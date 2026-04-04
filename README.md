```
 _______ ______ _______ _______ _______ ______ _______ _____  _______
|       |   __ \    ___|    |  |_     _|   __ \   _   |     \|    ___|
|   -   |    __/    ___|       | |   | |      <       |  --  |    ___|
|_______|___|  |_______|__|____| |___| |___|__|___|___|_____/|_______|

    The most powerful open-source TradingView AI agent ever built.
```

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![Pine Script](https://img.shields.io/badge/Pine%20Script-v6-blue.svg)](https://www.tradingview.com/pine-script-docs/)
[![Claude](https://img.shields.io/badge/Powered%20by-Claude%20AI-purple.svg)](https://anthropic.com)

📚 **[Full Documentation](docs/Home.md)** · [Installation](docs/Installation.md) · [Tools Reference](docs/Tools-Reference.md) · [Quant Standards](docs/Quant-Standards.md) · [Roadmap](docs/Roadmap.md)

> OpenTrade connects Claude AI to your live TradingView charts via Chrome DevTools Protocol. It reads your indicators, writes and compiles Pine Script, runs multi-symbol scans, executes quantitative analysis, and structures trades the way a hedge fund PM would — all through natural conversation.

---

## What Makes OpenTrade Different

Most "AI trading tools" are wrappers around chart screenshots or paper-thin APIs. OpenTrade is different:

- **Direct TradingView control** — reads every indicator value, every Pine drawing, every price level from your actual live chart
- **Writes and compiles real Pine Script** — not code snippets, but production-ready strategies that compile, run in the backtester, and get saved to your TradingView account
- **Institutional-grade analysis skills** — quantitative regime detection, Kelly Criterion position sizing, HFT microstructure, multi-timeframe hedge fund workflows
- **Fully self-contained** — one repo, `npm install`, done. No external services, no other repos, no subscriptions beyond Anthropic API

---

## Quick Start

```bash
git clone https://github.com/brandononchain/opentrade.git
cd opentrade
npm install
```

Create `.env` in the project folder:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Launch Chrome pointing at TradingView:
```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\ChromeDebug" "https://www.tradingview.com/chart/"

# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/ChromeDebug" "https://www.tradingview.com/chart/"
```

Log into TradingView, then:
```bash
node src/cli/index.js
```

---

## Interfaces

### Terminal (default)
```bash
node src/cli/index.js
```
Full streaming chat. Tool calls visible in real time. Built-in commands: `/state` `/screenshot` `/clear` `/quit`

### Browser UI
```bash
node src/cli/index.js server
# Open: http://localhost:7842
```
Screenshots render inline. Tool call timeline on every response. Good for longer sessions.

### Single commands
```bash
node src/cli/index.js chat "analyze my chart"
node src/cli/index.js pine "write a VWAP deviation strategy"
node src/cli/index.js screenshot
node src/cli/index.js analyze my_script.pine
```

---

## Skills

OpenTrade ships with 7 professional-grade analytical skills that activate automatically based on what you ask.

---

### Chart Analysis
*Triggers: "analyze my chart", "what's on my chart", "give me a market overview"*

Reads every indicator on your chart, maps all Pine Script drawings, organizes levels by proximity to price, and produces a structured market report with a clear directional bias.

```
You: analyze my chart

Agent: ⚡ chart_get_state    → BTCUSDT · 1H · 8 indicators
       ⚡ quote_get           → last=67,420 change=-1.2%
       ⚡ data_get_study_values→ RSI=38.4, MACD=-142 bearish
       ⚡ data_get_pine_lines  → 6 levels identified
       ⚡ capture_screenshot   → chart captured

       BTCUSDT 1H Analysis
       Price: $67,420 | Change: -1.2%
       Structure: BEARISH — price below all EMAs
       Momentum:  RSI 38.4, approaching oversold territory
       🔴 Resistance: 68,100 / 69,500
       🟢 Support:    66,800 / 65,200
       Bias: BEARISH — watching 66,800 for bounce or break
```

---

### Quantitative Analysis
*Triggers: "quant analysis", "statistical edge", "vol regime", "return distribution", "is there edge here"*

Computes institutional-grade statistics from your chart data: return distribution (mean, std, skew, kurtosis), volatility regime detection via 5-bar vs 20-bar vol ratio, z-score from 20-bar mean, momentum factor score, autocorrelation sign, and relative volume — then classifies the market regime and states whether statistical edge exists and what type.

```
You: run quant analysis on ES1!

Agent: RETURN STATS (last 200 bars)
       Mean return:   +0.03%  |  Volatility: 0.41% (6.5% annualized)
       Skewness:      -0.31   |  Kurtosis: 3.8 (mild fat tails)
       Sharpe equiv:  +0.73

       VOLATILITY REGIME
       5-bar vol: 0.38%  |  20-bar vol: 0.41%  |  Ratio: 0.93
       → STABLE — mean reversion strategies favored

       Z-SCORE: -1.82 (1.8 std devs below 20-bar mean)
       AUTOCORR: -0.12 → MEAN REVERTING market

       EDGE: YES — Mean Reversion — 72% confidence
       Recommended: Fade extremes, target VWAP reversion
```

---

### Hedge Fund Analysis
*Triggers: "hedge fund view", "institutional analysis", "risk/reward", "position size", "Kelly"*

Full multi-timeframe confluence scan (Monthly → Weekly → Daily → Intraday), scores each timeframe -2 to +2, maps entry/stop/targets with explicit R-multiples, applies Kelly Criterion for position sizing, checks portfolio heat and factor correlation, and recommends the optimal trade expression (equity, options structure, or futures).

```
You: give me the hedge fund analysis on NVDA

Agent: MULTI-TIMEFRAME SIGNAL
       Monthly: +2 — Strong bull, EMA alignment, expanding volume
       Weekly:  +1 — Bullish, mild consolidation
       Daily:   +2 — Breakout from 3-week base, high rel volume
       Intraday:+1 — Above VWAP, holding 1σ band
       Composite: +1.5 → LONG BIAS

       TRADE SETUP
       Entry zone: $875–$882 (breakout retest)
       Stop:       $858 (below base low, -2.5%)
       T1:         $920 — 2.1R (50% position)
       T2:         $955 — 3.9R (30% position)
       T3:         $990 — 5.6R (20% position)

       SIZING — Half Kelly ($1M AUM)
       Kelly: 4.2%  →  Half Kelly: $21,000  →  24 shares @ $877

       STRUCTURE: Long equity (high conviction) or Jan $900 calls
```

---

### HFT & Market Microstructure
*Triggers: "order flow", "VWAP", "microstructure", "intraday edge", "execution", "liquidity"*

Switches to 1-minute chart and analyzes VWAP position and band touches (±1σ to ±3σ), volume profile levels (POC, VAH, VAL, HVNs, LVNs), opening range status, time-of-day session phase, stop cluster locations (where HFT liquidity hunts occur), and recommends the optimal execution algorithm (VWAP/TWAP/Aggressive/Sniper).

```
You: HFT microstructure analysis on SPY

Agent: VWAP STATUS
       Price: $512.40 — ABOVE VWAP by $1.20 (+0.23%)
       Band touch: Upper 1σ ($512.80) — approaching
       Signal: HOLD LONG, watch for fade at +2σ ($514.20)

       VOLUME PROFILE
       POC: $511.10 — strong magnet below
       Price: ABOVE VAH ($512.00) → breakout territory
       Nearest LVN: $513.50 → expect fast move through it

       SESSION PHASE: Power Hour (14:30 ET)
       OR Status: BROKEN HIGH — momentum intact
       Consecutive up bars: 6 — extended, reduce new long size

       STOP CLUSTERS
       Above: $514.00 (round number + prior high)  ← HFT target
       Below: $511.00 (VAH retest level)

       EXECUTION: Aggressive algo  |  Hold long to $513.50 LVN
       Stop: $510.80 below VAH
```

---

### Portfolio Scanner
*Triggers: "scan my watchlist", "rank these symbols", "best setup", "relative strength"*

Systematically scores every symbol in your watchlist (or a custom list) across 5 factors: momentum (1/5/20-day returns), RSI positioning, ATR volatility profile, volume confirmation, and EMA structure alignment. Calculates relative strength vs SPY, ranks all symbols 0–100, and produces the top 3 actionable setups with ATR-based position sizing.

```
You: scan my watchlist and find the best setups

Agent: PORTFOLIO SCAN — 12 symbols — Daily

       # | Symbol | Score | RS vs SPY | Signal
       1 | NVDA   | 87/100| +12.4%    | STRONG BUY
       2 | META   | 74/100| +6.8%     | BUY
       3 | AMZN   | 68/100| +3.2%     | BUY
       4 | MSFT   | 52/100| +1.1%     | WATCH
       5 | AAPL   | 44/100| -0.8%     | NEUTRAL
       ...

       TOP SETUP: NVDA (87/100)
       Entry: $878 (OR retest)  |  Stop: $858 (-2.3%)
       Target: $920 (2.1R)      |  Size: 24 shares ($100K, 0.5% risk)
```

---

### Macro Regime Analysis
*Triggers: "macro analysis", "regime", "sector rotation", "asset allocation", "risk-on/off"*

Scans 9 cross-asset instruments (SPY, QQQ, IWM, VIX, TLT, HYG, GLD, USO, UUP), scores growth and inflation signals, classifies the current regime (Goldilocks / Stagflation / Deflation / Recovery), and maps the optimal asset allocation, sector rotation, and factor tilt implied by that regime.

```
You: what is the current macro regime?

Agent: CROSS-ASSET SIGNALS
       SPY +8.2% (20D) | VIX 14.2 LOW | TLT -2.1% | HYG +1.8%
       GLD +3.4% | USO +5.1% | UUP -0.8%

       Growth: +1.8/2 → EXPANSION
       Inflation: +0.9/2 → MODERATE
       Risk appetite: RISK-ON (VIX low, HYG bid, IWM leading)

       REGIME: GOLDILOCKS (Growth+, Inflation moderate)

       ASSET ALLOCATION TILT
       Equities: OVERWEIGHT — growth + momentum stocks
       Bonds:    UNDERWEIGHT — avoid long duration
       Commodities: NEUTRAL — oil ok, gold less needed

       SECTOR ROTATION
       Overweight: Technology (XLK), Financials (XLF), Industrials (XLI)
       Underweight: Utilities (XLU), Consumer Staples (XLP), REITs
```

---

### Strategy Backtesting
*Triggers: "backtest", "test this strategy", "strategy tester", "does this have edge"*

Writes a complete Pine Script v6 strategy with realistic commission (0.05%), slippage (2 ticks), and position sizing — uses `[1]` indexing to prevent lookahead bias — compiles it, opens the Strategy Tester, reads all performance metrics, evaluates them against institutional minimums (profit factor >1.5, max DD <20%, >30 trades), and flags red flags or improvement paths.

---

### Pine Script Development
*Triggers: "write a Pine Script", "build an indicator", "compile this"*

Full AI development loop: write → static analysis → inject → compile → fix errors (up to 5 attempts) → screenshot → save. No manual work required.

---

## Pine Script Templates (11 built-in)

| Template | Type | Description |
|----------|------|-------------|
| `ema_ribbon` | Indicator | 5-EMA ribbon with trend background |
| `rsi_divergence` | Indicator | Pivot-based RSI divergence detector |
| `vwap_bands` | Indicator | VWAP + 3 standard deviation bands |
| `session_levels` | Indicator | NY / London / Asia session H/L |
| `ema_cross_strategy` | Strategy | EMA crossover with RSI filter |
| `supertrend_strategy` | Strategy | ATR-based supertrend with signals |
| `zscore_mean_reversion` | Strategy | **[Quant]** Statistical z-score fade |
| `vwap_institutional` | Strategy | **[HFT]** VWAP band fade + reclaim |
| `momentum_factor` | Strategy | **[Quant]** Weighted multi-period momentum |
| `opening_range_breakout` | Strategy | **[HFT]** Intraday ORB with volume filter |
| `multi_factor_dashboard` | Indicator | **[Quant]** Live 4-factor scoring table |

---

## Tools (50 total)

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

## Architecture

```
Your terminal / browser
        │
        ▼
   Claude AI  (claude-sonnet via Anthropic API)
        │  routes to the right skill automatically
        │
        ├── chart-analysis      (7 tools in sequence)
        ├── quant-analysis      (200-bar stats engine)
        ├── hedge-fund-analysis (MTF + Kelly sizing)
        ├── hft-microstructure  (1-min VWAP + volume profile)
        ├── portfolio-scanner   (5-factor scoring)
        ├── macro-regime        (9 cross-asset instruments)
        └── strategy-backtest   (Pine loop + tester reader)
                │
                ▼
   src/tv/tools.js       ← 50 TradingView control functions
   src/tv/connection.js  ← Chrome DevTools Protocol engine
                │
                ▼
   Chrome :9222 → TradingView (live charts)
```

Everything runs in your local environment. No cloud dependency except the Anthropic API call.

---

## Setup

### Requirements
- Node.js 18+ — [nodejs.org](https://nodejs.org)
- Chrome — [google.com/chrome](https://google.com/chrome)
- TradingView account — [tradingview.com](https://tradingview.com)
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com)

### Install
```bash
git clone https://github.com/brandononchain/opentrade.git
cd opentrade
npm install
```

### Configure
Create `.env` in the project root:
```
ANTHROPIC_API_KEY=sk-ant-...
TV_CDP_PORT=9222
TVA_PORT=7842
```

### Launch TradingView in Chrome
```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="C:\ChromeDebug" ^
  "https://www.tradingview.com/chart/"

# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/tmp/ChromeDebug" \
  "https://www.tradingview.com/chart/"
```

Log into TradingView when Chrome opens. **Keep this window running.**

### Run
```bash
node src/cli/index.js          # interactive terminal
node src/cli/index.js server   # browser UI at localhost:7842
```

---

## Example Conversations

```bash
# Quantitative regime detection
"Run quant analysis on the current chart — is there statistical edge?"

# Institutional trade structuring
"Give me the hedge fund analysis on NVDA with Kelly position sizing"

# HFT intraday execution
"VWAP microstructure on ES1! — what's the execution algo right now?"

# Portfolio screening
"Scan NVDA, META, AMZN, MSFT, GOOGL and rank by momentum score"

# Macro positioning
"What's the current macro regime and how should I be positioned?"

# Strategy development
"Write a z-score mean reversion strategy, backtest it on BTCUSDT daily, show me the results"

# Pine Script
"Write a session high/low indicator with VWAP and volume profile overlay"

# Multi-timeframe
"Give me the monthly, weekly, and daily structure on SPY and tell me the composite bias"

# Risk management
"I'm considering a $50K position in TSLA — what's the ATR-based stop and Kelly size?"

# Replay practice
"Start a replay session from 3 months ago and help me practice my entries on ES1!"
```

---

## Roadmap

The goal is to make OpenTrade the most powerful open-source TradingView agent ever built. Planned additions:

- **Options flow integration** — read implied vol, skew, put/call ratio from TradingView options chain
- **Alert automation** — trigger Pine Script alerts → webhook → external execution
- **Pairs trading skill** — statistical arbitrage setup detection and spread monitoring
- **Order flow imbalance** — footprint chart reading and delta analysis
- **Multi-chart layout** — simultaneous analysis across multiple chart panes
- **Portfolio P&L tracking** — track paper trades made through replay across sessions
- **Claude Code integration** — use as a skill inside Claude Code for workflow automation
- **Web scraping layer** — pull earnings dates, economic calendar, insider flow to enrich analysis

Pull requests welcome.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | — | From console.anthropic.com |
| `TV_CDP_PORT` | No | `9222` | Chrome debug port |
| `TVA_PORT` | No | `7842` | Browser UI port |

---

## FAQ

**Do I need VS Code or any IDE?**
No. Runs from any terminal — PowerShell, Terminal.app, iTerm2, Windows Terminal.

**Does it work with Edge instead of Chrome?**
Yes — Edge is Chromium-based and supports the same `--remote-debugging-port` flag.

**Do I need a TradingView subscription?**
Free account works. Saved scripts and some indicators require a paid plan.

**How much does it cost?**
API costs are per-token. A full chart analysis costs ~$0.01–0.03. A complete backtest workflow with multiple compile cycles runs $0.05–0.20.

**Is my API key secure?**
It stays in your local `.env` file, gitignored, and only sent directly to Anthropic's API.

**Can I run this on a cloud server?**
The Anthropic API calls can run anywhere. TradingView requires Chrome running with CDP enabled — on a cloud VM you'd need Xvfb (virtual display) to run Chrome headlessly.

---

## Disclaimer

OpenTrade is an independent project for personal, educational use only. Not affiliated with TradingView Inc. or Anthropic. Using Chrome DevTools Protocol to automate TradingView may conflict with [TradingView's Terms of Use](https://www.tradingview.com/policies/). Nothing here is financial advice. Use at your own risk.

## License

MIT — do whatever you want with it. Build something great.
