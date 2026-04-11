/**
 * OakScript Local TA Engine
 * JavaScript implementation of PineScript v6 technical analysis functions.
 * Inspired by OakScriptJS — provides offline indicator calculations,
 * pre-compilation validation, and backtest simulation.
 *
 * Architecture:
 *   1. Core functions (array-based): ta.sma(prices, 14) → number[]
 *   2. Series class: lazy evaluation with operator chaining
 *   3. BarData: versioned wrapper for streaming/cache invalidation
 */

// ═══════════════════════════════════════════════════════════════════════
// SERIES CLASS — PineScript-like lazy evaluation with operator chaining
// ═══════════════════════════════════════════════════════════════════════

export class Series {
  #data;
  #extractor;
  #cache;
  #cacheVersion;

  constructor(data, extractor) {
    if (data instanceof Series) {
      this.#data = data.#data;
      this.#extractor = extractor || data.#extractor;
    } else {
      this.#data = data;
      this.#extractor = extractor || ((bar, i) => (typeof bar === 'number' ? bar : bar));
    }
    this.#cache = null;
    this.#cacheVersion = -1;
  }

  get length() {
    const d = this.#data instanceof BarData ? this.#data.bars : this.#data;
    return d.length;
  }

  get bars() {
    return this.#data instanceof BarData ? this.#data.bars : this.#data;
  }

  get(index) {
    const arr = this.toArray();
    return index >= 0 && index < arr.length ? arr[index] : NaN;
  }

  last() { return this.get(this.length - 1); }

  toArray() {
    const version = this.#data instanceof BarData ? this.#data.version : 0;
    if (this.#cache && this.#cacheVersion === version) return this.#cache;

    const bars = this.#data instanceof BarData ? this.#data.bars : this.#data;
    const result = new Array(bars.length);
    for (let i = 0; i < bars.length; i++) {
      result[i] = this.#extractor(bars[i], i, bars);
    }
    this.#cache = result;
    this.#cacheVersion = version;
    return result;
  }

  // Arithmetic operators
  add(other) { return this._binOp(other, (a, b) => a + b); }
  sub(other) { return this._binOp(other, (a, b) => a - b); }
  mul(other) { return this._binOp(other, (a, b) => a * b); }
  div(other) { return this._binOp(other, (a, b) => b !== 0 ? a / b : NaN); }
  mod(other) { return this._binOp(other, (a, b) => b !== 0 ? a % b : NaN); }
  neg() { return new Series(this.#data, (bar, i, bars) => -this.toArray()[i]); }

  // Comparison operators (return 1/0)
  gt(other)  { return this._binOp(other, (a, b) => a > b ? 1 : 0); }
  lt(other)  { return this._binOp(other, (a, b) => a < b ? 1 : 0); }
  gte(other) { return this._binOp(other, (a, b) => a >= b ? 1 : 0); }
  lte(other) { return this._binOp(other, (a, b) => a <= b ? 1 : 0); }
  eq(other)  { return this._binOp(other, (a, b) => a === b ? 1 : 0); }
  neq(other) { return this._binOp(other, (a, b) => a !== b ? 1 : 0); }

  // Logical
  and(other) { return this._binOp(other, (a, b) => (a && b) ? 1 : 0); }
  or(other)  { return this._binOp(other, (a, b) => (a || b) ? 1 : 0); }
  not() { return new Series(this.#data, (bar, i) => this.toArray()[i] ? 0 : 1); }

  // History offset: like close[1] in PineScript
  offset(n) {
    const src = this;
    return new Series(this.#data, (bar, i) => {
      const arr = src.toArray();
      return i - n >= 0 ? arr[i - n] : NaN;
    });
  }

  // Break closure chains for memory efficiency
  materialize() {
    const values = this.toArray().slice();
    return new Series(values, (val) => val);
  }

  _binOp(other, fn) {
    const self = this;
    if (other instanceof Series) {
      return new Series(this.#data, (bar, i) => {
        return fn(self.toArray()[i], other.toArray()[i]);
      });
    }
    return new Series(this.#data, (bar, i) => fn(self.toArray()[i], other));
  }

  static fromBars(barData, field) {
    return new Series(barData, (bar) => bar[field]);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// BARDATA — Versioned wrapper for automatic cache invalidation
// ═══════════════════════════════════════════════════════════════════════

export class BarData {
  #bars;
  #version;

  constructor(bars = []) {
    this.#bars = [...bars];
    this.#version = 0;
  }

  get version() { return this.#version; }
  get bars() { return this.#bars; }
  get length() { return this.#bars.length; }

  push(bar) { this.#bars.push(bar); this.#version++; }
  pop() { const b = this.#bars.pop(); this.#version++; return b; }
  set(index, bar) { this.#bars[index] = bar; this.#version++; }
  updateLast(bar) { if (this.#bars.length) { this.#bars[this.#bars.length - 1] = bar; this.#version++; } }
  setAll(bars) { this.#bars = [...bars]; this.#version++; }
  invalidate() { this.#version++; }
  at(index) { return this.#bars[index]; }

  static from(bars) { return new BarData(bars); }
}

// ═══════════════════════════════════════════════════════════════════════
// ta — CORE TECHNICAL ANALYSIS (array-based)
// All 61 functions matching PineScript v6 API + custom additions
// ═══════════════════════════════════════════════════════════════════════

export const taCore = {

  // ── Moving Averages ──

  sma(source, length) {
    const result = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let sum = 0;
      for (let j = 0; j < length; j++) sum += source[i - j];
      result[i] = sum / length;
    }
    return result;
  },

  ema(source, length) {
    const result = new Array(source.length).fill(NaN);
    const alpha = 2 / (length + 1);
    // Seed with SMA
    let sum = 0;
    for (let i = 0; i < length && i < source.length; i++) sum += source[i];
    if (source.length >= length) {
      result[length - 1] = sum / length;
      for (let i = length; i < source.length; i++) {
        result[i] = alpha * source[i] + (1 - alpha) * result[i - 1];
      }
    }
    return result;
  },

  wma(source, length) {
    const result = new Array(source.length).fill(NaN);
    const denom = (length * (length + 1)) / 2;
    for (let i = length - 1; i < source.length; i++) {
      let sum = 0;
      for (let j = 0; j < length; j++) {
        sum += source[i - j] * (length - j);
      }
      result[i] = sum / denom;
    }
    return result;
  },

  vwma(source, volume, length) {
    const result = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let sumPV = 0, sumV = 0;
      for (let j = 0; j < length; j++) {
        sumPV += source[i - j] * volume[i - j];
        sumV += volume[i - j];
      }
      result[i] = sumV !== 0 ? sumPV / sumV : NaN;
    }
    return result;
  },

  hma(source, length) {
    const halfLen = Math.floor(length / 2);
    const sqrtLen = Math.round(Math.sqrt(length));
    const wmaHalf = this.wma(source, halfLen);
    const wmaFull = this.wma(source, length);
    const diff = wmaHalf.map((v, i) => 2 * v - wmaFull[i]);
    return this.wma(diff, sqrtLen);
  },

  alma(source, length, offset = 0.85, sigma = 6) {
    const result = new Array(source.length).fill(NaN);
    const m = offset * (length - 1);
    const s = length / sigma;
    let weightSum = 0;
    const weights = [];
    for (let i = 0; i < length; i++) {
      weights[i] = Math.exp(-((i - m) * (i - m)) / (2 * s * s));
      weightSum += weights[i];
    }
    for (let i = length - 1; i < source.length; i++) {
      let sum = 0;
      for (let j = 0; j < length; j++) {
        sum += source[i - (length - 1 - j)] * weights[j];
      }
      result[i] = sum / weightSum;
    }
    return result;
  },

  swma(source) {
    const result = new Array(source.length).fill(NaN);
    for (let i = 3; i < source.length; i++) {
      result[i] = (source[i - 3] + 2 * source[i - 2] + 2 * source[i - 1] + source[i]) / 6;
    }
    return result;
  },

  rma(source, length) {
    const result = new Array(source.length).fill(NaN);
    const alpha = 1 / length;
    let sum = 0;
    for (let i = 0; i < length && i < source.length; i++) sum += source[i];
    if (source.length >= length) {
      result[length - 1] = sum / length;
      for (let i = length; i < source.length; i++) {
        result[i] = alpha * source[i] + (1 - alpha) * result[i - 1];
      }
    }
    return result;
  },

  linreg(source, length, offset = 0) {
    const result = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (let j = 0; j < length; j++) {
        const x = j;
        const y = source[i - length + 1 + j];
        sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
      }
      const n = length;
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      result[i] = intercept + slope * (n - 1 - offset);
    }
    return result;
  },

  // ── Oscillators ──

  rsi(source, length) {
    const result = new Array(source.length).fill(NaN);
    if (source.length < length + 1) return result;

    const changes = [];
    for (let i = 1; i < source.length; i++) {
      changes.push(source[i] - source[i - 1]);
    }

    let avgGain = 0, avgLoss = 0;
    for (let i = 0; i < length; i++) {
      if (changes[i] > 0) avgGain += changes[i];
      else avgLoss += Math.abs(changes[i]);
    }
    avgGain /= length;
    avgLoss /= length;

    result[length] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    for (let i = length; i < changes.length; i++) {
      const gain = changes[i] > 0 ? changes[i] : 0;
      const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
      avgGain = (avgGain * (length - 1) + gain) / length;
      avgLoss = (avgLoss * (length - 1) + loss) / length;
      result[i + 1] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
    return result;
  },

  macd(source, fastLength, slowLength, signalLength) {
    const fastEma = this.ema(source, fastLength);
    const slowEma = this.ema(source, slowLength);
    const macdLine = fastEma.map((f, i) => f - slowEma[i]);
    const signalLine = this.ema(macdLine.filter(v => !isNaN(v)), signalLength);
    // Re-align signal
    const signalFull = new Array(source.length).fill(NaN);
    const offset = source.length - signalLine.length;
    for (let i = 0; i < signalLine.length; i++) {
      signalFull[i + offset] = signalLine[i];
    }
    const histogram = macdLine.map((m, i) => m - signalFull[i]);
    return [macdLine, signalFull, histogram];
  },

  stoch(high, low, close, length) {
    const result = new Array(close.length).fill(NaN);
    for (let i = length - 1; i < close.length; i++) {
      let hh = -Infinity, ll = Infinity;
      for (let j = 0; j < length; j++) {
        hh = Math.max(hh, high[i - j]);
        ll = Math.min(ll, low[i - j]);
      }
      const range = hh - ll;
      result[i] = range !== 0 ? ((close[i] - ll) / range) * 100 : 50;
    }
    return result;
  },

  cci(source, length) {
    const smaVals = this.sma(source, length);
    const result = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let sumDev = 0;
      for (let j = 0; j < length; j++) {
        sumDev += Math.abs(source[i - j] - smaVals[i]);
      }
      const meanDev = sumDev / length;
      result[i] = meanDev !== 0 ? (source[i] - smaVals[i]) / (0.015 * meanDev) : 0;
    }
    return result;
  },

  mfi(high, low, close, volume, length) {
    const tp = close.map((c, i) => (high[i] + low[i] + c) / 3);
    const result = new Array(close.length).fill(NaN);
    for (let i = length; i < close.length; i++) {
      let posFlow = 0, negFlow = 0;
      for (let j = 0; j < length; j++) {
        const mf = tp[i - j] * volume[i - j];
        if (tp[i - j] > tp[i - j - 1]) posFlow += mf;
        else negFlow += mf;
      }
      result[i] = negFlow !== 0 ? 100 - 100 / (1 + posFlow / negFlow) : 100;
    }
    return result;
  },

  cmo(source, length) {
    const result = new Array(source.length).fill(NaN);
    for (let i = length; i < source.length; i++) {
      let sumUp = 0, sumDown = 0;
      for (let j = 0; j < length; j++) {
        const diff = source[i - j] - source[i - j - 1];
        if (diff > 0) sumUp += diff;
        else sumDown += Math.abs(diff);
      }
      const total = sumUp + sumDown;
      result[i] = total !== 0 ? ((sumUp - sumDown) / total) * 100 : 0;
    }
    return result;
  },

  tsi(source, longLength = 25, shortLength = 13) {
    const changes = [NaN];
    for (let i = 1; i < source.length; i++) changes.push(source[i] - source[i - 1]);
    const absChanges = changes.map(c => Math.abs(c));
    const emaLong = this.ema(changes.slice(1), longLength);
    const emaLongAbs = this.ema(absChanges.slice(1), longLength);
    const emaShort = this.ema(emaLong.filter(v => !isNaN(v)), shortLength);
    const emaShortAbs = this.ema(emaLongAbs.filter(v => !isNaN(v)), shortLength);
    const result = new Array(source.length).fill(NaN);
    const off = source.length - emaShort.length;
    for (let i = 0; i < emaShort.length; i++) {
      result[i + off] = emaShortAbs[i] !== 0 ? (emaShort[i] / emaShortAbs[i]) * 100 : 0;
    }
    return result;
  },

  wpr(high, low, close, length) {
    const result = new Array(close.length).fill(NaN);
    for (let i = length - 1; i < close.length; i++) {
      let hh = -Infinity, ll = Infinity;
      for (let j = 0; j < length; j++) {
        hh = Math.max(hh, high[i - j]);
        ll = Math.min(ll, low[i - j]);
      }
      const range = hh - ll;
      result[i] = range !== 0 ? ((hh - close[i]) / range) * -100 : -50;
    }
    return result;
  },

  cog(source, length) {
    const result = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let num = 0, den = 0;
      for (let j = 0; j < length; j++) {
        num += source[i - j] * (j + 1);
        den += source[i - j];
      }
      result[i] = den !== 0 ? -num / den : 0;
    }
    return result;
  },

  mom(source, length) {
    const result = new Array(source.length).fill(NaN);
    for (let i = length; i < source.length; i++) {
      result[i] = source[i] - source[i - length];
    }
    return result;
  },

  roc(source, length) {
    const result = new Array(source.length).fill(NaN);
    for (let i = length; i < source.length; i++) {
      result[i] = source[i - length] !== 0 ? ((source[i] - source[i - length]) / source[i - length]) * 100 : 0;
    }
    return result;
  },

  // ── Volatility ──

  atr(high, low, close, length) {
    const tr = this.tr(high, low, close);
    return this.rma(tr, length);
  },

  tr(high, low, close) {
    const result = [high[0] - low[0]];
    for (let i = 1; i < close.length; i++) {
      result.push(Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      ));
    }
    return result;
  },

  bb(source, length, mult = 2) {
    const basis = this.sma(source, length);
    const stddev = this.stdev(source, length);
    const upper = basis.map((b, i) => b + mult * stddev[i]);
    const lower = basis.map((b, i) => b - mult * stddev[i]);
    return [upper, basis, lower];
  },

  bbw(source, length, mult = 2) {
    const [upper, basis, lower] = this.bb(source, length, mult);
    return basis.map((b, i) => b !== 0 ? (upper[i] - lower[i]) / b : 0);
  },

  kc(high, low, close, length, mult = 1.5, useTrue = true) {
    const basis = this.ema(close, length);
    const rangeVal = useTrue ? this.atr(high, low, close, length) : this.sma(
      close.map((_, i) => high[i] - low[i]), length
    );
    const upper = basis.map((b, i) => b + mult * rangeVal[i]);
    const lower = basis.map((b, i) => b - mult * rangeVal[i]);
    return [upper, basis, lower];
  },

  kcw(high, low, close, length, mult = 1.5) {
    const [upper, basis, lower] = this.kc(high, low, close, length, mult);
    return basis.map((b, i) => b !== 0 ? (upper[i] - lower[i]) / b : 0);
  },

  stdev(source, length) {
    const result = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let sum = 0;
      for (let j = 0; j < length; j++) sum += source[i - j];
      const mean = sum / length;
      let sumSq = 0;
      for (let j = 0; j < length; j++) sumSq += (source[i - j] - mean) ** 2;
      result[i] = Math.sqrt(sumSq / length);
    }
    return result;
  },

  variance(source, length) {
    const result = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let sum = 0;
      for (let j = 0; j < length; j++) sum += source[i - j];
      const mean = sum / length;
      let sumSq = 0;
      for (let j = 0; j < length; j++) sumSq += (source[i - j] - mean) ** 2;
      result[i] = sumSq / length;
    }
    return result;
  },

  dev(source, length) {
    const smaVals = this.sma(source, length);
    const result = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let sumDev = 0;
      for (let j = 0; j < length; j++) {
        sumDev += Math.abs(source[i - j] - smaVals[i]);
      }
      result[i] = sumDev / length;
    }
    return result;
  },

  // ── Trend ──

  supertrend(high, low, close, length = 10, mult = 3) {
    const atr = this.atr(high, low, close, length);
    const hl2 = close.map((_, i) => (high[i] + low[i]) / 2);
    const result = new Array(close.length).fill(NaN);
    const direction = new Array(close.length).fill(0);

    let upperBand, lowerBand;
    for (let i = length; i < close.length; i++) {
      let ub = hl2[i] + mult * atr[i];
      let lb = hl2[i] - mult * atr[i];

      if (i > length) {
        lb = lb > (lowerBand || lb) || close[i - 1] < (lowerBand || lb) ? lb : lowerBand;
        ub = ub < (upperBand || ub) || close[i - 1] > (upperBand || ub) ? ub : upperBand;
      }

      upperBand = ub;
      lowerBand = lb;

      if (i === length) {
        direction[i] = 1;
      } else if (result[i - 1] === upperBand) {
        direction[i] = close[i] > ub ? -1 : 1;
      } else {
        direction[i] = close[i] < lb ? 1 : -1;
      }

      result[i] = direction[i] === -1 ? lowerBand : upperBand;
    }
    return [result, direction];
  },

  sar(high, low, start = 0.02, inc = 0.02, max = 0.2) {
    const len = high.length;
    const result = new Array(len).fill(NaN);
    if (len < 2) return result;

    let isLong = close => true;
    let af = start;
    let ep = high[0];
    result[0] = low[0];
    let prevSar = low[0];
    let trend = 1; // 1 = up, -1 = down

    for (let i = 1; i < len; i++) {
      let sar = prevSar + af * (ep - prevSar);
      if (trend === 1) {
        sar = Math.min(sar, low[i - 1], i >= 2 ? low[i - 2] : low[i - 1]);
        if (high[i] > ep) { ep = high[i]; af = Math.min(af + inc, max); }
        if (low[i] < sar) { trend = -1; sar = ep; ep = low[i]; af = start; }
      } else {
        sar = Math.max(sar, high[i - 1], i >= 2 ? high[i - 2] : high[i - 1]);
        if (low[i] < ep) { ep = low[i]; af = Math.min(af + inc, max); }
        if (high[i] > sar) { trend = 1; sar = ep; ep = high[i]; af = start; }
      }
      result[i] = sar;
      prevSar = sar;
    }
    return result;
  },

  dmi(high, low, close, length = 14) {
    const tr = this.tr(high, low, close);
    const result = { plus: [], minus: [], adx: [] };

    const plusDM = [0], minusDM = [0];
    for (let i = 1; i < high.length; i++) {
      const upMove = high[i] - high[i - 1];
      const downMove = low[i - 1] - low[i];
      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }

    const smoothTR = this.rma(tr, length);
    const smoothPlusDM = this.rma(plusDM, length);
    const smoothMinusDM = this.rma(minusDM, length);

    const plusDI = smoothPlusDM.map((v, i) => smoothTR[i] !== 0 ? (v / smoothTR[i]) * 100 : 0);
    const minusDI = smoothMinusDM.map((v, i) => smoothTR[i] !== 0 ? (v / smoothTR[i]) * 100 : 0);

    const dx = plusDI.map((p, i) => {
      const sum = p + minusDI[i];
      return sum !== 0 ? (Math.abs(p - minusDI[i]) / sum) * 100 : 0;
    });

    const adx = this.rma(dx, length);
    return { plus: plusDI, minus: minusDI, adx };
  },

  ichimoku(high, low, tenkanLen = 9, kijunLen = 26, senkouBLen = 52) {
    const donchian = (h, l, len) => {
      const result = new Array(h.length).fill(NaN);
      for (let i = len - 1; i < h.length; i++) {
        let hh = -Infinity, ll = Infinity;
        for (let j = 0; j < len; j++) {
          hh = Math.max(hh, h[i - j]);
          ll = Math.min(ll, l[i - j]);
        }
        result[i] = (hh + ll) / 2;
      }
      return result;
    };

    const tenkan = donchian(high, low, tenkanLen);
    const kijun = donchian(high, low, kijunLen);
    const senkouA = tenkan.map((t, i) => (t + kijun[i]) / 2);
    const senkouB = donchian(high, low, senkouBLen);
    const chikou = new Array(low.length).fill(NaN);
    // Chikou is close shifted back 26 periods (represented in source array)

    return { tenkan, kijun, senkouA, senkouB, chikou };
  },

  // ── Crossovers & Detection ──

  crossover(series1, series2) {
    const r = new Array(series1.length).fill(false);
    for (let i = 1; i < series1.length; i++) {
      r[i] = series1[i] > series2[i] && series1[i - 1] <= series2[i - 1];
    }
    return r;
  },

  crossunder(series1, series2) {
    const r = new Array(series1.length).fill(false);
    for (let i = 1; i < series1.length; i++) {
      r[i] = series1[i] < series2[i] && series1[i - 1] >= series2[i - 1];
    }
    return r;
  },

  cross(series1, series2) {
    return this.crossover(series1, series2).map((v, i) =>
      v || this.crossunder(series1, series2)[i]
    );
  },

  change(source, length = 1) {
    const r = new Array(source.length).fill(NaN);
    for (let i = length; i < source.length; i++) {
      r[i] = source[i] - source[i - length];
    }
    return r;
  },

  rising(source, length) {
    const r = new Array(source.length).fill(false);
    for (let i = length; i < source.length; i++) {
      let allRising = true;
      for (let j = 0; j < length; j++) {
        if (source[i - j] <= source[i - j - 1]) { allRising = false; break; }
      }
      r[i] = allRising;
    }
    return r;
  },

  falling(source, length) {
    const r = new Array(source.length).fill(false);
    for (let i = length; i < source.length; i++) {
      let allFalling = true;
      for (let j = 0; j < length; j++) {
        if (source[i - j] >= source[i - j - 1]) { allFalling = false; break; }
      }
      r[i] = allFalling;
    }
    return r;
  },

  // ── Pivot Points ──

  pivothigh(source, leftBars, rightBars) {
    const r = new Array(source.length).fill(NaN);
    for (let i = leftBars; i < source.length - rightBars; i++) {
      let isPivot = true;
      for (let j = 1; j <= leftBars; j++) {
        if (source[i - j] >= source[i]) { isPivot = false; break; }
      }
      if (isPivot) {
        for (let j = 1; j <= rightBars; j++) {
          if (source[i + j] >= source[i]) { isPivot = false; break; }
        }
      }
      if (isPivot) r[i] = source[i];
    }
    return r;
  },

  pivotlow(source, leftBars, rightBars) {
    const r = new Array(source.length).fill(NaN);
    for (let i = leftBars; i < source.length - rightBars; i++) {
      let isPivot = true;
      for (let j = 1; j <= leftBars; j++) {
        if (source[i - j] <= source[i]) { isPivot = false; break; }
      }
      if (isPivot) {
        for (let j = 1; j <= rightBars; j++) {
          if (source[i + j] <= source[i]) { isPivot = false; break; }
        }
      }
      if (isPivot) r[i] = source[i];
    }
    return r;
  },

  pivot_point_levels(type, high, low, close) {
    const h = high, l = low, c = close;
    const pp = (h + l + c) / 3;
    const range = h - l;
    if (type === 'traditional') {
      return { pp, r1: 2 * pp - l, s1: 2 * pp - h, r2: pp + range, s2: pp - range, r3: h + 2 * (pp - l), s3: l - 2 * (h - pp) };
    }
    if (type === 'fibonacci') {
      return { pp, r1: pp + 0.382 * range, s1: pp - 0.382 * range, r2: pp + 0.618 * range, s2: pp - 0.618 * range, r3: pp + range, s3: pp - range };
    }
    if (type === 'woodie') {
      const wpp = (h + l + 2 * c) / 4;
      return { pp: wpp, r1: 2 * wpp - l, s1: 2 * wpp - h, r2: wpp + range, s2: wpp - range };
    }
    if (type === 'camarilla') {
      return { pp, r1: c + range * 1.1 / 12, s1: c - range * 1.1 / 12, r2: c + range * 1.1 / 6, s2: c - range * 1.1 / 6, r3: c + range * 1.1 / 4, s3: c - range * 1.1 / 4 };
    }
    if (type === 'dm') {
      let x;
      if (c === l) x = h + 2 * l + c;
      else if (c === h) x = 2 * h + l + c;
      else x = 2 * c + h + l;
      const dmpp = x / 4;
      return { pp: dmpp, r1: x / 2 - l, s1: x / 2 - h };
    }
    return { pp };
  },

  // ── Statistics ──

  correlation(series1, series2, length) {
    const r = new Array(series1.length).fill(NaN);
    for (let i = length - 1; i < series1.length; i++) {
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
      for (let j = 0; j < length; j++) {
        const x = series1[i - j], y = series2[i - j];
        sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x; sumY2 += y * y;
      }
      const n = length;
      const num = n * sumXY - sumX * sumY;
      const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      r[i] = den !== 0 ? num / den : 0;
    }
    return r;
  },

  percentrank(source, length) {
    const r = new Array(source.length).fill(NaN);
    for (let i = length; i < source.length; i++) {
      let count = 0;
      for (let j = 1; j <= length; j++) {
        if (source[i - j] <= source[i]) count++;
      }
      r[i] = (count / length) * 100;
    }
    return r;
  },

  percentile_linear_interpolation(source, length, pct) {
    const r = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      const window = [];
      for (let j = 0; j < length; j++) window.push(source[i - j]);
      window.sort((a, b) => a - b);
      const rank = (pct / 100) * (length - 1);
      const lo = Math.floor(rank), hi = Math.ceil(rank);
      r[i] = lo === hi ? window[lo] : window[lo] + (rank - lo) * (window[hi] - window[lo]);
    }
    return r;
  },

  percentile_nearest_rank(source, length, pct) {
    const r = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      const window = [];
      for (let j = 0; j < length; j++) window.push(source[i - j]);
      window.sort((a, b) => a - b);
      const rank = Math.ceil((pct / 100) * length) - 1;
      r[i] = window[Math.max(0, Math.min(rank, length - 1))];
    }
    return r;
  },

  median(source, length) {
    return this.percentile_linear_interpolation(source, length, 50);
  },

  mode(source, length) {
    const r = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      const counts = {};
      let maxCount = 0, modeVal = source[i];
      for (let j = 0; j < length; j++) {
        const val = source[i - j];
        counts[val] = (counts[val] || 0) + 1;
        if (counts[val] > maxCount) { maxCount = counts[val]; modeVal = val; }
      }
      r[i] = modeVal;
    }
    return r;
  },

  // ── Aggregations ──

  highest(source, length) {
    const r = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let max = -Infinity;
      for (let j = 0; j < length; j++) max = Math.max(max, source[i - j]);
      r[i] = max;
    }
    return r;
  },

  highestbars(source, length) {
    const r = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let max = -Infinity, idx = 0;
      for (let j = 0; j < length; j++) {
        if (source[i - j] > max) { max = source[i - j]; idx = -j; }
      }
      r[i] = idx;
    }
    return r;
  },

  lowest(source, length) {
    const r = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let min = Infinity;
      for (let j = 0; j < length; j++) min = Math.min(min, source[i - j]);
      r[i] = min;
    }
    return r;
  },

  lowestbars(source, length) {
    const r = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let min = Infinity, idx = 0;
      for (let j = 0; j < length; j++) {
        if (source[i - j] < min) { min = source[i - j]; idx = -j; }
      }
      r[i] = idx;
    }
    return r;
  },

  range(source, length) {
    const hi = this.highest(source, length);
    const lo = this.lowest(source, length);
    return hi.map((h, i) => h - lo[i]);
  },

  cum(source) {
    const r = new Array(source.length);
    r[0] = source[0];
    for (let i = 1; i < source.length; i++) r[i] = r[i - 1] + source[i];
    return r;
  },

  // ── Utility ──

  barssince(condition) {
    const r = new Array(condition.length).fill(NaN);
    let count = NaN;
    for (let i = 0; i < condition.length; i++) {
      if (condition[i]) count = 0;
      else if (!isNaN(count)) count++;
      r[i] = count;
    }
    return r;
  },

  valuewhen(condition, source, occurrence = 0) {
    const r = new Array(source.length).fill(NaN);
    const found = [];
    for (let i = 0; i < source.length; i++) {
      if (condition[i]) found.push(source[i]);
      r[i] = found.length > occurrence ? found[found.length - 1 - occurrence] : NaN;
    }
    return r;
  },

  // ── VWAP ──

  vwap(source, volume) {
    const cumPV = this.cum(source.map((s, i) => s * volume[i]));
    const cumV = this.cum(volume);
    return cumPV.map((pv, i) => cumV[i] !== 0 ? pv / cumV[i] : NaN);
  },

  // ── ZigZag (custom) ──

  zigzag(high, low, pctChange = 5) {
    const r = new Array(high.length).fill(NaN);
    let trend = 0; // 0=unknown, 1=up, -1=down
    let lastPivot = (high[0] + low[0]) / 2;
    let lastPivotI = 0;

    for (let i = 1; i < high.length; i++) {
      if (trend === 0) {
        if (high[i] > lastPivot * (1 + pctChange / 100)) { trend = 1; r[lastPivotI] = lastPivot; lastPivot = high[i]; lastPivotI = i; }
        else if (low[i] < lastPivot * (1 - pctChange / 100)) { trend = -1; r[lastPivotI] = lastPivot; lastPivot = low[i]; lastPivotI = i; }
      } else if (trend === 1) {
        if (high[i] > lastPivot) { lastPivot = high[i]; lastPivotI = i; }
        else if (low[i] < lastPivot * (1 - pctChange / 100)) { r[lastPivotI] = lastPivot; trend = -1; lastPivot = low[i]; lastPivotI = i; }
      } else {
        if (low[i] < lastPivot) { lastPivot = low[i]; lastPivotI = i; }
        else if (high[i] > lastPivot * (1 + pctChange / 100)) { r[lastPivotI] = lastPivot; trend = 1; lastPivot = high[i]; lastPivotI = i; }
      }
    }
    r[lastPivotI] = lastPivot;
    return r;
  },
};

// ═══════════════════════════════════════════════════════════════════════
// ta — SERIES-BASED WRAPPERS
// Usage: ta.sma(closeSeries, 14) → Series
// ═══════════════════════════════════════════════════════════════════════

export const ta = {
  sma: (src, len) => _wrapTA('sma', src, len),
  ema: (src, len) => _wrapTA('ema', src, len),
  wma: (src, len) => _wrapTA('wma', src, len),
  hma: (src, len) => _wrapTA('hma', src, len),
  alma: (src, len, offset, sigma) => _wrapTA('alma', src, len, offset, sigma),
  swma: (src) => _wrapTA('swma', src),
  rma: (src, len) => _wrapTA('rma', src, len),
  linreg: (src, len, off) => _wrapTA('linreg', src, len, off),
  rsi: (src, len) => _wrapTA('rsi', src, len),
  cci: (src, len) => _wrapTA('cci', src, len),
  cmo: (src, len) => _wrapTA('cmo', src, len),
  cog: (src, len) => _wrapTA('cog', src, len),
  mom: (src, len) => _wrapTA('mom', src, len),
  roc: (src, len) => _wrapTA('roc', src, len),
  stdev: (src, len) => _wrapTA('stdev', src, len),
  variance: (src, len) => _wrapTA('variance', src, len),
  dev: (src, len) => _wrapTA('dev', src, len),
  highest: (src, len) => _wrapTA('highest', src, len),
  lowest: (src, len) => _wrapTA('lowest', src, len),
  cum: (src) => _wrapTA('cum', src),
  median: (src, len) => _wrapTA('median', src, len),
  percentrank: (src, len) => _wrapTA('percentrank', src, len),

  macd(src, fast, slow, signal) {
    const arr = src instanceof Series ? src.toArray() : src;
    const [m, s, h] = taCore.macd(arr, fast, slow, signal);
    return [new Series(m, v => v), new Series(s, v => v), new Series(h, v => v)];
  },

  bb(src, len, mult) {
    const arr = src instanceof Series ? src.toArray() : src;
    const [u, b, l] = taCore.bb(arr, len, mult);
    return [new Series(u, v => v), new Series(b, v => v), new Series(l, v => v)];
  },

  stoch(high, low, close, len) {
    const h = high instanceof Series ? high.toArray() : high;
    const l = low instanceof Series ? low.toArray() : low;
    const c = close instanceof Series ? close.toArray() : close;
    return new Series(taCore.stoch(h, l, c, len), v => v);
  },

  atr(high, low, close, len) {
    const h = high instanceof Series ? high.toArray() : high;
    const l = low instanceof Series ? low.toArray() : low;
    const c = close instanceof Series ? close.toArray() : close;
    return new Series(taCore.atr(h, l, c, len), v => v);
  },

  supertrend(high, low, close, len, mult) {
    const h = high instanceof Series ? high.toArray() : high;
    const l = low instanceof Series ? low.toArray() : low;
    const c = close instanceof Series ? close.toArray() : close;
    const [st, dir] = taCore.supertrend(h, l, c, len, mult);
    return [new Series(st, v => v), new Series(dir, v => v)];
  },

  crossover(a, b) {
    const arr1 = a instanceof Series ? a.toArray() : a;
    const arr2 = b instanceof Series ? b.toArray() : b;
    return new Series(taCore.crossover(arr1, arr2), v => v);
  },

  crossunder(a, b) {
    const arr1 = a instanceof Series ? a.toArray() : a;
    const arr2 = b instanceof Series ? b.toArray() : b;
    return new Series(taCore.crossunder(arr1, arr2), v => v);
  },

  vwap(src, vol) {
    const s = src instanceof Series ? src.toArray() : src;
    const v = vol instanceof Series ? vol.toArray() : vol;
    return new Series(taCore.vwap(s, v), val => val);
  },

  correlation(a, b, len) {
    const arr1 = a instanceof Series ? a.toArray() : a;
    const arr2 = b instanceof Series ? b.toArray() : b;
    return new Series(taCore.correlation(arr1, arr2, len), v => v);
  },

  pivothigh(src, left, right) {
    const arr = src instanceof Series ? src.toArray() : src;
    return new Series(taCore.pivothigh(arr, left, right), v => v);
  },

  pivotlow(src, left, right) {
    const arr = src instanceof Series ? src.toArray() : src;
    return new Series(taCore.pivotlow(arr, left, right), v => v);
  },
};

function _wrapTA(fn, src, ...args) {
  const arr = src instanceof Series ? src.toArray() : src;
  const result = taCore[fn](arr, ...args);
  return new Series(result, v => v);
}

// ═══════════════════════════════════════════════════════════════════════
// math — MATHEMATICS NAMESPACE (24 functions)
// ═══════════════════════════════════════════════════════════════════════

export const math = {
  pi: Math.PI,
  e: Math.E,
  phi: (1 + Math.sqrt(5)) / 2,
  rphi: (Math.sqrt(5) - 1) / 2,

  abs: Math.abs,
  acos: Math.acos,
  asin: Math.asin,
  atan: Math.atan,
  ceil: Math.ceil,
  cos: Math.cos,
  exp: Math.exp,
  floor: Math.floor,
  log: Math.log,
  log10: Math.log10,
  pow: Math.pow,
  round(x, precision = 0) { const f = 10 ** precision; return Math.round(x * f) / f; },
  sign: Math.sign,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
  todegrees: (r) => r * (180 / Math.PI),
  toradians: (d) => d * (Math.PI / 180),
  max: (...args) => Math.max(...args.flat()),
  min: (...args) => Math.min(...args.flat()),
  avg: (...args) => { const flat = args.flat(); return flat.reduce((a, b) => a + b, 0) / flat.length; },
  sum(source, length) {
    if (typeof length === 'undefined') return source.reduce((a, b) => a + b, 0);
    const r = new Array(source.length).fill(NaN);
    for (let i = length - 1; i < source.length; i++) {
      let s = 0;
      for (let j = 0; j < length; j++) s += source[i - j];
      r[i] = s;
    }
    return r;
  },
  random: () => Math.random(),
  round_to_mintick: (x, mintick = 0.01) => Math.round(x / mintick) * mintick,
};

// ═══════════════════════════════════════════════════════════════════════
// BACKTEST ENGINE — Validate strategies offline
// ═══════════════════════════════════════════════════════════════════════

export class BacktestEngine {
  constructor(opts = {}) {
    this.initialCapital = opts.initialCapital || 100000;
    this.commissionPct = opts.commissionPct || 0.05;
    this.slippage = opts.slippage || 2;
    this.equity = this.initialCapital;
    this.position = 0;  // +long, -short
    this.entryPrice = 0;
    this.trades = [];
    this.equityCurve = [];
    this.maxEquity = this.initialCapital;
    this.maxDrawdown = 0;
  }

  run(bars, signals) {
    this.equity = this.initialCapital;
    this.position = 0;
    this.trades = [];
    this.equityCurve = [];
    this.maxEquity = this.initialCapital;
    this.maxDrawdown = 0;

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      const sig = signals[i];

      if (sig === 'long' && this.position <= 0) {
        if (this.position < 0) this._closeTrade(bar, i);
        this._openTrade('long', bar, i);
      } else if (sig === 'short' && this.position >= 0) {
        if (this.position > 0) this._closeTrade(bar, i);
        this._openTrade('short', bar, i);
      } else if (sig === 'close' && this.position !== 0) {
        this._closeTrade(bar, i);
      }

      // Mark-to-market
      if (this.position !== 0) {
        const unrealized = this.position > 0
          ? (bar.close - this.entryPrice) * Math.abs(this.position)
          : (this.entryPrice - bar.close) * Math.abs(this.position);
        this.equityCurve.push(this.equity + unrealized);
      } else {
        this.equityCurve.push(this.equity);
      }

      this.maxEquity = Math.max(this.maxEquity, this.equityCurve[i]);
      const dd = (this.maxEquity - this.equityCurve[i]) / this.maxEquity;
      this.maxDrawdown = Math.max(this.maxDrawdown, dd);
    }

    // Close any open position
    if (this.position !== 0 && bars.length > 0) {
      this._closeTrade(bars[bars.length - 1], bars.length - 1);
    }

    return this.report();
  }

  _openTrade(side, bar, index) {
    const slippageCost = this.slippage * 0.01;
    const price = side === 'long' ? bar.close * (1 + slippageCost) : bar.close * (1 - slippageCost);
    const qty = Math.floor((this.equity * 0.1) / price);
    if (qty <= 0) return;
    const commission = price * qty * (this.commissionPct / 100);
    this.equity -= commission;
    this.position = side === 'long' ? qty : -qty;
    this.entryPrice = price;
    this.trades.push({ side, entryPrice: price, entryIndex: index, qty, commission });
  }

  _closeTrade(bar, index) {
    const trade = this.trades[this.trades.length - 1];
    if (!trade || trade.exitPrice) return;
    const slippageCost = this.slippage * 0.01;
    const exitPrice = this.position > 0 ? bar.close * (1 - slippageCost) : bar.close * (1 + slippageCost);
    const pnl = this.position > 0
      ? (exitPrice - trade.entryPrice) * trade.qty
      : (trade.entryPrice - exitPrice) * trade.qty;
    const commission = exitPrice * trade.qty * (this.commissionPct / 100);
    this.equity += pnl - commission;
    trade.exitPrice = exitPrice;
    trade.exitIndex = index;
    trade.pnl = pnl - commission - trade.commission;
    trade.pnlPct = trade.pnl / (trade.entryPrice * trade.qty) * 100;
    this.position = 0;
    this.entryPrice = 0;
  }

  report() {
    const closedTrades = this.trades.filter(t => t.exitPrice);
    const wins = closedTrades.filter(t => t.pnl > 0);
    const losses = closedTrades.filter(t => t.pnl <= 0);
    const totalPnl = closedTrades.reduce((s, t) => s + t.pnl, 0);
    const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;

    return {
      totalTrades: closedTrades.length,
      winRate: closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0,
      profitFactor: grossLoss !== 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      totalPnl,
      totalPnlPct: (totalPnl / this.initialCapital) * 100,
      maxDrawdown: this.maxDrawdown * 100,
      avgWin,
      avgLoss,
      rewardRisk: avgLoss !== 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0,
      kellyPct: this._kelly(wins.length, closedTrades.length, avgWin, avgLoss),
      sharpeRatio: this._sharpe(),
      equityCurve: this.equityCurve,
      trades: closedTrades,
      quality: this._qualityGrade(closedTrades, grossProfit, grossLoss),
    };
  }

  _kelly(wins, total, avgWin, avgLoss) {
    if (total === 0 || avgLoss === 0) return 0;
    const w = wins / total;
    const r = avgWin / avgLoss;
    const kelly = w - (1 - w) / r;
    return Math.max(0, kelly / 2) * 100; // Half Kelly
  }

  _sharpe() {
    if (this.equityCurve.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < this.equityCurve.length; i++) {
      returns.push((this.equityCurve[i] - this.equityCurve[i - 1]) / this.equityCurve[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length);
    return std !== 0 ? (mean / std) * Math.sqrt(252) : 0;
  }

  _qualityGrade(trades, grossProfit, grossLoss) {
    const pf = grossLoss !== 0 ? grossProfit / grossLoss : 0;
    const wr = trades.length ? trades.filter(t => t.pnl > 0).length / trades.length * 100 : 0;
    const dd = this.maxDrawdown * 100;
    const n = trades.length;

    if (pf >= 2.0 && dd < 15 && n >= 100 && wr >= 50) return 'A+';
    if (pf >= 1.8 && dd < 20 && n >= 50 && wr >= 45) return 'A';
    if (pf >= 1.5 && dd < 25 && n >= 30 && wr >= 40) return 'B';
    if (pf >= 1.2 && dd < 30 && n >= 20) return 'C';
    return 'D';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// VOLATILITY REGIME DETECTOR
// ═══════════════════════════════════════════════════════════════════════

export function detectVolRegime(close, periodsPerYear = 252) {
  const returns = [];
  for (let i = 1; i < close.length; i++) {
    returns.push(Math.log(close[i] / close[i - 1]));
  }

  const vol5 = _rollingStd(returns, 5).map(v => v * Math.sqrt(periodsPerYear));
  const vol20 = _rollingStd(returns, 20).map(v => v * Math.sqrt(periodsPerYear));
  const ratio = vol5.map((v, i) => vol20[i] !== 0 ? v / vol20[i] : 1);

  const regimes = ratio.map(r => {
    if (r > 1.5) return 'expanding';   // Trending/stressed → momentum
    if (r < 0.7) return 'compressing'; // Coiling → breakout setup
    return 'stable';                    // Mean reversion
  });

  return { vol5, vol20, ratio, regimes };
}

function _rollingStd(arr, len) {
  const result = new Array(arr.length).fill(NaN);
  for (let i = len - 1; i < arr.length; i++) {
    let sum = 0;
    for (let j = 0; j < len; j++) sum += arr[i - j];
    const mean = sum / len;
    let sumSq = 0;
    for (let j = 0; j < len; j++) sumSq += (arr[i - j] - mean) ** 2;
    result[i] = Math.sqrt(sumSq / len);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// Z-SCORE ANALYZER
// ═══════════════════════════════════════════════════════════════════════

export function zScoreAnalysis(close, length = 20) {
  const mean = taCore.sma(close, length);
  const std = taCore.stdev(close, length);
  const zscore = close.map((c, i) => std[i] !== 0 ? (c - mean[i]) / std[i] : 0);

  const lastZ = zscore[zscore.length - 1];
  let interpretation;
  if (lastZ > 2.0) interpretation = 'Statistically overbought';
  else if (lastZ > 1.5) interpretation = 'Extended';
  else if (lastZ >= 0) interpretation = 'Mild bullish';
  else if (lastZ >= -1.5) interpretation = 'Mild bearish';
  else if (lastZ >= -2.0) interpretation = 'Extended bearish';
  else interpretation = 'Statistically oversold';

  return { zscore, lastZ, interpretation, mean, std };
}
