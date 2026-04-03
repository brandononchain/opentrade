/**
 * OpenTrade — TradingView Client
 * Uses the embedded TV engine (src/tv/) directly.
 * No external tradingview-mcp repo needed.
 */
import * as tools from '../tv/tools.js';
import { disconnectCDP } from '../tv/connection.js';

export const connect = async () => {
  const { getClient } = await import('../tv/connection.js');
  await getClient();
};
export const disconnect = disconnectCDP;

export async function callTool(name, args = {}) {
  const toolMap = {
    tv_health_check:             () => tools.healthCheck(),
    tv_launch:                   () => tools.tvLaunch(args),
    tv_ui_state:                 () => tools.uiState(),
    chart_get_state:             () => tools.chartGetState(),
    chart_set_symbol:            () => tools.chartSetSymbol(args),
    chart_set_timeframe:         () => tools.chartSetTimeframe(args),
    chart_set_type:              () => tools.chartSetType(args),
    chart_manage_indicator:      () => tools.chartManageIndicator(args),
    chart_scroll_to_date:        () => tools.chartScrollToDate(args),
    symbol_info:                 () => tools.symbolInfo(),
    symbol_search:               () => tools.symbolSearch(args),
    quote_get:                   () => tools.quoteGet(),
    data_get_study_values:       () => tools.dataGetStudyValues(args),
    data_get_ohlcv:              () => tools.dataGetOhlcv(args),
    data_get_pine_lines:         () => tools.dataGetPineLines(args),
    data_get_pine_labels:        () => tools.dataGetPineLabels(args),
    data_get_pine_tables:        () => tools.dataGetPineTables(args),
    data_get_pine_boxes:         () => tools.dataGetPineBoxes(args),
    pine_get_source:             () => tools.pineGetSource(),
    pine_set_source:             () => tools.pineSetSource(args),
    pine_smart_compile:          () => tools.pineSmartCompile(),
    pine_get_errors:             () => tools.pineGetErrors(),
    pine_get_console:            () => tools.pineGetConsole(),
    pine_save:                   () => tools.pineSave(),
    pine_new:                    () => tools.pineNew(args),
    pine_check:                  () => tools.pineCheck(args),
    pine_list_scripts:           () => tools.pineListScripts(),
    pine_open:                   () => tools.pineOpenScript(args),
    capture_screenshot:          () => tools.captureScreenshot(args),
    draw_shape:                  () => tools.drawShape(args),
    draw_list:                   () => tools.drawList(),
    draw_clear:                  () => tools.drawClear(),
    draw_remove_one:             () => tools.drawRemoveOne(args),
    alert_create:                () => tools.alertCreate(args),
    alert_list:                  () => tools.alertList(),
    indicator_set_inputs:        () => tools.indicatorSetInputs(args),
    indicator_toggle_visibility: () => tools.indicatorToggleVisibility(args),
    replay_start:                () => tools.replayStart(args),
    replay_step:                 () => tools.replayStep(args),
    replay_autoplay:             () => tools.replayAutoplay(args),
    replay_trade:                () => tools.replayTrade(args),
    replay_status:               () => tools.replayStatus(),
    replay_stop:                 () => tools.replayStop(),
    watchlist_get:               () => tools.watchlistGet(),
    watchlist_add:               () => tools.watchlistAdd(args),
    ui_click:                    () => tools.uiClick(args),
    ui_evaluate:                 () => tools.uiEvaluate(args),
    ui_open_panel:               () => tools.uiOpenPanel(args),
    batch_run:                   () => tools.batchRun(args),
  };
  const fn = toolMap[name];
  if (!fn) throw new Error(`Unknown tool: ${name}`);
  return fn();
}

export async function getTools() {
  return TOOL_DEFINITIONS;
}

// ── Convenience namespaces ──
export const health = {
  check: () => tools.healthCheck(),
  launch: (opts) => tools.tvLaunch(opts),
};
export const chart = {
  getState: () => tools.chartGetState(),
  setSymbol: (symbol) => tools.chartSetSymbol({ symbol }),
  setTimeframe: (timeframe) => tools.chartSetTimeframe({ timeframe }),
  setType: (chart_type) => tools.chartSetType({ chart_type }),
  manageIndicator: (action, indicator, entity_id) => tools.chartManageIndicator({ action, indicator, entity_id }),
  scrollToDate: (date) => tools.chartScrollToDate({ date }),
  symbolInfo: () => tools.symbolInfo(),
  symbolSearch: (query) => tools.symbolSearch({ query }),
};
export const data = {
  quoteGet: () => tools.quoteGet(),
  getStudyValues: (opts) => tools.dataGetStudyValues(opts),
  getOhlcv: (opts) => tools.dataGetOhlcv(opts || { summary: true }),
  getPineLines: (opts) => tools.dataGetPineLines(opts),
  getPineLabels: (opts) => tools.dataGetPineLabels(opts),
  getPineTables: (opts) => tools.dataGetPineTables(opts),
  getPineBoxes: (opts) => tools.dataGetPineBoxes(opts),
};
export const pine = {
  getSource: () => tools.pineGetSource(),
  setSource: (source) => tools.pineSetSource({ source }),
  smartCompile: () => tools.pineSmartCompile(),
  getErrors: () => tools.pineGetErrors(),
  getConsole: () => tools.pineGetConsole(),
  save: () => tools.pineSave(),
  newScript: (type) => tools.pineNew({ type }),
  check: (source) => tools.pineCheck({ source }),
  listScripts: () => tools.pineListScripts(),
  openScript: (name) => tools.pineOpenScript({ name }),
};
export const capture = {
  screenshot: (region = 'chart') => tools.captureScreenshot({ region }),
};
export const drawing = {
  shape: (opts) => tools.drawShape(opts),
  list: () => tools.drawList(),
  clear: () => tools.drawClear(),
  removeOne: (entity_id) => tools.drawRemoveOne({ entity_id }),
};
export const alerts = {
  create: (opts) => tools.alertCreate(opts),
  list: () => tools.alertList(),
};
export const replay = {
  start: (date) => tools.replayStart({ date }),
  step: (bars) => tools.replayStep({ bars }),
  autoplay: (speed) => tools.replayAutoplay({ speed }),
  trade: (action) => tools.replayTrade({ action }),
  status: () => tools.replayStatus(),
  stop: () => tools.replayStop(),
};
export const indicators = {
  setInputs: (entity_id, inputs) => tools.indicatorSetInputs({ entity_id, inputs }),
  toggleVisibility: (entity_id, visible) => tools.indicatorToggleVisibility({ entity_id, visible }),
};
export const watchlist = {
  get: () => tools.watchlistGet(),
  add: (symbol) => tools.watchlistAdd({ symbol }),
};
export const ui = {
  click: (opts) => tools.uiClick(opts),
  evaluate: (code) => tools.uiEvaluate({ code }),
  openPanel: (panel) => tools.uiOpenPanel({ panel }),
};
export const batch = {
  run: (symbols, action, opts) => tools.batchRun({ symbols, action, ...opts }),
};

const TOOL_DEFINITIONS = [
  { name: 'tv_health_check', description: 'Check TradingView Desktop connection status', inputSchema: { type: 'object', properties: {} } },
  { name: 'tv_launch', description: 'Auto-detect and launch TradingView Desktop with CDP debug mode', inputSchema: { type: 'object', properties: { port: { type: 'number' } } } },
  { name: 'tv_ui_state', description: 'Get current UI state — open panels, buttons, chart info', inputSchema: { type: 'object', properties: {} } },
  { name: 'chart_get_state', description: 'Get symbol, timeframe, chart type, and all indicator IDs', inputSchema: { type: 'object', properties: {} } },
  { name: 'chart_set_symbol', description: 'Change chart symbol (AAPL, ES1!, BTCUSD, NYMEX:CL1!)', inputSchema: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] } },
  { name: 'chart_set_timeframe', description: 'Change timeframe: 1, 5, 15, 60, 240, D, W, M', inputSchema: { type: 'object', properties: { timeframe: { type: 'string' } }, required: ['timeframe'] } },
  { name: 'chart_set_type', description: 'Change chart type: Candles, HeikinAshi, Line, Area, Renko', inputSchema: { type: 'object', properties: { chart_type: { type: 'string' } }, required: ['chart_type'] } },
  { name: 'chart_manage_indicator', description: 'Add or remove indicator. Use full names: "Relative Strength Index"', inputSchema: { type: 'object', properties: { action: { type: 'string' }, indicator: { type: 'string' }, entity_id: { type: 'string' } }, required: ['action'] } },
  { name: 'chart_scroll_to_date', description: 'Scroll chart to a date (ISO: 2025-01-15 or unix timestamp)', inputSchema: { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] } },
  { name: 'symbol_info', description: 'Get symbol metadata: exchange, type, description', inputSchema: { type: 'object', properties: {} } },
  { name: 'symbol_search', description: 'Search for symbols by name or keyword', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'quote_get', description: 'Get real-time price: last, OHLC, volume, change%', inputSchema: { type: 'object', properties: {} } },
  { name: 'data_get_study_values', description: 'Read values from all visible indicators (RSI, MACD, BB, EMAs). Use study_filter to target one.', inputSchema: { type: 'object', properties: { study_filter: { type: 'string' } } } },
  { name: 'data_get_ohlcv', description: 'Get price bars. Always use summary:true unless you need all bars.', inputSchema: { type: 'object', properties: { count: { type: 'number' }, summary: { type: 'boolean' } } } },
  { name: 'data_get_pine_lines', description: 'Read horizontal levels from Pine indicators (line.new). Use study_filter.', inputSchema: { type: 'object', properties: { study_filter: { type: 'string' } } } },
  { name: 'data_get_pine_labels', description: 'Read text annotations from Pine indicators (label.new). Use study_filter.', inputSchema: { type: 'object', properties: { study_filter: { type: 'string' } } } },
  { name: 'data_get_pine_tables', description: 'Read table data from Pine indicators (table.new). Use study_filter.', inputSchema: { type: 'object', properties: { study_filter: { type: 'string' } } } },
  { name: 'data_get_pine_boxes', description: 'Read price zones from Pine indicators (box.new). Use study_filter.', inputSchema: { type: 'object', properties: { study_filter: { type: 'string' } } } },
  { name: 'pine_get_source', description: 'Get current Pine Script source from editor (WARNING: can be 200KB+ for complex scripts)', inputSchema: { type: 'object', properties: {} } },
  { name: 'pine_set_source', description: 'Inject Pine Script source into the editor', inputSchema: { type: 'object', properties: { source: { type: 'string' } }, required: ['source'] } },
  { name: 'pine_smart_compile', description: 'Compile the script — auto-detects Add to Chart / Update on Chart button', inputSchema: { type: 'object', properties: {} } },
  { name: 'pine_get_errors', description: 'Read Pine Script compilation errors from Monaco markers', inputSchema: { type: 'object', properties: {} } },
  { name: 'pine_get_console', description: 'Read Pine Script log.info() console output', inputSchema: { type: 'object', properties: {} } },
  { name: 'pine_save', description: 'Save current Pine Script to TradingView cloud (Ctrl+S)', inputSchema: { type: 'object', properties: {} } },
  { name: 'pine_new', description: 'Create a new blank Pine Script', inputSchema: { type: 'object', properties: { type: { type: 'string', enum: ['indicator','strategy','library'] } }, required: ['type'] } },
  { name: 'pine_check', description: 'Server-validate Pine Script via TradingView API (no chart needed)', inputSchema: { type: 'object', properties: { source: { type: 'string' } }, required: ['source'] } },
  { name: 'pine_list_scripts', description: 'List all saved Pine Scripts from TradingView cloud', inputSchema: { type: 'object', properties: {} } },
  { name: 'pine_open', description: 'Open a saved Pine Script by name', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'capture_screenshot', description: 'Capture chart screenshot. Regions: full, chart, strategy_tester', inputSchema: { type: 'object', properties: { region: { type: 'string' } } } },
  { name: 'draw_shape', description: 'Draw on chart: horizontal_line, trend_line, rectangle, text', inputSchema: { type: 'object', properties: { shape: { type: 'string' }, point: { type: 'object' }, point2: { type: 'object' }, text: { type: 'string' }, overrides: { type: 'object' } }, required: ['shape','point'] } },
  { name: 'draw_list', description: 'List all drawings on the chart', inputSchema: { type: 'object', properties: {} } },
  { name: 'draw_clear', description: 'Remove all drawings from the chart', inputSchema: { type: 'object', properties: {} } },
  { name: 'draw_remove_one', description: 'Remove a specific drawing by entity ID', inputSchema: { type: 'object', properties: { entity_id: { type: 'string' } }, required: ['entity_id'] } },
  { name: 'alert_create', description: 'Create a price alert (opens alert dialog)', inputSchema: { type: 'object', properties: { price: { type: 'number' }, message: { type: 'string' } } } },
  { name: 'alert_list', description: 'List active alerts visible in the UI', inputSchema: { type: 'object', properties: {} } },
  { name: 'indicator_set_inputs', description: 'Change indicator settings by entity_id', inputSchema: { type: 'object', properties: { entity_id: { type: 'string' }, inputs: { type: 'object' } }, required: ['entity_id','inputs'] } },
  { name: 'indicator_toggle_visibility', description: 'Show or hide an indicator', inputSchema: { type: 'object', properties: { entity_id: { type: 'string' }, visible: { type: 'boolean' } }, required: ['entity_id','visible'] } },
  { name: 'replay_start', description: 'Enter replay mode at a specific date (ISO format)', inputSchema: { type: 'object', properties: { date: { type: 'string' } } } },
  { name: 'replay_step', description: 'Advance replay by N bars (default: 1)', inputSchema: { type: 'object', properties: { bars: { type: 'number' } } } },
  { name: 'replay_autoplay', description: 'Toggle replay autoplay at specified speed (ms per bar)', inputSchema: { type: 'object', properties: { speed: { type: 'number' } } } },
  { name: 'replay_trade', description: 'Simulate a trade in replay mode', inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['buy','sell','close'] } }, required: ['action'] } },
  { name: 'replay_status', description: 'Get current replay status, date, and position', inputSchema: { type: 'object', properties: {} } },
  { name: 'replay_stop', description: 'Stop replay and return to live chart', inputSchema: { type: 'object', properties: {} } },
  { name: 'watchlist_get', description: 'Get all symbols in the watchlist panel', inputSchema: { type: 'object', properties: {} } },
  { name: 'watchlist_add', description: 'Add a symbol to the watchlist', inputSchema: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] } },
  { name: 'ui_click', description: 'Click a UI element by CSS selector or button text', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } } } },
  { name: 'ui_evaluate', description: 'Execute custom JavaScript in the TradingView page context', inputSchema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] } },
  { name: 'ui_open_panel', description: 'Open a UI panel: pine-editor, strategy-tester, watchlist, alerts', inputSchema: { type: 'object', properties: { panel: { type: 'string' } }, required: ['panel'] } },
  { name: 'batch_run', description: 'Run an action across multiple symbols. Actions: screenshot, quote, ohlcv', inputSchema: { type: 'object', properties: { symbols: { type: 'array', items: { type: 'string' } }, action: { type: 'string' }, timeframes: { type: 'array', items: { type: 'string' } }, delay_ms: { type: 'number' } }, required: ['symbols','action'] } },
];
