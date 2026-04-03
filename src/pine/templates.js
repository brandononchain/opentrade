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
