# Connecting TradingView

OpenTrade connects to TradingView via **Chrome DevTools Protocol (CDP)** on port 9222. This requires Chrome (or any Chromium-based browser) to be launched with a special debug flag.

> **Why Chrome?** TradingView Desktop on Windows requires Windows 10.0.19042+. If you're on an older version or Windows Server, use the Chrome + TradingView web approach below — it works identically.

---

## Windows

### Option A — Chrome + TradingView Web (recommended)

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="C:\ChromeDebug" `
  "https://www.tradingview.com/chart/"
```

Log into TradingView when Chrome opens. Keep this window running.

**Create a shortcut** so you don't have to type this every time:
1. Right-click Desktop → New → Shortcut
2. Target: `"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\ChromeDebug" "https://www.tradingview.com/chart/"`
3. Name it: `TradingView (OpenTrade)`

### Option B — Microsoft Edge (already installed)

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="C:\EdgeDebug" `
  "https://www.tradingview.com/chart/"
```

### Option C — TradingView Desktop (Windows 10 21H2+ only)

First find the executable path:
```powershell
(Get-AppxPackage -Name "*TradingView*").InstallLocation
```

Then launch with CDP:
```powershell
$tv = (Get-AppxPackage -Name "*TradingView*").InstallLocation
& "$tv\TradingView.exe" --remote-debugging-port=9222
```

---

## Mac

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/tmp/ChromeDebug" \
  "https://www.tradingview.com/chart/"
```

**Add an alias** to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
alias tvopen='/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/ChromeDebug" "https://www.tradingview.com/chart/"'
```

Then just run `tvopen` from any terminal.

### TradingView Desktop (Mac)

```bash
open -a TradingView --args --remote-debugging-port=9222
```

---

## Linux

```bash
google-chrome --remote-debugging-port=9222 \
  --user-data-dir="/tmp/ChromeDebug" \
  "https://www.tradingview.com/chart/"
```

Or with Chromium:
```bash
chromium-browser --remote-debugging-port=9222 \
  --user-data-dir="/tmp/ChromeDebug" \
  "https://www.tradingview.com/chart/"
```

---

## Verify the Connection

After launching Chrome with CDP, open a new browser tab and go to:
```
http://localhost:9222/json/list
```

You should see a JSON array. If TradingView is in it, OpenTrade can connect.

Then verify from OpenTrade:
```bash
node src/cli/index.js health
```

---

## Auto-Launch from OpenTrade

OpenTrade can attempt to auto-launch TradingView for you:
```
node src/cli/index.js chat "launch TradingView in debug mode"
```

This uses `tv_launch` which searches common install paths. It works for TradingView Desktop but not for Chrome + TV web.

---

## Keeping TradingView Open

OpenTrade only works while TradingView is open and visible in Chrome. If Chrome is closed, tools will fail with a CDP connection error. You'll need to relaunch Chrome and reconnect.

**Tips:**
- Pin the Chrome debug window to your taskbar
- Use a separate Chrome profile (`--user-data-dir`) so it doesn't interfere with your regular browser
- On Windows, add the launch command to Task Scheduler to auto-start it

---

## Firefox / Safari

Firefox and Safari do **not** support Chrome DevTools Protocol. OpenTrade requires a Chromium-based browser (Chrome, Edge, Brave, or Chromium).

---

*Next: [Your First Analysis](First-Analysis)*
