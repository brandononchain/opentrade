/**
 * Seamless TradingView Quant Report
 * Pulls live OHLCV from the active TradingView chart, runs the full
 * institutional quant battery, and returns a single tearsheet.
 *
 * Designed for agent use: one call replaces 10+ tool steps.
 */
import { dataGetOhlcv, quoteGet, chartGetState } from './tools.js';
import {
  logReturns, pctReturns, performanceReport, classifyRegime,
  hurstExponent, halfLife, autocorrelation, ewmaVolatility,
  historicalVaR, historicalCVaR, monteCarloBootstrap,
} from '../pine/quant-research.js';
import { taCore, detectVolRegime, zScoreAnalysis } from '../pine/oakscript.js';

/**
 * One-shot quant analysis of the current chart symbol.
 *
 * @param {object} opts
 * @param {number} opts.bars     Bars to pull (default 500, max ~5000)
 * @param {number} opts.mcTrials Monte Carlo trials (default 1000, 0 to disable)
 * @param {boolean} opts.indicators Include classic indicator readings (default true)
 * @returns {Promise<object>} Full tearsheet
 */
export async function quantReport({ bars = 500, mcTrials = 1000, indicators = true } = {}) {
  const state = await chartGetState();
  const quote = await quoteGet();
  const ohlcv = await dataGetOhlcv({ count: bars });

  const candles = _extractCandles(ohlcv);
  if (candles.length < 30) {
    return { error: 'Insufficient bars', barsFetched: candles.length, symbol: state?.symbol };
  }

  const close = candles.map(c => c.close);
  const high  = candles.map(c => c.high);
  const low   = candles.map(c => c.low);
  const open  = candles.map(c => c.open);
  const vol   = candles.map(c => c.volume || 0);

  const returns = pctReturns(close);
  const log_r = logReturns(close);

  const perf = performanceReport(returns, { periodsPerYear: _periodsPerYear(state?.resolution) });
  const regime = classifyRegime(close);
  const volRegime = detectVolRegime(close, _periodsPerYear(state?.resolution));
  const zscore = zScoreAnalysis(close, 20);

  const report = {
    symbol: state?.symbol,
    timeframe: state?.resolution,
    lastPrice: quote?.last || close[close.length - 1],
    bars: candles.length,

    performance: perf,

    regime: {
      current: regime.regime,
      trendPct: regime.trend * 100,
      volRatio: regime.volRatio,
      currentVolAnnualized: regime.currentVol * Math.sqrt(_periodsPerYear(state?.resolution)),
      longVolAnnualized: regime.longVol * Math.sqrt(_periodsPerYear(state?.resolution)),
      ewmaVolNow: _last(ewmaVolatility(returns, 0.94)),
      volRegimeNow: volRegime.regimes[volRegime.regimes.length - 1],
    },

    structure: {
      hurst: hurstExponent(close),
      halfLifeBars: halfLife(close),
      autocorr1: autocorrelation(returns, 1),
      autocorr5: autocorrelation(returns, 5),
      zscore: zscore.lastZ,
      zscoreInterpretation: zscore.interpretation,
    },

    risk: {
      var95Daily: historicalVaR(returns, 0.95),
      cvar95Daily: historicalCVaR(returns, 0.95),
      var99Daily: historicalVaR(returns, 0.99),
      cvar99Daily: historicalCVaR(returns, 0.99),
    },
  };

  if (indicators) {
    report.indicators = {
      rsi14: _last(taCore.rsi(close, 14)),
      atr14: _last(taCore.atr(high, low, close, 14)),
      atr14Pct: (_last(taCore.atr(high, low, close, 14)) / _last(close)) * 100,
      ema20:  _last(taCore.ema(close, 20)),
      ema50:  _last(taCore.ema(close, 50)),
      ema200: _last(taCore.ema(close, 200)),
      cci20:  _last(taCore.cci(close, 20)),
      adx14:  taCore.adx ? _last(taCore.adx(high, low, close, 14)) : null,
      obvLast: _last(taCore.obv(close, vol)),
      cmf20: _last(taCore.cmf(high, low, close, vol, 20)),
      choppiness14: _last(taCore.choppiness(high, low, close, 14)),
    };
    const e20 = report.indicators.ema20, e50 = report.indicators.ema50, e200 = report.indicators.ema200;
    const last = _last(close);
    report.indicators.trendStack =
      last > e20 && e20 > e50 && e50 > e200 ? 'strong_uptrend' :
      last < e20 && e20 < e50 && e50 < e200 ? 'strong_downtrend' : 'mixed';
  }

  if (mcTrials > 0 && returns.length >= 30) {
    report.monteCarlo = monteCarloBootstrap(returns, { trials: mcTrials, horizon: Math.min(returns.length, 252) });
  }

  report.verdict = _verdict(report);
  return report;
}

/**
 * Compare quant metrics across a list of symbols.
 * For use with watchlist scanning.
 */
export async function quantScan(symbols, { bars = 250 } = {}) {
  const { chartSetSymbol } = await import('./tools.js');
  const results = [];
  for (const symbol of symbols) {
    try {
      await chartSetSymbol({ symbol });
      await new Promise(r => setTimeout(r, 1500));
      const r = await quantReport({ bars, mcTrials: 0, indicators: false });
      results.push({
        symbol,
        sharpe: r.performance?.sharpeRatio,
        sortino: r.performance?.sortinoRatio,
        maxDD: r.performance?.maxDrawdown,
        annReturn: r.performance?.annualizedReturn,
        annVol: r.performance?.annualizedVolatility,
        regime: r.regime?.current,
        hurst: r.structure?.hurst,
        zscore: r.structure?.zscore,
        grade: r.performance?.grade,
      });
    } catch (e) {
      results.push({ symbol, error: e.message });
    }
  }
  results.sort((a, b) => (b.sharpe || -99) - (a.sharpe || -99));
  return { ranked: results, scannedAt: new Date().toISOString() };
}

function _extractCandles(ohlcv) {
  if (Array.isArray(ohlcv)) return ohlcv;
  if (ohlcv?.bars) return ohlcv.bars;
  if (ohlcv?.candles) return ohlcv.candles;
  if (ohlcv?.data) return ohlcv.data;
  return [];
}

function _last(arr) {
  for (let i = arr.length - 1; i >= 0; i--) if (!isNaN(arr[i])) return arr[i];
  return NaN;
}

function _periodsPerYear(resolution) {
  if (!resolution) return 252;
  const r = String(resolution).toUpperCase();
  if (r === 'D' || r === '1D') return 252;
  if (r === 'W' || r === '1W') return 52;
  if (r === 'M' || r === '1M') return 12;
  const n = parseInt(r, 10);
  if (!isNaN(n)) return Math.round((252 * 6.5 * 60) / n); // intraday minutes
  return 252;
}

function _verdict(report) {
  const { performance: p, regime: rg, structure: s } = report;
  const lines = [];
  if (p.sharpeRatio > 1.5) lines.push(`Strong risk-adjusted edge (Sharpe ${p.sharpeRatio.toFixed(2)})`);
  else if (p.sharpeRatio < 0) lines.push(`Negative Sharpe (${p.sharpeRatio.toFixed(2)}) — buy-and-hold unfavorable`);
  if (s.hurst > 0.55) lines.push(`Trending behavior (Hurst ${s.hurst.toFixed(2)}) — momentum strategies favored`);
  else if (s.hurst < 0.45) lines.push(`Mean-reverting (Hurst ${s.hurst.toFixed(2)}) — fade extremes, half-life ${s.halfLifeBars.toFixed(0)} bars`);
  if (Math.abs(s.zscore) > 2) lines.push(`Statistical extreme: ${s.zscoreInterpretation}`);
  lines.push(`Regime: ${rg.current}`);
  return lines.join(' | ');
}
