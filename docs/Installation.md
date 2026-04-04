# Installation

## Requirements

| Requirement | Version | Link |
|-------------|---------|------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Chrome or Edge | Any recent | [google.com/chrome](https://google.com/chrome) |
| TradingView account | Free or paid | [tradingview.com](https://tradingview.com) |
| Anthropic API key | — | [console.anthropic.com](https://console.anthropic.com) |

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/brandononchain/opentrade.git
cd opentrade
npm install
```

---

## Step 2 — Create your `.env` file

Create a file called `.env` in the `opentrade/` folder:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Optional settings:
```
TV_CDP_PORT=9222
TVA_PORT=7842
```

Your `.env` is gitignored — it never gets committed.

> **Get your API key** at [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

---

## Step 3 — Launch TradingView in Chrome with CDP

TradingView must be open in Chrome with the remote debugging port enabled. See [Connecting TradingView](Connecting-TradingView) for full platform instructions.

**Quick version (Windows):**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\ChromeDebug" "https://www.tradingview.com/chart/"
```

**Quick version (Mac):**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/ChromeDebug" "https://www.tradingview.com/chart/"
```

Log into your TradingView account when Chrome opens.

---

## Step 4 — Run OpenTrade

```bash
node src/cli/index.js
```

You should see the banner, then:
```
✓ Connected (BTCUSDT)
You ›
```

Type anything to start.

---

## Optional: Install globally

```bash
npm link
opentrade          # now works from anywhere
```

---

## Verify the connection

```bash
node src/cli/index.js health
```

Expected output:
```json
{
  "success": true,
  "cdp_connected": true,
  "chart_symbol": "BTCUSDT",
  "chart_resolution": "60",
  "api_available": true
}
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Could not resolve authentication method` | Add `ANTHROPIC_API_KEY` to your `.env` file |
| `CDP connection failed` | Make sure Chrome is running with `--remote-debugging-port=9222` |
| `TradingView not found` | Navigate to `localhost:9222/json/list` in browser — should show TradingView |
| `npm install` fails | Make sure Node.js 18+ is installed: `node --version` |
| `.msix` install fails on Windows | See [Connecting TradingView](Connecting-TradingView) — use Chrome instead of TradingView Desktop |

---

*Next: [Connecting TradingView](Connecting-TradingView)*
