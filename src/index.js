/**
 * TradingView Agent — Main Entry Point
 * 
 * Usage:
 *   import { agent, tv, pine } from 'tradingview-agent';
 * 
 * Or via CLI:
 *   tva chat "analyze my chart"
 *   tva pine "write an RSI indicator"
 *   tva server   # start browser UI
 */

// ── MCP Client (all 78 tools) ──
export {
  connect,
  disconnect,
  callTool,
  getTools,
  health,
  chart,
  data,
  pine as pineTools,
  capture,
  drawing,
  alerts,
  replay,
  indicators,
  watchlist,
  ui,
  panes,
  tabs,
  layouts,
  batch,
} from './mcp/client.js';

// ── Claude Agent ──
export { agentTurn, agentChat } from './agent/claude.js';

// ── Pine Script ──
export { analyzeStatic, generateTemplate, developScript } from './pine/analyzer.js';
export { writePineScript, debugPineScript, explainPineScript } from './pine/writer.js';
export { TEMPLATES, getTemplate, listTemplates, searchTemplates } from './pine/templates.js';

// ── Streaming / Monitoring ──
export { watchChart, scanSymbols, watchIndicator } from './agent/stream.js';

/**
 * Quick-start: create a configured agent instance.
 * 
 * @example
 * const { chat } = createAgent();
 * await chat("analyze my chart");
 */
export function createAgent(opts = {}) {
  const history = [];

  return {
    /**
     * Send a message to the agent and get a response.
     */
    async chat(message) {
      const { agentChat } = await import('./agent/claude.js');
      const result = await agentChat(message, history);
      history.push(...result.newMessages.slice(history.length));
      return result;
    },

    /**
     * Stream a message to the agent, yielding events.
     */
    async *stream(message) {
      const { agentTurn } = await import('./agent/claude.js');
      const { connect } = await import('./mcp/client.js');
      await connect();

      const messages = [...history, { role: 'user', content: message }];
      let fullText = '';

      for await (const event of agentTurn(messages)) {
        yield event;
        if (event.type === 'text') fullText += event.text;
      }

      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: fullText });
    },

    /**
     * Clear conversation history.
     */
    clearHistory() {
      history.length = 0;
    },

    /**
     * Get current history.
     */
    getHistory() {
      return [...history];
    },
  };
}
