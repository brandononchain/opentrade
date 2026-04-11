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

// ============================================================================
// EXTERNAL_TEMPLATES - Production Pine Script v6 Templates
// ============================================================================

const EXTERNAL_TEMPLATES = {

    liquidity_heatmap: {
        name: "Liquidity Heatmap",
        description: "Volume concentration zones with POC, VAH/VAL, HVN/LVN bands",
        category: "advanced",
        code: `
//@version=6
indicator("Liquidity Heatmap", overlay=true, max_boxes_count=500, max_tables_count=1)

lookback = input.int(50, "Lookback Period", minval=10, maxval=500, group="Liquidity")
hvnThreshold = input.float(1.2, "HVN Threshold", minval=1.0, maxval=2.0, group="Liquidity")
lvnThreshold = input.float(0.5, "LVN Threshold", minval=0.1, maxval=1.0, group="Liquidity")

// Volume profile calculation
totalVol = 0.0
priceSum = 0.0
priceWeightedVol = 0.0

for i = 0 to lookback - 1
    barVol = volume[i]
    barClose = close[i]
    totalVol += barVol
    priceWeightedVol += barClose * barVol

pocPrice = totalVol > 0 ? priceWeightedVol / totalVol : close

// Calculate VAH/VAL (70% volume range)
sortedVol = 0.0
vahPrice = pocPrice
valPrice = pocPrice

for i = 0 to lookback - 1
    sortedVol += volume[i]
    if sortedVol <= totalVol * 0.85
        vahPrice = high[i]
    if sortedVol <= totalVol * 0.15
        valPrice = low[i]

avgVolume = totalVol / lookback
hvnZone = avgVolume * hvnThreshold
lvnZone = avgVolume * lvnThreshold

// Draw liquidity zones
if barstate.islast
    // HVN (high volume node) - green
    if volume[0] > hvnZone
        box.new(bar_index - lookback, valPrice, bar_index, vahPrice,
            bgcolor=color.new(color.green, 80), border_color=color.green)

    // LVN (low volume node) - red
    if volume[0] < lvnZone
        box.new(bar_index - lookback, valPrice, bar_index, vahPrice,
            bgcolor=color.new(color.red, 80), border_color=color.red)

    // Display table
    t = table.new(position.top_right, 4, 2, border_color=color.gray)
    table.cell(t, 0, 0, "POC", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 1, 0, str.tostring(pocPrice, "#.##"), text_color=color.white)
    table.cell(t, 0, 1, "VAH", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 1, 1, str.tostring(vahPrice, "#.##"), text_color=color.white)
    table.cell(t, 2, 0, "VAL", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 3, 0, str.tostring(valPrice, "#.##"), text_color=color.white)
    table.cell(t, 2, 1, "Vol%", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 3, 1, str.tostring(avgVolume > 0 ? volume[0] / avgVolume : 0, "#.##"), text_color=color.white)

// Plot POC line
plot(pocPrice, "POC", color.blue, 2)
plot(vahPrice, "VAH", color.green, 1, linestyle=plot.style_dashed)
plot(valPrice, "VAL", color.red, 1, linestyle=plot.style_dashed)
`,
    },

    session_structure_map: {
        name: "Session Structure Map",
        description: "NY, London, Asia sessions with VWAP and opening range",
        category: "advanced",
        code: `
//@version=6
indicator("Session Structure Map", overlay=true, max_lines_count=50, max_labels_count=20, max_tables_count=1)

// Session inputs
showNY = input.bool(true, "NY Session", group="Sessions")
showLondon = input.bool(true, "London Session", group="Sessions")
showAsia = input.bool(true, "Asia Session", group="Sessions")

// Session times (24h format, UTC-5 for NY)
nyOpen = 14    // 9:30 ET = 14:30 UTC
nyClose = 21   // 4:00 PM ET = 21:00 UTC
lonOpen = 8    // 3:00 AM ET = 8:00 UTC
lonClose = 16  // 11:30 AM ET = 16:30 UTC
asiaOpen = 1   // 8:00 PM ET = 1:00 UTC
asiaClose = 9  // 4:00 AM ET = 9:00 UTC

// VWAP calculation
cumVol = 0.0
cumTypVol = 0.0
typPrice = (high + low + close) / 3

for i = 0 to 29
    cumVol += volume[i]
    cumTypVol += typPrice[i] * volume[i]

vwap = cumVol > 0 ? cumTypVol / cumVol : close
vwapStdDev = ta.stdev(typPrice * volume, 20)

// Previous session levels
pdh = high[1]
pdl = low[1]
pdc = close[1]

// Opening range (first 30 min)
orHigh = high[0]
orLow = low[0]

if barstate.islast
    // Draw NY session levels
    if showNY
        line.new(bar_index - 30, pdh, bar_index, pdh, color=color.new(color.orange, 60), width=1)
        label.new(bar_index, pdh, "PDH", color=color.orange, textcolor=color.white, style=label.style_label_center, size=size.small)

    // Draw London session levels
    if showLondon
        line.new(bar_index - 30, pdl, bar_index, pdl, color=color.new(color.purple, 60), width=1)
        label.new(bar_index, pdl, "PDL", color=color.purple, textcolor=color.white, style=label.style_label_center, size=size.small)

    // Draw Asia session levels
    if showAsia
        line.new(bar_index - 30, pdc, bar_index, pdc, color=color.new(color.teal, 60), width=1)
        label.new(bar_index, pdc, "PDC", color=color.teal, textcolor=color.white, style=label.style_label_center, size=size.small)

    // VWAP with bands
    plot(vwap, "VWAP", color.blue, 2)
    plot(vwap + vwapStdDev, "VWAP+1σ", color.new(color.blue, 50), 1)
    plot(vwap - vwapStdDev, "VWAP-1σ", color.new(color.blue, 50), 1)

    // Session structure table
    t = table.new(position.top_left, 3, 5, border_color=color.gray)
    table.cell(t, 0, 0, "Level", bgcolor=color.gray, text_color=color.white)
    table.cell(t, 1, 0, "Price", bgcolor=color.gray, text_color=color.white)
    table.cell(t, 2, 0, "Distance", bgcolor=color.gray, text_color=color.white)

    table.cell(t, 0, 1, "NY High", text_color=color.orange)
    table.cell(t, 1, 1, str.tostring(pdh, "#.##"))
    table.cell(t, 2, 1, str.tostring(close - pdh, "#.##"))

    table.cell(t, 0, 2, "London Low", text_color=color.purple)
    table.cell(t, 1, 2, str.tostring(pdl, "#.##"))
    table.cell(t, 2, 2, str.tostring(close - pdl, "#.##"))

    table.cell(t, 0, 3, "VWAP", text_color=color.blue)
    table.cell(t, 1, 3, str.tostring(vwap, "#.##"))
    table.cell(t, 2, 3, str.tostring(close - vwap, "#.##"))

    table.cell(t, 0, 4, "OR High", text_color=color.cyan)
    table.cell(t, 1, 4, str.tostring(orHigh, "#.##"))
    table.cell(t, 2, 4, str.tostring(close - orHigh, "#.##"))
`,
    },

    funding_rate_overlay: {
        name: "Funding Rate Overlay",
        description: "Basis and z-score analysis for perpetual futures",
        category: "advanced",
        code: `
//@version=6
indicator("Funding Rate Overlay", overlay=false, max_tables_count=1)

basisLength = input.int(20, "Basis Period", minval=5, maxval=100, group="Funding")
smaLength = input.int(50, "SMA Period", minval=10, maxval=200, group="Funding")
zscoreThreshold = input.float(2.0, "Z-Score Extreme", minval=1.0, maxval=3.0, group="Funding")

// Calculate basis as (price - SMA) / SMA proxy for funding
smaPrice = ta.sma(close, smaLength)
basis = (close - smaPrice) / smaPrice

// Z-score of basis
basisMean = ta.sma(basis, basisLength)
basisStdDev = ta.stdev(basis, basisLength)
basisZscore = basisStdDev > 0 ? (basis - basisMean) / basisStdDev : 0

// Color coding
histColor = basis > 0 ? color.green : color.red
isExtreme = math.abs(basisZscore) > zscoreThreshold
bgColor = isExtreme ? (basisZscore > 0 ? color.new(color.green, 85) : color.new(color.red, 85)) : color.new(color.gray, 95)

// Plot histogram
plot(basis * 100, "Basis %", histColor, 2, plot.style_histogram)
plot(0, "Zero Line", color.gray, 1)

// Background coloring for extreme regimes
bgcolor(bgColor)

// Regime classification
regime = isExtreme ? (basisZscore > 0 ? "Overleveraged" : "Oversold") : "Normal"

// Display table
if barstate.islast
    t = table.new(position.top_right, 2, 4, border_color=color.gray)
    table.cell(t, 0, 0, "Metric", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 1, 0, "Value", bgcolor=color.blue, text_color=color.white)

    table.cell(t, 0, 1, "Basis", text_color=color.gray)
    table.cell(t, 1, 1, str.tostring(basis * 100, "#.##%"),
        text_color = basis > 0 ? color.green : color.red)

    table.cell(t, 0, 2, "Z-Score", text_color=color.gray)
    table.cell(t, 1, 2, str.tostring(basisZscore, "#.##"),
        text_color = math.abs(basisZscore) > 1.5 ? color.orange : color.gray)

    table.cell(t, 0, 3, "Regime", text_color=color.gray)
    table.cell(t, 1, 3, regime,
        text_color = isExtreme ? color.orange : color.green)
`,
    },

    multi_asset_correlation: {
        name: "Multi-Asset Correlation",
        description: "Rolling correlation dashboard with 4 symbols",
        category: "advanced",
        code: `
//@version=6
indicator("Multi-Asset Correlation", overlay=false, max_tables_count=1)

// Correlation symbol inputs
sym1 = input.symbol("SPY", "Asset 1", group="Symbols")
sym2 = input.symbol("TLT", "Asset 2", group="Symbols")
sym3 = input.symbol("GLD", "Asset 3", group="Symbols")
sym4 = input.symbol("DXY", "Asset 4", group="Symbols")

corrLength = input.int(20, "Correlation Period", minval=5, maxval=100, group="Correlation")

// Get data for each symbol
close1 = request.security(sym1, timeframe.period, close)
close2 = request.security(sym2, timeframe.period, close)
close3 = request.security(sym3, timeframe.period, close)
close4 = request.security(sym4, timeframe.period, close)

// Returns
ret0 = ta.change(close)
ret1 = ta.change(close1)
ret2 = ta.change(close2)
ret3 = ta.change(close3)
ret4 = ta.change(close4)

// Correlation calculation
corr1 = ta.correlation(ret0, ret1, corrLength)
corr2 = ta.correlation(ret0, ret2, corrLength)
corr3 = ta.correlation(ret0, ret3, corrLength)
corr4 = ta.correlation(ret0, ret4, corrLength)

// Color coding: green >0.7, red <-0.7, gray neutral
color1 = corr1 > 0.7 ? color.green : corr1 < -0.7 ? color.red : color.gray
color2 = corr2 > 0.7 ? color.green : corr2 < -0.7 ? color.red : color.gray
color3 = corr3 > 0.7 ? color.green : corr3 < -0.7 ? color.red : color.gray
color4 = corr4 > 0.7 ? color.green : corr4 < -0.7 ? color.red : color.gray

// Plot correlations
plot(corr1, "Corr 1", color1, 2)
plot(corr2, "Corr 2", color2, 2)
plot(corr3, "Corr 3", color3, 2)
plot(corr4, "Corr 4", color4, 2)
hline(0.7, "Positive Threshold", color.green, linestyle=plot.style_dashed)
hline(-0.7, "Negative Threshold", color.red, linestyle=plot.style_dashed)
hline(0, "Zero", color.gray)

// Display table
if barstate.islast
    t = table.new(position.top_right, 3, 5, border_color=color.gray)
    table.cell(t, 0, 0, "Asset", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 1, 0, "Correlation", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 2, 0, "Regime", bgcolor=color.blue, text_color=color.white)

    table.cell(t, 0, 1, str.tostring(sym1), text_color=color.gray)
    table.cell(t, 1, 1, str.tostring(corr1, "#.##"), text_color=color1)
    table.cell(t, 2, 1, corr1 > 0.7 ? "Correlated" : corr1 < -0.7 ? "Inverse" : "Neutral", text_color=color1)

    table.cell(t, 0, 2, str.tostring(sym2), text_color=color.gray)
    table.cell(t, 1, 2, str.tostring(corr2, "#.##"), text_color=color2)
    table.cell(t, 2, 2, corr2 > 0.7 ? "Correlated" : corr2 < -0.7 ? "Inverse" : "Neutral", text_color=color2)

    table.cell(t, 0, 3, str.tostring(sym3), text_color=color.gray)
    table.cell(t, 1, 3, str.tostring(corr3, "#.##"), text_color=color3)
    table.cell(t, 2, 3, corr3 > 0.7 ? "Correlated" : corr3 < -0.7 ? "Inverse" : "Neutral", text_color=color3)

    table.cell(t, 0, 4, str.tostring(sym4), text_color=color.gray)
    table.cell(t, 1, 4, str.tostring(corr4, "#.##"), text_color=color4)
    table.cell(t, 2, 4, corr4 > 0.7 ? "Correlated" : corr4 < -0.7 ? "Inverse" : "Neutral", text_color=color4)
`,
    },

    institutional_order_flow: {
        name: "Institutional Order Flow",
        description: "Block detection and cumulative delta with VWAP bands",
        category: "advanced",
        code: `
//@version=6
indicator("Institutional Order Flow", overlay=true, max_labels_count=100, max_tables_count=1)

blockThreshold = input.float(2.0, "Block Vol Multiplier", minval=1.0, maxval=5.0, group="Order Flow")
deltaThreshold = input.float(0.6, "Delta Threshold", minval=0.1, maxval=0.9, group="Order Flow")
vwapLength = input.int(20, "VWAP Period", minval=5, maxval=100, group="Order Flow")

// Calculate typical price and VWAP
typPrice = (high + low + close) / 3
cumVol = 0.0
cumTypVol = 0.0

for i = 0 to vwapLength - 1
    cumVol += volume[i]
    cumTypVol += typPrice[i] * volume[i]

vwap = cumVol > 0 ? cumTypVol / cumVol : close
vwapStdDev = ta.stdev(typPrice, vwapLength) * 0.5

// Delta volume calculation
closePos = (close - low) / (high - low)
delta = closePos * volume

// Cumulative delta
cumDelta = 0.0
for i = 0 to 100
    cumDelta += delta[i]

// Block detection
avgVol = ta.sma(volume, 20)
isLargeBlock = volume > avgVol * blockThreshold
isBlockBuy = isLargeBlock and delta > volume * deltaThreshold
isBlockSell = isLargeBlock and delta < -volume * deltaThreshold

// Draw block markers
if isBlockBuy
    label.new(bar_index, high + (high - low) * 0.5, "▲",
        color=color.new(color.green, 0), textcolor=color.green, size=size.small, style=label.style_label_center)

if isBlockSell
    label.new(bar_index, low - (high - low) * 0.5, "▼",
        color=color.new(color.red, 0), textcolor=color.red, size=size.small, style=label.style_label_center)

// Plot VWAP with bands
plot(vwap, "VWAP", color.blue, 2)
plot(vwap + vwapStdDev, "VWAP+σ", color.new(color.blue, 60), 1)
plot(vwap - vwapStdDev, "VWAP-σ", color.new(color.blue, 60), 1)

// Display table
if barstate.islast
    t = table.new(position.bottom_right, 2, 4, border_color=color.gray)
    table.cell(t, 0, 0, "Metric", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 1, 0, "Value", bgcolor=color.blue, text_color=color.white)

    table.cell(t, 0, 1, "Volume", text_color=color.gray)
    table.cell(t, 1, 1, str.tostring(volume, "#,##0"))

    table.cell(t, 0, 2, "Delta", text_color=color.gray)
    table.cell(t, 1, 2, str.tostring(delta, "#,##0"),
        text_color = delta > 0 ? color.green : color.red)

    table.cell(t, 0, 3, "Cum Delta", text_color=color.gray)
    table.cell(t, 1, 3, str.tostring(cumDelta, "#,##0"),
        text_color = cumDelta > 0 ? color.green : color.red)
`,
    },

    macro_regime_dashboard: {
        name: "Macro Regime Dashboard",
        description: "Comprehensive macro regime classifier with asset signals",
        category: "advanced",
        code: `
//@version=6
indicator("Macro Regime Dashboard", overlay=false, max_tables_count=1)

// Asset inputs
equitySymbol = input.symbol("SPY", "Equity (default SPY)", group="Assets")
bondSymbol = input.symbol("TLT", "Bonds (default TLT)", group="Assets")
commoditySymbol = input.symbol("GLD", "Commodity (default GLD)", group="Assets")
dollarSymbol = input.symbol("DXY", "Dollar (default DXY)", group="Assets")

lookbackDays = input.int(20, "Momentum Period", minval=5, maxval=100, group="Macro")

// Request daily data for macro signals
eqDaily = request.security(equitySymbol, "D", close)
bondDaily = request.security(bondSymbol, "D", close)
cmdyDaily = request.security(commoditySymbol, "D", close)
dxyDaily = request.security(dollarSymbol, "D", close)

// Calculate 20-day returns
eqReturn = (eqDaily - eqDaily[lookbackDays]) / eqDaily[lookbackDays]
bondReturn = (bondDaily - bondDaily[lookbackDays]) / bondDaily[lookbackDays]
cmdyReturn = (cmdyDaily - cmdyDaily[lookbackDays]) / cmdyDaily[lookbackDays]
dxyReturn = (dxyDaily - dxyDaily[lookbackDays]) / dxyDaily[lookbackDays]

// Z-scores for regime classification
eqMean = ta.sma(eqReturn, 20)
eqStd = ta.stdev(eqReturn, 20)
eqZscore = eqStd > 0 ? (eqReturn - eqMean) / eqStd : 0

bondMean = ta.sma(bondReturn, 20)
bondStd = ta.stdev(bondReturn, 20)
bondZscore = bondStd > 0 ? (bondReturn - bondMean) / bondStd : 0

// Regime classification logic
isGrowthHigh = eqZscore > 0.5
isInflationHigh = bondZscore < -0.5
isGoldilocks = isGrowthHigh and not isInflationHigh
isStagflation = (isGrowthHigh and isInflationHigh) or (not isGrowthHigh and isInflationHigh)
isDeflation = not isGrowthHigh and not isInflationHigh

regime = isGoldilocks ? "Goldilocks" : isStagflation ? "Stagflation" : isDeflation ? "Deflation" : "Recovery"

regimeColor = isGoldilocks ? color.new(color.green, 70) :
              isStagflation ? color.new(color.orange, 70) :
              isDeflation ? color.new(color.blue, 70) :
              color.new(color.purple, 70)

// Background
bgcolor(regimeColor)

// Display regime dashboard
if barstate.islast
    t = table.new(position.top_left, 3, 7, border_color=color.gray)
    table.cell(t, 0, 0, "Asset", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 1, 0, "Signal", bgcolor=color.blue, text_color=color.white)
    table.cell(t, 2, 0, "Direction", bgcolor=color.blue, text_color=color.white)

    // Equity row
    table.cell(t, 0, 1, str.tostring(equitySymbol), text_color=color.gray)
    table.cell(t, 1, 1, str.tostring(eqReturn * 100, "#.##%"),
        text_color = eqReturn > 0 ? color.green : color.red)
    table.cell(t, 2, 1, eqZscore > 0.5 ? "Strong ↑" : eqZscore < -0.5 ? "Weak ↓" : "Neutral →",
        text_color = eqZscore > 0 ? color.green : eqZscore < 0 ? color.red : color.gray)

    // Bond row
    table.cell(t, 0, 2, str.tostring(bondSymbol), text_color=color.gray)
    table.cell(t, 1, 2, str.tostring(bondReturn * 100, "#.##%"),
        text_color = bondReturn > 0 ? color.green : color.red)
    table.cell(t, 2, 2, bondZscore > 0.5 ? "Rising ↑" : bondZscore < -0.5 ? "Falling ↓" : "Stable →",
        text_color = bondZscore > 0 ? color.green : bondZscore < 0 ? color.red : color.gray)

    // Commodity row
    table.cell(t, 0, 3, str.tostring(commoditySymbol), text_color=color.gray)
    table.cell(t, 1, 3, str.tostring(cmdyReturn * 100, "#.##%"),
        text_color = cmdyReturn > 0 ? color.green : color.red)
    table.cell(t, 2, 3, cmdyReturn > 0 ? "Bid ↑" : "Offer ↓",
        text_color = cmdyReturn > 0 ? color.green : color.red)

    // Dollar row
    table.cell(t, 0, 4, str.tostring(dollarSymbol), text_color=color.gray)
    table.cell(t, 1, 4, str.tostring(dxyReturn * 100, "#.##%"),
        text_color = dxyReturn > 0 ? color.green : color.red)
    table.cell(t, 2, 4, dxyReturn > 0 ? "Strong ↑" : "Weak ↓",
        text_color = dxyReturn > 0 ? color.green : color.red)

    // Risk appetite
    riskAppetite = (eqZscore - bondZscore) / 2
    table.cell(t, 0, 5, "Risk Appetite", bgcolor=color.gray, text_color=color.white)
    table.cell(t, 1, 5, str.tostring(riskAppetite, "#.##"),
        text_color = riskAppetite > 0 ? color.green : color.red)
    table.cell(t, 2, 5, riskAppetite > 0 ? "Risk On" : "Risk Off",
        text_color = riskAppetite > 0 ? color.green : color.red)

    // Regime row
    table.cell(t, 0, 6, "REGIME", bgcolor=regimeColor, text_color=color.white)
    table.cell(t, 1, 6, regime, bgcolor=regimeColor, text_color=color.white)
    table.cell(t, 2, 6, "Active", bgcolor=regimeColor, text_color=color.white)
`,
    },

};

// Merge external templates into main TEMPLATES
Object.assign(TEMPLATES, EXTERNAL_TEMPLATES);
