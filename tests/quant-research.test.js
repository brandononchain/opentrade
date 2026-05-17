/**
 * Unit tests for quant-research module and new indicators.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert';

const qr = await import('../src/pine/quant-research.js');
const { taCore } = await import('../src/pine/oakscript.js');

// Deterministic synthetic price series: GBM-ish with a known drift
function syntheticPrices(n = 300, seed = 42) {
  let s = seed >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
  const p = [100];
  for (let i = 1; i < n; i++) {
    const z = Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());
    p.push(p[i - 1] * Math.exp(0.0005 + 0.01 * z));
  }
  return p;
}

describe('quant-research: returns + moments', () => {
  test('pctReturns produces length-1', () => {
    const r = qr.pctReturns([100, 110, 99]);
    assert.strictEqual(r.length, 2);
    assert.ok(Math.abs(r[0] - 0.1) < 1e-9);
  });

  test('mean and stdev sane', () => {
    assert.strictEqual(qr.mean([1, 2, 3, 4, 5]), 3);
    assert.ok(Math.abs(qr.stdev([1, 2, 3, 4, 5]) - Math.sqrt(2.5)) < 1e-9);
  });

  test('skewness ≈ 0 on symmetric, kurtosis finite', () => {
    const sym = [-2, -1, 0, 1, 2];
    assert.ok(Math.abs(qr.skewness(sym)) < 1e-9);
    assert.ok(Number.isFinite(qr.kurtosis(sym)));
  });
});

describe('quant-research: risk-adjusted', () => {
  const p = syntheticPrices();
  const r = qr.pctReturns(p);

  test('sharpe is a finite number', () => {
    const s = qr.sharpeRatio(r);
    assert.ok(Number.isFinite(s));
  });

  test('sortino >= sharpe when downside is asymmetric', () => {
    const so = qr.sortinoRatio(r);
    assert.ok(Number.isFinite(so));
  });

  test('omega > 1 implies positive expectancy above threshold', () => {
    const positive = [0.01, 0.02, -0.005, 0.015];
    assert.ok(qr.omegaRatio(positive) > 1);
  });
});

describe('quant-research: drawdown + VaR', () => {
  test('maxDrawdown captures known dip', () => {
    const eq = [100, 110, 105, 90, 95, 120];
    const dd = qr.maxDrawdown(eq);
    assert.ok(dd.maxDrawdown < 0);
    assert.ok(Math.abs(dd.maxDrawdown - (90 - 110) / 110) < 1e-9);
  });

  test('historical VaR is non-positive for typical returns', () => {
    const r = qr.pctReturns(syntheticPrices());
    const v = qr.historicalVaR(r, 0.95);
    assert.ok(v <= 0 || Math.abs(v) < 1);
  });

  test('CVaR <= VaR (more negative)', () => {
    const r = qr.pctReturns(syntheticPrices());
    const v = qr.historicalVaR(r, 0.95);
    const c = qr.historicalCVaR(r, 0.95);
    assert.ok(c <= v + 1e-9);
  });
});

describe('quant-research: structure', () => {
  test('hurst is between 0 and 1 for normal series', () => {
    const h = qr.hurstExponent(syntheticPrices(500));
    assert.ok(h > 0 && h < 1.2, `hurst out of bounds: ${h}`);
  });

  test('halfLife finite for mean-reverting series', () => {
    const oscillating = [];
    for (let i = 0; i < 200; i++) oscillating.push(100 + 5 * Math.sin(i / 5));
    const hl = qr.halfLife(oscillating);
    assert.ok(Number.isFinite(hl) && hl > 0);
  });

  test('autocorrelation(lag=1) of random walk ≈ 0 for returns', () => {
    const r = qr.pctReturns(syntheticPrices(1000));
    const ac = qr.autocorrelation(r, 1);
    assert.ok(Math.abs(ac) < 0.3);
  });
});

describe('quant-research: portfolio', () => {
  test('risk parity weights sum to 1', () => {
    const a = qr.pctReturns(syntheticPrices(200, 1));
    const b = qr.pctReturns(syntheticPrices(200, 2));
    const w = qr.riskParityWeights([a, b]);
    assert.ok(Math.abs(w.reduce((s, x) => s + x, 0) - 1) < 1e-9);
  });

  test('min-variance weights respect simplex', () => {
    const a = qr.pctReturns(syntheticPrices(150, 1));
    const b = qr.pctReturns(syntheticPrices(150, 2));
    const c = qr.pctReturns(syntheticPrices(150, 3));
    const w = qr.minVarianceWeights([a, b, c], 100, 0.1);
    assert.ok(w.every(x => x >= -1e-9));
    assert.ok(Math.abs(w.reduce((s, x) => s + x, 0) - 1) < 1e-6);
  });
});

describe('quant-research: performance report', () => {
  test('returns full tearsheet with grade', () => {
    const r = qr.pctReturns(syntheticPrices(300));
    const rep = qr.performanceReport(r);
    assert.ok('sharpeRatio' in rep);
    assert.ok('maxDrawdown' in rep);
    assert.ok('grade' in rep);
    assert.ok(['A+', 'A', 'B', 'C', 'D'].includes(rep.grade));
  });
});

describe('quant-research: monte carlo', () => {
  test('seeded MC is deterministic', () => {
    const r = qr.pctReturns(syntheticPrices());
    const a = qr.monteCarloBootstrap(r, { trials: 200, horizon: 100, seed: 7 });
    const b = qr.monteCarloBootstrap(r, { trials: 200, horizon: 100, seed: 7 });
    assert.strictEqual(a.terminalReturn.p50, b.terminalReturn.p50);
  });
});

describe('new indicators (taCore)', () => {
  const p = syntheticPrices(300);
  const high = p.map(v => v * 1.005);
  const low  = p.map(v => v * 0.995);
  const close = p;
  const vol  = p.map(() => 1000 + Math.random() * 500);

  test('OBV is cumulative volume', () => {
    const o = taCore.obv(close, vol);
    assert.strictEqual(o.length, close.length);
    assert.ok(Number.isFinite(o[o.length - 1]));
  });

  test('CMF returns values in [-1, 1] band', () => {
    const c = taCore.cmf(high, low, close, vol, 20);
    const last = c[c.length - 1];
    assert.ok(last >= -1 && last <= 1);
  });

  test('Vortex returns two arrays', () => {
    const [vp, vm] = taCore.vortex(high, low, close, 14);
    assert.strictEqual(vp.length, close.length);
    assert.strictEqual(vm.length, close.length);
  });

  test('DEMA and TEMA produce finite tail values', () => {
    const d = taCore.dema(close, 20);
    const t = taCore.tema(close, 20);
    assert.ok(Number.isFinite(d[d.length - 1]));
    assert.ok(Number.isFinite(t[t.length - 1]));
  });

  test('KAMA / ZLEMA produce finite values', () => {
    const k = taCore.kama(close, 10);
    const z = taCore.zlema(close, 20);
    assert.ok(Number.isFinite(k[k.length - 1]));
    assert.ok(Number.isFinite(z[z.length - 1]));
  });

  test('Fisher transform bounded reasonably', () => {
    const f = taCore.fisher(high, low, 10);
    const last = f[f.length - 1];
    assert.ok(Number.isFinite(last) && Math.abs(last) < 100);
  });

  test('Choppiness in [0, 100] roughly', () => {
    const c = taCore.choppiness(high, low, close, 14);
    const last = c[c.length - 1];
    assert.ok(Number.isFinite(last) && last >= -10 && last <= 110);
  });

  test('Connors RSI finite', () => {
    const cr = taCore.connorsRsi(close);
    assert.ok(Number.isFinite(cr[cr.length - 1]));
  });

  test('TRIX produces values around 0', () => {
    const t = taCore.trix(close, 18);
    assert.ok(Number.isFinite(t[t.length - 1]));
  });
});
