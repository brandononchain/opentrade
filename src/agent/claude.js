/**
 * OpenTrade — Claude AI Agent
 * Streaming agent with full TradingView tool access via embedded CDP engine.
 */
import Anthropic from '@anthropic-ai/sdk';
import { callTool, getTools, connect } from '../mcp/client.js';

const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are OpenTrade, a Claude-powered AI agent with full control over TradingView via 50 embedded tools. You help traders analyze charts, write Pine Script v6, manage alerts, practice with replay, and automate workflows.

## Core Capabilities

### Chart Analysis
- Read live chart state: symbol, timeframe, indicator values
- Pull Pine indicator data: lines, labels, tables, boxes
- Get OHLCV price data, real-time quotes
- Take screenshots for visual verification

### Pine Script v6 Development (Full Loop)
1. Write complete, valid Pine Script v6 code
2. Inject into TradingView with pine_set_source
3. Compile with pine_smart_compile
4. Read errors with pine_get_errors — fix and recompile (up to 5 attempts)
5. Verify with capture_screenshot
6. Save with pine_save

### Chart Control
- Change symbols, timeframes, chart types
- Add/remove indicators (use FULL names: "Relative Strength Index" not "RSI")
- Draw trend lines, support/resistance levels, text annotations
- Manage alerts, watchlists

### Batch and Replay
- Scan multiple symbols simultaneously with batch_run
- Enter historical replay at any date, step bars, simulate trades

## Tool Usage Rules
- ALWAYS call chart_get_state first to get entity IDs
- ALWAYS use summary:true with data_get_ohlcv
- ALWAYS use study_filter when targeting specific Pine indicators
- NEVER call pine_get_source on complex scripts (can be 200KB+)
- For full analysis: quote_get then data_get_study_values then data_get_pine_lines then data_get_pine_labels then capture_screenshot

## Pine Script v6 Standards
Every script must start with //@version=6 and have a proper indicator(), strategy(), or library() declaration.

## Response Style
- Be concise and action-oriented
- Show tool results clearly
- Proactively suggest next steps
- Always verify Pine Script with compilation before claiming success`;

export async function* agentTurn(messages) {
  const client = new Anthropic();
  const claudeTools = (await getTools()).map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema || { type: 'object', properties: {} },
  }));

  let currentMessages = [...messages];

  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      tools: claudeTools,
      messages: currentMessages,
    });

    // Yield all text blocks first
    for (const block of response.content) {
      if (block.type === 'text') {
        yield { type: 'text', text: block.text };
      }
    }

    // If no tool calls, we are done
    if (response.stop_reason === 'end_turn') {
      yield { type: 'done', usage: response.usage };
      break;
    }

    if (response.stop_reason !== 'tool_use') {
      yield { type: 'done', stop_reason: response.stop_reason };
      break;
    }

    // CRITICAL: collect ALL tool_use blocks from this response,
    // execute each one, and return ALL results in a single user message.
    // The Anthropic API requires every tool_use id to have a matching
    // tool_result in the immediately following user message — no exceptions.
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const toolResultContents = [];

    for (const block of toolUseBlocks) {
      yield { type: 'tool_use', name: block.name, input: block.input, id: block.id };

      let toolResult;
      try {
        toolResult = await callTool(block.name, block.input);
        yield { type: 'tool_result', id: block.id, name: block.name, result: toolResult };
      } catch (err) {
        toolResult = { success: false, error: err.message };
        yield { type: 'tool_error', id: block.id, name: block.name, error: err.message };
      }

      toolResultContents.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(toolResult),
      });
    }

    // Append one assistant turn (the full response) + one user turn (all results)
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResultContents },
    ];
  }
}

export async function agentChat(userMessage, history = []) {
  await connect();
  const messages = [...history, { role: 'user', content: userMessage }];
  let fullText = '';
  const toolCalls = [];

  for await (const event of agentTurn(messages)) {
    if (event.type === 'text') fullText += event.text;
    if (event.type === 'tool_use') toolCalls.push({ name: event.name, input: event.input });
  }

  return {
    text: fullText,
    toolCalls,
    // Return proper message history — assistant content must be the raw response
    // content array, not just the text string, so subsequent turns work correctly.
    newMessages: [...messages, { role: 'assistant', content: fullText || ' ' }],
  };
}
