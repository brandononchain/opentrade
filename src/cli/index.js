#!/usr/bin/env node
/**
 * TradingView Agent CLI
 * Beautiful terminal interface for the Claude-powered TradingView agent.
 *
 * Usage:
 *   tva                    # Interactive chat mode
 *   tva chat "analyze my chart"
 *   tva pine write         # Interactive Pine Script writer
 *   tva pine analyze file.pine
 *   tva chart state
 *   tva screenshot
 *   tva health
 */

import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Terminal Colors & Styling ──
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  italic:  '\x1b[3m',

  // Foreground
  black:   '\x1b[30m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',

  // Bright
  brightRed:     '\x1b[91m',
  brightGreen:   '\x1b[92m',
  brightYellow:  '\x1b[93m',
  brightBlue:    '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan:    '\x1b[96m',

  // Background
  bgBlack:  '\x1b[40m',
  bgBlue:   '\x1b[44m',
  bgGreen:  '\x1b[42m',
};

const WIDTH = Math.min(process.stdout.columns || 100, 120);

function hr(char = '─', color = C.dim) {
  return `${color}${char.repeat(WIDTH)}${C.reset}`;
}

function box(lines, color = C.cyan) {
  const inner = WIDTH - 2;
  const top    = `${color}╭${'─'.repeat(inner)}╮${C.reset}`;
  const bottom = `${color}╰${'─'.repeat(inner)}╯${C.reset}`;
  const rows = lines.map(l => {
    const visible = l.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = inner - visible.length;
    return `${color}│${C.reset} ${l}${' '.repeat(Math.max(0, pad - 1))}${color}│${C.reset}`;
  });
  return [top, ...rows, bottom].join('\n');
}

function banner() {
  const lines = [
    `${C.brightCyan}${C.bold} ████████╗██╗   ██╗ █████╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗${C.reset}`,
    `${C.brightCyan}${C.bold} ╚══██╔══╝██║   ██║██╔══██╗    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝${C.reset}`,
    `${C.cyan}${C.bold}    ██║   ██║   ██║███████║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ${C.reset}`,
    `${C.cyan}    ██║   ╚██╗ ██╔╝██╔══██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ${C.reset}`,
    `${C.blue}${C.bold}    ██║    ╚████╔╝ ██║  ██║    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ${C.reset}`,
    `${C.blue}    ╚═╝     ╚═══╝  ╚═╝  ╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ${C.reset}`,
    '',
    `${C.gray}  Claude-powered TradingView AI Agent  •  78 MCP Tools  •  Pine Script v6${C.reset}`,
  ];
  console.log('\n' + lines.join('\n') + '\n');
}

function label(text, color = C.brightCyan) {
  return `${color}${C.bold}${text}${C.reset}`;
}

function spinner(label) {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${C.cyan}${frames[i++ % frames.length]} ${label}...${C.reset}  `);
  }, 80);
  return {
    stop: (msg = '') => {
      clearInterval(interval);
      process.stdout.write(`\r${' '.repeat(label.length + 10)}\r`);
      if (msg) console.log(msg);
    },
  };
}

// ── Help Text ──
function showHelp() {
  banner();
  console.log(box([
    `${label('COMMANDS')}`,
    '',
    `  ${C.brightGreen}tva${C.reset}                      Interactive chat mode`,
    `  ${C.brightGreen}tva chat${C.reset} <message>       Send a single message`,
    `  ${C.brightGreen}tva health${C.reset}               Check TradingView connection`,
    `  ${C.brightGreen}tva screenshot${C.reset}           Capture chart screenshot`,
    `  ${C.brightGreen}tva state${C.reset}                Get current chart state`,
    `  ${C.brightGreen}tva analyze${C.reset} <file.pine>  Static analyze Pine Script`,
    `  ${C.brightGreen}tva pine${C.reset} <prompt>        Write/modify Pine Script with AI`,
    `  ${C.brightGreen}tva server${C.reset}               Start web UI server`,
    `  ${C.brightGreen}tva help${C.reset}                 Show this help`,
    '',
    `${label('EXAMPLES')}`,
    '',
    `  ${C.gray}tva chat "analyze my chart and give me key levels"${C.reset}`,
    `  ${C.gray}tva pine "write an RSI divergence indicator"${C.reset}`,
    `  ${C.gray}tva analyze strategy.pine${C.reset}`,
    `  ${C.gray}tva chat "switch to AAPL on the daily chart"${C.reset}`,
    `  ${C.gray}tva chat "draw a trend line from Jan 15 low"${C.reset}`,
    '',
    `${label('ENVIRONMENT')}`,
    '',
    `  ${C.yellow}ANTHROPIC_API_KEY${C.reset}        Required for AI features`,
    `  ${C.yellow}TRADINGVIEW_MCP_PATH${C.reset}     Path to tradingview-mcp/src/server.js`,
    `  ${C.yellow}TVA_PORT${C.reset}                 Web UI port (default: 7842)`,
  ], C.blue));
  console.log('');
}

// ── Format agent output ──
function renderText(text) {
  // Simple markdown-ish rendering for terminal
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const header = lang ? `${C.dim}${C.italic} ${lang}${C.reset}\n` : '';
      const formatted = code.trimEnd().split('\n').map(l => `  ${C.gray}│${C.reset} ${C.brightGreen}${l}${C.reset}`).join('\n');
      return `\n${header}${formatted}\n`;
    })
    .replace(/`([^`]+)`/g, `${C.yellow}$1${C.reset}`)
    .replace(/\*\*([^*]+)\*\*/g, `${C.bold}$1${C.reset}`)
    .replace(/\*([^*]+)\*/g, `${C.italic}$1${C.reset}`)
    .replace(/^#{1,3} (.+)$/gm, `${C.brightCyan}${C.bold}$1${C.reset}`)
    .replace(/^- (.+)$/gm, `  ${C.cyan}•${C.reset} $1`)
    .replace(/^(\d+)\. (.+)$/gm, `  ${C.cyan}$1.${C.reset} $2`);
}

function printToolCall(name, input) {
  const inputStr = JSON.stringify(input);
  const preview = inputStr.length > 60 ? inputStr.slice(0, 57) + '...' : inputStr;
  console.log(`  ${C.dim}⚡ ${C.yellow}${name}${C.reset} ${C.gray}${preview}${C.reset}`);
}

function printToolResult(name, result) {
  if (result?.success === false) {
    console.log(`  ${C.red}✗ ${name}: ${result.error}${C.reset}`);
    return;
  }
  // Show a compact summary
  const keys = Object.keys(result || {}).filter(k => k !== 'success');
  if (keys.length > 0) {
    const summary = keys.slice(0, 3).map(k => {
      const v = result[k];
      const vs = typeof v === 'object' ? JSON.stringify(v).slice(0, 30) : String(v).slice(0, 30);
      return `${k}=${vs}`;
    }).join(', ');
    console.log(`  ${C.green}✓${C.reset} ${C.gray}${summary}${C.reset}`);
  }
}

// ── Interactive Chat Mode ──
async function interactiveChat() {
  const { agentTurn, connect } = await import('../agent/claude.js');

  banner();
  console.log(hr());
  console.log(`${C.gray}  Type your message. Commands: ${C.cyan}/quit${C.gray} /clear /screenshot /state /help${C.reset}`);
  console.log(hr());
  console.log('');

  // Check connection
  const spin = spinner('Connecting to TradingView');
  try {
    const { health } = await import('../mcp/client.js');
    const h = await health.check();
    spin.stop(`${C.green}✓ TradingView connected${C.reset} ${C.gray}(${h.symbol || 'no chart'})${C.reset}`);
  } catch (e) {
    spin.stop(`${C.yellow}⚠ TradingView not connected${C.reset} ${C.gray}(start with: tv_launch)${C.reset}`);
  }

  console.log('');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  let history = [];

  const prompt = () => {
    rl.question(`${C.brightCyan}${C.bold}You${C.reset} ${C.cyan}›${C.reset} `, async (input) => {
      const msg = input.trim();
      if (!msg) { prompt(); return; }

      // Built-in commands
      if (msg === '/quit' || msg === '/exit' || msg === '/q') {
        console.log(`\n${C.gray}Goodbye.${C.reset}\n`);
        process.exit(0);
      }

      if (msg === '/clear') {
        history = [];
        console.clear();
        banner();
        prompt();
        return;
      }

      if (msg === '/screenshot') {
        const spin2 = spinner('Capturing screenshot');
        try {
          const { capture } = await import('../mcp/client.js');
          const ss = await capture.screenshot('chart');
          spin2.stop(`${C.green}✓ Screenshot captured${C.reset}`);
          if (ss.data) {
            // Save to file
            const fname = `chart_${Date.now()}.png`;
            writeFileSync(fname, Buffer.from(ss.data, 'base64'));
            console.log(`  ${C.gray}Saved: ${fname}${C.reset}`);
          }
        } catch (e) {
          spin2.stop(`${C.red}✗ ${e.message}${C.reset}`);
        }
        console.log('');
        prompt();
        return;
      }

      if (msg === '/state') {
        const spin2 = spinner('Reading chart state');
        try {
          const { chart } = await import('../mcp/client.js');
          const state = await chart.getState();
          spin2.stop();
          console.log(`\n  ${C.brightCyan}Symbol:${C.reset}    ${state.symbol}`);
          console.log(`  ${C.brightCyan}Timeframe:${C.reset} ${state.resolution}`);
          if (state.studies?.length > 0) {
            console.log(`  ${C.brightCyan}Studies:${C.reset}   ${state.studies.map(s => s.name).join(', ')}`);
          }
          console.log('');
        } catch (e) {
          spin2.stop(`${C.red}✗ ${e.message}${C.reset}`);
        }
        prompt();
        return;
      }

      if (msg === '/help') {
        console.log(`\n  ${C.cyan}/quit${C.reset}       Exit`);
        console.log(`  ${C.cyan}/clear${C.reset}      Clear history`);
        console.log(`  ${C.cyan}/state${C.reset}      Chart state`);
        console.log(`  ${C.cyan}/screenshot${C.reset} Capture chart`);
        console.log('');
        prompt();
        return;
      }

      // Agent response
      console.log('');
      console.log(`${C.brightMagenta}${C.bold}Agent${C.reset} ${C.magenta}›${C.reset}`);
      console.log('');

      const messages = [...history, { role: 'user', content: msg }];
      let responseText = '';

      try {
        for await (const event of agentTurn(messages)) {
          if (event.type === 'text') {
            process.stdout.write(renderText(event.text));
            responseText += event.text;
          } else if (event.type === 'tool_use') {
            console.log('');
            printToolCall(event.name, event.input);
          } else if (event.type === 'tool_result') {
            printToolResult(event.name, event.result);
          } else if (event.type === 'tool_error') {
            console.log(`  ${C.red}✗ ${event.name}: ${event.error}${C.reset}`);
          }
        }

        // Update history
        history.push({ role: 'user', content: msg });
        history.push({ role: 'assistant', content: responseText });

        // Keep history reasonable
        if (history.length > 40) history = history.slice(-40);

      } catch (e) {
        console.log(`\n${C.red}Error: ${e.message}${C.reset}`);
      }

      console.log('\n');
      console.log(hr('─', C.dim));
      console.log('');
      prompt();
    });
  };

  prompt();
}

// ── CLI Commands ──
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    if (!cmd) {
      // No command = interactive mode
      await interactiveChat();
      return;
    }
    showHelp();
    return;
  }

  // Single commands
  if (cmd === 'health') {
    const spin = spinner('Checking TradingView connection');
    try {
      const { health } = await import('../mcp/client.js');
      const result = await health.check();
      spin.stop(`${C.green}✓ Connected${C.reset}`);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      spin.stop(`${C.red}✗ ${e.message}${C.reset}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === 'state') {
    const spin = spinner('Reading chart state');
    try {
      const { chart } = await import('../mcp/client.js');
      const result = await chart.getState();
      spin.stop(`${C.green}✓${C.reset}`);
      console.log('');
      console.log(`  ${label('Symbol')}:    ${result.symbol}`);
      console.log(`  ${label('Timeframe')}: ${result.resolution}`);
      if (result.studies?.length > 0) {
        console.log(`  ${label('Studies')}:   ${result.studies.map(s => s.name).join(', ')}`);
      }
    } catch (e) {
      spin.stop(`${C.red}✗ ${e.message}${C.reset}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === 'screenshot') {
    const region = args[1] || 'chart';
    const spin = spinner(`Capturing ${region}`);
    try {
      const { capture } = await import('../mcp/client.js');
      const result = await capture.screenshot(region);
      spin.stop(`${C.green}✓${C.reset}`);
      if (result.data) {
        const fname = `chart_${Date.now()}.png`;
        writeFileSync(fname, Buffer.from(result.data, 'base64'));
        console.log(`Saved: ${fname}`);
      }
    } catch (e) {
      spin.stop(`${C.red}✗ ${e.message}${C.reset}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === 'analyze') {
    const file = args[1];
    if (!file) {
      console.error(`${C.red}Usage: tva analyze <file.pine>${C.reset}`);
      process.exit(1);
    }
    if (!existsSync(file)) {
      console.error(`${C.red}File not found: ${file}${C.reset}`);
      process.exit(1);
    }
    const source = readFileSync(file, 'utf-8');
    const { analyzeStatic } = await import('../pine/analyzer.js');
    const result = analyzeStatic(source);

    console.log('');
    console.log(box([
      `${label('Pine Script Analysis')} ${C.gray}${file}${C.reset}`,
      '',
      `  Version: ${C.yellow}v${result.version || '?'}${C.reset}  Type: ${C.cyan}${result.type}${C.reset}`,
      `  ${result.clean ? C.green + '✓ No errors' : C.red + '✗ Has errors'}${C.reset}`,
      `  Errors: ${C.red}${result.summary.errors}${C.reset}  Warnings: ${C.yellow}${result.summary.warnings}${C.reset}  Info: ${C.gray}${result.summary.info}${C.reset}`,
    ], result.clean ? C.green : C.red));

    if (result.issues.length > 0) {
      console.log('');
      for (const issue of result.issues) {
        const color = issue.severity === 'error' ? C.red : issue.severity === 'warning' ? C.yellow : C.gray;
        console.log(`  ${color}[${issue.severity.toUpperCase()}]${C.reset} Line ${issue.line}: ${issue.message}`);
      }
    }
    console.log('');
    process.exit(result.clean ? 0 : 1);
    return;
  }

  if (cmd === 'chat') {
    const message = args.slice(1).join(' ');
    if (!message) {
      // No message = interactive mode
      await interactiveChat();
      return;
    }

    console.log('');
    const spin = spinner('Connecting');
    try {
      await (await import('../mcp/client.js')).connect();
      spin.stop('');
    } catch (e) {
      spin.stop(`${C.yellow}⚠ TradingView not connected${C.reset}`);
    }

    const { agentTurn } = await import('../agent/claude.js');
    const messages = [{ role: 'user', content: message }];

    console.log(`${C.brightMagenta}${C.bold}Agent:${C.reset}\n`);

    try {
      for await (const event of agentTurn(messages)) {
        if (event.type === 'text') {
          process.stdout.write(renderText(event.text));
        } else if (event.type === 'tool_use') {
          console.log('');
          printToolCall(event.name, event.input);
        } else if (event.type === 'tool_result') {
          printToolResult(event.name, event.result);
        }
      }
      console.log('\n');
    } catch (e) {
      console.error(`${C.red}Error: ${e.message}${C.reset}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === 'pine') {
    const prompt = args.slice(1).join(' ');
    if (!prompt) {
      console.error(`${C.red}Usage: tva pine <describe what to build>${C.reset}`);
      process.exit(1);
    }

    const fullMessage = `Write a Pine Script v6 indicator or strategy for: ${prompt}

Follow the complete development loop:
1. Write the Pine Script code
2. Inject it into TradingView with pine_set_source
3. Compile with pine_smart_compile
4. Check for errors with pine_get_errors
5. Fix any errors and recompile
6. Take a screenshot to verify
7. Save with pine_save`;

    const { agentTurn } = await import('../agent/claude.js');

    console.log('');
    console.log(`${C.brightCyan}Building Pine Script: ${C.white}${prompt}${C.reset}\n`);

    try {
      await (await import('../mcp/client.js')).connect();
    } catch (e) {
      console.log(`${C.yellow}⚠ TradingView not connected — will write code only${C.reset}\n`);
    }

    const messages = [{ role: 'user', content: fullMessage }];
    for await (const event of agentTurn(messages)) {
      if (event.type === 'text') {
        process.stdout.write(renderText(event.text));
      } else if (event.type === 'tool_use') {
        console.log('');
        printToolCall(event.name, event.input);
      } else if (event.type === 'tool_result') {
        printToolResult(event.name, event.result);
      }
    }
    console.log('\n');
    return;
  }

  if (cmd === 'server') {
    const { startServer } = await import('../web/server.js');
    await startServer();
    return;
  }

  console.error(`${C.red}Unknown command: ${cmd}${C.reset}`);
  console.error(`Run ${C.cyan}tva help${C.reset} for usage.`);
  process.exit(1);
}

main().catch(err => {
  console.error(`${C.red}Fatal: ${err.message}${C.reset}`);
  process.exit(1);
});
