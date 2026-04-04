# Architecture

How OpenTrade works under the hood.

---

## Overview

```
Your Input (terminal / browser)
          │
          ▼
    Claude AI  ←──── ANTHROPIC API
          │
          │  reads 7 skills (CLAUDE.md + src/skills/)
          │  selects appropriate tools
          │
          ▼
    src/mcp/client.js        ← tool dispatcher
          │
          ▼
    src/tv/tools.js          ← 50 TradingView control functions
          │
          ▼
    src/tv/connection.js     ← Chrome DevTools Protocol engine
          │
          ▼
    Chrome :9222  ──── CDP websocket ────  TradingView (Electron/web)
```

---

## Component Breakdown

### `src/tv/connection.js` — CDP Engine

The lowest layer. Manages the Chrome DevTools Protocol connection:

- Discovers the TradingView tab by scanning `localhost:9222/json/list`
- Opens a CDP websocket to that tab
- Exposes `evaluate()` and `evaluateAsync()` for running JavaScript inside TradingView's page context
- Handles reconnection with exponential backoff (5 retries)
- Provides `waitForChartReady()` for symbol/timeframe switches
- Contains `launchTradingView()` for auto-launching Desktop

```javascript
// Example: running JS in TradingView's context
const symbol = await evaluate(`
  window.TradingViewApi._activeChartWidgetWV.value().symbol()
`);
```

### `src/tv/tools.js` — 50 Tool Functions

The business logic layer. Each exported function maps to one tool:

- **Chart functions**: Read/write via `window.TradingViewApi._activeChartWidgetWV.value()`
- **Data functions**: Pull OHLCV via `mainSeries().bars()`, indicators via `getAllStudies()`
- **Pine functions**: Interact with Monaco editor via React fiber traversal (`__reactFiber$`)
- **Screenshot**: Uses CDP's `Page.captureScreenshot()` with optional clip regions
- **Replay**: Controls `window.TradingViewApi._replayApi`
- **Alerts**: DOM interaction via `document.querySelector`

### `src/mcp/client.js` — Tool Dispatcher

Maps tool names (strings) to `src/tv/tools.js` functions. Also exports convenience namespaces (`chart.*`, `data.*`, `pine.*`) used by the CLI and server directly.

### `src/agent/claude.js` — Claude Agent Loop

The AI orchestration layer:

1. Converts tool definitions to Anthropic's tool format
2. Sends `messages` + `tools` to Claude via the Anthropic API
3. **Critical**: When Claude returns multiple `tool_use` blocks in one response, all are executed and all results are returned in a **single** user message. This is required by the API.
4. Loops until `stop_reason === 'end_turn'`
5. Yields events as an async generator for streaming output

```javascript
// The critical multi-tool pattern (common mistake area)
const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
const toolResultContents = [];

for (const block of toolUseBlocks) {
    const result = await callTool(block.name, block.input);
    toolResultContents.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
}

// ALL results in ONE user message — not one message per tool
currentMessages.push({ role: 'user', content: toolResultContents });
```

### `src/skills/` — Skill Files

Seven markdown files that tell Claude exactly how to approach specific categories of requests. These are embedded in `CLAUDE.md` as a decision routing table.

Skills are not code — they are structured instructions defining:
- What tools to call and in what order
- How to interpret results
- What format to produce output in
- Domain-specific knowledge (Kelly math, vol regime thresholds, etc.)

### `src/pine/` — Pine Script Utilities

- **`analyzer.js`**: Static analysis (no TradingView needed). Catches missing declarations, array OOB, deprecated syntax.
- **`templates.js`**: 11 complete Pine v6 scripts as JavaScript template strings.
- **`writer.js`**: AI-powered development loop using Claude to write and fix Pine Scripts.

### `src/cli/index.js` — Terminal Interface

Handles all CLI commands. Loads `.env` via `src/env/load.js`. Renders colored output, streaming tool calls, and markdown.

### `src/web/server.js` — Browser UI

HTTP + WebSocket server. History is managed server-side per connection — not sent by the client — to preserve correct message structure across tool-use turns.

### `src/env/load.js` — Zero-dependency `.env` Loader

Reads `.env` from the project root using only Node.js built-ins. Parses `KEY=VALUE` lines, strips quotes, skips comments. No `dotenv` package needed.

---

## TradingView Internal API Paths

These are the undocumented internal API paths OpenTrade uses, discovered via live CDP probing:

| Path | What it accesses |
|------|-----------------|
| `window.TradingViewApi._activeChartWidgetWV.value()` | Active chart widget |
| `window.TradingViewApi._chartWidgetCollection` | Chart collection |
| `window.TradingView.bottomWidgetBar` | Pine editor panel |
| `window.TradingViewApi._replayApi` | Replay controls |
| `window.TradingViewApi._alertService` | Alert system |
| `window.TradingViewApi._activeChartWidgetWV.value()._chartWidget.model().mainSeries().bars()` | Raw OHLCV bars |

These paths are not public API and may change with TradingView updates.

---

## Data Flow: "Analyze My Chart"

```
User: "analyze my chart"
         │
         ▼
Claude decides: use chart-analysis skill
         │
         ▼
Parallel tool calls:
  chart_get_state ──────────────────────────────────┐
  quote_get ────────────────────────────────────────┤
  data_get_study_values ────────────────────────────┤
  data_get_pine_lines ──────────────────────────────┤ All results
  data_get_pine_labels ─────────────────────────────┤ returned in
  data_get_ohlcv (summary:true) ────────────────────┘ one message
         │
         ▼
capture_screenshot
         │
         ▼
Claude synthesizes → structured report → streams to terminal/browser
```

---

## Security Model

- All processing is local. No chart data leaves your machine except the text sent to the Anthropic API.
- TradingView credentials never touch OpenTrade — you log in manually in Chrome.
- The Anthropic API key is stored only in `.env` (gitignored).
- CDP access is localhost-only. The debug port should never be exposed externally.

---

## Adding a New Tool

1. Add the function to `src/tv/tools.js`:
```javascript
export async function myNewTool({ param }) {
  const result = await evaluate(`/* your JS */`);
  return { success: true, ...result };
}
```

2. Add to the tool map in `src/mcp/client.js`:
```javascript
my_new_tool: () => tools.myNewTool(args),
```

3. Add the tool definition to `TOOL_DEFINITIONS` array in `src/mcp/client.js`

4. Update `CLAUDE.md` and the relevant skill file

---

## Adding a New Skill

1. Create `src/skills/my-skill.md`
2. Add the trigger keywords to the routing table in `CLAUDE.md`
3. Update `src/agent/claude.js` system prompt with the new skill's approach
4. Add to `docs/Home.md` skill table
