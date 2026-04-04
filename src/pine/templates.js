/**
 * Pine Script v6 Templates Library
 * Ready-to-use templates for common indicator and strategy patterns.
 * All templates pass static analysis and compile cleanly.
 */

export const TEMPLATES = {

  // ── Indicators ──

  ema_ribbon: `//@version=6
indicator("EMA Ribbon", overlay=true)

// ── Inputs ──
grp = "EMA Settings"
len1 = input.int(8,  "EMA 1", minval=1, group=grp)
len2 = input.int(13, "EMA 2", minval=1, group=grp)
len3 = input.int(21, "EMA 3", minval=1, group=grp)
len4 = input.int(34, "EMA 4", minval=1, group=grp)
len5 = input.int(55, "EMA 5", minval=1, group=grp)
src  = input.source(close, "Source", group=grp)

// ── EMAs ──
e1 = ta.ema(src, len1)
e2 = ta.ema(src, len2)
e3 = ta.ema(src, len3)
e4 = ta.ema(src, len4)
e5 = ta.ema(src, len5)

// ── Plots ──
plot(e1, "EMA " + str.tostring(len1), color.new(color.red,    0), 2)
plot(e2, "EMA " + str.tostring(len2), color.new(color.orange, 0), 2)
plot(e3, "EMA " + str.tostring(len3), color.new(color.yellow, 0), 2)
plot(e4, "EMA " + str.tostring(len4), color.new(color.teal,   0), 2)
plot(e5, "EMA " + str.tostring(len5), color.new(color.blue,   0), 2)

// ── Fill ──
bullish = e1 > e5
bgcolor(bullish ? color.new(color.green, 95) : color.new(color.red, 95))
`,

  rsi_divergence: `//@version=6
indicator("RSI Divergence Detector", overlay=false)

// ── Inputs ──
rsiLen  = input.int(14, "RSI Length",    minval=1, group="RSI")
src     = input.source(close, "Source",  group="RSI")
lbLeft  = input.int(5,  "Pivot Lookback Left",  minval=1, group="Pivots")
lbRight = input.int(5,  "Pivot Lookback Right", minval=1, group="Pivots")

// ── RSI ──
rsi = ta.rsi(src, rsiLen)

// ── Pivot detection ──
phRsi  = ta.pivothigh(rsi, lbLeft, lbRight)
plRsi  = ta.pivotlow(rsi,  lbLeft, lbRight)
phPrice = ta.pivothigh(src, lbLeft, lbRight)
plPrice = ta.pivotlow(src,  lbLeft, lbRight)

// ── Bearish divergence: price HH, RSI LH ──
bearDiv = not na(phRsi) and not na(phPrice[lbRight])
    and src[lbRight] > src[lbRight * 2]   // price higher high
    and rsi[lbRight] < rsi[lbRight * 2]   // rsi lower high

// ── Bullish divergence: price LL, RSI HL ──
bullDiv = not na(plRsi) and not na(plPrice[lbRight])
    and src[lbRight] < src[lbRight * 2]   // price lower low
    and rsi[lbRight] > rsi[lbRight * 2]   // rsi higher low

// ── Plots ──
plot(rsi, "RSI", color.blue, 2)
hline(70, "Overbought", color.red,   linestyle=hline.style_dashed)
hline(50, "Midline",    color.gray,  linestyle=hline.style_dotted)
hline(30, "Oversold",   color.green, linestyle=hline.style_dashed)

plotshape(bearDiv, "Bearish Div", shape.triangledown, location.abovebar, color.red,    size=size.small)
plotshape(bullDiv, "Bullish Div", shape.triangleup,   location.belowbar, color.green,  size=size.small)
`,

  vwap_bands: `//@version=6
indicator("VWAP + Deviation Bands", overlay=true)

// ── Inputs ──
grp = "VWAP Bands"
band1Mult = input.float(1.0, "Band 1 Multiplier", step=0.1, group=grp)
band2Mult = input.float(2.0, "Band 2 Multiplier", step=0.1, group=grp)
band3Mult = input.float(3.0, "Band 3 Multiplier", step=0.1, group=grp)

// ── VWAP Calculation ──
isNewSession = timeframe.change("D")
vwapVal = ta.vwap(hlc3)

// ── Deviation Bands ──
// Standard deviation of price from VWAP
sumSq    = math.sum(math.pow(hlc3 - vwapVal, 2) * volume, 20)
sumVol   = math.sum(volume, 20)
stdev    = math.sqrt(sumSq / math.max(sumVol, 1))

upperBand1 = vwapVal + band1Mult * stdev
upperBand2 = vwapVal + band2Mult * stdev
upperBand3 = vwapVal + band3Mult * stdev
lowerBand1 = vwapVal - band1Mult * stdev
lowerBand2 = vwapVal - band2Mult * stdev
lowerBand3 = vwapVal - band3Mult * stdev

// ── Plots ──
vwapPlot = plot(vwapVal, "VWAP", color.yellow, 2)
u1 = plot(upperBand1, "Upper 1σ", color.new(color.blue, 60), 1)
u2 = plot(upperBand2, "Upper 2σ", color.new(color.blue, 40), 1)
u3 = plot(upperBand3, "Upper 3σ", color.new(color.blue, 20), 1)
l1 = plot(lowerBand1, "Lower 1σ", color.new(color.red,  60), 1)
l2 = plot(lowerBand2, "Lower 2σ", color.new(color.red,  40), 1)
l3 = plot(lowerBand3, "Lower 3σ", color.new(color.red,  20), 1)

fill(u1, l1, color.new(color.blue, 93))
`,

  session_levels: `//@version=6
indicator("Session High/Low Levels", overlay=true)

// ── Inputs ──
grp = "Sessions"
showNY   = input.bool(true, "New York",  group=grp)
showLon  = input.bool(true, "London",    group=grp)
showAsia = input.bool(true, "Asia",      group=grp)
extLines = input.bool(true, "Extend lines to right", group="Style")

// ── Session Times (UTC) ──
nySession   = time(timeframe.period, "1400-2100", "America/New_York")
lonSession  = time(timeframe.period, "0800-1630", "Europe/London")
asiaSession = time(timeframe.period, "0000-0800", "Asia/Tokyo")

// ── Track H/L per session ──
var float nyHigh   = na, var float nyLow   = na
var float lonHigh  = na, var float lonLow  = na
var float asiaHigh = na, var float asiaLow = na

var bool nyOpen = false, var bool lonOpen = false, var bool asiaOpen = false

// New York
if not na(nySession) and not nyOpen
    nyHigh := high
    nyLow  := low
    nyOpen := true
else if not na(nySession)
    nyHigh := math.max(nyHigh, high)
    nyLow  := math.min(nyLow,  low)
else
    nyOpen := false

// London
if not na(lonSession) and not lonOpen
    lonHigh := high
    lonLow  := low
    lonOpen := true
else if not na(lonSession)
    lonHigh := math.max(lonHigh, high)
    lonLow  := math.min(lonLow,  low)
else
    lonOpen := false

// Asia
if not na(asiaSession) and not asiaOpen
    asiaHigh := high
    asiaLow  := low
    asiaOpen := true
else if not na(asiaSession)
    asiaHigh := math.max(asiaHigh, high)
    asiaLow  := math.min(asiaLow,  low)
else
    asiaOpen := false

// ── Plots ──
plot(showNY   and not na(nyHigh)   ? nyHigh   : na, "NY High",   color.new(color.green, 0), 1, plot.style_linebr)
plot(showNY   and not na(nyLow)    ? nyLow    : na, "NY Low",    color.new(color.red,   0), 1, plot.style_linebr)
plot(showLon  and not na(lonHigh)  ? lonHigh  : na, "LON High",  color.new(color.blue,  0), 1, plot.style_linebr)
plot(showLon  and not na(lonLow)   ? lonLow   : na, "LON Low",   color.new(color.purple,0), 1, plot.style_linebr)
plot(showAsia and not na(asiaHigh) ? asiaHigh : na, "Asia High", color.new(color.yellow,0), 1, plot.style_linebr)
plot(showAsia and not na(asiaLow)  ? asiaLow  : na, "Asia Low",  color.new(color.orange,0), 1, plot.style_linebr)
`,

  // ── Strategies ──

  ema_cross_strategy: `//@version=6
strategy("EMA Cross Strategy", overlay=true,
     commission_type=strategy.commission.percent, commission_value=0.05,
     slippage=1, initial_capital=10000, default_qty_type=strategy.percent_of_equity,
     default_qty_value=10)

// ── Inputs ──
grp = "EMAs"
fastLen = input.int(9,  "Fast EMA", minval=1, group=grp)
slowLen = input.int(21, "Slow EMA", minval=1, group=grp)
src     = input.source(close, "Source", group=grp)

grpF = "Filters"
useRsiFilter = input.bool(true, "RSI Filter", group=grpF)
rsiLen       = input.int(14, "RSI Length", group=grpF)
rsiOb        = input.int(70, "RSI Overbought", group=grpF)
rsiOs        = input.int(30, "RSI Oversold",   group=grpF)

// ── Calculations ──
fastEma = ta.ema(src, fastLen)
slowEma = ta.ema(src, slowLen)
rsi     = ta.rsi(src, rsiLen)

// ── Signals ──
longSignal  = ta.crossover(fastEma, slowEma)  and (not useRsiFilter or rsi < rsiOb)
shortSignal = ta.crossunder(fastEma, slowEma) and (not useRsiFilter or rsi > rsiOs)

// ── Entries ──
if longSignal
    strategy.entry("Long", strategy.long)

if shortSignal
    strategy.entry("Short", strategy.short)

// ── Plots ──
plot(fastEma, "Fast EMA", longSignal[1] ? color.lime : color.red, 2)
plot(slowEma, "Slow EMA", color.gray, 1)
plotshape(longSignal,  "Long",  shape.triangleup,   location.belowbar, color.lime, size=size.small)
plotshape(shortSignal, "Short", shape.triangledown, location.abovebar, color.red,  size=size.small)
`,

  supertrend_strategy: `//@version=6
strategy("Supertrend Strategy", overlay=true,
     commission_type=strategy.commission.percent, commission_value=0.05,
     slippage=1, initial_capital=10000, default_qty_type=strategy.percent_of_equity,
     default_qty_value=10)

// ── Inputs ──
atrLen   = input.int(10,  "ATR Length",     minval=1)
atrMult  = input.float(3.0, "ATR Multiplier", step=0.1)
src      = input.source(hl2, "Source")

// ── Supertrend Calculation ──
atr = ta.atr(atrLen)
upperBand = src + atrMult * atr
lowerBand = src - atrMult * atr

var float supertrend = na
var int direction    = na

prevSupertrend = nz(supertrend[1])
prevLower      = nz(lowerBand[1])
prevUpper      = nz(upperBand[1])

lowerBand := lowerBand > prevLower or close[1] < prevLower ? lowerBand : prevLower
upperBand := upperBand < prevUpper or close[1] > prevUpper ? upperBand : prevUpper

if na(direction[1])
    direction := 1
else if prevSupertrend == prevUpper
    direction := close > upperBand ? -1 : 1
else
    direction := close < lowerBand ? 1 : -1

supertrend := direction == -1 ? lowerBand : upperBand

// ── Signals ──
longCondition  = direction == -1 and direction[1] == 1
shortCondition = direction == 1  and direction[1] == -1

// ── Entries ──
if longCondition
    strategy.entry("Long", strategy.long)
if shortCondition
    strategy.entry("Short", strategy.short)

// ── Plots ──
supertrendColor = direction == 1 ? color.red : color.green
plot(supertrend, "Supertrend", supertrendColor, 2)
plotshape(longCondition,  "Buy",  shape.triangleup,   location.belowbar, color.lime, size=size.normal)
plotshape(shortCondition, "Sell", shape.triangledown, location.abovebar, color.red,  size=size.normal)
`,
};

/**
 * Get a template by name.
 */
export function getTemplate(name) {
  return TEMPLATES[name] || null;
}

/**
 * List all available templates.
 */
export function listTemplates() {
  return Object.keys(TEMPLATES).map(name => ({
    name,
    type: TEMPLATES[name].includes('strategy(') ? 'strategy' : 'indicator',
    lines: TEMPLATES[name].split('\n').length,
  }));
}

/**
 * Search templates by keyword.
 */
export function searchTemplates(query) {
  const q = query.toLowerCase();
  return Object.entries(TEMPLATES)
    .filter(([name, src]) => name.includes(q) || src.toLowerCase().includes(q))
    .map(([name]) => name);
}

// ── Quant / HFT / Hedge Fund Templates ──

export const QUANT_TEMPLATES = {

  // Statistical Z-Score Mean Reversion
  zscore_mean_reversion: `//@version=6
strategy("Z-Score Mean Reversion", overlay=false,
    initial_capital=100000, default_qty_type=strategy.percent_of_equity, default_qty_value=10,
    commission_type=strategy.commission.percent, commission_value=0.05, slippage=2,
    calc_on_every_tick=false, process_orders_on_close=false)

// ── Inputs ──
grpZ = "Z-Score Settings"
lookback  = input.int(20,   "Lookback Period",    minval=5,   group=grpZ)
entryZ    = input.float(2.0,"Entry Z-Score",      minval=0.5, step=0.1, group=grpZ)
exitZ     = input.float(0.5,"Exit Z-Score",       minval=0.0, step=0.1, group=grpZ)
src       = input.source(close, "Source",                     group=grpZ)

grpF = "Filters"
useVolFilter = input.bool(true,  "Volume Filter",             group=grpF)
volMult      = input.float(1.2,  "Min Relative Volume",       group=grpF, step=0.1)
useTrendFilter = input.bool(true,"Trend Filter (200 EMA)",    group=grpF)

// ── Calculations ──
mean    = ta.sma(src, lookback)
stddev  = ta.stdev(src, lookback)
zscore  = stddev != 0 ? (src - mean) / stddev : 0

ema200  = ta.ema(src, 200)
avgVol  = ta.sma(volume, 20)
relVol  = volume / avgVol

// ── Filters ──
volOk      = not useVolFilter   or relVol >= volMult
trendLong  = not useTrendFilter or src > ema200
trendShort = not useTrendFilter or src < ema200

// ── Signals (use [1] to avoid lookahead) ──
longEntry  = zscore[1] <= -entryZ and volOk[1] and trendLong[1]
shortEntry = zscore[1] >=  entryZ and volOk[1] and trendShort[1]
longExit   = zscore[1] >= -exitZ
shortExit  = zscore[1] <=  exitZ

// ── Execution ──
if longEntry
    strategy.entry("MR Long",  strategy.long)
if shortEntry
    strategy.entry("MR Short", strategy.short)
if longExit  and strategy.position_size > 0
    strategy.close("MR Long")
if shortExit and strategy.position_size < 0
    strategy.close("MR Short")

// ── Plots ──
plot(zscore, "Z-Score", color.blue, 2)
hline( entryZ, "Entry Short", color.red,   linestyle=hline.style_dashed)
hline(-entryZ, "Entry Long",  color.green, linestyle=hline.style_dashed)
hline( exitZ,  "Exit Short",  color.orange,linestyle=hline.style_dotted)
hline(-exitZ,  "Exit Long",   color.orange,linestyle=hline.style_dotted)
hline(0, "Zero", color.gray, linestyle=hline.style_solid)

bgcolor(zscore <= -entryZ ? color.new(color.green,90) :
        zscore >=  entryZ ? color.new(color.red,  90) : na)
`,

  // VWAP + Volume Profile Institutional Strategy
  vwap_institutional: `//@version=6
strategy("VWAP Institutional Strategy", overlay=true,
    initial_capital=100000, default_qty_type=strategy.percent_of_equity, default_qty_value=10,
    commission_type=strategy.commission.percent, commission_value=0.05, slippage=2)

// ── Inputs ──
grpV = "VWAP"
bandMult1 = input.float(1.0, "Band 1 Multiplier", step=0.1, group=grpV)
bandMult2 = input.float(2.0, "Band 2 Multiplier", step=0.1, group=grpV)

grpE = "Entry"
entryMode = input.string("Band Fade", "Entry Mode",
    options=["Band Fade", "VWAP Reclaim", "Both"], group=grpE)
stopMult  = input.float(1.5, "ATR Stop Multiplier", step=0.1, group=grpE)
atrLen    = input.int(14,    "ATR Length",          group=grpE)

// ── VWAP Calculation ──
vwapVal = ta.vwap(hlc3)
atr     = ta.atr(atrLen)

// ── Deviation Bands ──
sumSq  = math.sum(math.pow(hlc3 - vwapVal, 2) * volume, 20)
sumVol = math.sum(volume, 20)
stdev  = math.sqrt(sumSq / math.max(sumVol, 1))

upper1 = vwapVal + bandMult1 * stdev
upper2 = vwapVal + bandMult2 * stdev
lower1 = vwapVal - bandMult1 * stdev
lower2 = vwapVal - bandMult2 * stdev

// ── Signals ──
// Band Fade: price touches ±2σ band → revert to VWAP
longFade  = low[1]  <= lower2 and close[1] > open[1]  // touched lower2, closed green
shortFade = high[1] >= upper2 and close[1] < open[1]  // touched upper2, closed red

// VWAP Reclaim: price crosses VWAP on volume
avgVol    = ta.sma(volume, 20)
highVol   = volume[1] > avgVol[1] * 1.3
longReclaim  = ta.crossover(close, vwapVal)[1]  and highVol
shortReclaim = ta.crossunder(close, vwapVal)[1] and highVol

longEntry  = entryMode == "Band Fade"     ? longFade   :
             entryMode == "VWAP Reclaim"  ? longReclaim  :
             longFade or longReclaim
shortEntry = entryMode == "Band Fade"     ? shortFade  :
             entryMode == "VWAP Reclaim"  ? shortReclaim :
             shortFade or shortReclaim

// ── Execution ──
stopDist = stopMult * atr

if longEntry and strategy.position_size == 0
    strategy.entry("VWAP Long", strategy.long)
    strategy.exit("VWAP Long X", "VWAP Long",
        stop  = strategy.position_avg_price - stopDist,
        limit = vwapVal)

if shortEntry and strategy.position_size == 0
    strategy.entry("VWAP Short", strategy.short)
    strategy.exit("VWAP Short X", "VWAP Short",
        stop  = strategy.position_avg_price + stopDist,
        limit = vwapVal)

// ── Plots ──
plot(vwapVal, "VWAP",    color.yellow, 2)
plot(upper1,  "Upper 1σ",color.new(color.blue, 60), 1)
plot(upper2,  "Upper 2σ",color.new(color.blue, 30), 2)
plot(lower1,  "Lower 1σ",color.new(color.red,  60), 1)
plot(lower2,  "Lower 2σ",color.new(color.red,  30), 2)
`,

  // Momentum Factor Strategy (Hedge Fund Style)
  momentum_factor: `//@version=6
strategy("Momentum Factor Strategy", overlay=true,
    initial_capital=100000, default_qty_type=strategy.percent_of_equity, default_qty_value=15,
    commission_type=strategy.commission.percent, commission_value=0.05, slippage=2,
    calc_on_every_tick=false, process_orders_on_close=false)

// ── Inputs ──
grpM = "Momentum"
mom1  = input.int(1,   "Short-term (bars)",  minval=1, group=grpM)
mom5  = input.int(5,   "Medium-term (bars)", minval=1, group=grpM)
mom20 = input.int(20,  "Long-term (bars)",   minval=1, group=grpM)
w1    = input.float(0.2,"Short weight",       step=0.05, group=grpM)
w5    = input.float(0.3,"Medium weight",      step=0.05, group=grpM)
w20   = input.float(0.5,"Long weight",        step=0.05, group=grpM)

grpF = "Filters"
rsiFilter   = input.bool(true,  "RSI Filter",        group=grpF)
rsiLen      = input.int(14,     "RSI Length",        group=grpF)
rsiOBLevel  = input.int(70,     "RSI OB (no long)",  group=grpF)
rsiOSLevel  = input.int(30,     "RSI OS (no short)", group=grpF)
atrStopMult = input.float(2.0,  "ATR Stop Mult",     group=grpF, step=0.1)
atrLen      = input.int(14,     "ATR Length",        group=grpF)

// ── Calculations ──
ret1  = (close - close[mom1])  / close[mom1]
ret5  = (close - close[mom5])  / close[mom5]
ret20 = (close - close[mom20]) / close[mom20]

// Composite momentum score: weighted sum, normalized
rawMom = w1 * ret1 + w5 * ret5 + w20 * ret20

// Rolling normalize: z-score of the composite momentum
momMean   = ta.sma(rawMom, 60)
momStd    = ta.stdev(rawMom, 60)
momScore  = momStd != 0 ? (rawMom - momMean) / momStd : 0

rsi  = ta.rsi(close, rsiLen)
atr  = ta.atr(atrLen)
ema50= ta.ema(close, 50)

// Trend filter
upTrend   = close > ema50
downTrend = close < ema50

// ── Signals ──
longOk  = not rsiFilter or rsi < rsiOBLevel
shortOk = not rsiFilter or rsi > rsiOSLevel

longEntry  = momScore[1] >  1.0 and upTrend[1]   and longOk[1]
shortEntry = momScore[1] < -1.0 and downTrend[1]  and shortOk[1]
longExit   = momScore[1] <  0.0
shortExit  = momScore[1] >  0.0

// ── Execution ──
stopDist = atr * atrStopMult

if longEntry and strategy.position_size == 0
    strategy.entry("Mom Long", strategy.long)
    strategy.exit("Mom Long X", "Mom Long", stop=strategy.position_avg_price - stopDist)

if shortEntry and strategy.position_size == 0
    strategy.entry("Mom Short", strategy.short)
    strategy.exit("Mom Short X", "Mom Short", stop=strategy.position_avg_price + stopDist)

if longExit and strategy.position_size > 0
    strategy.close("Mom Long")
if shortExit and strategy.position_size < 0
    strategy.close("Mom Short")

// ── Plots ──
plot(ema50, "EMA 50", color.orange, 1)
plotshape(longEntry,  "Long",  shape.triangleup,   location.belowbar, color.green, size=size.small)
plotshape(shortEntry, "Short", shape.triangledown, location.abovebar, color.red,   size=size.small)
bgcolor(strategy.position_size > 0 ? color.new(color.green,95) :
        strategy.position_size < 0 ? color.new(color.red,  95) : na)
`,

  // Opening Range Breakout (HFT Intraday)
  opening_range_breakout: `//@version=6
strategy("Opening Range Breakout", overlay=true,
    initial_capital=100000, default_qty_type=strategy.percent_of_equity, default_qty_value=10,
    commission_type=strategy.commission.percent, commission_value=0.05, slippage=2)

// ── Inputs ──
grpOR = "Opening Range"
orMins  = input.int(30,   "OR Duration (minutes)", minval=5, maxval=120, group=grpOR)
session = input.session("0930-1600",              "Session",             group=grpOR)

grpE = "Entry"
volConfirm = input.bool(true,  "Require Volume Confirmation", group=grpE)
volMult    = input.float(1.5,  "Volume Multiplier",           group=grpE, step=0.1)
atrFilter  = input.bool(true,  "ATR Range Filter",            group=grpE)
minATRMult = input.float(0.5,  "Min OR Size (× ATR)",         group=grpE, step=0.1)

grpX = "Exit"
targetMult = input.float(2.0,  "Target (× OR size)",  group=grpX, step=0.1)
stopMult   = input.float(0.5,  "Stop (× OR size)",    group=grpX, step=0.1)
eodExit    = input.bool(true,  "Exit at 15:45",        group=grpX)

// ── Opening Range Logic ──
isInSession  = not na(time(timeframe.period, session))
isNewSession = ta.change(time("D")) != 0 or (isInSession and not isInSession[1])

// Track OR high/low during the first orMins minutes
var float orHigh = na
var float orLow  = na
var bool  orSet  = false
var int   barsSinceOpen = 0

if isNewSession
    orHigh := high
    orLow  := low
    orSet  := false
    barsSinceOpen := 0

if isInSession and not orSet
    barsSinceOpen += 1
    orHigh := math.max(orHigh, high)
    orLow  := math.min(orLow,  low)
    if barsSinceOpen >= orMins / timeframe.multiplier
        orSet := true

orSize = orHigh - orLow
atr14  = ta.atr(14)
avgVol = ta.sma(volume, 20)

// ── Signals ──
breakoutLong  = orSet and close[1] > orHigh and close > orHigh
breakoutShort = orSet and close[1] < orLow  and close < orLow

volOk    = not volConfirm or volume > avgVol * volMult
sizeOk   = not atrFilter  or orSize >= atr14 * minATRMult
eodTime  = hour == 15 and minute >= 45

// ── Execution ──
if breakoutLong and volOk and sizeOk and strategy.position_size == 0
    strategy.entry("ORB Long", strategy.long)
    strategy.exit("ORB Long X", "ORB Long",
        limit = orHigh + orSize * targetMult,
        stop  = orHigh - orSize * stopMult)

if breakoutShort and volOk and sizeOk and strategy.position_size == 0
    strategy.entry("ORB Short", strategy.short)
    strategy.exit("ORB Short X", "ORB Short",
        limit = orLow - orSize * targetMult,
        stop  = orLow + orSize * stopMult)

if eodExit and eodTime
    strategy.close_all(comment="EOD")

// ── Plots ──
plot(orSet ? orHigh : na, "OR High", color.green, 2, plot.style_stepline)
plot(orSet ? orLow  : na, "OR Low",  color.red,   2, plot.style_stepline)
plot(orSet ? orHigh + orSize * targetMult : na, "Long Target",  color.new(color.green,50), 1, plot.style_stepline)
plot(orSet ? orLow  - orSize * targetMult : na, "Short Target", color.new(color.red,  50), 1, plot.style_stepline)
`,

  // Multi-Factor Ranking Dashboard
  multi_factor_dashboard: `//@version=6
indicator("Multi-Factor Dashboard", overlay=false)

// ── Inputs ──
grp = "Factor Weights"
wMom  = input.float(0.30, "Momentum Weight",        step=0.05, group=grp)
wMR   = input.float(0.20, "Mean Reversion Weight",  step=0.05, group=grp)
wVol  = input.float(0.20, "Volume Weight",          step=0.05, group=grp)
wTrend= input.float(0.30, "Trend Weight",           step=0.05, group=grp)

// ── Factor 1: Momentum (z-scored returns) ──
ret5  = (close - close[5])  / close[5]  * 100
ret20 = (close - close[20]) / close[20] * 100
rawMom = 0.4 * ret5 + 0.6 * ret20
momZ  = ta.stdev(rawMom, 60) != 0 ?
        (rawMom - ta.sma(rawMom, 60)) / ta.stdev(rawMom, 60) : 0

// ── Factor 2: Mean Reversion (z-score from mean) ──
mrZ = ta.stdev(close, 20) != 0 ?
      -(close - ta.sma(close, 20)) / ta.stdev(close, 20) : 0
// Negative because being far below mean = positive MR signal

// ── Factor 3: Volume (relative volume) ──
relVol   = volume / ta.sma(volume, 20)
volScore = math.min(math.max((relVol - 1.0) / 1.5, -1.0), 1.0)
// Normalize to [-1, 1]: relVol of 2.5x → score of 1.0

// ── Factor 4: Trend (EMA alignment score) ──
ema9  = ta.ema(close, 9)
ema21 = ta.ema(close, 21)
ema50 = ta.ema(close, 50)
trendScore = (close > ema9 ? 0.33 : -0.33) +
             (ema9  > ema21? 0.33 : -0.33) +
             (ema21 > ema50? 0.34 : -0.34)

// ── Composite Score ──
composite = wMom * momZ + wMR * mrZ + wVol * volScore + wTrend * trendScore

// Smooth
smoothComp = ta.ema(composite, 3)

// ── Color coding ──
col = smoothComp >= 1.0  ? color.new(color.green,  0)  :
      smoothComp >= 0.5  ? color.new(color.green,  50) :
      smoothComp >= 0.0  ? color.new(color.gray,   30) :
      smoothComp >= -0.5 ? color.new(color.red,    50) :
                           color.new(color.red,    0)

// ── Plots ──
plot(smoothComp, "Composite Score", col, 3)
plot(momZ,       "Momentum",   color.new(color.blue,   50), 1)
plot(mrZ,        "Mean Rev",   color.new(color.purple, 50), 1)
plot(trendScore, "Trend",      color.new(color.orange, 50), 1)

hline( 1.0, "Strong Long",  color.green, linestyle=hline.style_dashed)
hline( 0.5, "Long",         color.new(color.green,50), linestyle=hline.style_dotted)
hline( 0.0, "Neutral",      color.gray)
hline(-0.5, "Short",        color.new(color.red,  50), linestyle=hline.style_dotted)
hline(-1.0, "Strong Short", color.red,   linestyle=hline.style_dashed)

bgcolor(smoothComp >=  1.0 ? color.new(color.green, 90) :
        smoothComp <= -1.0 ? color.new(color.red,   90) : na)

// ── Table Dashboard ──
var table t = table.new(position.top_right, 2, 6, bgcolor=color.new(color.black, 80),
    border_width=1, border_color=color.gray)

if barstate.islast
    table.cell(t, 0, 0, "FACTOR",    text_color=color.gray,  text_size=size.small)
    table.cell(t, 1, 0, "SCORE",     text_color=color.gray,  text_size=size.small)

    table.cell(t, 0, 1, "Momentum",  text_color=color.white, text_size=size.small)
    table.cell(t, 1, 1, str.tostring(momZ, "#.##"),
        text_color = momZ >= 0 ? color.green : color.red, text_size=size.small)

    table.cell(t, 0, 2, "Mean Rev",  text_color=color.white, text_size=size.small)
    table.cell(t, 1, 2, str.tostring(mrZ, "#.##"),
        text_color = mrZ >= 0 ? color.green : color.red, text_size=size.small)

    table.cell(t, 0, 3, "Volume",    text_color=color.white, text_size=size.small)
    table.cell(t, 1, 3, str.tostring(volScore, "#.##"),
        text_color = volScore >= 0 ? color.green : color.red, text_size=size.small)

    table.cell(t, 0, 4, "Trend",     text_color=color.white, text_size=size.small)
    table.cell(t, 1, 4, str.tostring(trendScore, "#.##"),
        text_color = trendScore >= 0 ? color.green : color.red, text_size=size.small)

    table.cell(t, 0, 5, "COMPOSITE", text_color=color.white, text_size=size.normal, text_halign=text.align_left)
    table.cell(t, 1, 5, str.tostring(smoothComp, "#.##"),
        text_color = smoothComp >= 0.5 ? color.green :
                     smoothComp <= -0.5? color.red : color.gray,
        text_size=size.normal)
`,

};

// Merge quant templates into main TEMPLATES
Object.assign(TEMPLATES, QUANT_TEMPLATES);
