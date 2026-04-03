/**
 * TradingView Claude Agent
 * Uses Anthropic SDK to power an AI agent with full TradingView MCP tool access.
 */
import Anthropic from '@anthropic-ai/sdk';
import { callTool, getTools, connect } from '../mcp/client.js';

const MODEL = 'claude-opus-4-5-20251101';

const SYSTEM_PROMPT = `You are a powerful TradingView AI agent with full control over the TradingView Desktop application via 78 MCP tools. You help traders analyze charts, write Pine Script, manage alerts, execute replay practice sessions, and automate workflows.

## Your Capabilities

### Chart Analysis
- Read live chart state: symbol, timeframe, indicator values
- Pull Pine indicator data: lines, labels, tables, boxes
- Get OHLCV price data, real-time quotes
- Take screenshots for visual analysis

### Pine Script Development (Full Loop)
1. Write Pine Script v6 code with proper structure
2. Inject into TradingView editor with pine_set_source
3. Compile with pine_smart_compile
4. Read errors with pine_get_errors and fix them
5. Verify with screenshot
6. Save to TradingView cloud with pine_save

### Chart Control
- Change symbols, timeframes, chart types
- Add/remove indicators
- Draw trend lines, support/resistance levels, text
- Manage alerts, watchlists, layouts

### Replay Practice
- Enter historical replay at any date
- Step through bars, execute simulated trades
- Track P&L and position status

## Tool Usage Best Practices
- ALWAYS call chart_get_state first to understand what's on the chart
- ALWAYS use summary=true with data_get_ohlcv
- ALWAYS use study_filter when reading Pine indicator data
- NEVER call pine_get_source on complex scripts (can be 200KB+)
- For full chart analysis: quote_get → data_get_study_values → data_get_pine_lines → data_get_pine_labels → data_get_pine_tables → capture_screenshot

## Pine Script v6 Standards
Every script must have:
- //@version=6 header
- Proper indicator() or strategy() declaration  
- Input variables with input.*() functions
- Clear section comments

## Response Style
- Be concise and action-oriented
- Show tool results clearly formatted
- Proactively suggest next steps
- When writing Pine Script, show the code and explain the logic
- Always verify with compilation before claiming success`;

/**
 * Convert MCP tools list to Anthropic tool format.
 */
async function getMcpToolsForClaude() {
  const tools = await getTools();
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema || { type: 'object', properties: {} },
  }));
}

/**
 * Process a single agent turn — may involve multiple tool calls.
 * Yields events: { type: 'text'|'tool_use'|'tool_result'|'done' }
 */
export async function* agentTurn(messages, onProgress = null) {
  const client = new Anthropic();
  const claudeTools = await getMcpToolsForClaude();

  let currentMessages = [...messages];

  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      tools: claudeTools,
      messages: currentMessages,
    });

    // Yield text chunks
    for (const block of response.content) {
      if (block.type === 'text') {
        yield { type: 'text', text: block.text };
      } else if (block.type === 'tool_use') {
        yield { type: 'tool_use', name: block.name, input: block.input, id: block.id };

        // Execute the tool
        let toolResult;
        try {
          if (onProgress) onProgress(`⚡ ${block.name}`, block.input);
          toolResult = await callTool(block.name, block.input);
          yield { type: 'tool_result', id: block.id, name: block.name, result: toolResult };
        } catch (err) {
          toolResult = { success: false, error: err.message };
          yield { type: 'tool_error', id: block.id, name: block.name, error: err.message };
        }

        // Add assistant + tool result to messages
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(toolResult),
            }],
          },
        ];
      }
    }

    // Check stop reason
    if (response.stop_reason === 'end_turn') {
      yield { type: 'done', usage: response.usage };
      break;
    }

    if (response.stop_reason !== 'tool_use') {
      yield { type: 'done', stop_reason: response.stop_reason };
      break;
    }
  }
}

/**
 * Simple single-turn agent call — collects all output and returns it.
 */
export async function agentChat(userMessage, history = []) {
  await connect();

  const messages = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  let fullText = '';
  const toolCalls = [];
  let usage = null;

  for await (const event of agentTurn(messages)) {
    if (event.type === 'text') fullText += event.text;
    if (event.type === 'tool_use') toolCalls.push({ name: event.name, input: event.input });
    if (event.type === 'done') usage = event.usage;
  }

  return {
    text: fullText,
    toolCalls,
    usage,
    newMessages: [
      ...messages,
      { role: 'assistant', content: fullText },
    ],
  };
}
