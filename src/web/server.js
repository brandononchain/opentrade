/**
 * TradingView Agent Web Server
 * Serves the browser UI and provides WebSocket + HTTP API.
 */
import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.TVA_PORT || '7842');

/**
 * Start the web server.
 */
export async function startServer() {
  const { agentTurn, connect: connectAgent } = await import('../agent/claude.js');
  const { connect, callTool, getTools, health, chart, capture } = await import('../mcp/client.js');

  // Try connecting to TradingView
  let tvConnected = false;
  try {
    await connect();
    await health.check();
    tvConnected = true;
    console.log('✓ TradingView connected');
  } catch (e) {
    console.log('⚠ TradingView not connected (start with tv_launch)');
  }

  // HTTP handler
  const httpHandler = async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Serve index.html
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = buildUI();
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    // API: status
    if (url.pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      let status = { connected: false };
      try {
        const h = await health.check();
        status = { connected: true, ...h };
      } catch (e) {
        status = { connected: false, error: e.message };
      }
      res.end(JSON.stringify(status));
      return;
    }

    // API: chart state
    if (url.pathname === '/api/state') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      try {
        const state = await chart.getState();
        res.end(JSON.stringify(state));
      } catch (e) {
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    // API: screenshot
    if (url.pathname === '/api/screenshot') {
      try {
        const region = url.searchParams.get('region') || 'chart';
        const ss = await capture.screenshot(region);
        if (ss.data) {
          res.writeHead(200, { 'Content-Type': ss.mimeType || 'image/png' });
          res.end(Buffer.from(ss.data, 'base64'));
        } else {
          res.writeHead(404);
          res.end('No screenshot');
        }
      } catch (e) {
        res.writeHead(500);
        res.end(e.message);
      }
      return;
    }

    // API: tools list
    if (url.pathname === '/api/tools') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      try {
        const tools = await getTools();
        res.end(JSON.stringify(tools));
      } catch (e) {
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    // API: call tool directly
    if (url.pathname === '/api/tool' && req.method === 'POST') {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', async () => {
        try {
          const { name, args } = JSON.parse(body);
          const result = await callTool(name, args);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  };

  const server = createServer(httpHandler);

  // WebSocket for streaming agent responses
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Browser connected');
    let history = [];

    ws.on('message', async (data) => {
      let msg;
      try { msg = JSON.parse(data.toString()); } catch { return; }

      if (msg.type === 'chat') {
        const userMessage = msg.content;
        const sessionHistory = msg.history || history;

        ws.send(JSON.stringify({ type: 'start' }));

        const messages = [...sessionHistory, { role: 'user', content: userMessage }];
        let fullText = '';

        try {
          for await (const event of agentTurn(messages)) {
            if (event.type === 'text') {
              fullText += event.text;
              ws.send(JSON.stringify({ type: 'text', content: event.text }));
            } else if (event.type === 'tool_use') {
              ws.send(JSON.stringify({ type: 'tool_use', name: event.name, input: event.input }));
            } else if (event.type === 'tool_result') {
              ws.send(JSON.stringify({ type: 'tool_result', name: event.name, result: event.result }));
            } else if (event.type === 'tool_error') {
              ws.send(JSON.stringify({ type: 'tool_error', name: event.name, error: event.error }));
            } else if (event.type === 'done') {
              // Update history
              history = [
                ...messages,
                { role: 'assistant', content: fullText },
              ];
              if (history.length > 40) history = history.slice(-40);
              ws.send(JSON.stringify({ type: 'done', usage: event.usage }));
            }
          }
        } catch (e) {
          ws.send(JSON.stringify({ type: 'error', error: e.message }));
        }
      }

      if (msg.type === 'clear_history') {
        history = [];
        ws.send(JSON.stringify({ type: 'cleared' }));
      }

      if (msg.type === 'screenshot') {
        try {
          const ss = await capture.screenshot(msg.region || 'chart');
          ws.send(JSON.stringify({ type: 'screenshot', data: ss.data, mimeType: ss.mimeType }));
        } catch (e) {
          ws.send(JSON.stringify({ type: 'error', error: e.message }));
        }
      }
    });

    ws.on('close', () => console.log('Browser disconnected'));
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 TradingView Agent UI: http://localhost:${PORT}\n`);
  });
}

/**
 * Build the single-file browser UI HTML.
 */
function buildUI() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TradingView Agent</title>
<style>
  :root {
    --bg:       #0a0e1a;
    --bg2:      #111827;
    --bg3:      #1a2235;
    --border:   #1e2d4a;
    --accent:   #00c8ff;
    --accent2:  #7c3aed;
    --green:    #00e5a0;
    --red:      #ff4560;
    --yellow:   #ffd700;
    --text:     #e2e8f0;
    --muted:    #64748b;
    --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    --font-ui:  -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-ui);
    height: 100vh;
    display: grid;
    grid-template-rows: 56px 1fr;
    grid-template-columns: 280px 1fr;
    grid-template-areas: "header header" "sidebar main";
    overflow: hidden;
  }

  /* ── Header ── */
  header {
    grid-area: header;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 16px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #00c8ff, #7c3aed);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .logo-text { color: var(--accent); }

  .header-status {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--muted);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
  }
  .status-dot.connected { background: var(--green); box-shadow: 0 0 6px var(--green); }
  .status-dot.error { background: var(--red); }

  .header-actions { display: flex; gap: 8px; margin-left: 16px; }
  .btn-sm {
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-sm:hover { background: var(--bg3); border-color: var(--accent); color: var(--accent); }

  /* ── Sidebar ── */
  aside {
    grid-area: sidebar;
    background: var(--bg2);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .sidebar-section { padding: 16px; border-bottom: 1px solid var(--border); }
  .sidebar-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .chart-state {
    font-family: var(--font-mono);
    font-size: 11px;
  }

  .chart-state-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid #1a2235;
  }

  .chart-state-key { color: var(--muted); }
  .chart-state-val { color: var(--accent); font-weight: 600; }

  .quick-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text);
    font-size: 12px;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: all 0.15s;
    margin-bottom: 2px;
  }
  .quick-btn:hover { background: var(--bg3); border-color: var(--border); }
  .quick-btn .icon { opacity: 0.7; font-size: 14px; }

  .tool-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    background: rgba(0, 200, 255, 0.1);
    color: var(--accent);
    border: 1px solid rgba(0, 200, 255, 0.2);
    margin: 2px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .tool-badge:hover { background: rgba(0, 200, 255, 0.2); }

  .tools-grid { display: flex; flex-wrap: wrap; gap: 3px; max-height: 200px; overflow-y: auto; }

  /* ── Main Chat Area ── */
  main {
    grid-area: main;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    scroll-behavior: smooth;
  }

  .message {
    display: flex;
    gap: 12px;
    max-width: 100%;
  }

  .message.user { flex-direction: row-reverse; }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .avatar.agent { background: linear-gradient(135deg, #00c8ff22, #7c3aed33); border: 1px solid #7c3aed55; }
  .avatar.user  { background: linear-gradient(135deg, #00e5a022, #00c8ff33); border: 1px solid #00c8ff55; }

  .bubble {
    max-width: 75%;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.6;
    border: 1px solid var(--border);
  }

  .bubble.agent { background: var(--bg3); border-color: #1e3a5f; }
  .bubble.user  { background: rgba(0, 200, 255, 0.08); border-color: rgba(0, 200, 255, 0.2); }

  /* Tool calls in bubbles */
  .tool-call {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(124, 58, 237, 0.1);
    border: 1px solid rgba(124, 58, 237, 0.2);
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    margin: 4px 0;
  }

  .tool-name { color: #a78bfa; font-weight: 600; }
  .tool-args { color: var(--muted); }

  .tool-result {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    margin: 2px 0;
  }

  .tool-result.success::before { content: '✓'; color: var(--green); }
  .tool-result.error::before { content: '✗'; color: var(--red); }

  /* Code blocks */
  pre {
    background: #0d1117;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px;
    overflow-x: auto;
    margin: 8px 0;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
  }

  code { font-family: var(--font-mono); font-size: 12px; color: var(--accent); }
  pre code { color: #e2e8f0; }

  .code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #161b22;
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono);
  }

  .copy-btn {
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    font-size: 10px;
    cursor: pointer;
  }
  .copy-btn:hover { color: var(--text); }

  /* Screenshot */
  .screenshot-img {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid var(--border);
    margin-top: 8px;
  }

  /* Input area */
  .input-area {
    padding: 16px 24px;
    background: var(--bg2);
    border-top: 1px solid var(--border);
  }

  .input-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 4px 8px 4px 16px;
    transition: border-color 0.15s;
  }
  .input-row:focus-within { border-color: var(--accent); }

  #userInput {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text);
    font-size: 14px;
    font-family: var(--font-ui);
    resize: none;
    outline: none;
    padding: 10px 0;
    max-height: 160px;
    min-height: 24px;
    line-height: 1.5;
  }

  #userInput::placeholder { color: var(--muted); }

  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: var(--accent);
    color: #000;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
    margin-bottom: 2px;
  }
  .send-btn:hover { background: #33d6ff; transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .input-hints {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .hint-chip {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    background: var(--bg3);
    border: 1px solid var(--border);
    color: var(--muted);
    cursor: pointer;
    transition: all 0.15s;
  }
  .hint-chip:hover { color: var(--accent); border-color: var(--accent); }

  /* Markdown rendering */
  .bubble h1, .bubble h2, .bubble h3 { color: var(--accent); margin: 10px 0 6px; }
  .bubble ul, .bubble ol { padding-left: 18px; }
  .bubble li { margin: 3px 0; }
  .bubble strong { color: #fff; }
  .bubble a { color: var(--accent); }

  /* Typing indicator */
  .typing {
    display: flex;
    gap: 4px;
    padding: 4px;
    align-items: center;
  }
  .typing span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: bounce 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-6px); opacity: 1; }
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--muted); }
</style>
</head>
<body>

<header>
  <div class="logo">
    <div class="logo-icon">📈</div>
    <span class="logo-text">TradingView Agent</span>
  </div>
  <div class="header-status">
    <div class="status-dot" id="statusDot"></div>
    <span id="statusText">Connecting...</span>
  </div>
  <div class="header-actions">
    <button class="btn-sm" onclick="sendMsg('Take a screenshot of the chart')">📸 Screenshot</button>
    <button class="btn-sm" onclick="sendMsg('Get the current chart state')">📊 State</button>
    <button class="btn-sm" onclick="clearChat()">🗑 Clear</button>
  </div>
</header>

<aside>
  <div class="sidebar-section">
    <div class="sidebar-label">Chart State</div>
    <div class="chart-state" id="chartState">
      <div class="chart-state-row">
        <span class="chart-state-key">Symbol</span>
        <span class="chart-state-val" id="stateSymbol">—</span>
      </div>
      <div class="chart-state-row">
        <span class="chart-state-key">Timeframe</span>
        <span class="chart-state-val" id="stateTf">—</span>
      </div>
      <div class="chart-state-row">
        <span class="chart-state-key">Status</span>
        <span class="chart-state-val" id="stateStatus">—</span>
      </div>
    </div>
  </div>

  <div class="sidebar-section">
    <div class="sidebar-label">Quick Actions</div>
    <button class="quick-btn" onclick="sendMsg('Analyze my chart and provide key price levels, indicator readings, and market bias')">
      <span class="icon">🔍</span> Full Analysis
    </button>
    <button class="quick-btn" onclick="sendMsg('Write a Pine Script v6 EMA crossover strategy with proper risk management')">
      <span class="icon">📝</span> EMA Strategy
    </button>
    <button class="quick-btn" onclick="sendMsg('Draw support and resistance levels on my chart based on recent price action')">
      <span class="icon">📏</span> Draw S/R Levels
    </button>
    <button class="quick-btn" onclick="sendMsg('Run a multi-symbol analysis on SPY, QQQ, and IWM to compare market breadth')">
      <span class="icon">⚡</span> Multi-Symbol Scan
    </button>
    <button class="quick-btn" onclick="sendMsg('Set up a price alert for when price crosses the current level')">
      <span class="icon">🔔</span> Create Alert
    </button>
    <button class="quick-btn" onclick="sendMsg('Start a replay session from 30 days ago to practice my strategy')">
      <span class="icon">▶️</span> Start Replay
    </button>
  </div>

  <div class="sidebar-section">
    <div class="sidebar-label">MCP Tools (<span id="toolCount">—</span>)</div>
    <div class="tools-grid" id="toolsGrid">
      <span style="color: var(--muted); font-size: 11px;">Loading...</span>
    </div>
  </div>

  <div class="sidebar-section" style="margin-top: auto;">
    <div class="sidebar-label">Pine Script</div>
    <button class="quick-btn" onclick="sendMsg('List all my saved Pine Scripts')">
      <span class="icon">📂</span> List Scripts
    </button>
    <button class="quick-btn" onclick="promptPine()">
      <span class="icon">✏️</span> Write New Script
    </button>
    <button class="quick-btn" onclick="sendMsg('Compile the current Pine Script and show me any errors')">
      <span class="icon">🔨</span> Compile Current
    </button>
  </div>
</aside>

<main>
  <div class="messages" id="messages">
    <div class="message">
      <div class="avatar agent">🤖</div>
      <div class="bubble agent">
        <strong>Welcome to TradingView Agent!</strong><br><br>
        I'm your Claude-powered AI assistant with full control over TradingView Desktop via 78 MCP tools.
        I can:
        <ul>
          <li>Analyze your charts and read indicator values</li>
          <li>Write, compile, and debug Pine Script v6</li>
          <li>Navigate charts, change symbols and timeframes</li>
          <li>Draw trend lines, support/resistance levels</li>
          <li>Manage alerts and watchlists</li>
          <li>Run multi-symbol batch analysis</li>
          <li>Practice trading via replay mode</li>
        </ul>
        <br>What would you like to do today?
      </div>
    </div>
  </div>

  <div class="input-area">
    <div class="input-row">
      <textarea
        id="userInput"
        placeholder="Ask me anything about your charts, Pine Script, or trading..."
        rows="1"
        onkeydown="handleKey(event)"
        oninput="autoResize(this)"
      ></textarea>
      <button class="send-btn" id="sendBtn" onclick="send()">↑</button>
    </div>
    <div class="input-hints">
      <span class="hint-chip" onclick="setInput('Analyze my current chart')">Analyze chart</span>
      <span class="hint-chip" onclick="setInput('Write an RSI divergence indicator in Pine Script v6')">RSI divergence</span>
      <span class="hint-chip" onclick="setInput('Switch to AAPL on the 1H timeframe')">Switch symbol</span>
      <span class="hint-chip" onclick="setInput('What are the key support and resistance levels?')">S/R levels</span>
      <span class="hint-chip" onclick="setInput('Show me the watchlist')">Watchlist</span>
    </div>
  </div>
</main>

<script>
// ── WebSocket ──
const wsUrl = 'ws://' + location.host;
let ws = null;
let isStreaming = false;
let currentBubble = null;
let currentText = '';

function connectWS() {
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    checkStatus();
    loadTools();
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === 'start') {
      currentText = '';
      currentBubble = addAgentBubble('');
    }

    if (msg.type === 'text') {
      currentText += msg.content;
      updateBubble(currentBubble, currentText);
    }

    if (msg.type === 'tool_use') {
      addToolCall(currentBubble, msg.name, msg.input);
    }

    if (msg.type === 'tool_result') {
      addToolResult(currentBubble, msg.name, msg.result);

      // If screenshot, embed image
      if (msg.result?.type === 'image' && msg.result?.data) {
        addScreenshot(currentBubble, msg.result.data, msg.result.mimeType);
      }
    }

    if (msg.type === 'tool_error') {
      addToolResult(currentBubble, msg.name, null, msg.error);
    }

    if (msg.type === 'screenshot') {
      addScreenshot(currentBubble || addAgentBubble(''), msg.data, msg.mimeType);
    }

    if (msg.type === 'done') {
      isStreaming = false;
      document.getElementById('sendBtn').disabled = false;
    }

    if (msg.type === 'error') {
      if (currentBubble) {
        updateBubble(currentBubble, currentText + '\\n\\n⚠️ ' + msg.error);
      }
      isStreaming = false;
      document.getElementById('sendBtn').disabled = false;
    }
  };

  ws.onclose = () => {
    setTimeout(connectWS, 2000);
  };
}

// ── Status ──
async function checkStatus() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if (d.connected) {
      dot.className = 'status-dot connected';
      text.textContent = d.symbol ? d.symbol + ' · ' + (d.resolution || '') : 'Connected';
      // Update chart state panel
      if (d.symbol) document.getElementById('stateSymbol').textContent = d.symbol;
      if (d.resolution) document.getElementById('stateTf').textContent = d.resolution;
      document.getElementById('stateStatus').textContent = '✓ Live';
    } else {
      dot.className = 'status-dot error';
      text.textContent = 'TradingView not connected';
      document.getElementById('stateStatus').textContent = '✗ Offline';
    }
  } catch {}
  setTimeout(checkStatus, 5000);
}

// ── Tools ──
async function loadTools() {
  try {
    const r = await fetch('/api/tools');
    const tools = await r.json();
    document.getElementById('toolCount').textContent = tools.length || '—';
    const grid = document.getElementById('toolsGrid');
    grid.innerHTML = '';
    const shown = (tools || []).slice(0, 30);
    for (const t of shown) {
      const b = document.createElement('span');
      b.className = 'tool-badge';
      b.textContent = t.name;
      b.onclick = () => setInput('Use ' + t.name);
      b.title = t.description || '';
      grid.appendChild(b);
    }
    if (tools.length > 30) {
      const more = document.createElement('span');
      more.className = 'tool-badge';
      more.style.opacity = '0.5';
      more.textContent = '+' + (tools.length - 30) + ' more';
      grid.appendChild(more);
    }
  } catch {}
}

// ── Messaging ──
function send() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text || isStreaming || !ws || ws.readyState !== WebSocket.OPEN) return;

  addUserMessage(text);
  input.value = '';
  input.style.height = 'auto';

  isStreaming = true;
  document.getElementById('sendBtn').disabled = true;
  currentBubble = null;

  ws.send(JSON.stringify({ type: 'chat', content: text }));
}

function sendMsg(text) {
  document.getElementById('userInput').value = text;
  send();
}

function setInput(text) {
  const input = document.getElementById('userInput');
  input.value = text;
  input.focus();
  autoResize(input);
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function clearChat() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'clear_history' }));
  }
  const msgs = document.getElementById('messages');
  msgs.innerHTML = '';
}

function promptPine() {
  setInput('Write a Pine Script v6 indicator for: ');
  document.getElementById('userInput').focus();
}

// ── DOM helpers ──
function addUserMessage(text) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'message user';
  div.innerHTML = \`
    <div class="avatar user">👤</div>
    <div class="bubble user">\${escapeHtml(text).replace(/\\n/g, '<br>')}</div>
  \`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addAgentBubble(text) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = \`
    <div class="avatar agent">🤖</div>
    <div class="bubble agent">
      <div class="bubble-content">\${text ? renderMarkdown(text) : '<div class="typing"><span></span><span></span><span></span></div>'}</div>
    </div>
  \`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function updateBubble(div, text) {
  const content = div.querySelector('.bubble-content');
  if (content) content.innerHTML = renderMarkdown(text);
  document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

function addToolCall(div, name, input) {
  const bubble = div.querySelector('.bubble');
  const tc = document.createElement('div');
  tc.className = 'tool-call';
  const inputStr = JSON.stringify(input);
  const preview = inputStr.length > 60 ? inputStr.slice(0, 57) + '...' : inputStr;
  tc.innerHTML = \`<span>⚡</span><span class="tool-name">\${name}</span><span class="tool-args">\${escapeHtml(preview)}</span>\`;
  bubble.appendChild(tc);
}

function addToolResult(div, name, result, error) {
  const bubble = div.querySelector('.bubble');
  const tr = document.createElement('div');
  if (error || result?.success === false) {
    tr.className = 'tool-result error';
    tr.textContent = name + ': ' + (error || result?.error || 'failed');
  } else {
    tr.className = 'tool-result success';
    const keys = Object.keys(result || {}).filter(k => k !== 'success' && k !== 'type' && k !== 'data');
    const summary = keys.slice(0, 3).map(k => k + '=' + JSON.stringify(result[k]).slice(0, 20)).join(', ');
    tr.textContent = name + (summary ? ': ' + summary : '');
  }
  bubble.appendChild(tr);
}

function addScreenshot(div, data, mimeType) {
  const bubble = div.querySelector('.bubble');
  const img = document.createElement('img');
  img.className = 'screenshot-img';
  img.src = 'data:' + (mimeType || 'image/png') + ';base64,' + data;
  bubble.appendChild(img);
}

// ── Markdown renderer ──
function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Restore HTML we add back
    .replace(/&lt;br&gt;/g, '<br>')
    // Code blocks with language
    .replace(/\`\`\`(\w*)\n([\s\S]*?)\`\`\`/g, (_, lang, code) =>
      \`<div class="code-header">
        <span>\${lang || 'code'}</span>
        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
      </div><pre><code>\${code.trim()}</code></pre>\`)
    // Inline code
    .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => '<ul>' + s + '</ul>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function copyCode(btn) {
  const pre = btn.closest('.code-header').nextElementSibling;
  navigator.clipboard.writeText(pre.textContent);
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 2000);
}

// ── Init ──
connectWS();
</script>
</body>
</html>`;
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch(console.error);
}
