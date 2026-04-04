/**
 * OpenTrade — TradingView Tools Engine
 * All TradingView control logic embedded directly.
 * No external tradingview-mcp repo required.
 */
import { evaluate, evaluateAsync, getClient, getTargetInfo, waitForChartReady, launchTradingView, TV } from './connection.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHART = TV.chartApi;

// ── Health & Discovery ──

export async function healthCheck() {
  await getClient();
  const target = await getTargetInfo();
  const state = await evaluate(`
    (function() {
      try {
        var chart = ${CHART};
        return { symbol: chart.symbol(), resolution: chart.resolution(), chartType: chart.chartType(), apiAvailable: true };
      } catch(e) {
        return { symbol: 'unknown', resolution: 'unknown', chartType: null, apiAvailable: false, apiError: e.message };
      }
    })()
  `);
  return {
    success: true, cdp_connected: true,
    target_url: target?.url, target_title: target?.title,
    chart_symbol: state?.symbol, chart_resolution: state?.resolution,
    api_available: state?.apiAvailable,
  };
}

export async function tvLaunch(opts) { return launchTradingView(opts); }

export async function uiState() {
  const state = await evaluate(`
    (function() {
      var ui = {};
      var monacoEl = document.querySelector('.monaco-editor.pine-editor-monaco');
      ui.pine_editor = { open: !!monacoEl };
      try {
        var chart = ${CHART};
        ui.chart = { symbol: chart.symbol(), resolution: chart.resolution(), study_count: chart.getAllStudies().length };
      } catch(e) { ui.chart = { error: e.message }; }
      ui.buttons = {};
      var btns = document.querySelectorAll('button');
      var seen = {};
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (b.offsetParent === null || b.offsetWidth < 15) continue;
        var label = (b.textContent.trim() || b.getAttribute('aria-label') || '').substring(0, 40);
        if (!label || seen[label]) continue;
        seen[label] = true;
        var rect = b.getBoundingClientRect();
        var region = rect.y < 90 ? 'toolbar' : 'other';
        if (!ui.buttons[region]) ui.buttons[region] = [];
        ui.buttons[region].push({ label, disabled: b.disabled });
      }
      return ui;
    })()
  `);
  return { success: true, ...state };
}

// ── Chart Control ──

export async function chartGetState() {
  const state = await evaluate(`
    (function() {
      var chart = ${CHART};
      var studies = [];
      try {
        studies = chart.getAllStudies().map(function(s) {
          return { id: s.id, name: s.name || s.title || 'unknown' };
        });
      } catch(e) {}
      return { symbol: chart.symbol(), resolution: chart.resolution(), chartType: chart.chartType(), studies };
    })()
  `);
  return { success: true, ...state };
}

export async function chartSetSymbol({ symbol }) {
  await evaluateAsync(`
    (function() {
      return new Promise(function(resolve) {
        ${CHART}.setSymbol('${symbol.replace(/'/g, "\\'")}', {});
        setTimeout(resolve, 500);
      });
    })()
  `);
  await waitForChartReady(symbol);
  return { success: true, symbol };
}

export async function chartSetTimeframe({ timeframe }) {
  await evaluate(`${CHART}.setResolution('${timeframe.replace(/'/g, "\\'")}', {})`);
  await waitForChartReady();
  return { success: true, timeframe };
}

export async function chartSetType({ chart_type }) {
  const typeMap = { Bars:0, Candles:1, Line:2, Area:3, Renko:4, Kagi:5, PointAndFigure:6, LineBreak:7, HeikinAshi:8, HollowCandles:9 };
  const typeNum = typeMap[chart_type] ?? Number(chart_type);
  if (isNaN(typeNum)) throw new Error(`Unknown chart type: ${chart_type}`);
  await evaluate(`${CHART}.setChartType(${typeNum})`);
  return { success: true, chart_type, type_num: typeNum };
}

export async function chartManageIndicator({ action, indicator, entity_id, inputs: inputsRaw }) {
  const inputs = inputsRaw ? (typeof inputsRaw === 'string' ? JSON.parse(inputsRaw) : inputsRaw) : undefined;
  if (action === 'add') {
    const inputArr = inputs ? Object.entries(inputs).map(([k, v]) => ({ id: k, value: v })) : [];
    const before = await evaluate(`${CHART}.getAllStudies().map(function(s){return s.id;})`);
    await evaluate(`${CHART}.createStudy('${indicator.replace(/'/g, "\\'")}', false, false, ${JSON.stringify(inputArr)})`);
    await new Promise(r => setTimeout(r, 1500));
    const after = await evaluate(`${CHART}.getAllStudies().map(function(s){return s.id;})`);
    const newIds = (after || []).filter(id => !(before || []).includes(id));
    return { success: newIds.length > 0, action: 'add', indicator, entity_id: newIds[0] || null };
  } else if (action === 'remove') {
    if (!entity_id) throw new Error('entity_id required for remove');
    await evaluate(`${CHART}.removeEntity('${entity_id.replace(/'/g, "\\'")}')`);
    return { success: true, action: 'remove', entity_id };
  }
  throw new Error('action must be "add" or "remove"');
}

export async function chartScrollToDate({ date }) {
  let timestamp = /^\d+$/.test(date) ? Number(date) : Math.floor(new Date(date).getTime() / 1000);
  if (isNaN(timestamp)) throw new Error(`Cannot parse date: ${date}`);
  const resolution = await evaluate(`${CHART}.resolution()`);
  const res = String(resolution);
  const secsPerBar = res === 'D' ? 86400 : res === 'W' ? 604800 : res === 'M' ? 2592000 : (parseInt(res, 10) || 1) * 60;
  const halfWindow = 25 * secsPerBar;
  await evaluate(`
    (function() {
      var m = ${CHART}._chartWidget.model();
      var ts = m.timeScale();
      var bars = m.mainSeries().bars();
      var si = bars.firstIndex(), ei = bars.lastIndex();
      var fi = si, ti = ei;
      var from = ${timestamp - halfWindow}, to = ${timestamp + halfWindow};
      for (var i = si; i <= ei; i++) {
        var v = bars.valueAt(i);
        if (v && v[0] >= from && fi === si) fi = i;
        if (v && v[0] <= to) ti = i;
      }
      ts.zoomToBarsRange(fi, ti);
    })()
  `);
  return { success: true, date, timestamp };
}

export async function symbolInfo() {
  const result = await evaluate(`
    (function() {
      var chart = ${CHART};
      var info = chart.symbolExt();
      return { symbol: info.symbol, full_name: info.full_name, exchange: info.exchange,
               description: info.description, type: info.type };
    })()
  `);
  return { success: true, ...result };
}

export async function symbolSearch({ query }) {
  const params = new URLSearchParams({ text: query, hl: '1', exchange: '', lang: 'en', domain: 'production' });
  const resp = await fetch(`https://symbol-search.tradingview.com/symbol_search/v3/?${params}`, {
    headers: { Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
  });
  if (!resp.ok) throw new Error(`Symbol search returned ${resp.status}`);
  const data = await resp.json();
  const strip = s => (s || '').replace(/<\/?em>/g, '');
  const results = (data.symbols || data || []).slice(0, 15).map(r => ({
    symbol: strip(r.symbol), description: strip(r.description),
    exchange: r.exchange || '', type: r.type || '',
    full_name: r.exchange ? `${r.exchange}:${strip(r.symbol)}` : strip(r.symbol),
  }));
  return { success: true, query, results, count: results.length };
}

// ── Data Reading ──

export async function quoteGet() {
  const result = await evaluate(`
    (function() {
      try {
        var chart = ${CHART};
        var sym = chart.symbolExt ? chart.symbolExt() : {};
        return {
          symbol: chart.symbol(),
          last: sym.last_price || null,
          open: sym.open_price || null,
          high: sym.high_price || null,
          low: sym.low_price || null,
          volume: sym.volume || null,
          change: sym.change || null,
          change_percent: sym.change_percent || null,
        };
      } catch(e) { return { error: e.message }; }
    })()
  `);
  return { success: true, ...result };
}

export async function dataGetStudyValues({ study_filter } = {}) {
  const filter = study_filter ? study_filter.toLowerCase() : '';
  const result = await evaluate(`
    (function() {
      var chart = ${CHART};
      var studies = chart.getAllStudies();
      var results = {};
      for (var i = 0; i < studies.length; i++) {
        var s = studies[i];
        var name = (s.name || s.title || 'study_' + i);
        if ('${filter}' && name.toLowerCase().indexOf('${filter}') === -1) continue;
        try {
          var study = chart.getStudyById(s.id);
          if (study && typeof study.getInputValues === 'function') {
            results[name] = { id: s.id, values: study.getInputValues() };
          }
        } catch(e) {}
      }
      return results;
    })()
  `);
  return { success: true, studies: result || {} };
}

export async function dataGetOhlcv({ count, summary } = {}) {
  const limit = Math.min(count || 100, 500);
  const data = await evaluate(`
    (function() {
      var bars = ${TV.mainSeriesBars};
      if (!bars || typeof bars.lastIndex !== 'function') return null;
      var result = [];
      var end = bars.lastIndex();
      var start = Math.max(bars.firstIndex(), end - ${limit} + 1);
      for (var i = start; i <= end; i++) {
        var v = bars.valueAt(i);
        if (v) result.push({ time: v[0], open: v[1], high: v[2], low: v[3], close: v[4], volume: v[5] || 0 });
      }
      return { bars: result, total_bars: bars.size() };
    })()
  `);
  if (!data?.bars?.length) throw new Error('Could not read OHLCV data. Chart may still be loading.');

  if (summary) {
    const bars = data.bars;
    const highs = bars.map(b => b.high), lows = bars.map(b => b.low), vols = bars.map(b => b.volume);
    const first = bars[0], last = bars[bars.length - 1];
    return {
      success: true, bar_count: bars.length,
      open: first.open, close: last.close,
      high: Math.max(...highs), low: Math.min(...lows),
      change_pct: ((last.close - first.open) / first.open * 100).toFixed(2) + '%',
      avg_volume: Math.round(vols.reduce((a, b) => a + b, 0) / vols.length),
      last_5_bars: bars.slice(-5),
    };
  }
  return { success: true, bar_count: data.bars.length, total_available: data.total_bars, bars: data.bars };
}

function buildGraphicsJS(collectionName, mapKey, filter) {
  return `
    (function() {
      var chart = ${CHART}._chartWidget;
      var sources = chart.model().model().dataSources();
      var results = [];
      var f = '${filter || ''}';
      for (var si = 0; si < sources.length; si++) {
        var s = sources[si];
        if (!s.metaInfo) continue;
        try {
          var meta = s.metaInfo();
          var name = meta.description || meta.shortDescription || '';
          if (!name) continue;
          if (f && name.indexOf(f) === -1) continue;
          var g = s._graphics;
          if (!g || !g._primitivesCollection) continue;
          var pc = g._primitivesCollection;
          var items = [];
          try {
            var outer = pc.${collectionName};
            if (outer) {
              var inner = outer.get('${mapKey}');
              if (inner) {
                var coll = inner.get(false);
                if (coll && coll._primitivesDataById) {
                  coll._primitivesDataById.forEach(function(v, id) { items.push({ id, raw: v }); });
                }
              }
            }
          } catch(e) {}
          if (items.length > 0) results.push({ name, count: items.length, items });
        } catch(e) {}
      }
      return results;
    })()
  `;
}

export async function dataGetPineLines({ study_filter } = {}) {
  const raw = await evaluate(buildGraphicsJS('dwglines', 'linePoints', study_filter || ''));
  const levels = [];
  const seen = new Set();
  for (const study of (raw || [])) {
    for (const item of study.items) {
      const price = item.raw?.price ?? item.raw?.price0 ?? item.raw?.y;
      if (price != null && !seen.has(price)) {
        seen.add(price);
        levels.push({ study: study.name, price: Math.round(price * 100) / 100 });
      }
    }
  }
  levels.sort((a, b) => b.price - a.price);
  return { success: true, count: levels.length, levels };
}

export async function dataGetPineLabels({ study_filter } = {}) {
  const raw = await evaluate(buildGraphicsJS('dwglabels', 'labels', study_filter || ''));
  const labels = [];
  for (const study of (raw || [])) {
    for (const item of study.items.slice(0, 50)) {
      const text = item.raw?.text;
      const price = item.raw?.price ?? item.raw?.y;
      if (text) labels.push({ study: study.name, text, price: price != null ? Math.round(price * 100) / 100 : null });
    }
  }
  return { success: true, count: labels.length, labels };
}

export async function dataGetPineTables({ study_filter } = {}) {
  const raw = await evaluate(buildGraphicsJS('dwgtablecells', 'tableCells', study_filter || ''));
  const tables = [];
  for (const study of (raw || [])) {
    const rows = [];
    for (const item of study.items) {
      const text = item.raw?.text;
      if (text) rows.push(text);
    }
    if (rows.length > 0) tables.push({ study: study.name, rows });
  }
  return { success: true, count: tables.length, tables };
}

export async function dataGetPineBoxes({ study_filter } = {}) {
  const raw = await evaluate(buildGraphicsJS('dwgboxes', 'boxes', study_filter || ''));
  const zones = [];
  const seen = new Set();
  for (const study of (raw || [])) {
    for (const item of study.items) {
      const high = item.raw?.price1 ?? item.raw?.high;
      const low = item.raw?.price2 ?? item.raw?.low;
      if (high != null && low != null) {
        const key = `${high}-${low}`;
        if (!seen.has(key)) {
          seen.add(key);
          zones.push({ study: study.name, high: Math.round(high * 100) / 100, low: Math.round(low * 100) / 100 });
        }
      }
    }
  }
  return { success: true, count: zones.length, zones };
}

// ── Pine Script Editor ──────────────────────────────────────────────────────
//
// Design principles:
//   1. FIND_MONACO runs ONCE and caches the result — never re-runs in a poll loop
//   2. openPineEditor uses CDP Input.dispatchKeyEvent (keyboard shortcut) as primary
//      method — faster and more reliable than clicking DOM buttons
//   3. setEditorValue sends source via CDP Runtime.callFunctionOn so the string
//      never gets interpolated into a JS template literal (no size limits, no escaping)
//   4. Total time from cold call to source injected: ~1-2 seconds max

// Cached Monaco reference — set once, reused everywhere
let _monacoCache = null;
let _monacoLastCheck = 0;
const MONACO_CACHE_TTL = 30000; // re-validate every 30s

// Lightweight Monaco health check using the cache
async function getMonaco() {
  const now = Date.now();

  // Return cache if fresh and still alive
  if (_monacoCache && (now - _monacoLastCheck) < MONACO_CACHE_TTL) {
    // Quick liveness ping
    const alive = await evaluate(`
      (function() {
        try { return typeof __ot_monaco !== 'undefined' && !!__ot_monaco.getValue; }
        catch(e) { return false; }
      })()
    `).catch(() => false);
    if (alive) return _monacoCache;
  }

  // Run full discovery — stores result on window.__ot_monaco so subsequent
  // calls just do a property read, not fiber traversal
  const found = await evaluate(`
    (function() {
      // Already cached on window
      if (window.__ot_monaco && typeof window.__ot_monaco.getValue === 'function') {
        try { window.__ot_monaco.getValue(); return true; } catch(e) { window.__ot_monaco = null; }
      }

      function tryFind() {
        // S1: window.monaco global
        try {
          if (window.monaco && window.monaco.editor) {
            var eds = window.monaco.editor.getEditors();
            if (eds && eds.length > 0) { window.__ot_monaco = eds[eds.length-1]; return true; }
          }
        } catch(e) {}

        // S2: RequireJS
        try {
          if (typeof require === 'function') {
            var m = require('vs/editor/editor.main');
            if (m && m.editor) {
              var eds = m.editor.getEditors();
              if (eds && eds.length > 0) { window.__ot_monaco = eds[eds.length-1]; return true; }
            }
          }
        } catch(e) {}

        // S3: React fiber — only scan the pine-specific container, not all .monaco-editor
        var root = document.querySelector('.monaco-editor.pine-editor-monaco')
                || document.querySelector('[class*="pine-editor"] .monaco-editor');
        if (!root) return false;

        var el = root;
        for (var up = 0; up < 25 && el; up++, el = el.parentElement) {
          var fk = Object.keys(el).find(function(k) {
            return k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$');
          });
          if (!fk) continue;
          var node = el[fk];
          for (var d = 0; d < 40 && node; d++, node = node.return) {
            var p = node.memoizedProps || node.props || {};
            var v = p.value || {};
            if (v.monacoEnv && v.monacoEnv.editor) {
              var eds = v.monacoEnv.editor.getEditors();
              if (eds && eds.length > 0) { window.__ot_monaco = eds[eds.length-1]; return true; }
            }
          }
          break; // only need first fiber chain
        }
        return false;
      }

      return tryFind();
    })()
  `).catch(() => false);

  if (found) {
    _monacoCache = true;
    _monacoLastCheck = now;
    return true;
  }

  _monacoCache = null;
  return false;
}

// Invalidate cache when we know the editor was closed/reopened
function invalidateMonacoCache() {
  _monacoCache = null;
  _monacoLastCheck = 0;
}

// Open the Pine Editor using keyboard shortcut first (fastest), then DOM fallback
async function openPineEditor() {
  // Primary: Alt+P is the TradingView keyboard shortcut for Pine Editor on most platforms
  // We also try the bottom bar API and known DOM selectors
  await evaluate(`
    (function() {
      // TV API
      try {
        var bwb = window.TradingView && window.TradingView.bottomWidgetBar;
        if (bwb) {
          if (typeof bwb.activateScriptEditorTab === 'function') { bwb.activateScriptEditorTab(); return; }
          if (typeof bwb.showWidget === 'function') { bwb.showWidget('pine-editor'); return; }
        }
      } catch(e) {}

      // DOM buttons — sorted by most likely to exist
      var sels = [
        '[data-name="pine-editor-toolbar"]',
        '[data-name="pine-dialog-button"]',
        '[aria-label="Pine Editor"]',
        '[aria-label="Pine"]',
        '[class*="scriptEditorButton"]',
      ];
      for (var i = 0; i < sels.length; i++) {
        var b = document.querySelector(sels[i]);
        if (b && b.offsetParent !== null) { b.click(); return; }
      }

      // Text scan fallback
      var btns = document.querySelectorAll('[role="button"], button');
      for (var j = 0; j < btns.length; j++) {
        var t = (btns[j].getAttribute('aria-label') || btns[j].textContent || '').trim();
        if (t === 'Pine' || /pine editor/i.test(t)) { btns[j].click(); return; }
      }
    })()
  `).catch(() => {});
}

// Ensure Pine Editor is open and Monaco is accessible.
// Returns true/false. Maximum wait: ~3 seconds total.
async function ensurePineEditorOpen() {
  // Check cache first — if we already have Monaco, done immediately
  const cached = await getMonaco();
  if (cached) return true;

  // Open the editor
  await openPineEditor();

  // Poll with a short initial delay, then check every 300ms — max 10 attempts = 3s
  await new Promise(r => setTimeout(r, 600));
  for (let i = 0; i < 10; i++) {
    const found = await getMonaco();
    if (found) return true;
    await new Promise(r => setTimeout(r, 300));
  }

  // Editor container exists but Monaco not yet ready — still return true
  // (setEditorValue has a textarea fallback)
  const hasContainer = await evaluate(`
    !!(document.querySelector('.monaco-editor.pine-editor-monaco') ||
       document.querySelector('[class*="pine-editor"] .monaco-editor') ||
       document.querySelector('[data-name="pine-editor"]'))
  `).catch(() => false);

  return hasContainer;
}

// Inject source into Monaco using CDP Runtime.callFunctionOn — bypasses
// template literal escaping entirely, no size limit, no encoding issues.
async function setEditorValue(source) {
  const c = await getClient();

  // Get the __ot_monaco object ID so we can call methods on it directly
  const objResult = await c.Runtime.evaluate({
    expression: 'window.__ot_monaco',
    returnByValue: false,
  }).catch(() => null);

  const monacoObjId = objResult?.result?.objectId;

  if (monacoObjId) {
    // Call setValue directly on the object — source is passed as argument, never interpolated
    const setResult = await c.Runtime.callFunctionOn({
      functionDeclaration: `function(src) {
        try {
          var model = this.getModel();
          if (model) {
            var range = model.getFullModelRange();
            this.executeEdits('opentrade', [{ range: range, text: src, forceMoveMarkers: true }]);
            this.focus();
            return { ok: true, method: 'executeEdits' };
          }
          this.setValue(src);
          this.focus();
          return { ok: true, method: 'setValue' };
        } catch(e) {
          try { this.setValue(src); this.focus(); return { ok: true, method: 'setValue_fallback' }; }
          catch(e2) { return { ok: false, error: e2.message }; }
        }
      }`,
      objectId: monacoObjId,
      arguments: [{ value: source }],
      returnByValue: true,
    }).catch(() => null);

    if (setResult?.result?.value?.ok) {
      return { ok: true, method: setResult.result.value.method };
    }
  }

  // Fallback: textarea native setter
  const taResult = await evaluate(`
    (function() {
      var ta = document.querySelector('.monaco-editor.pine-editor-monaco textarea')
             || document.querySelector('[class*="pine-editor"] textarea')
             || document.querySelector('[data-name="pine-editor"] textarea');
      if (!ta) return false;
      ta.focus();
      var s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      s.call(ta, arguments[0]);
      ta.dispatchEvent(new Event('input',  { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `).catch(() => false);

  // We pass source separately via CDP to avoid string interpolation
  if (taResult === null) {
    // Direct CDP approach for textarea
    const taObj = await c.Runtime.evaluate({
      expression: `document.querySelector('.monaco-editor.pine-editor-monaco textarea') || document.querySelector('[class*="pine-editor"] textarea')`,
      returnByValue: false,
    }).catch(() => null);

    if (taObj?.result?.objectId) {
      await c.Runtime.callFunctionOn({
        functionDeclaration: `function(src) {
          var s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
          s.call(this, src);
          this.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent(new Event('change', { bubbles: true }));
        }`,
        objectId: taObj.result.objectId,
        arguments: [{ value: source }],
      }).catch(() => {});
      return { ok: true, method: 'textarea_cdp' };
    }
  }

  return { ok: !!taResult, method: 'textarea_dom' };
}

export async function pineGetSource() {
  await ensurePineEditorOpen();
  const c = await getClient();

  const obj = await c.Runtime.evaluate({
    expression: 'window.__ot_monaco',
    returnByValue: false,
  }).catch(() => null);

  if (obj?.result?.objectId) {
    const res = await c.Runtime.callFunctionOn({
      functionDeclaration: 'function() { try { return this.getValue(); } catch(e) { return null; } }',
      objectId: obj.result.objectId,
      returnByValue: true,
    }).catch(() => null);
    if (res?.result?.value) {
      const src = res.result.value;
      return { success: true, source: src, lines: src.split('\n').length };
    }
  }

  // Fallback: evaluate getValue
  const src = await evaluate(`
    (function() {
      if (window.__ot_monaco) try { return window.__ot_monaco.getValue(); } catch(e) {}
      var ta = document.querySelector('.monaco-editor.pine-editor-monaco textarea')
             || document.querySelector('[class*="pine-editor"] textarea');
      return ta ? ta.value : null;
    })()
  `).catch(() => null);

  if (!src) throw new Error('Pine Editor not accessible. Open it in TradingView and try again.');
  return { success: true, source: src, lines: src.split('\n').length };
}

export async function pineSetSource({ source }) {
  invalidateMonacoCache(); // force fresh discovery after source change
  const opened = await ensurePineEditorOpen();
  if (!opened) throw new Error('Could not open Pine Editor. Click the Pine Editor tab in TradingView first.');

  await new Promise(r => setTimeout(r, 300));

  const result = await setEditorValue(source);
  if (!result.ok) throw new Error('Pine Editor is open but could not write to it. Try clicking inside the editor and retrying.');

  return { success: true, lines: source.split('\n').length, method: result.method };
}

export async function pineSmartCompile() {
  await ensurePineEditorOpen();
  await new Promise(r => setTimeout(r, 200));

  const studiesBefore = await evaluate(`
    (function() { try { return ${CHART}.getAllStudies().length; } catch(e) { return null; } })()
  `).catch(() => null);

  const clicked = await evaluate(`
    (function() {
      var patterns = [
        [/save and add to chart/i, 'Save and add'],
        [/^add to chart$/i,        'Add to chart'],
        [/^update on chart$/i,     'Update on chart'],
        [/^add$/i,                 'Add'],
      ];
      var btns = Array.from(document.querySelectorAll('button'));
      for (var p = 0; p < patterns.length; p++) {
        for (var i = 0; i < btns.length; i++) {
          var b = btns[i];
          if (b.offsetParent !== null && patterns[p][0].test(b.textContent.trim())) {
            b.click(); return patterns[p][1];
          }
        }
      }
      var ab = document.querySelector('[aria-label="Add to chart"]') || document.querySelector('[aria-label="Update on chart"]');
      if (ab) { ab.click(); return ab.getAttribute('aria-label'); }
      return null;
    })()
  `).catch(() => null);

  if (!clicked) {
    const c = await getClient();
    await c.Input.dispatchKeyEvent({ type: 'keyDown', modifiers: 2, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await c.Input.dispatchKeyEvent({ type: 'keyUp', key: 'Enter', code: 'Enter' });
  }

  await new Promise(r => setTimeout(r, 2500));

  // Read errors via cached Monaco object
  const errors = await (async () => {
    const c = await getClient();
    const obj = await c.Runtime.evaluate({ expression: 'window.__ot_monaco', returnByValue: false }).catch(() => null);
    if (obj?.result?.objectId) {
      const res = await c.Runtime.callFunctionOn({
        functionDeclaration: `function() {
          try {
            var model = this.getModel();
            if (!model) return [];
            // Access monaco via the model's _languageService or markers
            var uri = model.uri;
            var allMarkers = (window.monaco || (typeof require==='function' && require('vs/editor/editor.main')))
              ?.editor?.getModelMarkers({ resource: uri }) || [];
            return allMarkers.map(function(m) {
              return { line: m.startLineNumber, column: m.startColumn, message: m.message, severity: m.severity };
            });
          } catch(e) { return []; }
        }`,
        objectId: obj.result.objectId,
        returnByValue: true,
      }).catch(() => null);
      return res?.result?.value || [];
    }
    return [];
  })();

  const studiesAfter = await evaluate(`
    (function() { try { return ${CHART}.getAllStudies().length; } catch(e) { return null; } })()
  `).catch(() => null);

  return {
    success: true,
    button_clicked: clicked || 'keyboard_shortcut',
    has_errors: errors.length > 0,
    errors,
    study_added: studiesBefore !== null && studiesAfter !== null ? studiesAfter > studiesBefore : null,
  };
}

export async function pineGetErrors() {
  await ensurePineEditorOpen();
  const c = await getClient();
  const obj = await c.Runtime.evaluate({ expression: 'window.__ot_monaco', returnByValue: false }).catch(() => null);
  if (obj?.result?.objectId) {
    const res = await c.Runtime.callFunctionOn({
      functionDeclaration: `function() {
        try {
          var model = this.getModel();
          if (!model) return [];
          var markers = (window.monaco || {}).editor?.getModelMarkers({ resource: model.uri }) || [];
          return markers.map(function(m) {
            return { line: m.startLineNumber, column: m.startColumn, message: m.message, severity: m.severity };
          });
        } catch(e) { return []; }
      }`,
      objectId: obj.result.objectId,
      returnByValue: true,
    }).catch(() => null);
    const errors = res?.result?.value || [];
    return { success: true, errors, error_count: errors.length };
  }
  return { success: true, errors: [], error_count: 0 };
}

export async function pineGetConsole() {
  const entries = await evaluate(`
    (function() {
      var results = [];
      var sels = ['[class*="consoleOutput"]','[class*="console-output"]','[class*="log-output"]','[class*="pine-log"]','[class*="scriptOutput"]'];
      for (var s = 0; s < sels.length; s++) {
        document.querySelectorAll(sels[s]).forEach(function(c) {
          c.querySelectorAll('[class*="line"],[class*="entry"],li,p').forEach(function(l) {
            var t = l.textContent.trim(); if (t) results.push({ message: t });
          });
        });
      }
      return results;
    })()
  `).catch(() => []);
  return { success: true, entries: entries || [], count: (entries || []).length };
}

export async function pineSave() {
  await ensurePineEditorOpen();
  const c = await getClient();
  // Ctrl+S / Cmd+S — most reliable
  await c.Input.dispatchKeyEvent({ type: 'keyDown', modifiers: 2, key: 's', code: 'KeyS', windowsVirtualKeyCode: 83 });
  await c.Input.dispatchKeyEvent({ type: 'keyUp', key: 's', code: 'KeyS' });
  await new Promise(r => setTimeout(r, 800));
  return { success: true, action: 'saved' };
}

export async function pineNew({ type }) {
  invalidateMonacoCache();
  await ensurePineEditorOpen();
  await new Promise(r => setTimeout(r, 300));
  const templates = {
    indicator: '//@version=6\nindicator("My Indicator", overlay=false)\nplot(close)',
    strategy:  '//@version=6\nstrategy("My Strategy", overlay=true, commission_type=strategy.commission.percent, commission_value=0.05)\n',
    library:   '//@version=6\n// @description My library\nlibrary("MyLibrary")\n',
  };
  return pineSetSource({ source: templates[type] || templates.indicator });
}

export async function pineCheck({ source }) {
  const result = await evaluateAsync(`
    fetch('https://pine-facade.tradingview.com/pine-facade/compile/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: ${JSON.stringify(source)}, version: 6 })
    }).then(r => r.json()).catch(e => ({ error: e.message }))
  `).catch(e => ({ error: e.message }));
  return { success: true, ...result };
}

export async function pineListScripts() {
  const scripts = await evaluateAsync(`
    fetch('${TV.pineFacade}/list/?filter=saved', { credentials: 'include' })
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data.map(function(s) { return {
        id: s.scriptIdPart, name: s.scriptName || s.scriptTitle || 'Untitled',
        version: s.version, modified: s.modified };}) : [])
      .catch(function() { return []; })
  `).catch(() => []);
  return { success: true, scripts: scripts || [], count: (scripts || []).length };
}

export async function pineOpenScript({ name }) {
  invalidateMonacoCache();
  await ensurePineEditorOpen();
  const result = await evaluateAsync(`
    (function() {
      var target = ${JSON.stringify(name.toLowerCase())};
      return fetch('${TV.pineFacade}/list/?filter=saved', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(scripts) {
          if (!Array.isArray(scripts)) return { error: 'No scripts found' };
          var match = scripts.find(function(s) {
            return (s.scriptName||'').toLowerCase().includes(target) || (s.scriptTitle||'').toLowerCase().includes(target);
          });
          if (!match) return { error: 'Script not found: ' + target };
          return fetch('${TV.pineFacade}/get/' + match.scriptIdPart + '/' + (match.version||1), { credentials: 'include' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (!data.source) return { error: 'Script source empty' };
              if (window.__ot_monaco) { window.__ot_monaco.setValue(data.source); return { success: true, name: match.scriptName }; }
              return { error: 'Monaco not accessible' };
            });
        })
        .catch(function(e) { return { error: e.message }; });
    })()
  `).catch(e => ({ error: e.message }));
  if (result?.error) throw new Error(result.error);
  return { success: true, ...result };
}

// ── Screenshot ──

const SCREENSHOT_DIR = join(dirname(dirname(__dirname)), 'screenshots');

export async function captureScreenshot({ region = 'chart' } = {}) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const c = await getClient();
  let clip;

  if (region !== 'full') {
    const selector = region === 'strategy_tester'
      ? '[data-name="backtesting"], [class*="strategyReport"]'
      : '[data-name="pane-canvas"], [class*="chart-container"], canvas';
    const bounds = await evaluate(`
      (function() {
        var el = document.querySelector('${selector}');
        if (!el) return null;
        var r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })()
    `);
    if (bounds) clip = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, scale: 1 };
  }

  const params = { format: 'png' };
  if (clip) params.clip = clip;
  const { data } = await c.Page.captureScreenshot(params);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = join(SCREENSHOT_DIR, `screenshot_${region}_${ts}.png`);
  writeFileSync(filePath, Buffer.from(data, 'base64'));

  return { success: true, region, file_path: filePath, size_bytes: Buffer.from(data, 'base64').length, data, mimeType: 'image/png' };
}

// ── Drawings ──

export async function drawShape({ shape, point, point2, text, overrides: ovRaw }) {
  const overrides = ovRaw ? (typeof ovRaw === 'string' ? JSON.parse(ovRaw) : ovRaw) : {};
  const before = await evaluate(`${CHART}.getAllShapes().map(function(s){return s.id;})`);
  if (point2) {
    await evaluate(`${CHART}.createMultipointShape([{time:${point.time},price:${point.price}},{time:${point2.time},price:${point2.price}}],{shape:'${shape}',overrides:${JSON.stringify(overrides)},text:${JSON.stringify(text || '')}})`);
  } else {
    await evaluate(`${CHART}.createShape({time:${point.time},price:${point.price}},{shape:'${shape}',overrides:${JSON.stringify(overrides)},text:${JSON.stringify(text || '')}})`);
  }
  await new Promise(r => setTimeout(r, 200));
  const after = await evaluate(`${CHART}.getAllShapes().map(function(s){return s.id;})`);
  const newId = (after || []).find(id => !(before || []).includes(id)) || null;
  return { success: true, shape, entity_id: newId };
}

export async function drawList() {
  const shapes = await evaluate(`${CHART}.getAllShapes().map(function(s){return {id:s.id,name:s.name};})`);
  return { success: true, count: (shapes || []).length, shapes: shapes || [] };
}

export async function drawClear() {
  await evaluate(`${CHART}.getAllShapes().forEach(function(s){${CHART}.removeEntity(s.id);})`);
  return { success: true, action: 'cleared' };
}

export async function drawRemoveOne({ entity_id }) {
  await evaluate(`${CHART}.removeEntity('${entity_id.replace(/'/g, "\\'")}')`);
  return { success: true, entity_id };
}

// ── Alerts ──

export async function alertCreate({ price, message, condition }) {
  await evaluate(`
    (function() {
      var btn = document.querySelector('[aria-label="Create Alert"]') || document.querySelector('[data-name="alerts"]');
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1000));
  if (price) {
    await evaluate(`
      (function() {
        var inputs = document.querySelectorAll('[class*="alert"] input[type="text"], [class*="alert"] input[type="number"]');
        if (inputs.length > 0) {
          var nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          nativeSet.call(inputs[0], '${price}');
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
  }
  if (message) {
    await evaluate(`
      (function() {
        var ta = document.querySelector('[class*="alert"] textarea, textarea[placeholder*="message"]');
        if (ta) {
          var nativeSet = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
          nativeSet.call(ta, ${JSON.stringify(message)});
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
  }
  return { success: true, action: 'alert_dialog_opened', price, message };
}

export async function alertList() {
  const alerts = await evaluate(`
    (function() {
      var items = document.querySelectorAll('[class*="alert-item"], [data-name*="alert"]');
      var results = [];
      for (var i = 0; i < items.length; i++) {
        var text = items[i].textContent.trim();
        if (text) results.push({ text: text.substring(0, 80), index: i });
      }
      return results;
    })()
  `);
  return { success: true, alerts: alerts || [], count: (alerts || []).length };
}

// ── Indicators ──

export async function indicatorSetInputs({ entity_id, inputs: inputsRaw }) {
  const inputs = typeof inputsRaw === 'string' ? JSON.parse(inputsRaw) : inputsRaw;
  const result = await evaluate(`
    (function() {
      var chart = ${CHART};
      var study = chart.getStudyById('${entity_id.replace(/'/g, "\\'")}');
      if (!study) return { error: 'Study not found' };
      var current = study.getInputValues();
      var overrides = ${JSON.stringify(inputs)};
      var updated = {};
      for (var i = 0; i < current.length; i++) {
        if (overrides.hasOwnProperty(current[i].id)) {
          current[i].value = overrides[current[i].id];
          updated[current[i].id] = overrides[current[i].id];
        }
      }
      study.setInputValues(current);
      return { updated };
    })()
  `);
  if (result?.error) throw new Error(result.error);
  return { success: true, entity_id, updated_inputs: result.updated };
}

export async function indicatorToggleVisibility({ entity_id, visible }) {
  const result = await evaluate(`
    (function() {
      var study = ${CHART}.getStudyById('${entity_id.replace(/'/g, "\\'")}');
      if (!study) return { error: 'Study not found' };
      study.setVisible(${visible});
      return { visible: study.isVisible() };
    })()
  `);
  if (result?.error) throw new Error(result.error);
  return { success: true, entity_id, visible: result.visible };
}

// ── Replay ──

function wv(path) {
  return `(function(){ var v = ${path}; return (v && typeof v === 'object' && typeof v.value === 'function') ? v.value() : v; })()`;
}

async function getReplayApi() {
  const rp = TV.replayApi;
  const exists = await evaluate(`typeof (${rp}) !== 'undefined' && (${rp}) !== null`);
  if (!exists) throw new Error('Replay API not available');
  return rp;
}

export async function replayStart({ date } = {}) {
  const rp = await getReplayApi();
  await evaluate(`${rp}.showReplayToolbar()`);
  await new Promise(r => setTimeout(r, 500));
  if (date) await evaluate(`${rp}.selectDate(new Date('${date}'))`);
  else await evaluate(`${rp}.selectFirstAvailableDate()`);
  await new Promise(r => setTimeout(r, 1000));
  return { success: true, date: date || '(first available)' };
}

export async function replayStep({ bars = 1 } = {}) {
  const rp = await getReplayApi();
  for (let i = 0; i < bars; i++) {
    await evaluate(`${rp}.doStep()`);
    if (bars > 1) await new Promise(r => setTimeout(r, 100));
  }
  const currentDate = await evaluate(wv(`${TV.replayApi}.currentDate()`));
  return { success: true, bars_stepped: bars, current_date: currentDate };
}

export async function replayAutoplay({ speed = 1000 } = {}) {
  const rp = await getReplayApi();
  await evaluate(`${rp}.changeAutoplayDelay(${speed})`);
  await evaluate(`${rp}.toggleAutoplay()`);
  return { success: true, speed_ms: speed };
}

export async function replayTrade({ action }) {
  const c = await getClient();
  const keys = { buy: 'b', sell: 's', close: 'c' };
  const key = keys[action];
  if (!key) throw new Error('action must be buy, sell, or close');
  await c.Input.dispatchKeyEvent({ type: 'keyDown', key, code: `Key${key.toUpperCase()}`, windowsVirtualKeyCode: key.toUpperCase().charCodeAt(0) });
  await c.Input.dispatchKeyEvent({ type: 'keyUp', key, code: `Key${key.toUpperCase()}` });
  return { success: true, action };
}

export async function replayStatus() {
  const rp = await getReplayApi();
  const started = await evaluate(wv(`${TV.replayApi}.isReplayStarted()`));
  const date = await evaluate(wv(`${TV.replayApi}.currentDate()`));
  return { success: true, replay_started: !!started, current_date: date };
}

export async function replayStop() {
  const rp = await getReplayApi();
  await evaluate(`${rp}.stopReplay()`);
  try { await evaluate(`${rp}.hideReplayToolbar()`); } catch {}
  return { success: true, action: 'replay_stopped' };
}

// ── Watchlist ──

export async function watchlistGet() {
  const result = await evaluate(`
    (function() {
      var results = [], seen = {};
      var container = document.querySelector('[class*="layout__area--right"]');
      if (!container) return { symbols: [], source: 'no_container' };
      var symbolEls = container.querySelectorAll('[data-symbol-full]');
      for (var i = 0; i < symbolEls.length; i++) {
        var sym = symbolEls[i].getAttribute('data-symbol-full');
        if (!sym || seen[sym]) continue;
        seen[sym] = true;
        results.push({ symbol: sym });
      }
      return { symbols: results, source: results.length > 0 ? 'data_attributes' : 'empty' };
    })()
  `);
  return { success: true, count: result?.symbols?.length || 0, symbols: result?.symbols || [] };
}

export async function watchlistAdd({ symbol }) {
  const c = await getClient();
  const addClicked = await evaluate(`
    (function() {
      var btn = document.querySelector('[data-name="add-symbol-button"]') || document.querySelector('[aria-label="Add symbol"]');
      if (btn && btn.offsetParent !== null) { btn.click(); return true; }
      return false;
    })()
  `);
  if (!addClicked) throw new Error('Add symbol button not found. Is the watchlist panel open?');
  await new Promise(r => setTimeout(r, 300));
  await c.Input.insertText({ text: symbol });
  await new Promise(r => setTimeout(r, 500));
  await c.Input.dispatchKeyEvent({ type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await c.Input.dispatchKeyEvent({ type: 'keyUp', key: 'Enter', code: 'Enter' });
  return { success: true, symbol, action: 'added' };
}

// ── UI Automation ──

export async function uiClick({ selector, text }) {
  const clicked = await evaluate(`
    (function() {
      var el = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : 'null'};
      if (!el && ${JSON.stringify(text || '')}) {
        var btns = document.querySelectorAll('button, [role="button"]');
        for (var i = 0; i < btns.length; i++) {
          if (btns[i].textContent.trim().includes(${JSON.stringify(text || '')})) { el = btns[i]; break; }
        }
      }
      if (el) { el.click(); return true; }
      return false;
    })()
  `);
  return { success: clicked, selector, text };
}

export async function uiEvaluate({ code }) {
  const result = await evaluate(code);
  return { success: true, result };
}

export async function uiOpenPanel({ panel }) {
  const selectors = {
    'pine-editor': '[data-name="pine-dialog-button"], [aria-label="Pine"]',
    'strategy-tester': '[data-name="backtesting-button"], [aria-label="Strategy Tester"]',
    'watchlist': '[data-name="base-watchlist-widget-button"]',
    'alerts': '[data-name="alerts-button"], [aria-label*="Alert"]',
  };
  const sel = selectors[panel];
  if (!sel) throw new Error(`Unknown panel: ${panel}. Use: pine-editor, strategy-tester, watchlist, alerts`);
  const clicked = await evaluate(`
    (function() {
      var el = document.querySelector('${sel}');
      if (el) { el.click(); return true; }
      return false;
    })()
  `);
  return { success: clicked, panel };
}

// ── Batch ──

export async function batchRun({ symbols, timeframes, action, delay_ms = 2000 }) {
  const tfs = timeframes?.length ? timeframes : [null];
  const results = [];
  for (const symbol of symbols) {
    for (const tf of tfs) {
      try {
        await chartSetSymbol({ symbol });
        if (tf) await chartSetTimeframe({ timeframe: tf });
        await waitForChartReady(symbol);
        await new Promise(r => setTimeout(r, delay_ms));
        let result;
        if (action === 'screenshot') result = await captureScreenshot({ region: 'chart' });
        else if (action === 'quote') result = await quoteGet();
        else if (action === 'ohlcv') result = await dataGetOhlcv({ summary: true });
        else result = { error: `Unknown action: ${action}` };
        results.push({ symbol, timeframe: tf, success: true, result });
      } catch (err) {
        results.push({ symbol, timeframe: tf, success: false, error: err.message });
      }
    }
  }
  return { success: true, total: results.length, successful: results.filter(r => r.success).length, results };
}
