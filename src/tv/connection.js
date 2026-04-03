/**
 * OpenTrade — TradingView CDP Connection Engine
 * Embedded directly so no external tradingview-mcp repo is needed.
 * Connects to TradingView Desktop via Chrome DevTools Protocol on port 9222.
 */
import CDP from 'chrome-remote-interface';
import { existsSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';

const CDP_HOST = 'localhost';
const CDP_PORT = parseInt(process.env.TV_CDP_PORT || '9222');
const MAX_RETRIES = 5;
const BASE_DELAY = 500;

let _client = null;
let _targetInfo = null;

// ── Core TradingView API paths (discovered via live CDP probing) ──
export const TV = {
  chartApi:           'window.TradingViewApi._activeChartWidgetWV.value()',
  chartCollection:    'window.TradingViewApi._chartWidgetCollection',
  bottomBar:          'window.TradingView.bottomWidgetBar',
  replayApi:          'window.TradingViewApi._replayApi',
  alertService:       'window.TradingViewApi._alertService',
  mainSeriesBars:     'window.TradingViewApi._activeChartWidgetWV.value()._chartWidget.model().mainSeries().bars()',
  pineFacade:         'https://pine-facade.tradingview.com/pine-facade',
};

// ── Connection ──

export async function getClient() {
  if (_client) {
    try {
      await _client.Runtime.evaluate({ expression: '1', returnByValue: true });
      return _client;
    } catch {
      _client = null;
      _targetInfo = null;
    }
  }
  return _connect();
}

async function _connect() {
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const target = await _findChartTarget();
      if (!target) throw new Error('No TradingView chart found. Is TradingView running with --remote-debugging-port=9222?');

      _targetInfo = target;
      _client = await CDP({ host: CDP_HOST, port: CDP_PORT, target: target.id });

      await _client.Runtime.enable();
      await _client.Page.enable();
      await _client.DOM.enable();

      return _client;
    } catch (err) {
      lastError = err;
      const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), 30000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(
    `CDP connection failed after ${MAX_RETRIES} attempts: ${lastError?.message}\n` +
    `Make sure TradingView Desktop is running. Launch it with:\n` +
    `  Mac:   open -a TradingView --args --remote-debugging-port=9222\n` +
    `  Win:   TradingView.exe --remote-debugging-port=9222\n` +
    `  Linux: tradingview --remote-debugging-port=9222\n` +
    `Or run: node src/cli/index.js launch`
  );
}

async function _findChartTarget() {
  const resp = await fetch(`http://${CDP_HOST}:${CDP_PORT}/json/list`);
  const targets = await resp.json();
  return (
    targets.find(t => t.type === 'page' && /tradingview\.com\/chart/i.test(t.url)) ||
    targets.find(t => t.type === 'page' && /tradingview/i.test(t.url)) ||
    null
  );
}

export async function getTargetInfo() {
  if (!_targetInfo) await getClient();
  return _targetInfo;
}

export async function disconnectCDP() {
  if (_client) {
    try { await _client.close(); } catch {}
    _client = null;
    _targetInfo = null;
  }
}

// ── JS Evaluation ──

export async function evaluate(expression, opts = {}) {
  const c = await getClient();
  const result = await c.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: opts.awaitPromise ?? false,
    ...opts,
  });
  if (result.exceptionDetails) {
    const msg = result.exceptionDetails.exception?.description ||
                result.exceptionDetails.text ||
                'Unknown evaluation error';
    throw new Error(`JS error: ${msg}`);
  }
  return result.result?.value;
}

export async function evaluateAsync(expression) {
  return evaluate(expression, { awaitPromise: true });
}

// ── Chart Ready Polling ──

export async function waitForChartReady(expectedSymbol = null, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const state = await evaluate(`
      (function() {
        var spinner = document.querySelector('[class*="loader"]') || document.querySelector('[class*="loading"]');
        var isLoading = spinner && spinner.offsetParent !== null;
        var barCount = -1;
        try { barCount = document.querySelectorAll('[class*="bar"]').length; } catch {}
        return { isLoading: !!isLoading, barCount };
      })()
    `).catch(() => null);

    if (state && !state.isLoading && state.barCount > 0) return true;
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

// ── TradingView Auto-Launcher ──

export async function launchTradingView({ port = CDP_PORT, killExisting = true } = {}) {
  const platform = process.platform;

  const pathMap = {
    darwin: [
      '/Applications/TradingView.app/Contents/MacOS/TradingView',
      `${process.env.HOME}/Applications/TradingView.app/Contents/MacOS/TradingView`,
    ],
    win32: [
      `${process.env.LOCALAPPDATA}\\TradingView\\TradingView.exe`,
      `${process.env.PROGRAMFILES}\\TradingView\\TradingView.exe`,
    ],
    linux: [
      '/opt/TradingView/tradingview',
      '/opt/TradingView/TradingView',
      `${process.env.HOME}/.local/share/TradingView/TradingView`,
      '/snap/tradingview/current/tradingview',
    ],
  };

  let tvPath = null;
  for (const p of (pathMap[platform] || pathMap.linux)) {
    if (p && existsSync(p)) { tvPath = p; break; }
  }

  // Spotlight search on Mac
  if (!tvPath && platform === 'darwin') {
    try {
      const found = execSync('mdfind "kMDItemFSName == TradingView.app" | head -1', { timeout: 5000 }).toString().trim();
      if (found) {
        const candidate = `${found}/Contents/MacOS/TradingView`;
        if (existsSync(candidate)) tvPath = candidate;
      }
    } catch {}
  }

  if (!tvPath) {
    throw new Error(
      `TradingView Desktop not found on ${platform}.\n` +
      `Please launch it manually with: /path/to/TradingView --remote-debugging-port=${port}`
    );
  }

  if (killExisting) {
    try {
      if (platform === 'win32') execSync('taskkill /F /IM TradingView.exe', { timeout: 5000 });
      else execSync('pkill -f TradingView', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 1500));
    } catch {}
  }

  const child = spawn(tvPath, [`--remote-debugging-port=${port}`], { detached: true, stdio: 'ignore' });
  child.unref();

  // Wait for CDP to respond
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const http = await import('node:http');
      const info = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${port}/json/version`, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      return { success: true, platform, binary: tvPath, pid: child.pid, cdp_port: port, browser: info.Browser };
    } catch {}
  }

  return { success: true, platform, binary: tvPath, pid: child.pid, cdp_port: port, cdp_ready: false,
    warning: 'TradingView launched but CDP not ready yet. Wait a moment then try again.' };
}
