/**
 * TradingView MCP Client
 * Connects to the tradingview-mcp server via stdio or HTTP,
 * exposing all 78 tools as async JS functions.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _client = null;
let _tools = null;

/**
 * Resolve path to tradingview-mcp server.js
 * Checks: env var, sibling directory, npm global, local node_modules
 */
function resolveMcpServerPath() {
  const candidates = [
    process.env.TRADINGVIEW_MCP_PATH,
    join(__dirname, '../../../tradingview-mcp/src/server.js'),
    join(process.cwd(), '../tradingview-mcp/src/server.js'),
    join(process.env.HOME || '~', 'tradingview-mcp/src/server.js'),
  ].filter(Boolean);

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    'Cannot find tradingview-mcp server.js.\n' +
    'Set TRADINGVIEW_MCP_PATH=/path/to/tradingview-mcp/src/server.js\n' +
    'or clone: git clone https://github.com/tradesdontlie/tradingview-mcp'
  );
}

/**
 * Initialize and connect the MCP client.
 * Returns the connected client instance.
 */
export async function connect() {
  if (_client) return _client;

  const serverPath = resolveMcpServerPath();
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  });

  _client = new Client({ name: 'tradingview-agent', version: '1.0.0' }, { capabilities: {} });
  await _client.connect(transport);
  return _client;
}

/**
 * Get all available tools from the MCP server.
 */
export async function getTools() {
  if (_tools) return _tools;
  const client = await connect();
  const result = await client.listTools();
  _tools = result.tools;
  return _tools;
}

/**
 * Call any MCP tool by name with arguments.
 * Returns the parsed result.
 */
export async function callTool(name, args = {}) {
  const client = await connect();
  const result = await client.callTool({ name, arguments: args });

  // Parse text content
  if (result.content?.[0]?.type === 'text') {
    try {
      return JSON.parse(result.content[0].text);
    } catch {
      return { success: true, text: result.content[0].text };
    }
  }

  // Image content (screenshots)
  if (result.content?.[0]?.type === 'image') {
    return {
      success: true,
      type: 'image',
      mimeType: result.content[0].mimeType,
      data: result.content[0].data,
    };
  }

  return { success: true, content: result.content };
}

/**
 * Disconnect the MCP client.
 */
export async function disconnect() {
  if (_client) {
    await _client.close();
    _client = null;
    _tools = null;
  }
}

/**
 * Convenience wrappers for every tool category.
 * Each function matches the MCP tool name exactly.
 */

// ── Health & Connection ──
export const health = {
  check: () => callTool('tv_health_check'),
  discover: () => callTool('tv_discover'),
  uiState: () => callTool('tv_ui_state'),
  launch: (opts = {}) => callTool('tv_launch', opts),
};

// ── Chart Control ──
export const chart = {
  getState: () => callTool('chart_get_state'),
  setSymbol: (symbol) => callTool('chart_set_symbol', { symbol }),
  setTimeframe: (timeframe) => callTool('chart_set_timeframe', { timeframe }),
  setType: (chart_type) => callTool('chart_set_type', { chart_type }),
  scrollToDate: (date) => callTool('chart_scroll_to_date', { date }),
  setVisibleRange: (from, to) => callTool('chart_set_visible_range', { from, to }),
  manageIndicator: (action, name) => callTool('chart_manage_indicator', { action, name }),
  symbolInfo: () => callTool('symbol_info'),
  symbolSearch: (query) => callTool('symbol_search', { query }),
};

// ── Data Reading ──
export const data = {
  getStudyValues: (opts = {}) => callTool('data_get_study_values', opts),
  getOhlcv: (opts = { summary: true }) => callTool('data_get_ohlcv', opts),
  getPineLines: (opts = {}) => callTool('data_get_pine_lines', opts),
  getPineLabels: (opts = {}) => callTool('data_get_pine_labels', opts),
  getPineTables: (opts = {}) => callTool('data_get_pine_tables', opts),
  getPineBoxes: (opts = {}) => callTool('data_get_pine_boxes', opts),
  quoteGet: () => callTool('quote_get'),
};

// ── Pine Script ──
export const pine = {
  getSource: () => callTool('pine_get_source'),
  setSource: (source) => callTool('pine_set_source', { source }),
  compile: () => callTool('pine_compile'),
  smartCompile: () => callTool('pine_smart_compile'),
  getErrors: () => callTool('pine_get_errors'),
  getConsole: () => callTool('pine_get_console'),
  save: () => callTool('pine_save'),
  newScript: (type) => callTool('pine_new', { type }),
  openScript: (name) => callTool('pine_open', { name }),
  listScripts: () => callTool('pine_list_scripts'),
  analyze: (source) => callTool('pine_analyze', { source }),
  check: (source) => callTool('pine_check', { source }),
};

// ── Capture & Screenshots ──
export const capture = {
  screenshot: (region = 'chart') => callTool('capture_screenshot', { region }),
};

// ── Drawing ──
export const drawing = {
  shape: (opts) => callTool('draw_shape', opts),
  list: () => callTool('draw_list'),
  removeOne: (id) => callTool('draw_remove_one', { id }),
  clear: () => callTool('draw_clear'),
  getProperties: (id) => callTool('draw_get_properties', { id }),
};

// ── Alerts ──
export const alerts = {
  create: (opts) => callTool('alert_create', opts),
  list: () => callTool('alert_list'),
  delete: (id) => callTool('alert_delete', { id }),
};

// ── Replay ──
export const replay = {
  start: (date) => callTool('replay_start', { date }),
  step: (bars = 1) => callTool('replay_step', { bars }),
  autoplay: (speed = 1000) => callTool('replay_autoplay', { speed }),
  trade: (action, qty) => callTool('replay_trade', { action, qty }),
  status: () => callTool('replay_status'),
  stop: () => callTool('replay_stop'),
};

// ── Indicators ──
export const indicators = {
  setInputs: (id, inputs) => callTool('indicator_set_inputs', { id, inputs }),
  toggleVisibility: (id) => callTool('indicator_toggle_visibility', { id }),
};

// ── Watchlist ──
export const watchlist = {
  get: () => callTool('watchlist_get'),
  add: (symbol) => callTool('watchlist_add', { symbol }),
};

// ── UI Automation ──
export const ui = {
  openPanel: (panel) => callTool('ui_open_panel', { panel }),
  click: (selector) => callTool('ui_click', { selector }),
  evaluate: (code) => callTool('ui_evaluate', { code }),
  keyboard: (key) => callTool('ui_keyboard', { key }),
  typeText: (text) => callTool('ui_type_text', { text }),
};

// ── Panes ──
export const panes = {
  list: () => callTool('pane_list'),
  setLayout: (layout) => callTool('pane_set_layout', { layout }),
  focus: (id) => callTool('pane_focus', { id }),
  setSymbol: (id, symbol) => callTool('pane_set_symbol', { id, symbol }),
};

// ── Tabs ──
export const tabs = {
  list: () => callTool('tab_list'),
  newTab: () => callTool('tab_new'),
  close: (id) => callTool('tab_close', { id }),
  switch: (id) => callTool('tab_switch', { id }),
};

// ── Layouts ──
export const layouts = {
  list: () => callTool('layout_list'),
  switch: (name) => callTool('layout_switch', { name }),
};

// ── Batch ──
export const batch = {
  run: (action, symbols, opts = {}) => callTool('batch_run', { action, symbols, ...opts }),
};
