/**
 * OpenTrade — Web Server
 * Serves the browser UI and provides WebSocket + HTTP API.
 */
import { createServer } from 'node:http';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.TVA_PORT || '7842');

export async function startServer() {
  const { agentTurn } = await import('../agent/claude.js');
  const { connect, callTool, getTools, health, chart, capture } = await import('../mcp/client.js');

  // Try connecting to TradingView — non-fatal if not available yet
  try {
    await connect();
    const h = await health.check();
    console.log(`✓ TradingView connected (${h.chart_symbol || 'no chart'})`);
  } catch (e) {
    console.log('⚠ TradingView not connected — start Chrome with --remote-debugging-port=9222');
  }

  const httpHandler = async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(buildUI());
      return;
    }

    if (url.pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      try {
        const h = await health.check();
        res.end(JSON.stringify({ connected: true, ...h }));
      } catch (e) {
        res.end(JSON.stringify({ connected: false, error: e.message }));
      }
      return;
    }

    if (url.pathname === '/api/state') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      try { res.end(JSON.stringify(await chart.getState())); }
      catch (e) { res.end(JSON.stringify({ error: e.message })); }
      return;
    }

    if (url.pathname === '/api/screenshot') {
      try {
        const ss = await capture.screenshot(url.searchParams.get('region') || 'chart');
        if (ss.data) {
          res.writeHead(200, { 'Content-Type': ss.mimeType || 'image/png' });
          res.end(Buffer.from(ss.data, 'base64'));
        } else {
          res.writeHead(404); res.end('No screenshot data');
        }
      } catch (e) { res.writeHead(500); res.end(e.message); }
      return;
    }

    if (url.pathname === '/api/tools') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      try { res.end(JSON.stringify(await getTools())); }
      catch (e) { res.end(JSON.stringify({ error: e.message })); }
      return;
    }

    if (url.pathname === '/api/tool' && req.method === 'POST') {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', async () => {
        try {
          const { name, args } = JSON.parse(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(await callTool(name, args || {})));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    res.writeHead(404); res.end('Not found');
  };

  const server = createServer(httpHandler);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Browser client connected');
    let history = [];

    ws.on('message', async (data) => {
      let msg;
      try { msg = JSON.parse(data.toString()); } catch { return; }

      if (msg.type === 'chat') {
        const userMessage = msg.content;
        if (!userMessage?.trim()) return;

        ws.send(JSON.stringify({ type: 'start' }));

        // Build messages — always append to server-side history,
        // don't trust client-sent history to avoid message structure drift
        const messages = [...history, { role: 'user', content: userMessage }];
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
              ws.send(JSON.stringify({ type: 'done', usage: event.usage }));
            }
          }

          // Update server-side history with properly structured messages
          history = [
            ...messages,
            { role: 'assistant', content: fullText || ' ' },
          ];
          // Keep history from growing unbounded
          if (history.length > 40) history = history.slice(-40);

        } catch (e) {
          console.error('Agent error:', e.message);
          ws.send(JSON.stringify({ type: 'error', error: e.message }));
        }
        return;
      }

      if (msg.type === 'clear_history') {
        history = [];
        ws.send(JSON.stringify({ type: 'cleared' }));
        return;
      }

      if (msg.type === 'screenshot') {
        try {
          const ss = await capture.screenshot(msg.region || 'chart');
          ws.send(JSON.stringify({ type: 'screenshot', data: ss.data, mimeType: ss.mimeType }));
        } catch (e) {
          ws.send(JSON.stringify({ type: 'error', error: e.message }));
        }
        return;
      }
    });

    ws.on('close', () => console.log('Browser client disconnected'));
    ws.on('error', (e) => console.error('WebSocket error:', e.message));
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 OpenTrade UI: http://localhost:${PORT}\n`);
  });
}

function buildUI() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OpenTrade</title>
<style>
  :root {
    --bg:#0a0e1a; --bg2:#111827; --bg3:#1a2235; --border:#1e2d4a;
    --accent:#00c8ff; --green:#00e5a0; --red:#ff4560; --yellow:#ffd700;
    --text:#e2e8f0; --muted:#64748b;
    --mono:'JetBrains Mono','Fira Code',monospace;
    --ui:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:var(--ui);height:100vh;
    display:grid;grid-template-rows:56px 1fr;grid-template-columns:260px 1fr;
    grid-template-areas:"header header" "sidebar main";overflow:hidden}

  header{grid-area:header;background:var(--bg2);border-bottom:1px solid var(--border);
    display:flex;align-items:center;padding:0 20px;gap:16px}
  .logo{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;color:var(--accent)}
  .logo-icon{width:32px;height:32px;background:linear-gradient(135deg,#00c8ff,#7c3aed);
    border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}
  .hstatus{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--muted)}
  .dot.on{background:var(--green);box-shadow:0 0 6px var(--green)}
  .dot.err{background:var(--red)}
  .hbtn{padding:5px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;
    color:var(--text);font-size:12px;cursor:pointer;transition:all .15s;margin-left:8px}
  .hbtn:hover{background:var(--bg3);border-color:var(--accent);color:var(--accent)}

  aside{grid-area:sidebar;background:var(--bg2);border-right:1px solid var(--border);
    overflow-y:auto;display:flex;flex-direction:column;gap:0}
  .sec{padding:14px 16px;border-bottom:1px solid var(--border)}
  .sec-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;
    color:var(--muted);margin-bottom:10px}
  .stat-row{display:flex;justify-content:space-between;padding:3px 0;
    font-family:var(--mono);font-size:11px;border-bottom:1px solid #1a2235}
  .stat-k{color:var(--muted)} .stat-v{color:var(--accent);font-weight:600}
  .qbtn{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;
    border:1px solid transparent;background:transparent;color:var(--text);font-size:12px;
    cursor:pointer;width:100%;text-align:left;transition:all .15s;margin-bottom:2px}
  .qbtn:hover{background:var(--bg3);border-color:var(--border)}
  .tbadge{display:inline-flex;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;
    background:rgba(0,200,255,.1);color:var(--accent);border:1px solid rgba(0,200,255,.2);
    margin:2px;cursor:pointer;transition:all .15s}
  .tbadge:hover{background:rgba(0,200,255,.2)}
  .tgrid{display:flex;flex-wrap:wrap;gap:2px;max-height:180px;overflow-y:auto}

  main{grid-area:main;display:flex;flex-direction:column;overflow:hidden}
  .messages{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:18px}
  .message{display:flex;gap:12px;max-width:100%}
  .message.user{flex-direction:row-reverse}
  .avatar{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;
    justify-content:center;font-size:14px;flex-shrink:0}
  .avatar.agent{background:linear-gradient(135deg,#00c8ff22,#7c3aed33);border:1px solid #7c3aed55}
  .avatar.user{background:linear-gradient(135deg,#00e5a022,#00c8ff33);border:1px solid #00c8ff55}
  .bubble{max-width:78%;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.6;
    border:1px solid var(--border)}
  .bubble.agent{background:var(--bg3);border-color:#1e3a5f}
  .bubble.user{background:rgba(0,200,255,.08);border-color:rgba(0,200,255,.2)}
  .tool-call{display:flex;align-items:center;gap:8px;padding:5px 10px;
    background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);border-radius:6px;
    font-family:var(--mono);font-size:11px;margin:3px 0}
  .tn{color:#a78bfa;font-weight:600} .ta{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px}
  .tool-result{padding:3px 10px;font-family:var(--mono);font-size:11px;color:var(--muted);margin:1px 0}
  .tool-result.ok::before{content:'✓ ';color:var(--green)}
  .tool-result.fail::before{content:'✗ ';color:var(--red)}
  pre{background:#0d1117;border:1px solid var(--border);border-radius:0 0 8px 8px;
    padding:12px;overflow-x:auto;font-family:var(--mono);font-size:12px;line-height:1.5;margin:0}
  .code-hdr{display:flex;align-items:center;justify-content:space-between;padding:5px 12px;
    background:#161b22;border:1px solid var(--border);border-radius:8px 8px 0 0;
    font-size:11px;color:var(--muted);font-family:var(--mono)}
  .cpbtn{padding:2px 8px;border-radius:4px;border:1px solid var(--border);background:transparent;
    color:var(--muted);font-size:10px;cursor:pointer}
  .cpbtn:hover{color:var(--text)}
  code{font-family:var(--mono);font-size:12px;color:var(--accent)}
  pre code{color:#e2e8f0}
  .ss-img{max-width:100%;border-radius:8px;border:1px solid var(--border);margin-top:8px}
  .typing{display:flex;gap:4px;padding:4px;align-items:center}
  .typing span{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:bounce 1.2s infinite}
  .typing span:nth-child(2){animation-delay:.2s} .typing span:nth-child(3){animation-delay:.4s}
  @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-6px);opacity:1}}
  .bubble h1,.bubble h2,.bubble h3{color:var(--accent);margin:8px 0 4px}
  .bubble ul,.bubble ol{padding-left:18px} .bubble li{margin:3px 0}
  .bubble strong{color:#fff}

  .input-area{padding:14px 20px;background:var(--bg2);border-top:1px solid var(--border)}
  .input-row{display:flex;gap:10px;align-items:flex-end;background:var(--bg3);
    border:1px solid var(--border);border-radius:12px;padding:4px 8px 4px 14px;transition:border-color .15s}
  .input-row:focus-within{border-color:var(--accent)}
  #inp{flex:1;background:transparent;border:none;color:var(--text);font-size:14px;
    font-family:var(--ui);resize:none;outline:none;padding:10px 0;
    max-height:160px;min-height:24px;line-height:1.5}
  #inp::placeholder{color:var(--muted)}
  .sbtn{width:36px;height:36px;border-radius:8px;border:none;background:var(--accent);
    color:#000;font-size:18px;cursor:pointer;display:flex;align-items:center;
    justify-content:center;flex-shrink:0;transition:all .15s;margin-bottom:2px}
  .sbtn:hover{background:#33d6ff;transform:scale(1.05)} .sbtn:disabled{opacity:.4;cursor:not-allowed;transform:none}
  .hints{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
  .hint{padding:4px 10px;border-radius:20px;font-size:11px;background:var(--bg3);
    border:1px solid var(--border);color:var(--muted);cursor:pointer;transition:all .15s}
  .hint:hover{color:var(--accent);border-color:var(--accent)}
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
</style>
</head>
<body>
<header>
  <div class="logo"><div class="logo-icon">📈</div>OpenTrade</div>
  <div class="hstatus">
    <div class="dot" id="dot"></div>
    <span id="statusTxt">Connecting...</span>
  </div>
  <button class="hbtn" onclick="sendQ('Take a screenshot of the chart')">📸 Screenshot</button>
  <button class="hbtn" onclick="sendQ('Get the current chart state, symbol and timeframe')">📊 State</button>
  <button class="hbtn" onclick="clearChat()">🗑 Clear</button>
</header>

<aside>
  <div class="sec">
    <div class="sec-label">Chart</div>
    <div class="stat-row"><span class="stat-k">Symbol</span><span class="stat-v" id="sym">—</span></div>
    <div class="stat-row"><span class="stat-k">Timeframe</span><span class="stat-v" id="tf">—</span></div>
    <div class="stat-row"><span class="stat-k">Status</span><span class="stat-v" id="tvst">—</span></div>
  </div>
  <div class="sec">
    <div class="sec-label">Quick Actions</div>
    <button class="qbtn" onclick="sendQ('Analyze my chart — give me indicator readings, key price levels, and market bias')">🔍 Full Analysis</button>
    <button class="qbtn" onclick="sendQ('Write a Pine Script v6 EMA crossover strategy with commission settings and risk management')">📝 EMA Strategy</button>
    <button class="qbtn" onclick="sendQ('Draw support and resistance levels on my chart based on recent price action')">📏 Draw S/R Levels</button>
    <button class="qbtn" onclick="sendQ('Scan SPY, QQQ, IWM and compare momentum and RSI readings across all three')">⚡ Multi-Symbol Scan</button>
    <button class="qbtn" onclick="sendQ('Create a price alert at the current price level')">🔔 Create Alert</button>
    <button class="qbtn" onclick="sendQ('Start a replay session from 30 days ago so I can practice')">▶️ Start Replay</button>
  </div>
  <div class="sec">
    <div class="sec-label">Pine Script</div>
    <button class="qbtn" onclick="sendQ('List all my saved Pine Scripts')">📂 List Scripts</button>
    <button class="qbtn" onclick="setI('Write a Pine Script v6 indicator for: ')">✏️ Write New Script</button>
    <button class="qbtn" onclick="sendQ('Compile the current Pine Script and show me any errors')">🔨 Compile Current</button>
  </div>
  <div class="sec">
    <div class="sec-label">Tools (<span id="tc">—</span>)</div>
    <div class="tgrid" id="tgrid"><span style="color:var(--muted);font-size:11px">Loading...</span></div>
  </div>
</aside>

<main>
  <div class="messages" id="msgs">
    <div class="message">
      <div class="avatar agent">🤖</div>
      <div class="bubble agent">
        <strong>Welcome to OpenTrade!</strong><br><br>
        I have full control over your TradingView chart. I can analyze charts, write and compile Pine Script v6, draw levels, manage alerts, run multi-symbol scans, and practice with replay.<br><br>
        Make sure Chrome is running with <code>--remote-debugging-port=9222</code> and TradingView is open, then ask me anything.
      </div>
    </div>
  </div>
  <div class="input-area">
    <div class="input-row">
      <textarea id="inp" rows="1" placeholder="Ask me anything about your charts or Pine Script..." onkeydown="onKey(event)" oninput="resize(this)"></textarea>
      <button class="sbtn" id="sbtn" onclick="send()">↑</button>
    </div>
    <div class="hints">
      <span class="hint" onclick="setI('Analyze my current chart')">Analyze chart</span>
      <span class="hint" onclick="setI('Write a VWAP deviation bands indicator in Pine Script v6')">VWAP bands</span>
      <span class="hint" onclick="setI('Switch to AAPL on the 1 hour timeframe')">Switch symbol</span>
      <span class="hint" onclick="setI('What are the key support and resistance levels on my chart?')">S/R levels</span>
      <span class="hint" onclick="setI('Take a screenshot of my chart')">Screenshot</span>
    </div>
  </div>
</main>

<script>
let ws, streaming = false, bubble = null, bubbleText = '';
const msgs = document.getElementById('msgs');

function connectWS() {
  ws = new WebSocket('ws://' + location.host);
  ws.onopen = () => { poll(); loadTools(); };
  ws.onmessage = e => handle(JSON.parse(e.data));
  ws.onclose = () => setTimeout(connectWS, 2000);
  ws.onerror = () => ws.close();
}

function handle(m) {
  if (m.type === 'start') {
    bubbleText = '';
    bubble = mkBubble();
  }
  if (m.type === 'text') {
    bubbleText += m.content;
    setBubble(bubble, bubbleText);
  }
  if (m.type === 'tool_use' && bubble) addToolCall(bubble, m.name, m.input);
  if (m.type === 'tool_result' && bubble) addToolResult(bubble, m.name, m.result, null);
  if (m.type === 'tool_error' && bubble) addToolResult(bubble, m.name, null, m.error);
  if (m.type === 'screenshot' && m.data) {
    if (!bubble) bubble = mkBubble();
    addImg(bubble, m.data, m.mimeType);
  }
  if (m.type === 'done') { streaming = false; document.getElementById('sbtn').disabled = false; }
  if (m.type === 'error') {
    if (bubble) setBubble(bubble, bubbleText + (bubbleText ? '\n\n' : '') + '⚠️ Error: ' + m.error);
    streaming = false; document.getElementById('sbtn').disabled = false;
  }
  if (m.type === 'cleared') { msgs.innerHTML = ''; bubble = null; }
}

async function poll() {
  try {
    const d = await fetch('/api/status').then(r => r.json());
    const dot = document.getElementById('dot');
    const st = document.getElementById('statusTxt');
    if (d.connected) {
      dot.className = 'dot on';
      st.textContent = (d.chart_symbol || 'Connected') + (d.chart_resolution ? ' · ' + d.chart_resolution : '');
      if (d.chart_symbol) document.getElementById('sym').textContent = d.chart_symbol;
      if (d.chart_resolution) document.getElementById('tf').textContent = d.chart_resolution;
      document.getElementById('tvst').textContent = '✓ Live';
    } else {
      dot.className = 'dot err';
      st.textContent = 'Not connected';
      document.getElementById('tvst').textContent = '✗ Offline';
    }
  } catch {}
  setTimeout(poll, 5000);
}

async function loadTools() {
  try {
    const tools = await fetch('/api/tools').then(r => r.json());
    document.getElementById('tc').textContent = tools.length || '—';
    const g = document.getElementById('tgrid');
    g.innerHTML = '';
    tools.slice(0, 28).forEach(t => {
      const b = document.createElement('span');
      b.className = 'tbadge'; b.textContent = t.name; b.title = t.description || '';
      b.onclick = () => setI('Use ' + t.name + ' to ');
      g.appendChild(b);
    });
    if (tools.length > 28) {
      const b = document.createElement('span');
      b.className = 'tbadge'; b.style.opacity = '.5';
      b.textContent = '+' + (tools.length - 28) + ' more';
      g.appendChild(b);
    }
  } catch {}
}

function send() {
  const el = document.getElementById('inp');
  const txt = el.value.trim();
  if (!txt || streaming || !ws || ws.readyState !== 1) return;
  addUser(txt);
  el.value = ''; el.style.height = 'auto';
  streaming = true; bubble = null;
  document.getElementById('sbtn').disabled = true;
  ws.send(JSON.stringify({ type: 'chat', content: txt }));
}

function sendQ(t) { setI(t); send(); }
function setI(t) { const el = document.getElementById('inp'); el.value = t; el.focus(); resize(el); }
function onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
function resize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }
function clearChat() { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'clear_history' })); }

function addUser(txt) {
  const d = document.createElement('div');
  d.className = 'message user';
  d.innerHTML = '<div class="avatar user">👤</div><div class="bubble user">' + esc(txt).replace(/\\n/g,'<br>') + '</div>';
  msgs.appendChild(d); scroll();
}

function mkBubble() {
  const d = document.createElement('div');
  d.className = 'message';
  d.innerHTML = '<div class="avatar agent">🤖</div><div class="bubble agent"><div class="bc"><div class="typing"><span></span><span></span><span></span></div></div></div>';
  msgs.appendChild(d); scroll(); return d;
}

function setBubble(d, txt) {
  const bc = d.querySelector('.bc');
  if (bc) { bc.innerHTML = md(txt); scroll(); }
}

function addToolCall(d, name, input) {
  const b = d.querySelector('.bubble');
  const tc = document.createElement('div');
  tc.className = 'tool-call';
  const inp = JSON.stringify(input);
  tc.innerHTML = '<span>⚡</span><span class="tn">' + name + '</span><span class="ta">' + esc(inp.length > 80 ? inp.slice(0,77)+'...' : inp) + '</span>';
  b.appendChild(tc); scroll();
}

function addToolResult(d, name, result, error) {
  const b = d.querySelector('.bubble');
  const tr = document.createElement('div');
  if (error || result?.success === false) {
    tr.className = 'tool-result fail';
    tr.textContent = name + ': ' + (error || result?.error || 'failed');
  } else {
    tr.className = 'tool-result ok';
    const keys = Object.keys(result || {}).filter(k => !['success','data','type'].includes(k));
    const sum = keys.slice(0,3).map(k => k + '=' + String(JSON.stringify(result[k])).slice(0,25)).join(', ');
    tr.textContent = name + (sum ? ': ' + sum : '');
    // Embed screenshot if present
    if (result?.data && result?.mimeType?.startsWith('image')) addImg(d, result.data, result.mimeType);
  }
  b.appendChild(tr); scroll();
}

function addImg(d, data, mime) {
  const b = d.querySelector('.bubble');
  const img = document.createElement('img');
  img.className = 'ss-img';
  img.src = 'data:' + (mime || 'image/png') + ';base64,' + data;
  b.appendChild(img); scroll();
}

function scroll() { msgs.scrollTop = msgs.scrollHeight; }
function esc(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function md(t) {
  return esc(t)
    .replace(/\`\`\`(\w*)\n?([\s\S]*?)\`\`\`/g, (_,lang,code) =>
      '<div class="code-hdr"><span>'+(lang||'code')+'</span><button class="cpbtn" onclick="cp(this)">Copy</button></div><pre><code>'+code.trim()+'</code></pre>')
    .replace(/\`([^\`]+)\`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\\s\\S]*?<\\/li>)+/g,s=>'<ul>'+s+'</ul>')
    .replace(/^\d+\\. (.+)$/gm,'<li>$1</li>')
    .replace(/\n\n/g,'</p><p>')
    .replace(/\n/g,'<br>');
}

function cp(btn) {
  const pre = btn.closest('.code-hdr').nextElementSibling;
  navigator.clipboard.writeText(pre.textContent).then(() => {
    btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000);
  });
}

connectWS();
</script>
</body>
</html>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch(console.error);
}
