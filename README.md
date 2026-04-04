```
 _______ ______ _______ _______ _______ ______ _______ _____  _______
|       |   __ \    ___|    |  |_     _|   __ \   _   |     \|    ___|
|   -   |    __/    ___|       | |   | |      <       |  --  |    ___|
|_______|___|  |_______|__|____| |___| |___|__|___|___|_____/|_______|

         Claude-powered TradingView Agent  //  50 Tools  //  Pine Script v6
```

> Talk to your charts. Write Pine Script by asking for it. Control TradingView with plain English.

---

## What is OpenTrade?

OpenTrade puts Claude AI inside your TradingView workflow. It connects to your running TradingView chart via Chrome DevTools Protocol and gives Claude full control — reading indicators, writing and compiling Pine Script, drawing levels, managing alerts, running multi-symbol scans, and practicing trades in replay mode.

You chat with it in your terminal or browser. It does the rest.

```
You:    "Analyze my chart and give me the key levels"

Agent:  ⚡ chart_get_state     → BTCUSDT · 1H · 7 indicators
        ⚡ quote_get            → last=67,420 change=-1.2%
        ⚡ data_get_study_values → RSI=38, MACD bearish, EMA 9<21
        ⚡ data_get_pine_lines  → resistance: 68,100 / support: 66,800
        ⚡ capture_screenshot   → chart captured

        BTCUSDT 1H Analysis
        ───────────────────
        Price: $67,420  |  Change: -1.2%

        Structure: BEARISH — price below all EMAs
        Momentum:  RSI at 38, approaching oversold
                   MACD histogram red and expanding

        Key Levels:
          🔴 Resistance: 68,100  →  69,500
          🟢 Support:    66,800  →  65,200

        Bias: BEARISH — watching 66,800 for bounce or break
```

---

## Quick Start

### 1. Requirements

- **Node.js 18+** → [nodejs.org](https://nodejs.org)
- **Chrome** with TradingView open (see Step 3)
- **Anthropic API key** → [console.anthropic.com](https://console.anthropic.com)

### 2. Install

```bash
git clone https://github.com/brandononchain/opentrade.git
cd opentrade
npm install
```

### 3. Create your `.env` file

```bash
# In the opentrade folder, create a file called .env
# Windows PowerShell:
Add-Content .env "ANTHROPIC_API_KEY=sk-ant-..."

# Mac/Linux:
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

Your key is never committed — `.env` is in `.gitignore`.

### 4. Launch Chrome pointing at TradingView

```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\ChromeDebug" "https://www.tradingview.com/chart/"

# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/ChromeDebug" "https://www.tradingview.com/chart/"
```

Log into TradingView when Chrome opens. Keep this window running.

### 5. Run OpenTrade

```bash
node src/cli/index.js
```

You'll see the banner, a connection confirmation, and a prompt. Start chatting.

---

## How to Use It

### Terminal (main interface)

```bash
node src/cli/index.js
```

Full streaming chat with history. Type naturally — no commands to memorize.

| Shortcut | Action |
|----------|--------|
| `/state` | Show current symbol and timeframe |
| `/screenshot` | Capture chart to PNG |
| `/clear` | Start a fresh conversation |
| `/quit` | Exit |

### Browser UI

```bash
node src/cli/index.js server
# Open: http://localhost:7842
```

Same agent, but in your browser. Screenshots appear inline. Tool calls are visible in real time. Good for longer sessions or when you want a bigger workspace.

### Single commands (great for scripting)

```bash
node src/cli/index.js chat "switch to NVDA on the daily chart"
node src/cli/index.js chat "what is my RSI reading right now"
node src/cli/index.js pine "write a VWAP deviation bands indicator"
node src/cli/index.js screenshot
node src/cli/index.js health
```

### Static Pine Script analysis (no TradingView needed)

```bash
node src/cli/index.js analyze my_strategy.pine
```

Catches errors before touching the editor — array out-of-bounds, missing declarations, deprecated syntax, missing commission settings.

---

## Things You Can Ask

### Chart Reading
```
"Analyze my chart"
"What are the RSI and MACD readings?"
"Read the key levels from my indicators"
"Give me a full market breakdown with bias"
"Take a screenshot"
```

### Chart Control
```
"Switch to AAPL on the 4-hour chart"
"Add the Bollinger Bands indicator"
"Change to Heikin Ashi candles"
"Remove all my drawings"
"Scroll back to the March 2024 highs"
```

### Pine Script
```
"Write a supertrend strategy with EMA filter"
"Build a session high/low indicator with alerts"
"Debug this script: [paste your code]"
"Add a dashboard table to my indicator"
"List all my saved scripts"
"Open my Session Levels script"
```

### Drawings & Alerts
```
"Draw support at 4800 and resistance at 5100"
"Mark the current price with a horizontal line"
"Create an alert when price hits 5000"
"Clear all drawings"
```

### Multi-Symbol Scanning
```
"Scan ES, NQ, YM and tell me which is strongest"
"Take screenshots of AAPL, MSFT, NVDA on daily"
"Compare RSI across SPY, QQQ, and IWM"
```

### Replay Practice
```
"Start replay from 60 days ago"
"Step forward 10 bars"
"Buy 5 contracts at market"
"What's my P&L?"
"Stop replay and go back to live"
```

---

## Architecture

OpenTrade is **fully self-contained** — everything is in this repo. No external services, no other repos to clone.

```
Your terminal or browser
        │
        ▼
   Claude AI (via Anthropic API)
        │  uses 50 tools
        ▼
   src/tv/tools.js         ← all TradingView control logic
   src/tv/connection.js    ← Chrome DevTools Protocol engine
        │
        ▼
   Chrome (port 9222)  →  TradingView
```

### What's inside

| File | What it does |
|------|-------------|
| `src/tv/connection.js` | Connects to Chrome/TradingView via CDP |
| `src/tv/tools.js` | All 50 tools — chart, data, Pine, drawings, replay |
| `src/agent/claude.js` | Streaming Claude agent with tool-use loop |
| `src/pine/analyzer.js` | Pine Script v6 static analyzer |
| `src/pine/templates.js` | 6 ready-to-use Pine v6 templates |
| `src/pine/writer.js` | AI Pine development loop (write→compile→fix→save) |
| `src/cli/index.js` | Terminal interface |
| `src/web/server.js` | Browser UI + WebSocket server |
| `src/env/load.js` | Auto-loads `.env` — no dotenv package needed |

---

## Tools Reference (50 total)

**Chart** — `chart_get_state` `chart_set_symbol` `chart_set_timeframe` `chart_set_type` `chart_manage_indicator` `chart_scroll_to_date`

**Data** — `quote_get` `data_get_study_values` `data_get_ohlcv` `data_get_pine_lines` `data_get_pine_labels` `data_get_pine_tables` `data_get_pine_boxes`

**Pine Script** — `pine_set_source` `pine_smart_compile` `pine_get_errors` `pine_get_console` `pine_save` `pine_new` `pine_check` `pine_list_scripts` `pine_open`

**Visual** — `capture_screenshot` `draw_shape` `draw_list` `draw_clear` `draw_remove_one`

**Alerts** — `alert_create` `alert_list`

**Replay** — `replay_start` `replay_step` `replay_autoplay` `replay_trade` `replay_status` `replay_stop`

**Indicators** — `indicator_set_inputs` `indicator_toggle_visibility`

**Symbols** — `symbol_info` `symbol_search`

**Watchlist** — `watchlist_get` `watchlist_add`

**UI** — `ui_click` `ui_evaluate` `ui_open_panel`

**Batch** — `batch_run`

**System** — `tv_health_check` `tv_launch` `tv_ui_state`

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | — | Your key from console.anthropic.com |
| `TV_CDP_PORT` | No | `9222` | Chrome debug port |
| `TVA_PORT` | No | `7842` | Browser UI port |

---

## FAQ

**Do I need VS Code or any IDE?**
No. OpenTrade is a standalone CLI — run it from any terminal.

**Does it work on Windows?**
Yes. Use PowerShell or the VS Code terminal. The `.env` file handles your API key automatically.

**Can I use Edge instead of Chrome?**
Yes — Edge is Chromium-based and supports the same `--remote-debugging-port` flag.

**Do I need a TradingView subscription?**
You need a free TradingView account. Some features (saved scripts, certain indicators) require a paid plan.

**How much does it cost to run?**
API costs are usage-based. A typical chart analysis costs roughly $0.01–0.03. Pine Script development with multiple compile cycles might cost $0.05–0.15.

**Is my API key safe?**
Yes — it stays in your local `.env` file, which is gitignored and never sent anywhere except directly to Anthropic's API.

---

## Disclaimer

OpenTrade is an independent project for personal, educational use only. Not affiliated with TradingView Inc. or Anthropic. Uses Chrome DevTools Protocol, which may conflict with [TradingView's Terms of Use](https://www.tradingview.com/policies/). Use at your own risk.

## License

MIT
