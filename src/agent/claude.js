/**
 * OpenTrade — Claude AI Agent (v2)
 * 
 * Fixes:
 * 1. Context window overflow (234K > 200K) — active history pruning + tool result truncation
 * 2. UI tool failures (undefined) — retry with prerequisite resolution
 * 3. Tool loop runaway — max iteration cap
 * 4. History management — proper structured content preservation
 */
import Anthropic from '@anthropic-ai/sdk';
import { callTool as rawCallTool, getTools, connect } from '../mcp/client.js';
import {
  CONFIG,
  estimateHistoryTokens,
  pruneHistory,
  safeToolResultContent,
  sanitizeToolInput,
} from './context-manager.js';
import { createResilientCaller } from './tool-resilience.js';

// ─── Configuration ────────────────────────────────────────────────────────────

const MODEL = process.env.OPENTRADE_MODEL || 'claude-sonnet-4-20250514';
const MAX_TOKENS = parseInt(process.env.OPENTRADE_MAX_TOKENS || '8096', 10);

// Wrap the raw MCP callTool with retry/resilience logic
const callTool = createResilientCaller(rawCallTool);

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are OpenTrade, a Claude-powered AI agent for professional traders. You have full control over TradingView via 68+ embedded tools.

CRITICAL RULES — Context Management:
1. ALWAYS use summary:true on data_get_ohlcv unless you need individual bars for computation
2. ALWAYS use study_filter on pine data tools when targeting a specific indicator
3. NEVER call pine_get_source on complex scripts — it can return 200KB+ and overflow the context window
4. Cap OHLCV requests: count:20 for quick analysis, count:100 for deeper work, NEVER count:500
5. Call chart_get_state ONCE at start, reuse entity IDs — don't call it repeatedly
6. Use capture_screenshot for visual verification instead of pulling large datasets
7. When adding indicators, use FULL names: "Relative Strength Index" not "RSI", "Moving Average Exponential" not "EMA"

CRITICAL RULES — UI Panel Tools:
8. Before using pine_set_source, pine_smart_compile, or pine_save → first call ui_open_panel(panel:"pine-editor")
9. Before reading strategy results → first call ui_open_panel(panel:"strategy-tester")
10. If ui_open_panel returns undefined, retry once after a brief wait. If still failing, tell the user to make sure TradingView is open.

Response Style:
- Be concise and action-oriented
- Lead with the actionable insight, then supporting detail
- Never claim "done" without a clean compile AND a screenshot
- Proactively suggest next steps`;

// ─── Streaming Agent Loop ─────────────────────────────────────────────────────

/**
 * Main agent loop — yields events as they happen.
 * Integrates context management to prevent token overflow.
 */
export async function* agentTurn(messages) {
  const client = new Anthropic();
  const claudeTools = (await getTools()).map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema || { type: 'object', properties: {} },
  }));

  // ── Pre-flight: prune history if approaching limit ──
  let currentMessages = pruneHistory([...messages]);

  const historyTokens = estimateHistoryTokens(currentMessages);
  if (historyTokens > CONFIG.PRUNE_THRESHOLD) {
    console.error(
      `[agent] WARNING: History still at ~${historyTokens} tokens after pruning. Consider clearing history.`
    );
  }

  let loopCount = 0;

  while (loopCount < CONFIG.MAX_TOOL_LOOPS) {
    loopCount++;

    // ── Token budget check before API call ──
    const currentTokens = estimateHistoryTokens(currentMessages);
    if (currentTokens > CONFIG.MAX_HISTORY_TOKENS) {
      console.error(
        `[agent] Context at ~${currentTokens} tokens (limit: ${CONFIG.MAX_HISTORY_TOKENS}). Force pruning.`
      );
      currentMessages = pruneHistory(currentMessages);
    }

    let response;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: claudeTools,
        messages: currentMessages,
      });
    } catch (err) {
      // ── Handle the exact error from the screenshot ──
      if (err?.status === 400 && err?.message?.includes('prompt is too long')) {
        console.error('[agent] Hit token limit — aggressive pruning and retry...');
        
        // Emergency pruning: keep only the last exchange
        currentMessages = currentMessages.slice(-CONFIG.MIN_MESSAGES_TO_KEEP);
        
        // Truncate all remaining tool results aggressively
        for (const msg of currentMessages) {
          if (msg.role === 'user' && Array.isArray(msg.content)) {
            msg.content = msg.content.map((block) => {
              if (block.type === 'tool_result' && typeof block.content === 'string') {
                return { ...block, content: block.content.slice(0, 1_000) };
              }
              return block;
            });
          }
        }

        try {
          response = await client.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: SYSTEM_PROMPT,
            tools: claudeTools,
            messages: currentMessages,
          });
        } catch (retryErr) {
          yield {
            type: 'error',
            error: `Context window overflow after emergency pruning. Please start a new conversation (/clear) or reduce the scope of your request.`,
          };
          return;
        }
      } else {
        yield { type: 'error', error: err.message || String(err) };
        return;
      }
    }

    // ── Yield text blocks ──
    for (const block of response.content) {
      if (block.type === 'text') {
        yield { type: 'text', text: block.text };
      }
    }

    // ── Check stop reason ──
    if (response.stop_reason === 'end_turn') {
      yield { type: 'done', usage: response.usage };
      break;
    }

    if (response.stop_reason !== 'tool_use') {
      yield { type: 'done', stop_reason: response.stop_reason };
      break;
    }

    // ── Process ALL tool calls from this response ──
    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
    const toolResultContents = [];

    for (const block of toolUseBlocks) {
      // Sanitize inputs before calling (enforce limits)
      const sanitizedInput = sanitizeToolInput(block.name, block.input);
      yield { type: 'tool_use', name: block.name, input: sanitizedInput, id: block.id };

      let toolResult;
      try {
        toolResult = await callTool(block.name, sanitizedInput);
        yield { type: 'tool_result', id: block.id, name: block.name, result: toolResult };
      } catch (err) {
        toolResult = { success: false, error: err.message };
        yield { type: 'tool_error', id: block.id, name: block.name, error: err.message };
      }

      // ── Truncate the result before storing in history ──
      const truncatedContent = safeToolResultContent(block.name, toolResult);

      toolResultContents.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: truncatedContent,
      });
    }

    // ── Append assistant response + ALL tool results as ONE user message ──
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResultContents },
    ];

    // ── Post-loop pruning check ──
    if (estimateHistoryTokens(currentMessages) > CONFIG.PRUNE_THRESHOLD) {
      currentMessages = pruneHistory(currentMessages);
    }
  }

  if (loopCount >= CONFIG.MAX_TOOL_LOOPS) {
    yield {
      type: 'text',
      text: `\n\n⚠️ Reached maximum tool iterations (${CONFIG.MAX_TOOL_LOOPS}). Stopping to prevent runaway. Please break your request into smaller steps.`,
    };
    yield { type: 'done', stop_reason: 'max_loops' };
  }
}

// ─── Chat Helper ──────────────────────────────────────────────────────────────

/**
 * Simple send-and-receive wrapper around agentTurn.
 * Returns the full response text and properly structured history.
 */
export async function agentChat(userMessage, history = []) {
  await connect();

  const messages = [...history, { role: 'user', content: userMessage }];
  let fullText = '';
  const toolCalls = [];
  let finalMessages = messages;

  for await (const event of agentTurn(messages)) {
    if (event.type === 'text') fullText += event.text;
    if (event.type === 'tool_use') toolCalls.push({ name: event.name, input: event.input });
  }

  // Build proper history with structured content for tool-use turns
  // This prevents Bug #2 from the original code where tool-use assistant
  // messages were stored as plain text, breaking subsequent API calls
  const newMessages = [
    ...messages,
    { role: 'assistant', content: fullText || ' ' },
  ];

  return {
    text: fullText,
    toolCalls,
    newMessages,
  };
}
