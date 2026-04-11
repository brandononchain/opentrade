/**
 * Pine Script Strategy Builder
 * Modular strategy composition system with entry/exit modules,
 * risk management, position sizing, and multi-factor model builder.
 *
 * Architecture:
 *   1. Entry modules: individual signal generators
 *   2. Exit modules: stop-loss, take-profit, trailing, time-based
 *   3. Filter modules: trend, volatility, volume, time
 *   4. Position sizing: Kelly, fixed fractional, volatility-adjusted
 *   5. Composer: combines modules into complete strategy code
 */

// ═══════════════════════════════════════════════════════════════════════
// ENTRY MODULES — Signal generators
// ═══════════════════════════════════════════════════════════════════════

const ENTRY_MODULES = {

  ema_cross: {
    name: 'EMA Crossover',
    description: 'Fast/slow EMA crossover signals',
    params: { fastLen: 9, slowLen: 21, src: 'close' },
    inputs: (p) => `
fastLen = input.int(${p.fastLen}, "Fast EMA Length", minval=1, group="Entry: EMA Cross")
slowLen = input.int(${p.slowLen}, "Slow EMA Length", minval=1, group="Entry: EMA Cross")`,
    calc: () => `
fastEma = ta.ema(close, fastLen)
slowEma = ta.ema(close, slowLen)`,
    longSignal: () => 'ta.crossover(fastEma, slowEma)[1]',
    shortSignal: () => 'ta.crossunder(fastEma, slowEma)[1]',
    plots: () => `
plot(fastEma, "Fast EMA", color.blue, 2)
plot(slowEma, "Slow EMA", color.orange, 1)`,
  },

  rsi_reversal: {
    name: 'RSI Reversal',
    description: 'RSI oversold/overbought reversals',
    params: { rsiLen: 14, obLevel: 70, osLevel: 30 },
    inputs: (p) => `
rsiLen  = input.int(${p.rsiLen}, "RSI Length", minval=1, group="Entry: RSI")
obLevel = input.int(${p.obLevel}, "Overbought", group="Entry: RSI")
osLevel = input.int(${p.osLevel}, "Oversold", group="Entry: RSI")`,
    calc: () => `
rsiVal = ta.rsi(close, rsiLen)`,
    longSignal: () => 'ta.crossover(rsiVal, osLevel)[1]',
    shortSignal: () => 'ta.crossunder(rsiVal, obLevel)[1]',
    plots: () => '',
  },

  macd_signal: {
    name: 'MACD Signal Cross',
    description: 'MACD line crosses signal line',
    params: { fast: 12, slow: 26, signal: 9 },
    inputs: (p) => `
macdFast   = input.int(${p.fast}, "MACD Fast", group="Entry: MACD")
macdSlow   = input.int(${p.slow}, "MACD Slow", group="Entry: MACD")
macdSignal = input.int(${p.signal}, "Signal", group="Entry: MACD")`,
    calc: () => `
[macdLine, signalLine, histogram] = ta.macd(close, macdFast, macdSlow, macdSignal)`,
    longSignal: () => 'ta.crossover(macdLine, signalLine)[1]',
    shortSignal: () => 'ta.crossunder(macdLine, signalLine)[1]',
    plots: () => '',
  },

  supertrend: {
    name: 'Supertrend',
    description: 'ATR-based trend following',
    params: { atrLen: 10, mult: 3.0 },
    inputs: (p) => `
stAtrLen = input.int(${p.atrLen}, "ATR Length", group="Entry: Supertrend")
stMult   = input.float(${p.mult}, "Multiplier", step=0.1, group="Entry: Supertrend")`,
    calc: () => `
[stValue, stDir] = ta.supertrend(stMult, stAtrLen)`,
    longSignal: () => 'ta.change(stDir) < 0',
    shortSignal: () => 'ta.change(stDir) > 0',
    plots: () => `
plot(stValue, "Supertrend", stDir < 0 ? color.green : color.red, 2)`,
  },

  bollinger_squeeze: {
    name: 'Bollinger Squeeze Breakout',
    description: 'Bollinger Band squeeze into breakout',
    params: { bbLen: 20, bbMult: 2.0, kcLen: 20, kcMult: 1.5 },
    inputs: (p) => `
bbLen  = input.int(${p.bbLen}, "BB Length", group="Entry: Squeeze")
bbMult = input.float(${p.bbMult}, "BB Mult", step=0.1, group="Entry: Squeeze")
kcLen  = input.int(${p.kcLen}, "KC Length", group="Entry: Squeeze")
kcMult = input.float(${p.kcMult}, "KC Mult", step=0.1, group="Entry: Squeeze")`,
    calc: () => `
[bbMid, bbUp, bbLo] = ta.bb(close, bbLen, bbMult)
kcMid  = ta.ema(close, kcLen)
kcRange = ta.atr(kcLen) * kcMult
kcUp   = kcMid + kcRange
kcLo   = kcMid - kcRange
sqzOn  = bbUp < kcUp and bbLo > kcLo
sqzOff = not sqzOn
sqzMom = ta.linreg(close - (bbMid + kcMid) / 2, bbLen, 0)`,
    longSignal: () => 'sqzOff[1] and sqzOn[2] and sqzMom[1] > 0',
    shortSignal: () => 'sqzOff[1] and sqzOn[2] and sqzMom[1] < 0',
    plots: () => '',
  },

  zscore_mean_reversion: {
    name: 'Z-Score Mean Reversion',
    description: 'Statistical mean reversion on z-score extremes',
    params: { lookback: 20, entryZ: 2.0, exitZ: 0.5 },
    inputs: (p) => `
zLookback = input.int(${p.lookback}, "Z Lookback", group="Entry: Z-Score")
zEntry    = input.float(${p.entryZ}, "Entry Z", step=0.1, group="Entry: Z-Score")
zExit     = input.float(${p.exitZ}, "Exit Z", step=0.1, group="Entry: Z-Score")`,
    calc: () => `
zMean   = ta.sma(close, zLookback)
zStd    = ta.stdev(close, zLookback)
zScore  = zStd != 0 ? (close - zMean) / zStd : 0`,
    longSignal: () => 'zScore[1] <= -zEntry',
    shortSignal: () => 'zScore[1] >= zEntry',
    plots: () => '',
  },

  vwap_fade: {
    name: 'VWAP Band Fade',
    description: 'Fade price at VWAP deviation band extremes',
    params: { bandMult: 2.0 },
    inputs: (p) => `
vwapBandMult = input.float(${p.bandMult}, "VWAP Band Mult", step=0.1, group="Entry: VWAP")`,
    calc: () => `
vwapVal   = ta.vwap(hlc3)
vwapDev   = ta.stdev(hlc3 - vwapVal, 20)
vwapUpper = vwapVal + vwapBandMult * vwapDev
vwapLower = vwapVal - vwapBandMult * vwapDev`,
    longSignal: () => 'low[1] <= vwapLower[1] and close[1] > open[1]',
    shortSignal: () => 'high[1] >= vwapUpper[1] and close[1] < open[1]',
    plots: () => `
plot(vwapVal, "VWAP", color.yellow, 2)
plot(vwapUpper, "VWAP Upper", color.new(color.blue, 50), 1)
plot(vwapLower, "VWAP Lower", color.new(color.red, 50), 1)`,
  },

  opening_range_breakout: {
    name: 'Opening Range Breakout',
    description: 'Breakout from the opening range',
    params: { orMins: 30, session: '0930-1600' },
    inputs: (p) => `
orMins_  = input.int(${p.orMins}, "OR Duration (min)", group="Entry: ORB")
orSession = input.session("${p.session}", "Session", group="Entry: ORB")`,
    calc: () => `
isInSession_ = not na(time(timeframe.period, orSession))
isNewSession_ = ta.change(time("D")) != 0
var float orH = na, var float orL = na
var bool orDone = false, var int orBars = 0
if isNewSession_
    orH := high, orL := low, orDone := false, orBars := 0
if isInSession_ and not orDone
    orBars += 1, orH := math.max(orH, high), orL := math.min(orL, low)
    if orBars >= orMins_ / timeframe.multiplier
        orDone := true`,
    longSignal: () => 'orDone and close[1] > orH',
    shortSignal: () => 'orDone and close[1] < orL',
    plots: () => `
plot(orDone ? orH : na, "OR High", color.green, 2, plot.style_stepline)
plot(orDone ? orL : na, "OR Low", color.red, 2, plot.style_stepline)`,
  },

  ichimoku: {
    name: 'Ichimoku Cloud',
    description: 'Ichimoku cloud breakout with TK cross',
    params: { tenkan: 9, kijun: 26, senkou: 52 },
    inputs: (p) => `
tenkanLen = input.int(${p.tenkan}, "Tenkan", group="Entry: Ichimoku")
kijunLen  = input.int(${p.kijun}, "Kijun", group="Entry: Ichimoku")
senkouLen = input.int(${p.senkou}, "Senkou B", group="Entry: Ichimoku")`,
    calc: () => `
tenkan  = (ta.highest(high, tenkanLen) + ta.lowest(low, tenkanLen)) / 2
kijun   = (ta.highest(high, kijunLen) + ta.lowest(low, kijunLen)) / 2
senkouA = (tenkan + kijun) / 2
senkouB = (ta.highest(high, senkouLen) + ta.lowest(low, senkouLen)) / 2
aboveCloud = close > math.max(senkouA[kijunLen], senkouB[kijunLen])
belowCloud = close < math.min(senkouA[kijunLen], senkouB[kijunLen])`,
    longSignal: () => 'ta.crossover(tenkan, kijun)[1] and aboveCloud[1]',
    shortSignal: () => 'ta.crossunder(tenkan, kijun)[1] and belowCloud[1]',
    plots: () => `
plot(tenkan, "Tenkan", color.blue, 1)
plot(kijun, "Kijun", color.red, 1)`,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// FILTER MODULES — Signal filters
// ═══════════════════════════════════════════════════════════════════════

const FILTER_MODULES = {

  trend_ema: {
    name: 'EMA Trend Filter',
    params: { trendLen: 200 },
    inputs: (p) => `
trendLen = input.int(${p.trendLen}, "Trend EMA Length", group="Filter: Trend")`,
    calc: () => `
trendEma = ta.ema(close, trendLen)
trendUp  = close > trendEma
trendDn  = close < trendEma`,
    longFilter: () => 'trendUp[1]',
    shortFilter: () => 'trendDn[1]',
  },

  volume: {
    name: 'Volume Filter',
    params: { volMult: 1.2 },
    inputs: (p) => `
volFilterMult = input.float(${p.volMult}, "Min Relative Volume", step=0.1, group="Filter: Volume")`,
    calc: () => `
avgVolFilter = ta.sma(volume, 20)
volOk = volume[1] >= avgVolFilter[1] * volFilterMult`,
    longFilter: () => 'volOk',
    shortFilter: () => 'volOk',
  },

  volatility_regime: {
    name: 'Volatility Regime Filter',
    params: {},
    inputs: () => `
useVolRegime = input.bool(true, "Volatility Regime Filter", group="Filter: Volatility")`,
    calc: () => `
vol5  = ta.stdev(math.log(close / close[1]), 5)
vol20 = ta.stdev(math.log(close / close[1]), 20)
volRatio = vol20 != 0 ? vol5 / vol20 : 1.0
volExpanding   = volRatio > 1.5
volCompressing = volRatio < 0.7`,
    longFilter: () => 'not useVolRegime or not volCompressing',
    shortFilter: () => 'not useVolRegime or not volCompressing',
  },

  time_session: {
    name: 'Session Time Filter',
    params: { session: '0930-1530' },
    inputs: (p) => `
sessionFilter = input.session("${p.session}", "Trading Session", group="Filter: Time")`,
    calc: () => `
inSession = not na(time(timeframe.period, sessionFilter))`,
    longFilter: () => 'inSession',
    shortFilter: () => 'inSession',
  },

  atr_regime: {
    name: 'ATR Regime Filter',
    params: { atrLen: 14, minAtrMult: 0.5 },
    inputs: (p) => `
atrFilterLen  = input.int(${p.atrLen}, "ATR Length", group="Filter: ATR")
minAtrMult_   = input.float(${p.minAtrMult}, "Min ATR Multiplier", step=0.1, group="Filter: ATR")`,
    calc: () => `
atrFilter     = ta.atr(atrFilterLen)
atrSma        = ta.sma(atrFilter, 50)
atrAboveMin   = atrFilter > atrSma * minAtrMult_`,
    longFilter: () => 'atrAboveMin[1]',
    shortFilter: () => 'atrAboveMin[1]',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// EXIT MODULES — Stop loss, take profit, trailing
// ═══════════════════════════════════════════════════════════════════════

const EXIT_MODULES = {

  atr_stop: {
    name: 'ATR Stop Loss / Take Profit',
    params: { atrLen: 14, stopMult: 2.0, tpMult: 3.0 },
    inputs: (p) => `
exitAtrLen = input.int(${p.atrLen}, "Exit ATR Length", group="Exit: ATR")
stopMult_  = input.float(${p.stopMult}, "Stop Loss (× ATR)", step=0.1, group="Exit: ATR")
tpMult_    = input.float(${p.tpMult}, "Take Profit (× ATR)", step=0.1, group="Exit: ATR")`,
    calc: () => `
exitAtr = ta.atr(exitAtrLen)`,
    exit: () => `
if strategy.position_size > 0
    strategy.exit("Long X", "Long",
        stop  = strategy.position_avg_price - stopMult_ * exitAtr,
        limit = strategy.position_avg_price + tpMult_ * exitAtr)
if strategy.position_size < 0
    strategy.exit("Short X", "Short",
        stop  = strategy.position_avg_price + stopMult_ * exitAtr,
        limit = strategy.position_avg_price - tpMult_ * exitAtr)`,
  },

  percent_stop: {
    name: 'Percentage Stop / Target',
    params: { stopPct: 2.0, tpPct: 4.0 },
    inputs: (p) => `
stopPct = input.float(${p.stopPct}, "Stop Loss %", step=0.1, group="Exit: Percent")
tpPct   = input.float(${p.tpPct}, "Take Profit %", step=0.1, group="Exit: Percent")`,
    calc: () => '',
    exit: () => `
if strategy.position_size > 0
    strategy.exit("Long X", "Long",
        stop  = strategy.position_avg_price * (1 - stopPct / 100),
        limit = strategy.position_avg_price * (1 + tpPct / 100))
if strategy.position_size < 0
    strategy.exit("Short X", "Short",
        stop  = strategy.position_avg_price * (1 + stopPct / 100),
        limit = strategy.position_avg_price * (1 - tpPct / 100))`,
  },

  trailing_stop: {
    name: 'Trailing Stop',
    params: { trailPct: 2.0 },
    inputs: (p) => `
trailPct_ = input.float(${p.trailPct}, "Trailing Stop %", step=0.1, group="Exit: Trailing")`,
    calc: () => '',
    exit: () => `
strategy.exit("Trail Long",  "Long",  trail_price=strategy.position_avg_price, trail_offset=close * trailPct_ / 100 / syminfo.mintick)
strategy.exit("Trail Short", "Short", trail_price=strategy.position_avg_price, trail_offset=close * trailPct_ / 100 / syminfo.mintick)`,
  },

  time_exit: {
    name: 'Time-Based Exit',
    params: { maxBars: 20, eodExit: true },
    inputs: (p) => `
maxBarsHeld = input.int(${p.maxBars}, "Max Bars in Trade", group="Exit: Time")
eodExit_    = input.bool(${p.eodExit}, "Exit at EOD", group="Exit: Time")`,
    calc: () => `
barsInTrade = strategy.position_size != 0 ? bar_index - strategy.opentrades.entry_bar_index(0) : 0
isEOD       = hour == 15 and minute >= 45`,
    exit: () => `
if barsInTrade >= maxBarsHeld and strategy.position_size != 0
    strategy.close_all(comment="Time Exit")
if eodExit_ and isEOD
    strategy.close_all(comment="EOD Exit")`,
  },

  chandelier_exit: {
    name: 'Chandelier Exit',
    params: { atrLen: 22, mult: 3.0 },
    inputs: (p) => `
chanAtrLen = input.int(${p.atrLen}, "Chandelier ATR", group="Exit: Chandelier")
chanMult   = input.float(${p.mult}, "Chandelier Mult", step=0.1, group="Exit: Chandelier")`,
    calc: () => `
chanAtr      = ta.atr(chanAtrLen)
chanLongStop = ta.highest(high, chanAtrLen) - chanMult * chanAtr
chanShortStop= ta.lowest(low, chanAtrLen)  + chanMult * chanAtr`,
    exit: () => `
if strategy.position_size > 0 and close < chanLongStop
    strategy.close("Long", comment="Chandelier")
if strategy.position_size < 0 and close > chanShortStop
    strategy.close("Short", comment="Chandelier")`,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// POSITION SIZING MODULES
// ═══════════════════════════════════════════════════════════════════════

const SIZING_MODULES = {

  fixed_percent: {
    name: 'Fixed Percent of Equity',
    strategyParam: 'default_qty_type=strategy.percent_of_equity, default_qty_value=10',
    code: () => '',
  },

  kelly: {
    name: 'Half Kelly Criterion',
    strategyParam: 'default_qty_type=strategy.percent_of_equity, default_qty_value=1',
    code: () => `
// ── Kelly Position Sizing ──
wins  = strategy.wintrades
total = strategy.closedtrades
winRate  = total > 10 ? wins / total : 0.5
avgWin   = strategy.grossprofit  / math.max(wins, 1)
avgLoss  = math.abs(strategy.grossloss) / math.max(total - wins, 1)
rr       = avgLoss != 0 ? avgWin / avgLoss : 1.0
kellyPct = winRate - (1 - winRate) / rr
halfKelly = math.max(kellyPct / 2, 0.01) * 100  // % of equity
// Note: Pine doesn't allow dynamic qty on strategy.entry; display as reference
var table kellyTbl = table.new(position.bottom_right, 2, 3, bgcolor=color.new(color.black, 80))
if barstate.islast
    table.cell(kellyTbl, 0, 0, "Win Rate", text_color=color.gray, text_size=size.tiny)
    table.cell(kellyTbl, 1, 0, str.tostring(winRate * 100, "#.#") + "%", text_color=color.white, text_size=size.tiny)
    table.cell(kellyTbl, 0, 1, "R:R", text_color=color.gray, text_size=size.tiny)
    table.cell(kellyTbl, 1, 1, str.tostring(rr, "#.##"), text_color=color.white, text_size=size.tiny)
    table.cell(kellyTbl, 0, 2, "Half Kelly", text_color=color.gray, text_size=size.tiny)
    table.cell(kellyTbl, 1, 2, str.tostring(halfKelly, "#.#") + "%", text_color=color.yellow, text_size=size.tiny)`,
  },

  volatility_adjusted: {
    name: 'Volatility-Adjusted Sizing',
    strategyParam: 'default_qty_type=strategy.percent_of_equity, default_qty_value=10',
    code: () => `
// ── Volatility-Adjusted Position Size Reference ──
targetVol   = 0.15  // 15% annualized vol target
annualFactor = math.sqrt(252)
realizedVol  = ta.stdev(math.log(close / close[1]), 20) * annualFactor
volScalar    = realizedVol > 0 ? targetVol / realizedVol : 1.0
adjPctEquity = math.min(math.max(10 * volScalar, 2), 25)  // clamp 2-25%`,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// STRATEGY COMPOSER
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build a complete Pine Script v6 strategy from modular components.
 *
 * @param {object} config
 * @param {string} config.title - Strategy title
 * @param {string[]} config.entries - Entry module names
 * @param {string[]} config.filters - Filter module names
 * @param {string} config.exit - Exit module name
 * @param {string} config.sizing - Position sizing module name
 * @param {object} config.params - Override default params per module
 * @param {boolean} config.longOnly - Long-only strategy
 * @param {number} config.capital - Initial capital
 * @param {number} config.commission - Commission percent
 * @param {number} config.slippage - Slippage in ticks
 * @returns {string} Complete Pine Script v6 strategy code
 */
export function buildStrategy(config) {
  const {
    title = 'Modular Strategy',
    entries = ['ema_cross'],
    filters = [],
    exit = 'atr_stop',
    sizing = 'fixed_percent',
    params = {},
    longOnly = false,
    capital = 100000,
    commission = 0.05,
    slippage = 2,
  } = config;

  const entryMods = entries.map(e => {
    const mod = ENTRY_MODULES[e];
    if (!mod) throw new Error(`Unknown entry module: ${e}`);
    return { ...mod, key: e, mergedParams: { ...mod.params, ...params[e] } };
  });

  const filterMods = filters.map(f => {
    const mod = FILTER_MODULES[f];
    if (!mod) throw new Error(`Unknown filter module: ${f}`);
    return { ...mod, key: f, mergedParams: { ...mod.params, ...params[f] } };
  });

  const exitMod = EXIT_MODULES[exit];
  if (!exitMod) throw new Error(`Unknown exit module: ${exit}`);
  const exitParams = { ...exitMod.params, ...params[exit] };

  const sizingMod = SIZING_MODULES[sizing] || SIZING_MODULES.fixed_percent;

  // Build code sections
  const sections = [];

  // Header
  sections.push(`//@version=6
strategy("${title}", overlay=true,
    initial_capital=${capital},
    ${sizingMod.strategyParam},
    commission_type=strategy.commission.percent,
    commission_value=${commission},
    slippage=${slippage},
    calc_on_every_tick=false,
    process_orders_on_close=false)`);

  // Inputs
  sections.push('\n// ══════════════════════════════════════');
  sections.push('// ── Inputs ──');
  for (const mod of entryMods) {
    sections.push(mod.inputs(mod.mergedParams));
  }
  for (const mod of filterMods) {
    sections.push(mod.inputs(mod.mergedParams));
  }
  sections.push(exitMod.inputs(exitParams));

  // Calculations
  sections.push('\n// ══════════════════════════════════════');
  sections.push('// ── Calculations ──');
  for (const mod of entryMods) {
    sections.push(mod.calc());
  }
  for (const mod of filterMods) {
    sections.push(mod.calc());
  }
  sections.push(exitMod.calc());

  // Signals
  sections.push('\n// ══════════════════════════════════════');
  sections.push('// ── Signals ──');

  // Combine entry signals with OR (any entry triggers)
  const longSignals = entryMods.map(m => `(${m.longSignal()})`).join(' or ');
  const shortSignals = entryMods.map(m => `(${m.shortSignal()})`).join(' or ');

  // Combine filters with AND
  const longFilters = filterMods.map(m => m.longFilter()).join(' and ');
  const shortFilters = filterMods.map(m => m.shortFilter()).join(' and ');

  const longFinal = longFilters ? `(${longSignals}) and ${longFilters}` : longSignals;
  const shortFinal = shortFilters ? `(${shortSignals}) and ${shortFilters}` : shortSignals;

  sections.push(`longEntry  = ${longFinal}`);
  if (!longOnly) {
    sections.push(`shortEntry = ${shortFinal}`);
  }

  // Execution
  sections.push('\n// ══════════════════════════════════════');
  sections.push('// ── Execution ──');
  sections.push(`if longEntry and strategy.position_size == 0
    strategy.entry("Long", strategy.long)`);

  if (!longOnly) {
    sections.push(`if shortEntry and strategy.position_size == 0
    strategy.entry("Short", strategy.short)`);
  }

  // Exit
  sections.push('\n// ── Exits ──');
  sections.push(exitMod.exit());

  // Position sizing code (if any)
  const sizingCode = sizingMod.code();
  if (sizingCode) {
    sections.push('\n// ── Position Sizing ──');
    sections.push(sizingCode);
  }

  // Plots
  sections.push('\n// ══════════════════════════════════════');
  sections.push('// ── Plots ──');
  for (const mod of entryMods) {
    const p = mod.plots();
    if (p) sections.push(p);
  }

  sections.push(`
plotshape(longEntry,  "Long",  shape.triangleup,   location.belowbar, color.lime, size=size.small)
plotshape(${longOnly ? 'false' : 'shortEntry'}, "Short", shape.triangledown, location.abovebar, color.red,  size=size.small)
bgcolor(strategy.position_size > 0 ? color.new(color.green, 95) :
        strategy.position_size < 0 ? color.new(color.red, 95) : na)`);

  return sections.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * List available modules by type.
 */
export function listModules(type = 'all') {
  const result = {};
  if (type === 'all' || type === 'entry') {
    result.entries = Object.entries(ENTRY_MODULES).map(([k, v]) => ({
      key: k, name: v.name, description: v.description, params: v.params,
    }));
  }
  if (type === 'all' || type === 'filter') {
    result.filters = Object.entries(FILTER_MODULES).map(([k, v]) => ({
      key: k, name: v.name, params: v.params,
    }));
  }
  if (type === 'all' || type === 'exit') {
    result.exits = Object.entries(EXIT_MODULES).map(([k, v]) => ({
      key: k, name: v.name, params: v.params,
    }));
  }
  if (type === 'all' || type === 'sizing') {
    result.sizing = Object.entries(SIZING_MODULES).map(([k, v]) => ({
      key: k, name: v.name,
    }));
  }
  return result;
}

/**
 * Quick-build preset strategies.
 */
export const STRATEGY_PRESETS = {

  trend_following: {
    title: 'Trend Following (EMA + Supertrend)',
    entries: ['ema_cross', 'supertrend'],
    filters: ['trend_ema', 'volume'],
    exit: 'trailing_stop',
    sizing: 'fixed_percent',
  },

  mean_reversion: {
    title: 'Mean Reversion (Z-Score + RSI)',
    entries: ['zscore_mean_reversion', 'rsi_reversal'],
    filters: ['volatility_regime', 'volume'],
    exit: 'atr_stop',
    sizing: 'kelly',
  },

  momentum_breakout: {
    title: 'Momentum Breakout (Bollinger + MACD)',
    entries: ['bollinger_squeeze', 'macd_signal'],
    filters: ['trend_ema', 'atr_regime'],
    exit: 'chandelier_exit',
    sizing: 'fixed_percent',
  },

  intraday_orb: {
    title: 'Intraday ORB + VWAP',
    entries: ['opening_range_breakout', 'vwap_fade'],
    filters: ['time_session', 'volume'],
    exit: 'time_exit',
    sizing: 'volatility_adjusted',
  },

  ichimoku_trend: {
    title: 'Ichimoku Cloud Trend',
    entries: ['ichimoku'],
    filters: ['trend_ema', 'volume'],
    exit: 'atr_stop',
    sizing: 'fixed_percent',
  },
};

/**
 * Build a strategy from a preset name.
 */
export function buildPreset(presetName, overrides = {}) {
  const preset = STRATEGY_PRESETS[presetName];
  if (!preset) throw new Error(`Unknown preset: ${presetName}. Available: ${Object.keys(STRATEGY_PRESETS).join(', ')}`);
  return buildStrategy({ ...preset, ...overrides });
}
