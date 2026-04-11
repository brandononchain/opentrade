// Quick verification of all new modules
import { lintPineScript, detectsRepainting, auditStrategy, listRules } from '../src/pine/linter.js';
import { buildStrategy, buildPreset, listModules } from '../src/pine/strategy-builder.js';
import { generateChartHTML, generatePluginPine, listPlugins } from '../src/charts/plugins.js';
import { taCore, BacktestEngine } from '../src/pine/oakscript.js';
import { getTemplate, listTemplates, searchTemplates } from '../src/pine/templates.js';

console.log('=== Linter ===');
const code = `//@version=6
indicator("Test", overlay=true)
plot(close)
`;
const lint = lintPineScript(code);
console.log(`  Grade: ${lint.grade}, Score: ${lint.score}, Issues: ${lint.diagnostics.length}`);
console.log(`  Rules: ${listRules().length}`);
console.log(`  Repainting check: ${detectsRepainting('close > ta.ema(close, 20)')}`);

console.log('\n=== Strategy Builder ===');
const strat = buildPreset('trend_following');
console.log(`  Preset lines: ${strat.split('\n').length}`);
const mods = listModules('all');
console.log(`  Entry modules: ${mods.entries.length}`);
console.log(`  Filter modules: ${mods.filters.length}`);
console.log(`  Exit modules: ${mods.exits.length}`);

console.log('\n=== Charts ===');
const plugins = listPlugins();
console.log(`  Series: ${plugins.series.length}, Primitives: ${plugins.primitives.length}`);
const html = generateChartHTML({ series: ['rounded_candles'] });
console.log(`  HTML length: ${html.length} chars`);
const pine = generatePluginPine('volume_profile');
console.log(`  Pine plugin lines: ${pine.split('\n').length}`);

console.log('\n=== OakScript ===');
const closes = Array.from({length: 100}, (_, i) => 100 + Math.sin(i / 5) * 10);
const rsi = taCore.rsi(closes, 14);
console.log(`  RSI(14) last: ${rsi[rsi.length - 1].toFixed(2)}`);
const ema = taCore.ema(closes, 20);
console.log(`  EMA(20) last: ${ema[ema.length - 1].toFixed(2)}`);

const bars = closes.map((c, i) => ({
  time: Date.now() + i * 60000,
  open: c - 1, high: c + 2, low: c - 2, close: c, volume: 1000
}));
const signals = [{bar: 10, side: 'long'}, {bar: 30, side: 'short'}, {bar: 50, side: 'long'}, {bar: 70, side: 'short'}];
const bt = new BacktestEngine({ capital: 100000, riskPct: 0.02 });
const result = bt.run(bars, signals);
console.log(`  Backtest: ${result.trades.length} trades, Grade: ${result.grade}`);
console.log(`  Result keys: ${Object.keys(result).join(', ')}`);

console.log('\n=== Templates ===');
const templates = listTemplates();
console.log(`  Total: ${templates.length}`);
const ict = getTemplate('ict_killzones');
console.log(`  ICT Killzones: ${ict ? ict.split('\n').length + ' lines' : 'MISSING'}`);
const bs = getTemplate('black_scholes');
console.log(`  Black-Scholes: ${bs ? bs.split('\n').length + ' lines' : 'MISSING'}`);
const search = searchTemplates('strategy');
console.log(`  Search "strategy": ${search.length} matches`);

console.log('\n✅ All modules verified!');
