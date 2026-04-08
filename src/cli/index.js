#!/usr/bin/env node
import '../env/load.js'; // auto-loads .env from project root
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const C = {
  reset:'\x1b[0m', bold:'\x1b[1m', dim:'\x1b[2m', italic:'\x1b[3m',
  red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', blue:'\x1b[34m',
  magenta:'\x1b[35m', cyan:'\x1b[36m', gray:'\x1b[90m',
  brightCyan:'\x1b[96m', brightGreen:'\x1b[92m', brightMagenta:'\x1b[95m', white:'\x1b[37m',
};

const W = Math.min(process.stdout.columns || 100, 120);
const hr = (ch='─', col=C.dim) => `${col}${ch.repeat(W)}${C.reset}`;

function banner() {
  const b = C.brightCyan + C.bold;
  const c = C.cyan + C.bold;
  const d = C.cyan;
  const g = C.gray;
  console.log('');
  console.log(b + ' _______ ______ _______ _______ _______ ______ _______ _____  _______ ' + C.reset);
  console.log(b + '|       |   __ \\    ___|    |  |_     _|   __ \\   _   |     \\|    ___|' + C.reset);
  console.log(c + '|   -   |    __/    ___|       | |   | |      <       |  --  |    ___|' + C.reset);
  console.log(d + '|_______|___|  |_______|__|____| |___| |___|__|___|___|_____/|_______|' + C.reset);
  console.log('');
  console.log(g + '    The most powerful open-source TradingView AI agent.' + C.reset);
  console.log(g + '    50 Tools  //  6 Providers  //  15 Models  //  Pine Script v6' + C.reset);
  console.log('');
}

function showActiveModel() {
  try {
    const { getActiveModelAlias, getModel } = require('../agent/models.js');
    const alias = getActiveModelAlias();
    const m = getModel(alias);
    const tierColors = { flagship: C.brightMagenta, balanced: C.brightCyan, fast: C.brightGreen, budget: C.green };
    const tc = tierColors[m.tier] || C.gray;
    console.log(`  ${C.gray}Model:${C.reset} ${C.bold}${m.displayName}${C.reset} ${C.gray}(${alias})${C.reset}  ${tc}${m.tier}${C.reset}  ${C.gray}ctx:${(m.context/1000).toFixed(0)}K${C.reset}`);
  } catch { /* models not loaded yet */ }
}

async function showActiveModelAsync() {
  try {
    const { getActiveModelAlias, getModel } = await import('../agent/models.js');
    const alias = getActiveModelAlias();
    const m = getModel(alias);
    const tierColors = { flagship: C.brightMagenta, balanced: C.brightCyan, fast: C.brightGreen, budget: C.green };
    const tc = tierColors[m.tier] || C.gray;
    console.log(`  ${C.gray}Model:${C.reset} ${C.bold}${m.displayName}${C.reset} ${C.gray}(${alias})${C.reset}  ${tc}${m.tier}${C.reset}  ${C.gray}ctx:${(m.context/1000).toFixed(0)}K${C.reset}`);
  } catch { /* models not loaded yet */ }
}

async function showModelsTable() {
  const { listModels } = await import('../agent/models.js');
  const { getActiveModelAlias } = await import('../agent/models.js');
  const active = getActiveModelAlias();
  const tiers = ['flagship', 'balanced', 'fast'];
  const tierLabels = { flagship: 'Flagship', balanced: 'Balanced', fast: 'Fast' };
  const tierColors = { flagship: C.brightMagenta, balanced: C.brightCyan, fast: C.brightGreen };

  console.log('');
  for (const tier of tiers) {
    const models = listModels({ tier });
    if (!models.length) continue;
    const tc = tierColors[tier] || C.gray;
    console.log(`  ${tc}${C.bold}${tierLabels[tier]}${C.reset}`);
    for (const m of models) {
      const isActive = m.alias === active;
      const marker = isActive ? `${C.green} *${C.reset}` : '  ';
      const name = isActive ? `${C.bold}${m.displayName}${C.reset}` : m.displayName;
      const cost = `$${m.costPer1kInput}/$${m.costPer1kOutput}`;
      console.log(`  ${marker} ${C.cyan}${m.alias.padEnd(18)}${C.reset} ${name.padEnd(isActive ? 40 : 22)} ${C.gray}${m.provider.padEnd(10)} ${(m.context/1000).toFixed(0).padStart(5)}K  ${cost}${C.reset}`);
    }
    console.log('');
  }
  console.log(`  ${C.gray}Set LLM_MODEL in .env to switch. Active model marked with ${C.green}*${C.reset}`);
  console.log('');
}

function spin(label) {
  const f = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0;
  const t = setInterval(() => process.stdout.write(`\r${C.cyan}${f[i++%f.length]} ${label}...${C.reset}   `), 80);
  return { stop(msg='') { clearInterval(t); process.stdout.write(`\r${' '.repeat(label.length+12)}\r`); if(msg) console.log(msg); } };
}

function renderText(text) {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const hdr = lang ? `${C.dim}${C.italic} ${lang}${C.reset}\n` : '';
      const lines = code.trimEnd().split('\n').map(l => `  ${C.gray}│${C.reset} ${C.brightGreen}${l}${C.reset}`).join('\n');
      return `\n${hdr}${lines}\n`;
    })
    .replace(/`([^`]+)`/g, `${C.yellow}$1${C.reset}`)
    .replace(/\*\*([^*]+)\*\*/g, `${C.bold}$1${C.reset}`)
    .replace(/\*([^*]+)\*/g, `${C.italic}$1${C.reset}`)
    .replace(/^#{1,3} (.+)$/gm, `${C.brightCyan}${C.bold}$1${C.reset}`)
    .replace(/^- (.+)$/gm, `  ${C.cyan}•${C.reset} $1`)
    .replace(/^(\d+)\. (.+)$/gm, `  ${C.cyan}$1.${C.reset} $2`);
}

// ── Stream Pine Script code with typewriter effect ──
// Called when agent emits text that contains a Pine Script code block
async function streamPineCode(code, langLabel = 'pine') {
  const lines = code.split('\n');
  const totalLines = lines.length;

  // Header
  process.stdout.write(`\n  ${C.dim}${C.italic} ${langLabel}  (${totalLines} lines)${C.reset}\n`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Color code Pine Script syntax inline
    let colored = line
      .replace(/(\/\/.*)$/, `${C.gray}$1${C.reset}`)               // comments
      .replace(/\b(indicator|strategy|library|plot|hline|bgcolor|fill|plotshape|label|line|box|table|input|ta|math|str|array|matrix|map|request|ticker|timeframe|alert|runtime|chart)\b/g,
               `${C.cyan}$1${C.reset}`)                               // builtins
      .replace(/\b(if|else|for|while|var|varip|float|int|bool|string|color|series|simple|const|export|import|switch|type|method|fun)\b/g,
               `${C.brightMagenta}$1${C.reset}`)                      // keywords
      .replace(/"([^"]*)"/g, `${C.yellow}"$1"${C.reset}`)             // strings
      .replace(/\b(\d+\.?\d*)\b/g, `${C.brightGreen}$1${C.reset}`); // numbers

    process.stdout.write(`  ${C.gray}${String(i+1).padStart(3)}${C.reset}  ${colored}\n`);

    // Typing speed: fast for comment/blank lines, slower for logic
    const delay = line.trim() === '' || line.trim().startsWith('//')
      ? 8
      : line.includes('strategy.') || line.includes('indicator(') || line.includes('strategy(')
      ? 35
      : 18;
    await new Promise(r => setTimeout(r, delay));
  }
  process.stdout.write('\n');
}

// Intercept text output — if it contains a Pine Script block, stream it live
async function renderAndStream(text) {
  const pineBlockRe = /\`\`\`(?:pine|pinescript|pine-script)?\n([\s\S]*?)\`\`\`/g;
  let lastIndex = 0;
  let match;
  let hasPine = false;

  // Split on Pine blocks and handle each segment
  const segments = [];
  while ((match = pineBlockRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'pine', content: match[1] });
    lastIndex = pineBlockRe.lastIndex;
    hasPine = true;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (!hasPine) {
    // No Pine block — render normally
    process.stdout.write(renderText(text));
    return;
  }

  // Render each segment
  for (const seg of segments) {
    if (seg.type === 'text' && seg.content.trim()) {
      process.stdout.write(renderText(seg.content));
    } else if (seg.type === 'pine') {
      await streamPineCode(seg.content);
    }
  }
}

function printTool(name, input) {
  const s = JSON.stringify(input);
  console.log(`  ${C.dim}⚡ ${C.yellow}${name}${C.reset} ${C.gray}${s.length>70?s.slice(0,67)+'...':s}${C.reset}`);
}

function printResult(name, result) {
  if (result?.success === false) {
    console.log(`  ${C.red}✗ ${name}: ${result.error}${C.reset}`);
    return;
  }
  const keys = Object.keys(result||{}).filter(k=>!['success','data'].includes(k));
  if (keys.length) {
    const s = keys.slice(0,3).map(k=>`${k}=${String(JSON.stringify(result[k])).slice(0,25)}`).join(', ');
    console.log(`  ${C.green}✓${C.reset} ${C.gray}${s}${C.reset}`);
  }
}

async function runAgent(messages) {
  const { agentTurn } = await import('../agent/claude.js');
  let text = '';
  for await (const ev of agentTurn(messages)) {
    if (ev.type === 'model_info') {
      console.log(`  ${C.gray}Using ${C.reset}${C.bold}${ev.displayName}${C.reset} ${C.gray}(${ev.provider})${C.reset}`);
      console.log('');
    }
    else if (ev.type === 'text') { await renderAndStream(ev.text); text += ev.text; }
    else if (ev.type === 'tool_use') { console.log(''); printTool(ev.name, ev.input); }
    else if (ev.type === 'tool_result') { printResult(ev.name, ev.result); }
    else if (ev.type === 'tool_error') { console.log(`  ${C.red}✗ ${ev.name}: ${ev.error}${C.reset}`); }
  }
  return text;
}

async function interactiveChat() {
  banner();
  await showActiveModelAsync();
  console.log(hr());
  console.log(`${C.gray}  Commands: ${C.cyan}/quit /clear /screenshot /state /models /help${C.reset}`);
  console.log(hr());
  console.log('');

  const s = spin('Connecting to TradingView');
  try {
    const { health } = await import('../mcp/client.js');
    const h = await health.check();
    s.stop(`${C.green}✓ Connected${C.reset} ${C.gray}(${h.chart_symbol||'no chart'})${C.reset}`);
  } catch {
    s.stop(`${C.yellow}⚠ TradingView not connected${C.reset} ${C.gray}— open Chrome with --remote-debugging-port=9222${C.reset}`);
  }
  console.log('');

  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let history = [];

  const prompt = () => rl.question(`${C.brightCyan}${C.bold}You${C.reset} ${C.cyan}›${C.reset} `, async (raw) => {
    const msg = raw.trim();
    if (!msg) { prompt(); return; }

    if (['/quit','/exit','/q'].includes(msg)) { console.log(`\n${C.gray}Goodbye.${C.reset}\n`); process.exit(0); }

    if (msg === '/clear') { history = []; console.clear(); banner(); prompt(); return; }

    if (msg === '/state') {
      const s2 = spin('Reading chart');
      try {
        const { chart } = await import('../mcp/client.js');
        const r = await chart.getState();
        s2.stop('');
        console.log(`\n  ${C.brightCyan}Symbol:${C.reset} ${r.symbol}  ${C.brightCyan}TF:${C.reset} ${r.resolution}`);
        if (r.studies?.length) console.log(`  ${C.brightCyan}Studies:${C.reset} ${r.studies.map(s=>s.name).join(', ')}`);
        console.log('');
      } catch(e) { s2.stop(`${C.red}✗ ${e.message}${C.reset}`); }
      prompt(); return;
    }

    if (msg === '/screenshot') {
      const s2 = spin('Capturing');
      try {
        const { capture } = await import('../mcp/client.js');
        const ss = await capture.screenshot('chart');
        s2.stop(`${C.green}✓ Captured${C.reset}`);
        if (ss.data) {
          const f = `chart_${Date.now()}.png`;
          writeFileSync(f, Buffer.from(ss.data,'base64'));
          console.log(`  ${C.gray}Saved: ${f}${C.reset}`);
        }
      } catch(e) { s2.stop(`${C.red}✗ ${e.message}${C.reset}`); }
      console.log(''); prompt(); return;
    }

    if (msg === '/help') {
      console.log(`\n  ${C.cyan}/quit${C.reset}        Exit`);
      console.log(`  ${C.cyan}/clear${C.reset}       Clear history`);
      console.log(`  ${C.cyan}/state${C.reset}       Chart state`);
      console.log(`  ${C.cyan}/screenshot${C.reset}  Capture chart`);
      console.log(`  ${C.cyan}/models${C.reset}      List all LLMs\n`);
      prompt(); return;
    }

    if (msg === '/models') {
      await showModelsTable();
      prompt(); return;
    }

    console.log('');
    console.log(`${C.brightMagenta}${C.bold}Agent${C.reset} ${C.magenta}›${C.reset}`);
    console.log('');

    try {
      // Build proper message array from history
      const messages = [...history, { role: 'user', content: msg }];
      const responseText = await runAgent(messages);

      // Store with simple string content for history continuity
      history.push({ role: 'user', content: msg });
      history.push({ role: 'assistant', content: responseText || ' ' });
      if (history.length > 40) history = history.slice(-40);
    } catch(e) {
      console.log(`\n${C.red}Error: ${e.message}${C.reset}`);
    }

    console.log('\n');
    console.log(hr());
    console.log('');
    prompt();
  });

  prompt();
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd) { await interactiveChat(); return; }
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    banner();
    console.log(`  ${C.brightCyan}opentrade${C.reset}                       Interactive chat`);
    console.log(`  ${C.brightCyan}opentrade chat${C.reset} <message>       Single message`);
    console.log(`  ${C.brightCyan}opentrade pine${C.reset} <prompt>        AI Pine Script writer`);
    console.log(`  ${C.brightCyan}opentrade analyze${C.reset} <file.pine>  Static analysis`);
    console.log(`  ${C.brightCyan}opentrade state${C.reset}                Chart state`);
    console.log(`  ${C.brightCyan}opentrade screenshot${C.reset}           Capture chart`);
    console.log(`  ${C.brightCyan}opentrade models${C.reset}               List all supported LLMs`);
    console.log(`  ${C.brightCyan}opentrade health${C.reset}               Connection check`);
    console.log(`  ${C.brightCyan}opentrade server${C.reset}               Browser UI at :7842\n`);
    return;
  }

  if (cmd === 'models') {
    banner();
    await showModelsTable();
    return;
  }

  if (cmd === 'health') {
    const s = spin('Checking connection');
    try {
      const { health } = await import('../mcp/client.js');
      const r = await health.check();
      s.stop(`${C.green}✓ Connected${C.reset}`);
      console.log(JSON.stringify(r, null, 2));
    } catch(e) { s.stop(`${C.red}✗ ${e.message}${C.reset}`); process.exit(1); }
    return;
  }

  if (cmd === 'state') {
    const s = spin('Reading chart');
    try {
      const { chart } = await import('../mcp/client.js');
      const r = await chart.getState();
      s.stop(`${C.green}✓${C.reset}`);
      console.log(`\n  Symbol: ${r.symbol}  TF: ${r.resolution}`);
      if (r.studies?.length) console.log(`  Studies: ${r.studies.map(s=>s.name).join(', ')}`);
      console.log('');
    } catch(e) { s.stop(`${C.red}✗ ${e.message}${C.reset}`); process.exit(1); }
    return;
  }

  if (cmd === 'screenshot') {
    const region = args[1] || 'chart';
    const s = spin(`Capturing ${region}`);
    try {
      const { capture } = await import('../mcp/client.js');
      const r = await capture.screenshot(region);
      s.stop(`${C.green}✓${C.reset}`);
      if (r.data) {
        const f = `chart_${Date.now()}.png`;
        writeFileSync(f, Buffer.from(r.data,'base64'));
        console.log(`Saved: ${f}`);
      }
    } catch(e) { s.stop(`${C.red}✗ ${e.message}${C.reset}`); process.exit(1); }
    return;
  }

  if (cmd === 'analyze') {
    const file = args[1];
    if (!file) { console.error(`Usage: opentrade analyze <file.pine>`); process.exit(1); }
    if (!existsSync(file)) { console.error(`File not found: ${file}`); process.exit(1); }
    const { analyzeStatic } = await import('../pine/analyzer.js');
    const r = analyzeStatic(readFileSync(file,'utf-8'));
    console.log(`\n  Version: v${r.version||'?'}  Type: ${r.type}  ${r.clean?C.green+'✓ Clean':C.red+'✗ Has errors'}${C.reset}`);
    console.log(`  Errors: ${r.summary.errors}  Warnings: ${r.summary.warnings}  Info: ${r.summary.info}\n`);
    for (const i of r.issues) {
      const col = i.severity==='error'?C.red:i.severity==='warning'?C.yellow:C.gray;
      console.log(`  ${col}[${i.severity.toUpperCase()}]${C.reset} Line ${i.line}: ${i.message}`);
    }
    console.log('');
    process.exit(r.clean ? 0 : 1);
    return;
  }

  if (cmd === 'chat') {
    const message = args.slice(1).join(' ');
    if (!message) { await interactiveChat(); return; }
    const s = spin('Connecting');
    try { await (await import('../mcp/client.js')).connect(); s.stop(''); }
    catch { s.stop(`${C.yellow}⚠ TradingView not connected${C.reset}`); }
    console.log(`\n${C.brightMagenta}${C.bold}Agent:${C.reset}\n`);
    try {
      await runAgent([{ role: 'user', content: message }]);
      console.log('\n');
    } catch(e) { console.error(`${C.red}Error: ${e.message}${C.reset}`); process.exit(1); }
    return;
  }

  if (cmd === 'pine') {
    const prompt = args.slice(1).join(' ');
    if (!prompt) { console.error('Usage: opentrade pine <description>'); process.exit(1); }
    console.log(`\n${C.brightCyan}Building Pine Script:${C.reset} ${prompt}\n`);
    try { await (await import('../mcp/client.js')).connect(); }
    catch { console.log(`${C.yellow}⚠ TradingView not connected — will write code only${C.reset}\n`); }
    const fullMsg = `Write a complete Pine Script v6 for: ${prompt}\n\nDo the full loop: pine_set_source, pine_smart_compile, pine_get_errors, fix any errors, capture_screenshot to verify, pine_save.`;
    try {
      await runAgent([{ role: 'user', content: fullMsg }]);
      console.log('\n');
    } catch(e) { console.error(`${C.red}Error: ${e.message}${C.reset}`); process.exit(1); }
    return;
  }

  if (cmd === 'server') {
    const { startServer } = await import('../web/server.js');
    await startServer();
    return;
  }

  console.error(`Unknown command: ${cmd}. Run 'opentrade help' for usage.`);
  process.exit(1);
}

main().catch(e => { console.error(`${C.red}Fatal: ${e.message}${C.reset}`); process.exit(1); });
