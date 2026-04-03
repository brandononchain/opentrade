# OpenTrade

```
 ___________  _____ _   _ ___________  ___ ______ _____
|  _  | ___ \/  ___| \ | |_   _| ___ \/ _ \|  _  \  ___|
| | | | |_/ / `--. | | \| | | | | |_/ / /_\ \ | | | |__
| | | |  __/ `--. \ .`  | | | |    /|  _  | | | |  __|
\ \_/ / |   /\__/ / |\  | | | | |\ \| | | | |/ /| |___
 \___/\_|   \____/\_| \_/ \_/ \_| \_\_| |_/___/ \____/
```

**Claude-powered TradingView agent. Fully self-contained — no external repos required.**

Analyze charts, write Pine Script v6, draw levels, manage alerts, run replay practice — all through natural conversation, from your terminal or browser.

---

## How to Use OpenTrade

OpenTrade is a **standalone CLI application** you install once and run from your terminal. It does not require VS Code, Cursor, or any IDE. You talk to it like a chat interface — in your terminal or in a browser window it serves locally.

### Three ways to interact

| Interface | How | Best for |
|-----------|-----|---------|
| **Terminal chat** | `opentrade` | Power users, scripting, quick commands |
| **Browser UI** | `opentrade server` → `localhost:7842` | Visual work, seeing screenshots inline |
| **Single commands** | `opentrade chat "..."` | Automation, shell scripts |

---

## Install

### Prerequisites
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **TradingView Desktop** — [tradingview.com/desktop](https://www.tradingview.com/desktop/)
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and install

```bash
git clone https://github.com/brandononchain/opentrade.git
cd opentrade
npm install
```

### 2. Set your API key

```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.) so it persists
export ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Install the CLI globally (optional but recommended)

```bash
npm link
# Now you can run `opentrade` from anywhere
```

### 4. Launch TradingView with debug mode

OpenTrade connects to TradingView via Chrome DevTools Protocol on port 9222. You must launch TradingView this way:

```bash
# Mac
open -a TradingView --args --remote-debugging-port=9222

# Windows (Command Prompt)
"%LOCALAPPDATA%\TradingView\TradingView.exe" --remote-debugging-port=9222

# Linux
tradingview --remote-debugging-port=9222

# Or let OpenTrade launch it for you:
opentrade chat "launch TradingView in debug mode"
```

> **Tip:** Create an alias or shell script so you don't have to type this every time.
> Mac example: `echo 'alias tv="open -a TradingView --args --remote-debugging-port=9222"' >> ~/.zshrc`

---

## Usage

### Interactive terminal chat (recommended)

```bash
opentrade
```

Starts a streaming chat session in your terminal with full color output, history, and built-in commands.

```
 ___________  _____ _   _ ___________  ___ ______ _____
|  _  | ___ \/  ___| \ | |_   _| ___ \/ _ \|  _  \  ___|
...

✓ TradingView connected  (ES1! · 5)

You › analyze my chart and give me the key levels
Agent ›
  ⚡ chart_get_state   {"symbol":"ES1!","resolution":"5"}
  ✓ symbol=ES1!, resolution=5, studies=7
  ⚡ quote_get
  ✓ last=5842.25, change_pct=-0.14%
  ...

  **ES1! 5-Minute Analysis**

  Price: 5842.25 | Change: -0.14%

  **Key Levels**
  - 🔴 Resistance: 5868, 5851
  - 🟢 Support: 5832, 5818
  ...
```

**Built-in terminal commands:**

| Command | Action |
|---------|--------|
| `/state` | Show current chart symbol and timeframe |
| `/screenshot` | Capture and save chart screenshot |
| `/clear` | Clear conversation history |
| `/quit` | Exit |

---

### Browser UI

```bash
opentrade server
# Open http://localhost:7842 in your browser
```

The browser UI streams responses in real time, embeds screenshots inline, shows every tool call, and has quick-action buttons for common tasks.

---

### Single-command mode

```bash
# Pass a message directly — perfect for shell scripts
opentrade chat "switch to AAPL on the daily timeframe"
opentrade chat "what are the RSI and MACD readings right now"
opentrade chat "write a supertrend indicator and compile it"
```

---

### Pine Script writer

```bash
opentrade pine "RSI divergence detector with bullish and bearish signals"
```

Runs the full development loop: write → static analyze → inject → compile → fix errors → screenshot → save. Shows you every step.

---

### Static analyzer (no TradingView needed)

```bash
opentrade analyze my_strategy.pine
```

Checks your Pine Script file for errors offline — array out-of-bounds, deprecated syntax, missing declarations, and more.

---

### Other commands

```bash
opentrade health      # Check TradingView connection
opentrade state       # Print current chart state (symbol, TF, studies)
opentrade screenshot  # Capture chart → saves as PNG
opentrade help        # Show all commands
```

---

## What You Can Ask

```bash
# Chart analysis
"Give me a full analysis of my chart"
"What are the key support and resistance levels?"
"What's the RSI reading and is it overbought?"
"Take a screenshot of my chart"

# Chart control
"Switch to NVDA on the 1-hour timeframe"
"Add the Bollinger Bands indicator"
"Change to Heikin Ashi candles"
"Scroll back to the January 15th high"

# Pine Script
"Write a VWAP with standard deviation bands"
"Build an EMA crossover strategy with proper risk management"
"Debug this Pine Script: [paste code]"
"List all my saved Pine Scripts"
"Open my 'Session Levels' script"

# Drawings
"Draw a horizontal line at 5800"
"Mark support at 5750 and resistance at 5900"
"Clear all my drawings"

# Alerts
"Create an alert for when price reaches 6000"
"Show me all my active alerts"

# Multi-symbol
"Scan ES, NQ, YM, and RTY — which has the strongest momentum?"
"Take screenshots of AAPL, MSFT, and NVDA on the daily chart"

# Replay
"Start a replay session from 60 days ago"
"Step forward 10 bars"
"Buy 5 contracts at market price"
"What's my replay P&L?"
"Stop replay and go back to live"

# Watchlist
"Show me my watchlist"
"Add SMCI and ARM to my watchlist"
```

---

## Architecture

```
Your terminal / browser
        │
        ▼
  Claude Agent (claude-opus-4-5)
        │
        ├── src/tv/connection.js  ← CDP engine (connects to TradingView)
        ├── src/tv/tools.js       ← 50 TradingView control tools
        ├── src/pine/analyzer.js  ← Pine v6 static analyzer
        ├── src/pine/templates.js ← Ready-to-use Pine v6 templates
        └── src/pine/writer.js    ← AI Pine development loop
                │
                ▼
      Chrome DevTools Protocol
         (localhost:9222)
                │
                ▼
      TradingView Desktop (Electron)
```

Everything is self-contained in this repo. No other packages, repos, or servers needed beyond `npm install`.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | — | Your Anthropic API key |
| `TV_CDP_PORT` | No | `9222` | TradingView CDP port |
| `TVA_PORT` | No | `7842` | Browser UI port |

---

## FAQ

**Do I need VS Code or Cursor?**
No. OpenTrade is a standalone CLI. It works from any terminal — Terminal.app, iTerm2, Windows Terminal, PowerShell, etc.

**Does it work alongside VS Code / Cursor?**
Yes. You can run `opentrade` in any terminal tab alongside your IDE. They're completely independent.

**Can I use it as a Claude Code skill?**
Yes — drop `CLAUDE.md` from this repo into your project and Claude Code will use it as an agent skill automatically.

**Does it require a TradingView subscription?**
You need TradingView Desktop installed (free download). Some features like saved scripts require a TradingView account.

**How does the billing work?**
OpenTrade uses the Anthropic API directly. You pay per token at standard API rates. A typical chart analysis costs ~$0.01–0.03.

---

## Disclaimer

OpenTrade is an independent project for **personal, educational use only**. Not affiliated with TradingView Inc. or Anthropic. Uses Chrome DevTools Protocol, which may conflict with [TradingView's Terms of Use](https://www.tradingview.com/policies/). You are solely responsible for your usage. Do not use to redistribute data or automate trading.

## License

MIT
