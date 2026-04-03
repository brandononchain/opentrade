# OpenTrade 📈🤖

**Claude-powered AI agent for TradingView Desktop.** Write Pine Script v6, analyze charts, control every aspect of TradingView — from a beautiful terminal or browser UI.

**Fully self-contained** — no external repos required.

---

## Quick Start

```bash
git clone https://github.com/brandononchain/opentrade.git
cd opentrade
npm install

export ANTHROPIC_API_KEY=sk-ant-...

# Launch TradingView with CDP enabled first (see below)
node src/cli/index.js        # interactive chat
node src/cli/index.js server # browser UI at localhost:7842
```

---

## Launch TradingView with Debug Mode

OpenTrade connects via Chrome DevTools Protocol on port 9222.

```bash
# Mac
open -a TradingView --args --remote-debugging-port=9222

# Windows
"%LOCALAPPDATA%\TradingView\TradingView.exe" --remote-debugging-port=9222

# Linux
tradingview --remote-debugging-port=9222

# Or let OpenTrade launch it:
node src/cli/index.js chat "launch TradingView in debug mode"
```

---

## CLI Commands

```bash
node src/cli/index.js                          # Interactive streaming chat
node src/cli/index.js chat "analyze my chart"  # Single message
node src/cli/index.js pine "write RSI divergence indicator"  # Pine Script AI writer
node src/cli/index.js analyze my_script.pine   # Static analysis (no TV needed)
node src/cli/index.js state                    # Chart state
node src/cli/index.js screenshot               # Capture chart
node src/cli/index.js health                   # Connection check
node src/cli/index.js server                   # Browser UI
```

Install globally with `npm link` then use `opentrade` instead.

---

## What You Can Do

| Ask OpenTrade... | It will... |
|-----------------|-----------|
| "Analyze my chart" | Read all indicators, price levels, bias, take screenshot |
| "Switch to AAPL daily" | Change symbol and timeframe |
| "Write a VWAP deviation indicator" | Code → compile → fix → save Pine Script |
| "Draw support at 4800" | Create horizontal line drawing |
| "Scan ES, NQ, YM for momentum" | Batch multi-symbol analysis |
| "Start replay from 60 days ago" | Enter historical replay mode |
| "Alert me when price crosses 5000" | Create TradingView price alert |

---

## Pine Script Development

Full AI-driven development loop — **write → analyze → compile → fix → verify → save**:

```bash
node src/cli/index.js pine "supertrend strategy with EMA filter and risk management"
```

### Static Analyzer (offline, no TradingView needed)

```bash
node src/cli/index.js analyze strategy.pine
```

Detects: missing `//@version=6`, array out-of-bounds, deprecated syntax, missing declarations, strategy commission settings.

### Built-in Templates

`ema_ribbon` · `rsi_divergence` · `vwap_bands` · `session_levels` · `ema_cross_strategy` · `supertrend_strategy`

---

## Architecture

```
CLI / Browser UI
      │
      ▼
Claude Agent (Anthropic API)
      │
      ├── src/tv/connection.js   ← CDP connection to TradingView
      ├── src/tv/tools.js        ← All 50 TradingView control tools
      ├── src/pine/analyzer.js   ← Pine Script v6 static analyzer
      ├── src/pine/templates.js  ← Pine v6 ready-to-use templates
      └── src/pine/writer.js     ← AI Pine Script development loop
              │
              ▼
    TradingView Desktop (Electron)
    via Chrome DevTools Protocol :9222
```

Everything is embedded. No external repos needed.

---

## Tools (50 total)

**Chart:** `chart_get_state` `chart_set_symbol` `chart_set_timeframe` `chart_set_type` `chart_manage_indicator` `chart_scroll_to_date`

**Data:** `quote_get` `data_get_study_values` `data_get_ohlcv` `data_get_pine_lines` `data_get_pine_labels` `data_get_pine_tables` `data_get_pine_boxes`

**Pine:** `pine_set_source` `pine_smart_compile` `pine_get_errors` `pine_get_console` `pine_save` `pine_new` `pine_check` `pine_list_scripts` `pine_open`

**Visual:** `capture_screenshot` `draw_shape` `draw_list` `draw_clear` `draw_remove_one`

**Alerts:** `alert_create` `alert_list`

**Replay:** `replay_start` `replay_step` `replay_autoplay` `replay_trade` `replay_status` `replay_stop`

**Symbols:** `symbol_info` `symbol_search`

**Watchlist:** `watchlist_get` `watchlist_add`

**Indicators:** `indicator_set_inputs` `indicator_toggle_visibility`

**UI:** `ui_click` `ui_evaluate` `ui_open_panel`

**Multi-symbol:** `batch_run`

**System:** `tv_health_check` `tv_launch` `tv_ui_state`

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key **(required)** | — |
| `TV_CDP_PORT` | TradingView CDP port | `9222` |
| `TVA_PORT` | Browser UI port | `7842` |

---

## Disclaimer

OpenTrade is an independent project for **personal, educational use only**. Not affiliated with TradingView Inc. or Anthropic. Uses Chrome DevTools Protocol which may conflict with [TradingView's Terms of Use](https://www.tradingview.com/policies/). Use at your own risk.

## License

MIT
