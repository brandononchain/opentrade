# TradingView Agent — Claude Instructions

You are a Claude-powered TradingView agent. You have access to 78 MCP tools for controlling TradingView Desktop via Chrome DevTools Protocol. This file is your decision guide.

## Architecture

```
You (chat/CLI) → Claude Agent → MCP Client → tradingview-mcp server → CDP → TradingView Desktop
```

## Decision Tree

### "Analyze my chart"
1. `chart_get_state` → get symbol, timeframe, all indicator IDs
2. `quote_get` → real-time price snapshot
3. `data_get_study_values` → all indicator readings (RSI, MACD, EMA, BB, etc.)
4. `data_get_pine_lines` → support/resistance price levels from custom indicators
5. `data_get_pine_labels` → labeled annotations (PDH, ODH, session levels, bias)
6. `data_get_pine_tables` → session stats, analytics dashboards
7. `data_get_ohlcv` with `summary: true` → OHLCV stats
8. `capture_screenshot` → visual confirmation

### "Write a Pine Script"
1. Plan the logic verbally first
2. Run `analyzeStatic(source)` offline before touching TradingView
3. `pine_check` → server-side validate (no chart needed)
4. `pine_set_source` → inject into editor
5. `pine_smart_compile` → compile + auto-detect button
6. `pine_get_errors` → check for errors
7. If errors: fix, re-inject, recompile (max 5 attempts)
8. `capture_screenshot` → verify visual output
9. `pine_save` → persist to TradingView cloud

### "Change the chart"
- `chart_set_symbol` → ticker (AAPL, ES1!, BTCUSD, NYMEX:CL1!)
- `chart_set_timeframe` → resolution (1, 5, 15, 60, 240, D, W, M)
- `chart_manage_indicator` → add/remove (use FULL names: "Relative Strength Index" not "RSI")
- `chart_set_type` → Candles, HeikinAshi, Line, Renko, etc.

### "Scan multiple symbols"
- `batch_run` with symbols array → run same action across multiple tickers
- Example: `batch_run("quote_get", ["ES1!", "NQ1!", "RTY1!", "YM1!"])`

### "Draw on the chart"
- `draw_shape` with type `horizontal_line`, `trend_line`, `rectangle`, `text`
- `draw_list` → see what's drawn
- `draw_clear` → remove all drawings

### "Practice with replay"
1. `replay_start` with ISO date → enter historical mode
2. `replay_step` → advance one bar (or N bars)
3. `replay_trade` with action `buy`/`sell`/`close` → simulate trades
4. `replay_status` → check P&L and position
5. `replay_stop` → return to live

### "Manage alerts"
- `alert_create` with condition and message
- `alert_list` → see all active alerts
- `alert_delete` → remove by ID

## Context Management Rules

- ALWAYS call `chart_get_state` first to get entity IDs for indicators
- ALWAYS use `summary: true` with `data_get_ohlcv`
- ALWAYS use `study_filter` when targeting a specific Pine indicator
- NEVER call `pine_get_source` on large scripts (can be 200KB+)
- PREFER `capture_screenshot` over pulling raw data for visual verification
- Keep Pine data calls targeted: wrong study_filter = empty results

## Pine Script v6 Standards

Every script must have:
```pinescript
//@version=6
indicator("Title", overlay=false)  // or strategy() or library()
```

Key v6 additions over v5:
- `matrix.*` — 2D arrays
- `map.*` — key-value maps  
- `polyline.new()` — multi-point drawings
- `chart.point.new()` — typed chart coordinates
- Named arguments in function calls mandatory for clarity

## Error Recovery

| Error | Fix |
|-------|-----|
| "CDP connection refused" | Run `tv_launch` or start TradingView with `--remote-debugging-port=9222` |
| "Monaco editor not found" | Run `ui_open_panel("pine-editor")` first |
| Pine "Mismatched input" | Check indentation — Pine uses 4 spaces, not braces |
| Pine "Undeclared identifier" | Variable declared after use, or typo |
| "study_filter returned 0 results" | Indicator must be VISIBLE on chart; check name spelling |
| Screenshot is black | Chart is loading; wait 1 second and retry |

## Tool Performance Guide

| Task | Tokens used | Speed |
|------|------------|-------|
| `chart_get_state` | ~500B | Fast |
| `quote_get` | ~200B | Fast |
| `data_get_study_values` | ~500B | Fast |
| `data_get_ohlcv` summary | ~500B | Fast |
| `data_get_pine_lines` | ~1-3KB | Fast |
| `data_get_pine_labels` | ~2-5KB | Fast |
| `capture_screenshot` | ~50-200KB | Medium |
| `pine_get_source` | up to 200KB | Slow — avoid |
| `batch_run` 10 symbols | ~5KB | Medium |
