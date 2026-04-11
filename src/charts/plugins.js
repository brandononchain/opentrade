/**
 * Lightweight Charts Plugin Engine
 * Custom series types and drawing primitives inspired by
 * TradingView lightweight-charts plugin-examples.
 *
 * Generates standalone HTML/JS for lightweight-charts rendering,
 * Pine Script overlays that match plugin visuals, and configuration
 * for the web server's chart UI.
 *
 * Categories:
 *   1. Custom Series — heatmap, rounded candles, stacked area, etc.
 *   2. Drawing Primitives — volume profile, session highlighting, tooltips
 *   3. Chart Layouts — multi-pane, synchronized timeframes
 *   4. Pine Generators — Pine Script that mimics plugin visuals
 */

// ═══════════════════════════════════════════════════════════════════════
// CUSTOM SERIES DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

export const CUSTOM_SERIES = {

  rounded_candles: {
    name: 'Rounded Candles',
    description: 'OHLC candles with rounded corners for a modern look',
    type: 'candlestick',
    options: {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderRadius: 4,
      wickVisible: true,
    },
    lwcConfig: (opts) => ({
      upColor: opts.upColor || '#26a69a',
      downColor: opts.downColor || '#ef5350',
      borderUpColor: opts.upColor || '#26a69a',
      borderDownColor: opts.downColor || '#ef5350',
      wickUpColor: opts.upColor || '#26a69a',
      wickDownColor: opts.downColor || '#ef5350',
    }),
  },

  heatmap: {
    name: 'Volume Heatmap',
    description: 'Color-coded volume intensity overlay',
    type: 'histogram',
    options: {
      lowColor: 'rgba(76, 175, 80, 0.2)',
      highColor: 'rgba(244, 67, 54, 0.9)',
      bins: 20,
    },
    dataTransform: (ohlcv, opts) => {
      const bins = opts.bins || 20;
      const volumes = ohlcv.map(b => b.volume);
      const maxVol = Math.max(...volumes);
      const minVol = Math.min(...volumes);
      const range = maxVol - minVol || 1;

      return ohlcv.map(bar => ({
        time: bar.time,
        value: bar.volume,
        color: interpolateColor(
          opts.lowColor || 'rgba(76,175,80,0.2)',
          opts.highColor || 'rgba(244,67,54,0.9)',
          (bar.volume - minVol) / range
        ),
      }));
    },
  },

  stacked_area: {
    name: 'Stacked Area',
    description: 'Multiple overlapping area series for comparison',
    type: 'area_multi',
    options: {
      colors: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'],
      opacity: 0.3,
    },
    generate: (dataSeries, opts) => {
      const colors = opts.colors || ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];
      return dataSeries.map((series, idx) => ({
        type: 'area',
        data: series.data,
        options: {
          topColor: colors[idx % colors.length].replace(')', `,${opts.opacity || 0.3})`).replace('rgb', 'rgba'),
          bottomColor: 'rgba(0,0,0,0)',
          lineColor: colors[idx % colors.length],
          lineWidth: 2,
          title: series.name || `Series ${idx + 1}`,
        },
      }));
    },
  },

  hlc_area: {
    name: 'HLC Area',
    description: 'High-Low-Close area fill showing price range',
    type: 'custom',
    options: {
      highLineColor: '#26a69a',
      lowLineColor: '#ef5350',
      areaColor: 'rgba(41, 98, 255, 0.1)',
    },
  },

  brushable_area: {
    name: 'Brushable Area',
    description: 'Area chart with interactive selection brush for analysis',
    type: 'area',
    options: {
      brushColor: 'rgba(33, 150, 243, 0.2)',
      lineColor: '#2196F3',
      areaColor: 'rgba(33, 150, 243, 0.1)',
    },
  },

  grouped_bars: {
    name: 'Grouped Bars',
    description: 'Side-by-side bar comparison (multi-metric)',
    type: 'histogram_multi',
    options: {
      colors: ['#2196F3', '#4CAF50', '#FF9800'],
      gap: 2,
    },
  },

  whisker_box: {
    name: 'Whisker Box (Box Plot)',
    description: 'Statistical box plot showing quartiles and outliers',
    type: 'custom',
    options: {
      boxColor: 'rgba(33, 150, 243, 0.5)',
      whiskerColor: '#ccc',
      medianColor: '#fff',
    },
  },

  lollipop: {
    name: 'Lollipop Chart',
    description: 'Dot with stem for discrete data points',
    type: 'custom',
    options: {
      color: '#2196F3',
      dotRadius: 4,
      stemWidth: 1,
    },
  },

  dual_histogram: {
    name: 'Dual Range Histogram',
    description: 'Above/below zero histogram with separate colors',
    type: 'histogram',
    options: {
      positiveColor: '#26a69a',
      negativeColor: '#ef5350',
    },
    dataTransform: (data) => {
      return data.map(d => ({
        time: d.time,
        value: d.value,
        color: d.value >= 0 ? '#26a69a' : '#ef5350',
      }));
    },
  },
};


// ═══════════════════════════════════════════════════════════════════════
// DRAWING PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════

export const DRAWING_PRIMITIVES = {

  volume_profile: {
    name: 'Volume Profile',
    description: 'Horizontal volume histogram at price levels (POC, VA)',
    generate: (ohlcv, opts = {}) => {
      const bins = opts.bins || 40;
      const vaPercent = opts.vaPercent || 0.70;

      const prices = ohlcv.flatMap(b => [b.high, b.low]);
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      const step = (maxP - minP) / bins || 1;

      // Build volume at price levels
      const profile = new Array(bins).fill(0);
      for (const bar of ohlcv) {
        const lo = Math.floor((bar.low - minP) / step);
        const hi = Math.floor((bar.high - minP) / step);
        const binCount = hi - lo + 1 || 1;
        const volPerBin = bar.volume / binCount;
        for (let b = Math.max(0, lo); b <= Math.min(bins - 1, hi); b++) {
          profile[b] += volPerBin;
        }
      }

      // Find POC
      let pocIdx = 0;
      for (let i = 1; i < profile.length; i++) {
        if (profile[i] > profile[pocIdx]) pocIdx = i;
      }
      const pocPrice = minP + (pocIdx + 0.5) * step;

      // Find Value Area (70% volume)
      const totalVol = profile.reduce((a, b) => a + b, 0);
      const targetVol = totalVol * vaPercent;
      let vaVol = profile[pocIdx];
      let vaLow = pocIdx, vaHigh = pocIdx;
      while (vaVol < targetVol && (vaLow > 0 || vaHigh < bins - 1)) {
        const addLow = vaLow > 0 ? profile[vaLow - 1] : 0;
        const addHigh = vaHigh < bins - 1 ? profile[vaHigh + 1] : 0;
        if (addLow >= addHigh && vaLow > 0) { vaLow--; vaVol += addLow; }
        else if (vaHigh < bins - 1) { vaHigh++; vaVol += addHigh; }
        else { vaLow--; vaVol += addLow; }
      }

      return {
        profile: profile.map((vol, i) => ({
          price: minP + (i + 0.5) * step,
          volume: vol,
          isPoc: i === pocIdx,
          inValueArea: i >= vaLow && i <= vaHigh,
        })),
        poc: pocPrice,
        vah: minP + (vaHigh + 1) * step,
        val: minP + vaLow * step,
        totalVolume: totalVol,
      };
    },
  },

  session_highlighting: {
    name: 'Session Highlighting',
    description: 'Color-coded background zones for NY, London, Asia sessions',
    sessions: {
      newyork:  { start: '14:30', end: '21:00', color: 'rgba(76,175,80,0.05)', label: 'NY' },
      london:   { start: '08:00', end: '16:30', color: 'rgba(33,150,243,0.05)', label: 'London' },
      asia:     { start: '01:00', end: '09:00', color: 'rgba(255,152,0,0.05)', label: 'Asia' },
      overlap:  { start: '14:30', end: '16:30', color: 'rgba(156,39,176,0.08)', label: 'NY/LON' },
    },
  },

  trend_line: {
    name: 'Trend Line',
    description: 'Automatic trend line detection between pivot points',
    detect: (ohlcv, opts = {}) => {
      const leftBars = opts.leftBars || 5;
      const rightBars = opts.rightBars || 5;
      const lines = [];

      // Find pivot highs and lows
      const pivotHighs = [];
      const pivotLows = [];
      for (let i = leftBars; i < ohlcv.length - rightBars; i++) {
        let isHigh = true, isLow = true;
        for (let j = 1; j <= leftBars; j++) {
          if (ohlcv[i].high <= ohlcv[i - j].high) isHigh = false;
          if (ohlcv[i].low >= ohlcv[i - j].low) isLow = false;
        }
        for (let j = 1; j <= rightBars; j++) {
          if (ohlcv[i].high <= ohlcv[i + j].high) isHigh = false;
          if (ohlcv[i].low >= ohlcv[i + j].low) isLow = false;
        }
        if (isHigh) pivotHighs.push({ index: i, price: ohlcv[i].high, time: ohlcv[i].time });
        if (isLow) pivotLows.push({ index: i, price: ohlcv[i].low, time: ohlcv[i].time });
      }

      // Connect recent pivots for trend lines
      if (pivotHighs.length >= 2) {
        const last2 = pivotHighs.slice(-2);
        lines.push({
          type: 'resistance',
          start: last2[0],
          end: last2[1],
          slope: (last2[1].price - last2[0].price) / (last2[1].index - last2[0].index),
        });
      }
      if (pivotLows.length >= 2) {
        const last2 = pivotLows.slice(-2);
        lines.push({
          type: 'support',
          start: last2[0],
          end: last2[1],
          slope: (last2[1].price - last2[0].price) / (last2[1].index - last2[0].index),
        });
      }

      return { trendLines: lines, pivotHighs, pivotLows };
    },
  },

  delta_tooltip: {
    name: 'Delta Tooltip',
    description: 'Tooltip showing price change and percent from reference',
    compute: (currentPrice, referencePrice) => {
      const delta = currentPrice - referencePrice;
      const pct = ((delta / referencePrice) * 100).toFixed(2);
      return {
        delta: delta.toFixed(2),
        percent: pct,
        direction: delta >= 0 ? 'up' : 'down',
        formatted: `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} (${delta >= 0 ? '+' : ''}${pct}%)`,
      };
    },
  },

  anchored_text: {
    name: 'Anchored Text',
    description: 'Text labels anchored to price/time coordinates',
    create: (text, opts = {}) => ({
      text,
      price: opts.price,
      time: opts.time,
      color: opts.color || '#ffffff',
      fontSize: opts.fontSize || 12,
      background: opts.background || 'rgba(0,0,0,0.7)',
      padding: opts.padding || 4,
    }),
  },

  bands_indicator: {
    name: 'Bands Indicator',
    description: 'Bollinger-like bands rendered as filled areas',
    options: {
      upperColor: 'rgba(33, 150, 243, 0.2)',
      lowerColor: 'rgba(244, 67, 54, 0.2)',
      midColor: '#9e9e9e',
    },
  },

  price_alerts: {
    name: 'Expiring Price Alerts',
    description: 'Visual price alert lines that expire after N bars',
    create: (price, opts = {}) => ({
      price,
      expiresInBars: opts.expiresInBars || 20,
      color: opts.color || '#ff9800',
      lineStyle: opts.lineStyle || 'dashed',
      label: opts.label || `Alert @ ${price}`,
    }),
  },

  watermark: {
    name: 'Image Watermark',
    description: 'Semi-transparent branding watermark on chart',
    options: {
      text: 'OpenTrade',
      color: 'rgba(255, 255, 255, 0.06)',
      fontSize: 48,
      position: 'center',
    },
  },
};


// ═══════════════════════════════════════════════════════════════════════
// HTML CHART GENERATOR
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate a standalone HTML page with a lightweight-charts chart.
 *
 * @param {object} config
 * @param {object[]} config.data - OHLCV data array
 * @param {string} config.title - Chart title
 * @param {object[]} config.series - Additional series configs
 * @param {object[]} config.primitives - Drawing primitives to add
 * @param {object} config.layout - Chart layout options
 * @returns {string} Complete HTML page
 */
export function generateChartHTML(config) {
  const {
    data = [],
    title = 'Chart',
    series = [],
    layout = {},
    theme = 'dark',
  } = config;

  const chartOptions = {
    width: layout.width || 0,
    height: layout.height || 600,
    layout: {
      background: { type: 'solid', color: theme === 'dark' ? '#131722' : '#ffffff' },
      textColor: theme === 'dark' ? '#d1d4dc' : '#191919',
    },
    grid: {
      vertLines: { color: theme === 'dark' ? '#1e222d' : '#e1e3eb' },
      horzLines: { color: theme === 'dark' ? '#1e222d' : '#e1e3eb' },
    },
    crosshair: { mode: 0 },
    rightPriceScale: { borderColor: theme === 'dark' ? '#2a2e39' : '#d1d4dc' },
    timeScale: {
      borderColor: theme === 'dark' ? '#2a2e39' : '#d1d4dc',
      timeVisible: true,
      secondsVisible: false,
    },
  };

  const seriesCode = series.map((s, idx) => {
    const varName = `series_${idx}`;
    switch (s.type) {
      case 'line':
        return `const ${varName} = chart.addLineSeries(${JSON.stringify(s.options || {})});\n${varName}.setData(${JSON.stringify(s.data)});`;
      case 'area':
        return `const ${varName} = chart.addAreaSeries(${JSON.stringify(s.options || {})});\n${varName}.setData(${JSON.stringify(s.data)});`;
      case 'histogram':
        return `const ${varName} = chart.addHistogramSeries(${JSON.stringify(s.options || {})});\n${varName}.setData(${JSON.stringify(s.data)});`;
      default:
        return '';
    }
  }).filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; background: ${theme === 'dark' ? '#131722' : '#fff'}; }
    #chart-container { width: 100vw; height: 100vh; }
    .title { position: absolute; top: 12px; left: 16px; color: ${theme === 'dark' ? '#d1d4dc' : '#191919'};
             font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 16px; z-index: 10; }
  </style>
</head>
<body>
  <div class="title">${escapeHtml(title)}</div>
  <div id="chart-container"></div>
  <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
  <script>
    const container = document.getElementById('chart-container');
    const chart = LightweightCharts.createChart(container, ${JSON.stringify(chartOptions)});

    // Resize handler
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(container);

    // Main candlestick series
    const mainSeries = chart.addCandlestickSeries({
      upColor: '${CUSTOM_SERIES.rounded_candles.options.upColor}',
      downColor: '${CUSTOM_SERIES.rounded_candles.options.downColor}',
      borderUpColor: '${CUSTOM_SERIES.rounded_candles.options.upColor}',
      borderDownColor: '${CUSTOM_SERIES.rounded_candles.options.downColor}',
    });
    mainSeries.setData(${JSON.stringify(data)});

    // Additional series
    ${seriesCode}

    chart.timeScale().fitContent();
  </script>
</body>
</html>`;
}

/**
 * Generate a multi-pane chart layout HTML.
 */
export function generateMultiPaneHTML(config) {
  const {
    panes = [],
    title = 'Multi-Pane Chart',
    theme = 'dark',
    syncTimeScales = true,
  } = config;

  const paneHTML = panes.map((pane, idx) => {
    const height = pane.height || (idx === 0 ? '60%' : `${40 / (panes.length - 1)}%`);
    return `<div id="pane-${idx}" style="width:100%;height:${height};border-bottom:1px solid ${theme === 'dark' ? '#2a2e39' : '#d1d4dc'}"></div>`;
  }).join('\n    ');

  const paneJS = panes.map((pane, idx) => {
    const bg = theme === 'dark' ? '#131722' : '#ffffff';
    const text = theme === 'dark' ? '#d1d4dc' : '#191919';
    return `
    const chart${idx} = LightweightCharts.createChart(document.getElementById('pane-${idx}'), {
      layout: { background: { type: 'solid', color: '${bg}' }, textColor: '${text}' },
      ${idx > 0 ? "timeScale: { visible: false }," : ''}
    });
    const series${idx} = chart${idx}.add${pane.seriesType || 'Candlestick'}Series(${JSON.stringify(pane.options || {})});
    series${idx}.setData(${JSON.stringify(pane.data || [])});`;
  }).join('\n');

  const syncJS = syncTimeScales && panes.length > 1
    ? `chart0.timeScale().subscribeVisibleLogicalRangeChange(range => {
      ${panes.slice(1).map((_, i) => `chart${i + 1}.timeScale().setVisibleLogicalRange(range);`).join('\n      ')}
    });`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
<style>body{margin:0;background:${theme === 'dark' ? '#131722' : '#fff'};display:flex;flex-direction:column;height:100vh;}</style>
</head><body>
    ${paneHTML}
<script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
<script>
${paneJS}
${syncJS}
</script></body></html>`;
}


// ═══════════════════════════════════════════════════════════════════════
// PINE SCRIPT GENERATORS — Matching plugin visuals
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate Pine Script that produces visuals matching a plugin type.
 */
export function generatePluginPine(pluginType, opts = {}) {
  const generators = {

    volume_profile: () => `//@version=6
indicator("Volume Profile Overlay", overlay=true, max_boxes_count=500)

// ── Inputs ──
grp = "Volume Profile"
lookback  = input.int(${opts.lookback || 100}, "Lookback Bars", minval=10, group=grp)
numBins   = input.int(${opts.bins || 24}, "Price Bins", minval=5, maxval=100, group=grp)
vpWidth   = input.int(${opts.width || 20}, "Profile Width (bars)", group=grp)
showPOC   = input.bool(true, "Show POC", group=grp)
showVA    = input.bool(true, "Show Value Area", group=grp)
vaPercent = input.float(70.0, "Value Area %", minval=50, maxval=95, group=grp)

// ── Volume at Price ──
if barstate.islast
    float hi = ta.highest(high, lookback)
    float lo = ta.lowest(low, lookback)
    float step_ = (hi - lo) / numBins

    float[] volAtPrice = array.new_float(numBins, 0.0)
    float totalVol_ = 0.0

    for i = 0 to lookback - 1
        int binLo = math.floor((low[i] - lo) / step_)
        int binHi = math.floor((high[i] - lo) / step_)
        binLo := math.max(0, math.min(binLo, numBins - 1))
        binHi := math.max(0, math.min(binHi, numBins - 1))
        float spread = binHi - binLo + 1
        float volPerBin = volume[i] / spread
        for b = binLo to binHi
            array.set(volAtPrice, b, array.get(volAtPrice, b) + volPerBin)
        totalVol_ += volume[i]

    // Find POC
    float maxVol_ = 0.0
    int pocBin = 0
    for i = 0 to numBins - 1
        if array.get(volAtPrice, i) > maxVol_
            maxVol_ := array.get(volAtPrice, i)
            pocBin := i

    // Draw boxes
    for i = 0 to numBins - 1
        float binPrice = lo + i * step_
        float v = array.get(volAtPrice, i)
        float barWidth = v / maxVol_ * vpWidth
        color c = i == pocBin ? color.new(color.yellow, 30) :
                  color.new(color.blue, 70)
        box.new(bar_index - math.round(barWidth), binPrice,
                bar_index, binPrice + step_, bgcolor=c, border_color=na)

    // POC line
    if showPOC
        float pocPrice_ = lo + (pocBin + 0.5) * step_
        line.new(bar_index - lookback, pocPrice_, bar_index + 10, pocPrice_,
                 color=color.yellow, width=2, style=line.style_solid)`,

    session_highlighting: () => `//@version=6
indicator("Session Highlighting", overlay=true)

// ── Inputs ──
grp = "Sessions"
showNY_   = input.bool(true, "New York",  group=grp)
showLon_  = input.bool(true, "London",    group=grp)
showAsia_ = input.bool(true, "Asia",      group=grp)
nyCol     = input.color(color.new(color.green,  92), "NY Color",   group=grp)
lonCol    = input.color(color.new(color.blue,   92), "LON Color",  group=grp)
asiaCol   = input.color(color.new(color.orange, 92), "Asia Color", group=grp)

inNY   = not na(time(timeframe.period, "0930-1600", "America/New_York"))
inLon  = not na(time(timeframe.period, "0800-1630", "Europe/London"))
inAsia = not na(time(timeframe.period, "0900-1500", "Asia/Tokyo"))

bgcolor(showNY_   and inNY   ? nyCol   : na, title="NY Session")
bgcolor(showLon_  and inLon  ? lonCol  : na, title="LON Session")
bgcolor(showAsia_ and inAsia ? asiaCol : na, title="Asia Session")`,

    dual_histogram: () => `//@version=6
indicator("Delta Histogram", overlay=false)

// ── Inputs ──
src_   = input.source(close, "Source", group="Histogram")
len_   = input.int(14, "Length", group="Histogram")
posCol = input.color(#26a69a, "Positive", group="Colors")
negCol = input.color(#ef5350, "Negative", group="Colors")

// ── Calculation ──
val_  = ta.ema(src_, len_) - ta.ema(src_, len_ * 3)

col_ = val_ >= 0 ?
    (val_ >= val_[1] ? posCol : color.new(posCol, 50)) :
    (val_ <= val_[1] ? negCol : color.new(negCol, 50))

plot(val_, "Delta", col_, 2, plot.style_histogram)
hline(0, "Zero", color.gray)`,

    stacked_area: () => `//@version=6
indicator("Multi-MA Stacked Area", overlay=true)

// ── Inputs ──
grp_ = "Moving Averages"
len1_ = input.int(10, "MA 1", group=grp_)
len2_ = input.int(20, "MA 2", group=grp_)
len3_ = input.int(50, "MA 3", group=grp_)
len4_ = input.int(100, "MA 4", group=grp_)

ma1 = ta.ema(close, len1_)
ma2 = ta.ema(close, len2_)
ma3 = ta.ema(close, len3_)
ma4 = ta.ema(close, len4_)

p1 = plot(ma1, "MA 1", color.new(color.blue, 0), 1)
p2 = plot(ma2, "MA 2", color.new(color.teal, 0), 1)
p3 = plot(ma3, "MA 3", color.new(color.orange, 0), 1)
p4 = plot(ma4, "MA 4", color.new(color.purple, 0), 1)

fill(p1, p2, color.new(color.blue, 85))
fill(p2, p3, color.new(color.teal, 85))
fill(p3, p4, color.new(color.orange, 85))`,

    heatmap_overlay: () => `//@version=6
indicator("Volume Heatmap Overlay", overlay=true, max_boxes_count=500)

grp = "Heatmap"
lookback_ = input.int(50, "Lookback", group=grp)
numRows   = input.int(10, "Rows", group=grp)

if barstate.islast
    float hi_ = ta.highest(high, lookback_)
    float lo_ = ta.lowest(low, lookback_)
    float rowH = (hi_ - lo_) / numRows
    float maxV = 0.0

    float[] heatVol = array.new_float(numRows * lookback_, 0.0)

    for col = 0 to lookback_ - 1
        for row = 0 to numRows - 1
            float rowBot = lo_ + row * rowH
            float rowTop = rowBot + rowH
            float v_ = 0.0
            if high[col] >= rowBot and low[col] <= rowTop
                v_ := volume[col]
            int idx_ = col * numRows + row
            array.set(heatVol, idx_, v_)
            maxV := math.max(maxV, v_)

    for col = 0 to lookback_ - 1
        for row = 0 to numRows - 1
            float rowBot = lo_ + row * rowH
            float v_ = array.get(heatVol, col * numRows + row)
            float intensity = maxV > 0 ? v_ / maxV : 0
            int alpha = math.round(95 - intensity * 70)
            color c_ = intensity > 0.7 ? color.new(color.red, alpha) :
                       intensity > 0.3 ? color.new(color.orange, alpha) :
                       color.new(color.blue, alpha + 10)
            box.new(bar_index - col - 1, rowBot, bar_index - col, rowBot + rowH,
                    bgcolor=c_, border_color=na)`,
  };

  const gen = generators[pluginType];
  if (!gen) {
    const available = Object.keys(generators).join(', ');
    throw new Error(`Unknown plugin type: ${pluginType}. Available: ${available}`);
  }
  return gen();
}

/**
 * List all available chart plugins.
 */
export function listPlugins() {
  return {
    series: Object.entries(CUSTOM_SERIES).map(([k, v]) => ({
      key: k, name: v.name, description: v.description, type: v.type,
    })),
    primitives: Object.entries(DRAWING_PRIMITIVES).map(([k, v]) => ({
      key: k, name: v.name, description: v.description,
    })),
  };
}


// ═══════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function interpolateColor(c1, c2, t) {
  // Simple linear interpolation between two rgba colors
  const parse = (c) => {
    const m = c.match(/[\d.]+/g);
    return m ? m.map(Number) : [0, 0, 0, 1];
  };
  const a = parse(c1);
  const b = parse(c2);
  const lerp = (x, y, p) => x + (y - x) * p;
  return `rgba(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))},${lerp(a[3] || 1, b[3] || 1, t).toFixed(2)})`;
}
