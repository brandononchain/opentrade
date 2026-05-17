/**
 * Quantitative Research Module
 * Institutional-grade analytics for return series, strategy evaluation,
 * regime classification, and portfolio construction.
 *
 * All inputs accept arrays of bar OHLCV or raw returns where noted.
 * Functions are pure, allocation-light, and deterministic.
 */

// ═══════════════════════════════════════════════════════════════════════
// Returns Utilities
// ═══════════════════════════════════════════════════════════════════════

export function logReturns(prices) {
  const r = new Array(prices.length - 1);
  for (let i = 1; i < prices.length; i++) r[i - 1] = Math.log(prices[i] / prices[i - 1]);
  return r;
}

export function pctReturns(prices) {
  const r = new Array(prices.length - 1);
  for (let i = 1; i < prices.length; i++) r[i - 1] = (prices[i] - prices[i - 1]) / prices[i - 1];
  return r;
}

export function cumulativeReturn(returns) {
  let v = 1;
  for (const r of returns) v *= 1 + r;
  return v - 1;
}

export function annualize(value, periodsPerYear = 252, mode = 'return') {
  if (mode === 'vol') return value * Math.sqrt(periodsPerYear);
  return (1 + value) ** periodsPerYear - 1;
}

// ═══════════════════════════════════════════════════════════════════════
// Moments
// ═══════════════════════════════════════════════════════════════════════

export function mean(arr) {
  if (!arr.length) return NaN;
  let s = 0;
  for (const v of arr) s += v;
  return s / arr.length;
}

export function variance(arr, ddof = 1) {
  if (arr.length <= ddof) return NaN;
  const m = mean(arr);
  let s = 0;
  for (const v of arr) s += (v - m) ** 2;
  return s / (arr.length - ddof);
}

export function stdev(arr, ddof = 1) { return Math.sqrt(variance(arr, ddof)); }

export function skewness(arr) {
  const n = arr.length;
  if (n < 3) return NaN;
  const m = mean(arr), s = stdev(arr, 0);
  if (s === 0) return 0;
  let sum = 0;
  for (const v of arr) sum += ((v - m) / s) ** 3;
  return (n / ((n - 1) * (n - 2))) * sum;
}

export function kurtosis(arr, excess = true) {
  const n = arr.length;
  if (n < 4) return NaN;
  const m = mean(arr), s = stdev(arr, 0);
  if (s === 0) return 0;
  let sum = 0;
  for (const v of arr) sum += ((v - m) / s) ** 4;
  const k = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum
          - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return excess ? k : k + 3;
}

// ═══════════════════════════════════════════════════════════════════════
// Risk-Adjusted Performance
// ═══════════════════════════════════════════════════════════════════════

export function sharpeRatio(returns, riskFreePerPeriod = 0, periodsPerYear = 252) {
  const excess = returns.map(r => r - riskFreePerPeriod);
  const m = mean(excess);
  const s = stdev(excess);
  if (s === 0) return 0;
  return (m / s) * Math.sqrt(periodsPerYear);
}

export function sortinoRatio(returns, target = 0, periodsPerYear = 252) {
  const excess = returns.map(r => r - target);
  const m = mean(excess);
  const downside = excess.filter(r => r < 0);
  if (!downside.length) return Infinity;
  let sumSq = 0;
  for (const r of downside) sumSq += r * r;
  const dd = Math.sqrt(sumSq / returns.length);
  return dd === 0 ? 0 : (m / dd) * Math.sqrt(periodsPerYear);
}

export function calmarRatio(returns, periodsPerYear = 252) {
  const annRet = annualize(mean(returns), periodsPerYear, 'return');
  const dd = maxDrawdown(equityCurveFromReturns(returns));
  return dd.maxDrawdown === 0 ? Infinity : annRet / Math.abs(dd.maxDrawdown);
}

export function omegaRatio(returns, threshold = 0) {
  let gain = 0, loss = 0;
  for (const r of returns) {
    const x = r - threshold;
    if (x > 0) gain += x; else loss += -x;
  }
  return loss === 0 ? Infinity : gain / loss;
}

export function informationRatio(returns, benchmark, periodsPerYear = 252) {
  const active = returns.map((r, i) => r - benchmark[i]);
  const m = mean(active);
  const te = stdev(active);
  return te === 0 ? 0 : (m / te) * Math.sqrt(periodsPerYear);
}

// ═══════════════════════════════════════════════════════════════════════
// Drawdown
// ═══════════════════════════════════════════════════════════════════════

export function equityCurveFromReturns(returns, start = 1) {
  const eq = new Array(returns.length + 1);
  eq[0] = start;
  for (let i = 0; i < returns.length; i++) eq[i + 1] = eq[i] * (1 + returns[i]);
  return eq;
}

export function maxDrawdown(equity) {
  let peak = equity[0];
  let maxDD = 0;
  let peakIdx = 0, troughIdx = 0, ddStart = 0;
  let recoveryIdx = -1;
  let currentDDStart = 0;
  for (let i = 0; i < equity.length; i++) {
    if (equity[i] > peak) {
      peak = equity[i];
      currentDDStart = i;
    }
    const dd = (equity[i] - peak) / peak;
    if (dd < maxDD) {
      maxDD = dd;
      troughIdx = i;
      peakIdx = currentDDStart;
    }
  }
  for (let i = troughIdx; i < equity.length; i++) {
    if (equity[i] >= equity[peakIdx]) { recoveryIdx = i; break; }
  }
  return {
    maxDrawdown: maxDD,
    maxDrawdownPct: maxDD * 100,
    peakIndex: peakIdx,
    troughIndex: troughIdx,
    recoveryIndex: recoveryIdx,
    durationBars: (recoveryIdx >= 0 ? recoveryIdx : equity.length - 1) - peakIdx,
    underwaterBars: troughIdx - peakIdx,
  };
}

export function underwaterCurve(equity) {
  const r = new Array(equity.length);
  let peak = equity[0];
  for (let i = 0; i < equity.length; i++) {
    if (equity[i] > peak) peak = equity[i];
    r[i] = (equity[i] - peak) / peak;
  }
  return r;
}

// ═══════════════════════════════════════════════════════════════════════
// Value-at-Risk / CVaR
// ═══════════════════════════════════════════════════════════════════════

export function historicalVaR(returns, confidence = 0.95) {
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  return sorted[Math.max(0, idx)];
}

export function historicalCVaR(returns, confidence = 0.95) {
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.floor((1 - confidence) * sorted.length);
  const tail = sorted.slice(0, Math.max(1, cutoff));
  return mean(tail);
}

export function parametricVaR(returns, confidence = 0.95) {
  const m = mean(returns), s = stdev(returns);
  const z = _normInv(1 - confidence);
  return m + z * s;
}

// ═══════════════════════════════════════════════════════════════════════
// Time-Series Statistics
// ═══════════════════════════════════════════════════════════════════════

export function autocorrelation(series, lag = 1) {
  if (series.length <= lag) return NaN;
  const m = mean(series);
  let num = 0, den = 0;
  for (let i = 0; i < series.length; i++) den += (series[i] - m) ** 2;
  for (let i = lag; i < series.length; i++) num += (series[i] - m) * (series[i - lag] - m);
  return den === 0 ? 0 : num / den;
}

/**
 * Hurst exponent via rescaled range (R/S) analysis.
 * H < 0.5: mean-reverting | H ≈ 0.5: random walk | H > 0.5: trending.
 */
export function hurstExponent(series, minLag = 10, maxLag = 100) {
  const n = series.length;
  const lags = [];
  const rs = [];
  const cap = Math.min(maxLag, Math.floor(n / 2));
  for (let lag = minLag; lag <= cap; lag += Math.max(1, Math.floor((cap - minLag) / 20))) {
    const chunks = Math.floor(n / lag);
    if (chunks < 1) continue;
    let avgRS = 0, count = 0;
    for (let c = 0; c < chunks; c++) {
      const seg = series.slice(c * lag, (c + 1) * lag);
      const mu = mean(seg);
      const dev = seg.map(v => v - mu);
      const cumDev = [];
      let s = 0;
      for (const d of dev) { s += d; cumDev.push(s); }
      const R = Math.max(...cumDev) - Math.min(...cumDev);
      const S = stdev(seg, 0);
      if (S > 0) { avgRS += R / S; count++; }
    }
    if (count > 0) { lags.push(Math.log(lag)); rs.push(Math.log(avgRS / count)); }
  }
  if (lags.length < 2) return NaN;
  return _linregSlope(lags, rs);
}

/**
 * Half-life of mean reversion via Ornstein-Uhlenbeck regression.
 * Returns expected number of bars to revert halfway to the mean.
 */
export function halfLife(series) {
  const lagged = series.slice(0, -1);
  const delta = [];
  for (let i = 1; i < series.length; i++) delta.push(series[i] - series[i - 1]);
  const slope = _linregSlope(lagged, delta);
  if (slope >= 0) return Infinity;
  return -Math.log(2) / slope;
}

export function rollingBeta(assetReturns, benchmarkReturns, window = 60) {
  const r = new Array(assetReturns.length).fill(NaN);
  for (let i = window - 1; i < assetReturns.length; i++) {
    const a = assetReturns.slice(i - window + 1, i + 1);
    const b = benchmarkReturns.slice(i - window + 1, i + 1);
    const vb = variance(b);
    if (vb === 0) continue;
    const ma = mean(a), mb = mean(b);
    let cov = 0;
    for (let j = 0; j < a.length; j++) cov += (a[j] - ma) * (b[j] - mb);
    cov /= (a.length - 1);
    r[i] = cov / vb;
  }
  return r;
}

export function rollingCorrelation(a, b, window = 60) {
  const r = new Array(a.length).fill(NaN);
  for (let i = window - 1; i < a.length; i++) {
    const x = a.slice(i - window + 1, i + 1);
    const y = b.slice(i - window + 1, i + 1);
    const mx = mean(x), my = mean(y);
    let num = 0, dx = 0, dy = 0;
    for (let j = 0; j < x.length; j++) {
      num += (x[j] - mx) * (y[j] - my);
      dx += (x[j] - mx) ** 2;
      dy += (y[j] - my) ** 2;
    }
    const den = Math.sqrt(dx * dy);
    r[i] = den === 0 ? 0 : num / den;
  }
  return r;
}

// ═══════════════════════════════════════════════════════════════════════
// Volatility Models
// ═══════════════════════════════════════════════════════════════════════

export function ewmaVolatility(returns, lambda = 0.94) {
  const r = new Array(returns.length).fill(NaN);
  if (!returns.length) return r;
  let v = returns[0] * returns[0];
  r[0] = Math.sqrt(v);
  for (let i = 1; i < returns.length; i++) {
    v = lambda * v + (1 - lambda) * returns[i] * returns[i];
    r[i] = Math.sqrt(v);
  }
  return r;
}

export function realizedVolatility(returns, periodsPerYear = 252) {
  return stdev(returns) * Math.sqrt(periodsPerYear);
}

export function garmanKlass(high, low, open, close) {
  const n = close.length;
  const r = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const ln_hl = Math.log(high[i] / low[i]);
    const ln_co = Math.log(close[i] / open[i]);
    r[i] = Math.sqrt(0.5 * ln_hl * ln_hl - (2 * Math.log(2) - 1) * ln_co * ln_co);
  }
  return r;
}

// ═══════════════════════════════════════════════════════════════════════
// Position Sizing
// ═══════════════════════════════════════════════════════════════════════

export function kellyFraction(winRate, payoffRatio, fraction = 0.5) {
  const k = winRate - (1 - winRate) / payoffRatio;
  return Math.max(0, k * fraction);
}

export function volTargetSize(currentVolAnnualized, targetVolAnnualized = 0.15, maxLeverage = 3) {
  if (currentVolAnnualized <= 0) return 0;
  return Math.min(maxLeverage, targetVolAnnualized / currentVolAnnualized);
}

export function fixedFractional(capital, riskPct, stopDistance) {
  if (stopDistance <= 0) return 0;
  return Math.floor((capital * riskPct) / stopDistance);
}

// ═══════════════════════════════════════════════════════════════════════
// Portfolio Construction
// ═══════════════════════════════════════════════════════════════════════

/**
 * Risk-parity / inverse-volatility weights.
 * Allocates inversely proportional to each asset's volatility.
 */
export function riskParityWeights(returnsByAsset) {
  const vols = returnsByAsset.map(r => stdev(r));
  const inv = vols.map(v => v > 0 ? 1 / v : 0);
  const sum = inv.reduce((a, b) => a + b, 0);
  return sum === 0 ? inv.map(() => 0) : inv.map(v => v / sum);
}

export function equalWeights(n) {
  return new Array(n).fill(1 / n);
}

/**
 * Min-variance long-only weights via simple gradient projection.
 * Good enough for 2-10 asset baskets; not a substitute for QP solver.
 */
export function minVarianceWeights(returnsByAsset, iters = 500, lr = 0.05) {
  const n = returnsByAsset.length;
  const cov = covarianceMatrix(returnsByAsset);
  let w = equalWeights(n);
  for (let it = 0; it < iters; it++) {
    const grad = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) grad[i] += 2 * cov[i][j] * w[j];
    for (let i = 0; i < n; i++) w[i] -= lr * grad[i];
    // Project to simplex (long-only, sum=1)
    w = w.map(v => Math.max(0, v));
    const s = w.reduce((a, b) => a + b, 0);
    if (s > 0) w = w.map(v => v / s);
  }
  return w;
}

export function covarianceMatrix(returnsByAsset) {
  const n = returnsByAsset.length;
  const cov = Array.from({ length: n }, () => new Array(n).fill(0));
  const means = returnsByAsset.map(r => mean(r));
  const len = Math.min(...returnsByAsset.map(r => r.length));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let s = 0;
      for (let t = 0; t < len; t++) s += (returnsByAsset[i][t] - means[i]) * (returnsByAsset[j][t] - means[j]);
      cov[i][j] = cov[j][i] = s / (len - 1);
    }
  }
  return cov;
}

export function portfolioReturn(weights, returnsByAsset) {
  const len = Math.min(...returnsByAsset.map(r => r.length));
  const r = new Array(len).fill(0);
  for (let t = 0; t < len; t++) for (let i = 0; i < weights.length; i++) r[t] += weights[i] * returnsByAsset[i][t];
  return r;
}

// ═══════════════════════════════════════════════════════════════════════
// Monte Carlo
// ═══════════════════════════════════════════════════════════════════════

/**
 * Bootstrap returns to simulate equity curve distributions.
 * Returns percentiles of terminal equity and worst drawdown.
 */
export function monteCarloBootstrap(returns, { trials = 1000, horizon = null, seed = null } = {}) {
  const len = horizon || returns.length;
  const rng = seed !== null ? _seededRng(seed) : Math.random;
  const terminals = new Array(trials);
  const maxDDs = new Array(trials);
  for (let t = 0; t < trials; t++) {
    let eq = 1, peak = 1, dd = 0;
    for (let i = 0; i < len; i++) {
      const r = returns[Math.floor(rng() * returns.length)];
      eq *= 1 + r;
      if (eq > peak) peak = eq;
      const cur = (eq - peak) / peak;
      if (cur < dd) dd = cur;
    }
    terminals[t] = eq - 1;
    maxDDs[t] = dd;
  }
  terminals.sort((a, b) => a - b);
  maxDDs.sort((a, b) => a - b);
  const pct = (arr, p) => arr[Math.floor(p * arr.length)];
  return {
    terminalReturn: { p05: pct(terminals, 0.05), p50: pct(terminals, 0.5), p95: pct(terminals, 0.95), mean: mean(terminals) },
    maxDrawdown:    { p05: pct(maxDDs, 0.05),    p50: pct(maxDDs, 0.5),    p95: pct(maxDDs, 0.95),    mean: mean(maxDDs)    },
    trials,
    horizon: len,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Regime Classification
// ═══════════════════════════════════════════════════════════════════════

export function classifyRegime(prices, { volWindow = 20, trendWindow = 50 } = {}) {
  const returns = pctReturns(prices);
  const vol = stdev(returns.slice(-volWindow));
  const longVol = stdev(returns);
  const sma = mean(prices.slice(-trendWindow));
  const last = prices[prices.length - 1];
  const trend = (last - sma) / sma;
  const volRatio = longVol > 0 ? vol / longVol : 1;

  let regime;
  if (volRatio > 1.5 && trend > 0) regime = 'trending_volatile';
  else if (volRatio > 1.5 && trend < 0) regime = 'crash_risk';
  else if (volRatio < 0.7) regime = 'compressed_breakout_setup';
  else if (trend > 0.05) regime = 'orderly_uptrend';
  else if (trend < -0.05) regime = 'orderly_downtrend';
  else regime = 'chop_mean_reversion';

  return { regime, volRatio, trend, currentVol: vol, longVol };
}

// ═══════════════════════════════════════════════════════════════════════
// Strategy Evaluation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Full performance tearsheet from a returns series.
 * Use after running a backtest to get publication-grade metrics.
 */
export function performanceReport(returns, { periodsPerYear = 252, benchmark = null } = {}) {
  const equity = equityCurveFromReturns(returns);
  const dd = maxDrawdown(equity);
  const annRet = annualize(mean(returns), periodsPerYear, 'return');
  const annVol = realizedVolatility(returns, periodsPerYear);
  const sharpe = sharpeRatio(returns, 0, periodsPerYear);
  const sortino = sortinoRatio(returns, 0, periodsPerYear);
  const calmar = calmarRatio(returns, periodsPerYear);
  const var95 = historicalVaR(returns, 0.95);
  const cvar95 = historicalCVaR(returns, 0.95);
  const skew = skewness(returns);
  const kurt = kurtosis(returns);
  const wins = returns.filter(r => r > 0).length;

  const out = {
    totalReturn: cumulativeReturn(returns),
    annualizedReturn: annRet,
    annualizedVolatility: annVol,
    sharpeRatio: sharpe,
    sortinoRatio: sortino,
    calmarRatio: calmar,
    omegaRatio: omegaRatio(returns),
    maxDrawdown: dd.maxDrawdown,
    maxDrawdownDuration: dd.durationBars,
    var95,
    cvar95,
    skewness: skew,
    kurtosis: kurt,
    winRate: returns.length ? wins / returns.length : 0,
    bars: returns.length,
    grade: _gradePerformance(sharpe, Math.abs(dd.maxDrawdown), returns.length),
  };

  if (benchmark && benchmark.length >= returns.length) {
    const bench = benchmark.slice(0, returns.length);
    out.informationRatio = informationRatio(returns, bench, periodsPerYear);
    out.beta = _beta(returns, bench);
    out.alpha = annualize(mean(returns) - out.beta * mean(bench), periodsPerYear, 'return');
  }
  return out;
}

function _beta(asset, bench) {
  const v = variance(bench);
  if (v === 0) return 0;
  const ma = mean(asset), mb = mean(bench);
  let cov = 0;
  for (let i = 0; i < asset.length; i++) cov += (asset[i] - ma) * (bench[i] - mb);
  return cov / (asset.length - 1) / v;
}

function _gradePerformance(sharpe, dd, n) {
  if (sharpe >= 2.0 && dd < 0.15 && n >= 252) return 'A+';
  if (sharpe >= 1.5 && dd < 0.20 && n >= 126) return 'A';
  if (sharpe >= 1.0 && dd < 0.25 && n >= 60)  return 'B';
  if (sharpe >= 0.5 && dd < 0.35) return 'C';
  return 'D';
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function _linregSlope(x, y) {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (x[i] - mx) * (y[i] - my); den += (x[i] - mx) ** 2; }
  return den === 0 ? 0 : num / den;
}

// Beasley-Springer-Moro approximation for standard normal inverse CDF
function _normInv(p) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-7.78489400243029e-3, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [7.78469570904146e-3, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  if (p <= pHigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}

function _seededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
