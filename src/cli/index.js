#!/usr/bin/env node
/**
 * OpenTrade CLI
 * Commands: (none) | chat | pine | analyze | state | screenshot | health | server | help
 */
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
  console.log([
    '',
    `${C.brightCyan}${C.bold} ___________  _____ _   _ ___________  ___ ______ _____ ${C.reset}`,
    `${C.brightCyan}${C.bold}|  _  | ___ \\/  ___| \\ | |_   _| ___ \\/ _ \\|  _  \\  ___|${C.reset}`,
    `${C.cyan}${C.bold}| | | | |_/ /\\ \`--.| |\\  | | | | |_/ / /_\\ \\ | | | |__ ${C.reset}`,
    `${C.cyan}| | | |  __/  \`--. \\ . \` | | | |    /|  _  | | | |  __|${C.reset}`,
    `${C.blue}${C.bold}\\ \\_/ / |    /\\__/ / |\\  | | | | |\\ \\| | | | |/ /| |___${C.reset}`,
    `${C.blue} \\___/\\_|    \\____/\\_| \\_/ \\_/ \\_| \\_\\_| |_/___/ \\____/${C.reset}`,
    '',
    `${C.gray}  Claude-powered TradingView Agent  •  50 Tools  •  Pine Script v6${C.reset}`,
    '',
  ].join('\n'));
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
    if (ev.type === 'text') { process.stdout.write(renderText(ev.text)); text += ev.text; }
    else if (ev.type === 'tool_use') { console.log(''); printTool(ev.name, ev.input); }
    else if (ev.type === 'tool_result') { printResult(ev.name, ev.result); }
    else if (ev.type === 'tool_error') { console.log(`  ${C.red}✗ ${ev.name}: ${ev.error}${C.reset}`); }
  }
  return text;
}

async function interactiveChat() {
  banner();
  console.log(hr());
  console.log(`${C.gray}  Commands: ${C.cyan}/quit /clear /screenshot /state /help${C.reset}`);
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
      console.log(`  ${C.cyan}/screenshot${C.reset}  Capture chart\n`);
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
    console.log(`  ${C.brightCyan}opentrade health${C.reset}               Connection check`);
    console.log(`  ${C.brightCyan}opentrade server${C.reset}               Browser UI at :7842\n`);
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
