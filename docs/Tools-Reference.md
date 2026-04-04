# Tools Reference

OpenTrade has 50 embedded tools that control every aspect of TradingView. Claude routes to these automatically — you never call them directly — but knowing what exists helps you ask for exactly what you need.

---

## Chart Control

| Tool | Description | Example ask |
|------|-------------|-------------|
| `chart_get_state` | Get symbol, timeframe, chart type, all indicator IDs | "What's on my chart?" |
| `chart_set_symbol` | Change the chart symbol | "Switch to NVDA" |
| `chart_set_timeframe` | Change timeframe: 1, 5, 15, 60, 240, D, W, M | "Go to the daily chart" |
| `chart_set_type` | Chart style: Candles, HeikinAshi, Line, Renko | "Switch to Heikin Ashi" |
| `chart_manage_indicator` | Add or remove an indicator | "Add RSI to my chart" |
| `chart_scroll_to_date` | Navigate to a specific date | "Go back to January 15th" |

**Note:** When adding indicators, use full names: `"Relative Strength Index"` not `"RSI"`.

---

## Data Reading

| Tool | Description | Key parameter |
|------|-------------|---------------|
| `quote_get` | Real-time price snapshot (last, OHLC, volume, change%) | — |
| `data_get_study_values` | Current values from all visible indicators | `study_filter` to target one |
| `data_get_ohlcv` | OHLCV price bars | `summary: true` for stats, `count: 200` for quant |
| `data_get_pine_lines` | Horizontal levels drawn by Pine indicators (`line.new`) | `study_filter` |
| `data_get_pine_labels` | Text annotations from Pine indicators (`label.new`) | `study_filter` |
| `data_get_pine_tables` | Table data from Pine indicators (`table.new`) | `study_filter` |
| `data_get_pine_boxes` | Price zones from Pine indicators (`box.new`) | `study_filter` |

**Always use `summary: true` with `data_get_ohlcv`** unless you need raw bars for statistical calculations. Summary returns compact stats instead of 100+ bar objects.

**Always use `study_filter`** when you know which indicator you want. Without it, all visible indicators are read — useful for a full analysis, slower for targeted queries.

---

## Pine Script Editor

| Tool | Description | Notes |
|------|-------------|-------|
| `pine_set_source` | Inject code into the Pine Editor | Triggers Monaco editor |
| `pine_smart_compile` | Compile the current script | Auto-detects Add/Update button |
| `pine_get_errors` | Read compilation errors from Monaco markers | Call after every compile |
| `pine_get_console` | Read `log.info()` console output | For debugging Pine code |
| `pine_save` | Save to TradingView cloud (Ctrl+S) | — |
| `pine_new` | Create a blank indicator/strategy/library | — |
| `pine_check` | Server-side validate without opening chart | No TV window needed |
| `pine_list_scripts` | List all your saved Pine Scripts | — |
| `pine_open` | Open a saved script by name | Case-insensitive match |
| `pine_get_source` | Read current script source | ⚠️ Can be 200KB+ — avoid on complex scripts |

---

## Screenshots

| Tool | Description | Regions |
|------|-------------|---------|
| `capture_screenshot` | Capture a PNG of TradingView | `chart`, `full`, `strategy_tester` |

Screenshots return base64 PNG data. In the browser UI, they render inline automatically.

---

## Drawings

| Tool | Description |
|------|-------------|
| `draw_shape` | Draw on the chart: `horizontal_line`, `trend_line`, `rectangle`, `text` |
| `draw_list` | List all current drawings |
| `draw_clear` | Remove all drawings |
| `draw_remove_one` | Remove a specific drawing by entity ID |

---

## Alerts

| Tool | Description |
|------|-------------|
| `alert_create` | Open the alert dialog with a price pre-filled |
| `alert_list` | List active alerts visible in the UI |

---

## Replay

| Tool | Description |
|------|-------------|
| `replay_start` | Enter replay mode at a specific date (ISO: `2025-01-15`) |
| `replay_step` | Advance N bars (default: 1) |
| `replay_autoplay` | Toggle autoplay at a given speed (ms per bar) |
| `replay_trade` | Simulate a trade: `buy`, `sell`, `close` |
| `replay_status` | Get current date, position, and P&L |
| `replay_stop` | Exit replay and return to live |

---

## Indicators

| Tool | Description |
|------|-------------|
| `indicator_set_inputs` | Change indicator settings (length, period, source) |
| `indicator_toggle_visibility` | Show or hide an indicator |

Both require an `entity_id` — get these from `chart_get_state`.

---

## Symbols & Watchlist

| Tool | Description |
|------|-------------|
| `symbol_info` | Get metadata: exchange, type, description |
| `symbol_search` | Search for symbols by keyword |
| `watchlist_get` | Read all symbols in the watchlist panel |
| `watchlist_add` | Add a symbol to the watchlist |

---

## UI Automation

| Tool | Description |
|------|-------------|
| `ui_click` | Click a button by CSS selector or text |
| `ui_evaluate` | Execute custom JavaScript in TradingView's page context |
| `ui_open_panel` | Open a panel: `pine-editor`, `strategy-tester`, `watchlist`, `alerts` |

---

## Batch Operations

| Tool | Description |
|------|-------------|
| `batch_run` | Run an action across multiple symbols. Actions: `screenshot`, `quote`, `ohlcv` |

```
"Scan SPY, QQQ, IWM, IWO and take a screenshot of each"
→ batch_run(symbols: ["SPY","QQQ","IWM","IWO"], action: "screenshot")
```

---

## System

| Tool | Description |
|------|-------------|
| `tv_health_check` | Check CDP connection and chart API availability |
| `tv_launch` | Auto-detect and launch TradingView Desktop |
| `tv_ui_state` | Get current UI state: open panels, visible buttons |

---

## Tool Performance Guide

| Tool | Context size | Speed |
|------|-------------|-------|
| `chart_get_state` | ~500B | Fast |
| `quote_get` | ~200B | Fast |
| `data_get_study_values` | ~500B | Fast |
| `data_get_ohlcv` (summary) | ~500B | Fast |
| `data_get_ohlcv` (200 bars) | ~8KB | Fast |
| `data_get_pine_lines` | ~1–3KB | Fast |
| `data_get_pine_labels` | ~2–5KB | Fast |
| `capture_screenshot` | ~50–200KB | Medium |
| `batch_run` (10 symbols) | ~5KB | Slow (sequential) |
| `pine_get_source` | up to 200KB | Slow — avoid |
