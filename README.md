# TradingView Agent 🤖📈

A powerful **Claude-powered AI agent** with full control over TradingView Desktop via 78 MCP tools. Features a beautiful CLI terminal interface and browser UI.

```
 ████████╗██╗   ██╗ █████╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗
 ╚══██╔══╝██║   ██║██╔══██╗    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
    ██║   ██║   ██║███████║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
    ██║   ╚██╗ ██╔╝██╔══██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
    ██║    ╚████╔╝ ██║  ██║    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
    ╚═╝     ╚═══╝  ╚═╝  ╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
```

## What It Does

Built on top of [tradingview-mcp](https://github.com/tradesdontlie/tradingview-mcp) and the [Pine Script v6 Extension](https://github.com/tradesdontlie/pine-script-v6-extension), this agent gives Claude full access to your TradingView Desktop.

### 🤖 AI-Powered Features
- **Natural language chart control** — "switch to AAPL on the daily chart"
- **Intelligent Pine Script development** — write → analyze → compile → fix → verify loop
- **Full chart analysis** — reads all indicator values, Pine drawings, price levels
- **Multi-symbol batch scanning** — scan multiple symbols simultaneously
- **Replay practice automation** — AI-assisted historical replay and trade practice

### 🖥️ Two Interfaces
1. **Beautiful CLI Terminal** — colorful, pipe-friendly, scriptable
2. **Browser UI** — real-time WebSocket streaming chat interface

## Quick Start

### Prerequisites
1. [TradingView Desktop](https://www.tradingview.com/desktop/) installed
2. [tradingview-mcp](https://github.com/tradesdontlie/tradingview-mcp) cloned & installed
3. Node.js 18+
4. Anthropic API key

### Install

```bash
git clone https://github.com/tradesdontlie/tradingview-agent.git
cd tradingview-agent
npm install
```

### Configure

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export TRADINGVIEW_MCP_PATH=/path/to/tradingview-mcp/src/server.js
```

### Launch TradingView with CDP

```bash
# Mac
/path/to/tradingview-mcp/scripts/launch_tv_debug_mac.sh

# Windows
scripts\launch_tv_debug.bat

# Or use the agent to launch it
tva chat "launch TradingView in debug mode"
```

## CLI Usage

```bash
# Interactive chat mode (default)
tva

# Single message
tva chat "analyze my chart and give me key levels"

# Pine Script development
tva pine "write an RSI divergence indicator"

# Static Pine Script analysis
tva analyze my_strategy.pine

# Chart state
tva state

# Screenshot
tva screenshot

# Check connection
tva health

# Start browser UI
tva server
```

## Browser UI

```bash
tva server
# → http://localhost:7842
```

Features:
- Real-time streaming responses
- Tool call visualization
- Screenshot embedding
- Quick action buttons
- MCP tools browser
- Chart state panel

## Agent Capabilities

### Chart Analysis
```
"Analyze my chart and tell me the market bias"
"What are the key support and resistance levels from my indicators?"
"Read the session table from my Profiler indicator"
"Compare ES, NQ, and YM across all timeframes"
```

### Pine Script Development
```
"Write a VWAP deviation band indicator with alerts"
"Build an EMA crossover strategy with proper risk management"
"Debug this Pine Script: [paste code]"
"Add a dashboard table to my existing indicator"
```

### Chart Control
```
"Switch to Bitcoin on the 4-hour chart"
"Add RSI and MACD to my chart"
"Draw a trend line from the January 15th low to last Friday's high"
"Set an alert for when price crosses 4800"
"Scroll back to March 2024 and take a screenshot"
```

### Replay Practice
```
"Start a replay session from 60 days ago"
"Step forward 10 bars"
"Buy 5 contracts at market"
"What's my current P&L?"
"Stop replay and return to live"
```

## Architecture

```
You (Chat/CLI)
      │
      ▼
TradingView Agent (Claude claude-opus-4-5-20251101)
      │
      ├── MCP Client ──────────────────────────────┐
      │         │                                  │
      │         ▼                                  ▼
      │   tradingview-mcp                 Pine Script v6
      │   (78 MCP tools)                 Static Analyzer
      │         │
      │         ▼
      │   CDP (port 9222)
      │         │
      │         ▼
      │   TradingView Desktop
      │
      └── Browser UI (WebSocket)
```

## Pine Script Static Analysis

Built from the [pine-script-v6-extension](https://github.com/tradesdontlie/pine-script-v6-extension), the static analyzer catches:

- Missing `//@version=6` declaration
- Array out-of-bounds access
- Unguarded `array.first()` / `array.last()` calls
- Deprecated v4/v5 syntax in v6 scripts
- Missing strategy commission settings
- Undefined variables and type mismatches

```bash
tva analyze my_strategy.pine
# ╭──────────────────────────────────╮
# │ Pine Script Analysis my_strategy │
# │                                  │
# │  Version: v6  Type: strategy     │
# │  ✓ No errors                     │
# │  Errors: 0  Warnings: 1  Info: 1 │
# ╰──────────────────────────────────╯
```

## MCP Tools Reference

All 78 tools from tradingview-mcp are available. Key categories:

| Category | Tools |
|----------|-------|
| Health | `tv_health_check`, `tv_discover`, `tv_launch` |
| Chart | `chart_get_state`, `chart_set_symbol`, `chart_set_timeframe`, `chart_manage_indicator` |
| Data | `data_get_study_values`, `data_get_ohlcv`, `quote_get`, `data_get_pine_lines` |
| Pine | `pine_set_source`, `pine_smart_compile`, `pine_get_errors`, `pine_save` |
| Drawing | `draw_shape`, `draw_list`, `draw_clear` |
| Alerts | `alert_create`, `alert_list`, `alert_delete` |
| Replay | `replay_start`, `replay_step`, `replay_trade`, `replay_stop` |
| Capture | `capture_screenshot` |
| Batch | `batch_run` |
| UI | `ui_click`, `ui_evaluate`, `ui_keyboard` |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key (required) | — |
| `TRADINGVIEW_MCP_PATH` | Path to server.js | Auto-detected |
| `TVA_PORT` | Browser UI port | 7842 |

## Disclaimer

This project is for **personal, educational use only**. Not affiliated with TradingView Inc. or Anthropic.
See [tradingview-mcp disclaimer](https://github.com/tradesdontlie/tradingview-mcp#disclaimer) for full terms.

## License

MIT
