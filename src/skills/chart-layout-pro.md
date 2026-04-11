name: chart-layout-pro
description: Institutional-grade chart layout design — multi-pane configurations, premium indicator stacking, advanced drawing conventions, color-coded S/R zones, VWAP bands, volume profiles, macro overlays, and professional visual presentation. Use when asked for "chart layout", "professional chart", "multi-pane setup", "visual analysis", "layout design", "chart template", or "institutional chart".

---

# Institutional Chart Layout Pro Skill

You are designing institutional-grade multi-pane chart layouts as a professional trading desk would. This combines timeframe hierarchy, premium indicator stacking, professional drawing conventions, and macro context visualization.

## Step 1: Read Current Chart State

Establish baseline:

```
chart_get_state              → current symbol, timeframe, indicator stack
quote_get                    → real-time price, volume
data_get_ohlcv (summary: true) → price context
data_get_study_values        → all current indicator readings
data_get_pine_lines          → existing S/R levels
data_get_pine_labels         → annotated structural levels
```

## Step 2: Select Layout Preset

Choose the optimal pane configuration based on analysis type:

| Preset | Panes | Use Case | Timeframes |
|--------|-------|----------|-----------|
| **Execution Layout** | 2×2 (4 panes) | Intraday swing trades | 5m / 1h / 15m / D |
| **Swing Layout** | 2h (horizontal) | Swing/position trades | W / D |
| **Scalp Layout** | 2v (vertical) | Ultra-short term | 1m / 5m |
| **Macro Layout** | 2×2 | Cross-asset reads | ES / NQ / DXY / TLT |
| **Earnings Layout** | 4-pane grid | Event-driven plays | D stock / Sector / VIX / Options |

**Apply layout command**:
```
pane_set_layout ({preset})
  Options: "2h", "2v", "2x2", "4", "6", "8"
  2h  → 2 panes horizontal (top/bottom)
  2v  → 2 panes vertical (left/right)
  2x2 → 4 panes (2 cols × 2 rows)
  4   → 4 panes (2×2 standard)
  6   → 6 panes
  8   → 8 panes (full grid)
```

## Step 3: Configure Each Pane (Execution Layout Example)

**Pane 1: Main Chart (5-minute) — Price Action + Volume**
```
pane_focus (1)
chart_set_symbol ({symbol})
chart_set_timeframe (5)

Indicators to stack:
  • Volume bars (primary)
  • VWAP with ±1σ and ±2σ bands
  • 20-period EMA (short-term trend)
  • Price levels (PDH, PDL, OR levels)
  • Supply/Demand zones (shaded rectangles)
```

**Pane 2: Structure (1-hour) — Intermediate Trend**
```
pane_focus (2)
chart_set_symbol ({same symbol})
chart_set_timeframe (60)

Indicators to stack:
  • Price + VWAP
  • 50-period EMA (intermediate trend)
  • Bollinger Bands (volatility context)
  • Session levels (NY open, European close)
```

**Pane 3: Momentum (15-minute) — Oscillator Stack**
```
pane_focus (3)
chart_set_symbol ({same symbol})
chart_set_timeframe (15)

Indicators to stack:
  • RSI(14) — overbought/oversold zones marked
  • Stochastic(14,3,3) overlay on RSI
  • MACD or Momentum indicator
```

**Pane 4: Macro Context (Daily) — Regime + Correlation**
```
pane_focus (4)
chart_set_symbol ({symbol} or macro ticker like ES, DXY)
chart_set_timeframe (D)

Indicators to stack:
  • Price (daily bars)
  • 200-period EMA (long-term trend)
  • Correlation overlay (DXY, VIX, yields if applicable)
  • Weekly/Monthly S/R zones
```

## Step 4: Apply Institutional Indicator Stack

For each pane, add indicators in priority order:

### Pane 1: Price Action (Main)
```
Priority order:
1. Volume bars (base layer)
2. VWAP + ±1σ, ±2σ bands
3. Moving averages: 20-EMA (fast), 50-EMA (mid)
4. Price levels (Support/Resistance via draw_shape)
5. Opening Range (OR) high/low markers
```

### Pane 2: Intermediate Structure
```
Priority order:
1. Price (candles)
2. VWAP with bands
3. 50-EMA + 200-EMA confluence
4. Bollinger Bands (20/2)
5. Session separators (market opens/closes)
```

### Pane 3: Momentum/Oscillators
```
Priority order:
1. RSI(14) with overbought (70), oversold (30) levels
2. Stochastic(14,3,3) overlay
3. Histogram for signal divergence
4. Mid-line at 50 (for mean reversion reads)
```

### Pane 4: Macro/Regime
```
Priority order:
1. Primary price chart (D or W timeframe)
2. 200-period SMA (regime definition)
3. ATR(14) or similar volatility metric
4. Correlation layer (if multi-asset: DXY overlay, VIX reading, bond yields)
```

## Step 5: Draw Institutional S/R Levels

Using `draw_shape` with institutional color conventions:

```
Support zones (BUY interest):
  • Shape: rectangle (semi-transparent)
  • Color: Green (#26A69A)
  • Opacity: 20-30%
  • Label: "Support {price}" or "Demand Zone"

Resistance zones (SELL interest):
  • Shape: rectangle (semi-transparent)
  • Color: Red (#EF5350)
  • Opacity: 20-30%
  • Label: "Resistance {price}" or "Supply Zone"

VWAP levels (Institutional benchmark):
  • Shape: horizontal_line
  • Color: Blue (#42A5F5)
  • Style: solid
  • Label: "VWAP {price}"

Pivot/Session levels (Time-based reference):
  • Shape: horizontal_line
  • Color: Orange (#FFA726)
  • Style: dashed
  • Label: "Daily Pivot {price}" or "NY Open {price}"

Order flow levels (Market microstructure):
  • Shape: horizontal_line
  • Color: Purple (#AB47BC)
  • Style: dotted
  • Label: "Order Flow {price}"
```

## Step 6: Drawing Conventions Matrix

**Zone Depth Rules**:
- Supply/Demand rectangles: Width = 0.5–1% of price (for liquid instruments)
- For SPY at $400: zones ≈ $2–4 wide
- For SPX at 4000: zones ≈ $20–40 wide

**Line Weight & Clarity**:
- Primary S/R (weekly/monthly): 2pt line weight, solid
- Secondary S/R (daily): 1.5pt line weight, solid
- VWAP bands: 1pt, color-coded by deviation
- Session markers: thin (0.5pt), dashed or dotted

**Label Positioning**:
- Place labels in a consistent location (e.g., right side of chart)
- Format: "{Level Type} {Price}" or "{Level Type} {Price} ({Context})"
- Examples: "Resistance 4020.50 (Monthly High)", "VWAP 3988.75", "Support 3975 (10-day MA)"

## Step 7: Multi-Symbol / Cross-Asset Configurations

### Macro Layout (2×2 Execution Grid)
```
Pane 1 (TL): ES (S&P 500 futures)
  → Daily chart, 200-EMA, VWAP bands
  → Draw major S/R from recent monthly highs/lows

Pane 2 (TR): NQ (Nasdaq-100 futures)
  → Daily chart, 200-EMA, VWAP bands
  → Identify if tech is leading or lagging equities

Pane 3 (BL): DXY (Dollar Index)
  → Daily chart, 50/200-EMA
  → Overlay correlation to ES (inverse relationship often visible)

Pane 4 (BR): TLT (20+ year Bond ETF)
  → Daily chart, trend identification
  → Use to gauge rate regime (bonds up = risk off)
```

**Cross-pane correlation logic**:
- ES and DXY often inverse → if DXY up, watch ES for weakness
- ES and TLT often inverse → if TLT up, equity downside expected
- ES and NQ usually correlate → if one breaks structure, other often follows

### Earnings Layout (4 Pane)
```
Pane 1: Stock (Daily chart)
  → Price, 50/200-EMA, IV rank overlay
  → Supply/Demand zones from prior consolidation

Pane 2: Sector ETF (Daily chart, same timeframe as stock)
  → Identify if stock will outperform or underperform sector
  → Example: QQQ for tech stock earnings

Pane 3: VIX (Daily chart)
  → Elevated VIX = wider earnings moves expected
  → Support/resistance on VIX itself guides move magnitude

Pane 4: Options Chain view (if available)
  → Implied volatility by strike
  → Put/call ratio
  → Open interest concentration
```

## Step 8: Finalize Layout & Capture

```
Confirm all panes:
  pane_focus (1) → chart_get_state → verify timeframe + indicators
  pane_focus (2) → chart_get_state → verify timeframe + indicators
  pane_focus (3) → chart_get_state → verify timeframe + indicators
  pane_focus (4) → chart_get_state → verify timeframe + indicators

Return to main pane:
  pane_focus (1)

Capture full layout:
  capture_screenshot (region: "full")
```

## Step 9: Layout Report

```
=== INSTITUTIONAL CHART LAYOUT: {SYMBOL} ===

LAYOUT CONFIGURATION
  Preset:     {Execution Layout / Swing / Scalp / Macro / Earnings}
  Structure:  {2×2 / 2h / 2v / 4 / 6 / 8 panes}

PANE 1: {PRIMARY CHART}
  Timeframe:    {5m / 1h / D / etc.}
  Main indicator: {VWAP + Bands / Price Action / Volume}
  Key S/R:      {list price levels with context}

PANE 2: {SECONDARY CHART}
  Timeframe:    {1h / D / W / etc.}
  Main indicator: {EMA confluence / Bollinger Bands / Session Levels}
  Key S/R:      {list price levels}

PANE 3: {OSCILLATOR / MOMENTUM}
  Timeframe:    {15m / 1h / etc.}
  Indicators:   {RSI / Stochastic / MACD}
  Signal:       {Overbought / Oversold / Neutral}

PANE 4: {MACRO / REGIME}
  Timeframe:    {D / W / or alternate symbol}
  Indicator:    {Correlation / Trend / Volatility}
  Context:      {Growth regime / Risk-off / Vol spike / etc.}

DRAWN LEVELS (By Color Coding)
  Green zones:   {support/demand prices} — {justification}
  Red zones:     {resistance/supply prices} — {justification}
  Blue lines:    {VWAP / pivots} — {justification}
  Orange lines:  {session levels} — {justification}
  Purple lines:  {order flow levels} — {justification}

LAYOUT BIAS
  Primary trend:   {UP / DOWN / SIDEWAYS}
  Intermediate:    {direction + key level}
  Execution setup: {ready to trade / waiting for confirmation / no signal}
  Next key level:  {price and context}

SCREENSHOT
  [Full layout captured with all panes visible]
```

## Color Convention Reference (Institutional Standard)

| Color | Hex | Use Case | Opacity |
|-------|-----|----------|---------|
| Green | #26A69A | Support / Demand zones | 20-30% |
| Red | #EF5350 | Resistance / Supply zones | 20-30% |
| Blue | #42A5F5 | VWAP / Institutional benchmark | Solid |
| Orange | #FFA726 | Session levels / Pivots | Solid or dashed |
| Purple | #AB47BC | Order flow / Level 2 levels | Solid or dotted |
| Yellow | #FFD54F | Trend reversals / Key points | Solid |
| Gray | #757575 | Historical levels (old S/R) | Faded |

## Error Recovery

| Issue | Fix |
|-------|-----|
| Pane won't focus | Use `pane_focus({pane_id})` before `chart_set_timeframe` |
| Indicators don't load | Chart may be loading — wait 2s, then `chart_get_state` |
| Layout resets | Re-apply via `pane_set_layout({preset})` |
| Lines not visible | Ensure `draw_shape` has correct coordinates and color |
| Screenshot black | Wait for chart to render, then retry `capture_screenshot` |

## Best Practices

1. **Always save layout snapshots**: After perfecting a layout, capture and label by use case
2. **Color consistency**: Use the institutional convention matrix — no ad-hoc colors
3. **Zone depth proportional**: Support/resistance width should match instrument's typical daily range
4. **Labels clear**: Include price and context (e.g., "Resistance 4050 (Monthly High)")
5. **Layer by timeframe**: Longer timeframes (weekly/monthly S/R) on top layer; shorter-term details in separate panes
6. **Cross-asset alignment**: When using multi-symbol layouts, ensure all timeframes are synchronous with market events (earnings, FOMC, etc.)
7. **Review before trading**: Always screenshot full layout, walk through each pane top-to-bottom, confirm all signals align before size
