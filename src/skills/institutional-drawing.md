name: institutional-drawing
description: Premium chart drawing and annotation — structural levels (PDH/PDL/PWH/PWL), VWAP deviations, volume profile (POC/VAH/VAL), Fibonacci retracements, supply/demand zones, trend channels, order flow annotations, session separators, and trade setup visualizations with professional color coding and positioning. Use when asked for "draw levels", "chart annotations", "support/resistance mapping", "Fibonacci levels", "volume zones", "trade setup drawing", or "level visualization".

---

# Institutional Drawing & Annotation Skill

You are drawing institutional-grade chart annotations and structural levels as a professional trading desk would. This combines systematic level identification, premium visual conventions, color-coded zones, and trade setup visualization.

## Step 1: Read Chart State & Current Price

Establish baseline:

```
chart_get_state              → current symbol, timeframe, zoom level
quote_get                    → real-time price, bid-ask, volume
data_get_ohlcv (summary: true) → current bar context
data_get_study_values        → all indicator readings (VWAP, ATR, etc.)
data_get_pine_lines          → all existing drawn lines and zones
data_get_pine_labels         → all existing annotations
```

## Step 2: Identify & Map Key Structural Levels

### Time-Based Structural Levels

**Previous Day High/Low (PDH/PDL)**
```
Extract from daily OHLCV:
  chart_set_timeframe (D)
  data_get_ohlcv (count: 2, summary: false)
  → Current bar high = PDH reference
  → Previous bar high = PDH for next day
  → Previous bar low = PDL for next day
```

**Previous Week High/Low (PWH/PWL)**
```
chart_set_timeframe (W)
data_get_ohlcv (count: 2, summary: false)
  → Current week high/low
  → Prior week high/low = trading range reference
```

**Monthly Open/High/Low**
```
chart_set_timeframe (M)
data_get_ohlcv (summary: true)
  → Month open (entry reference)
  → Month high/low (extended targets/stops)
```

**Session Levels (NY Open, European Close, Asian Close)**
```
Typical reference prices:
  • NY Open: Market open at 9:30 ET → price + volume bar at that time
  • European Close: 11:00 ET (16:00 London) → flow reversal point
  • Asian Open: Overnight gap reference (3:00 ET)

Mark each as time-based annotation:
  draw_shape (type: "horizontal_line", price: {open_price}, 
             time: {session_start}, label: "NY Open {price}")
```

### Price-Based Technical Levels

**VWAP & Deviations**
```
data_get_study_values        → VWAP reading
Calculate deviations:
  VWAP ± 1σ → First momentum targets
  VWAP ± 2σ → Extended targets / mean reversion zones
  VWAP ± 3σ → Extreme reversal points

Interpretation:
  Price > VWAP +2σ  → Likely pullback to VWAP or +1σ
  Price > VWAP +1σ  → Strong uptrend, support at VWAP
  Price < VWAP -1σ  → Weak structure, resistance at VWAP
  Price < VWAP -2σ  → Extreme, mean reversion setup
```

**Volume Profile (POC, VAH, VAL)**
```
data_get_pine_tables (study_filter: "Volume Profile")
data_get_pine_lines  (study_filter: "Volume Profile")

Extract:
  POC (Point of Control) → Price with highest traded volume
  VAH (Value Area High)  → Top of 70% volume acceptance range
  VAL (Value Area Low)   → Bottom of 70% volume acceptance range
  HVN (High Volume Node) → Secondary volume cluster → support/resistance
  LVN (Low Volume Node)  → Gap in volume → price moves through quickly

Volume profile logic:
  Price above VAH → upside target is next VAH or measured move
  Price within VAL/VAH → contested range, chop expected
  Price below VAL → downside target is next volume cluster below
```

**Opening Range (OR) High/Low**
```
For intraday (1m-5m timeframes):
  chart_set_timeframe (1)
  data_get_ohlcv (count: 30, summary: false) → first 30 bars (5-30 min range)
  
  Calculate:
    OR High = highest high in first N bars (5/15/30 min)
    OR Low  = lowest low in first N bars

  Trading logic:
    Close > OR High on volume → OR breakout long
    Close < OR Low on volume  → OR breakdown short
    Failed OR break + reversal → fade setup (opposite side)
```

### Fibonacci Retracements

```
Identify recent swing high and low:
  Swing High = highest price in last N bars (e.g., 20-bar swing)
  Swing Low  = lowest price in last N bars

Calculate Fibonacci levels:
  Distance = Swing High - Swing Low
  0%   level = Swing Low (100% move down from high)
  23.6% level = Swing Low + (Distance × 0.236)
  38.2% level = Swing Low + (Distance × 0.382)
  50%  level = Swing Low + (Distance × 0.50)
  61.8% level = Swing Low + (Distance × 0.618)  ← Most commonly tested
  78.6% level = Swing Low + (Distance × 0.786)
  100% level = Swing High

Key Fibonacci rules:
  • 61.8% = "Golden Ratio" → highest probability support/resistance
  • 50% = psychological level, often tested
  • Confluence with other levels (VWAP, POC, PDH) = strong reaction zone
```

## Step 3: Clear Existing Drawings (Optional)

```
Ask user first: "Clear all existing drawings and start fresh?"

If yes:
  draw_clear (all: true)
    → Removes all rectangles, lines, labels

If no:
  Add new layers on top of existing (recommended for comparison)
```

## Step 4: Draw Support Zones (Demand)

Green-coded institutional supply/demand drawing:

```
For each support cluster identified:
  draw_shape (
    type: "rectangle",
    low_price: {zone_bottom},
    high_price: {zone_top},
    start_time: {zone_start_time},
    end_time: {current_time},
    color: "#26A69A",           // Institutional green
    opacity: 0.25,
    border_color: "#26A69A",
    border_width: 1
  )

Zone width calculation:
  zone_width = (highest_close - lowest_close) in zone area
  For liquid equities: 0.5–1% of price
  For ES @ 4000: zones ≈ $20–40 tall
  For SPY @ 400: zones ≈ $2–4 tall

Label each zone:
  draw_shape (
    type: "label",
    price: {zone_midpoint},
    text: "Support {price} ({context})",
    color: "#26A69A"
  )

Context examples:
  "Support 3975 (10-day MA)"
  "Demand 3950 (Weekly Pivot)"
  "Support 3920 (Prior Month Low)"
```

## Step 5: Draw Resistance Zones (Supply)

Red-coded institutional resistance drawing:

```
For each resistance cluster identified:
  draw_shape (
    type: "rectangle",
    low_price: {zone_bottom},
    high_price: {zone_top},
    start_time: {zone_start_time},
    end_time: {current_time},
    color: "#EF5350",           // Institutional red
    opacity: 0.25,
    border_color: "#EF5350",
    border_width: 1
  )

Zone height = same calculation as support zones

Label each zone:
  draw_shape (
    type: "label",
    price: {zone_midpoint},
    text: "Resistance {price} ({context})",
    color: "#EF5350"
  )

Context examples:
  "Resistance 4050 (Monthly High)"
  "Supply 4040 (20-day MA)"
  "Resistance 4065 (Prior Month High)"
```

## Step 6: Draw Trend Channels

Using `draw_shape` trend_line for upper and lower bounds:

```
Identify trend (uptrend example):
  Lower bound: Connect at least 2 swing lows (trendline support)
  Upper bound: Connect at least 2 swing highs (trendline resistance)

Upper trendline:
  draw_shape (
    type: "trend_line",
    start_price: {first_swing_high_price},
    start_time: {first_swing_high_time},
    end_price: {latest_swing_high_price},
    end_time: {latest_swing_high_time},
    color: "#EF5350",           // Red for resistance
    style: "solid",
    width: 2
  )

Lower trendline (support):
  draw_shape (
    type: "trend_line",
    start_price: {first_swing_low_price},
    start_time: {first_swing_low_time},
    end_price: {latest_swing_low_price},
    end_time: {latest_swing_low_time},
    color: "#26A69A",           // Green for support
    style: "solid",
    width: 2
  )

Channel interpretation:
  Price touching upper band → expect pullback to center or lower band
  Price touching lower band → expect bounce to center or upper band
  Break of channel + close beyond → new trend establishment
```

## Step 7: Add Fibonacci Levels

Horizontal lines with precise labels:

```
For each Fibonacci level calculated:
  
  # Golden Ratio (61.8%) — highest probability
  draw_shape (
    type: "horizontal_line",
    price: {fib_618_price},
    color: "#FFD54F",           // Yellow/gold
    style: "solid",
    width: 2
  )
  
  draw_shape (
    type: "label",
    price: {fib_618_price},
    text: "Fib 61.8% {price}",
    color: "#FFD54F"
  )

  # 50% level (psychological)
  draw_shape (
    type: "horizontal_line",
    price: {fib_50_price},
    color: "#FFD54F",
    style: "dashed",
    width: 1
  )

  # Other levels (23.6%, 38.2%, 78.6%) — lighter weight
  draw_shape (
    type: "horizontal_line",
    price: {fib_level_price},
    color: "#FFD54F",
    style: "dotted",
    width: 1,
    opacity: 0.6
  )

Priority: Draw 61.8% first (thickest line), then 50% and 38.2% (secondary)
```

## Step 8: Draw Session Separators & Time Annotations

Marking key market hours and events:

```
# New York Market Open (9:30 ET)
draw_shape (
  type: "vertical_line",
  time: {ny_open_time},
  color: "#FFA726",          // Orange
  style: "dashed",
  width: 1
)

draw_shape (
  type: "label",
  time: {ny_open_time},
  price: {price_at_open},
  text: "NY Open",
  color: "#FFA726"
)

# European Session Close (11:00 ET / 16:00 London)
draw_shape (
  type: "vertical_line",
  time: {eur_close_time},
  color: "#FFA726",
  style: "dashed",
  width: 1
)

# Market Close (4:00 PM ET)
draw_shape (
  type: "vertical_line",
  time: {market_close_time},
  color: "#FFA726",
  style: "dashed",
  width: 1
)

# Economic Event Marker (if applicable)
draw_shape (
  type: "label",
  time: {event_time},
  price: {price_at_event},
  text: "CPI Release",
  color: "#AB47BC"           // Purple for event risk
)
```

## Step 9: Create Trade Setup Annotations

Complete entry/stop/target visualization:

```
# Entry Zone (green horizontal band)
draw_shape (
  type: "rectangle",
  low_price: {entry_low},
  high_price: {entry_high},
  color: "#26A69A",
  opacity: 0.15,
  border_color: "#26A69A",
  label: "Entry Zone {avg_price}"
)

# Stop Loss (red dashed line with extended left label)
draw_shape (
  type: "horizontal_line",
  price: {stop_loss_price},
  color: "#EF5350",
  style: "dashed",
  width: 2
)

draw_shape (
  type: "label",
  price: {stop_loss_price},
  text: "Stop {price} ({stop_distance} pts)",
  color: "#EF5350"
)

# Target 1 (50% position exit)
draw_shape (
  type: "horizontal_line",
  price: {target1_price},
  color: "#42A5F5",          // Blue
  style: "solid",
  width: 2
)

draw_shape (
  type: "label",
  price: {target1_price},
  text: "T1 {price} ({r_multiple}R | 50%)",
  color: "#42A5F5"
)

# Target 2 (30% position exit)
draw_shape (
  type: "horizontal_line",
  price: {target2_price},
  color: "#42A5F5",
  style: "solid",
  width: 1.5
)

draw_shape (
  type: "label",
  price: {target2_price},
  text: "T2 {price} ({r_multiple}R | 30%)",
  color: "#42A5F5"
)

# Target 3 (20% position exit / extended)
draw_shape (
  type: "horizontal_line",
  price: {target3_price},
  color: "#42A5F5",
  style: "dotted",
  width: 1
)

draw_shape (
  type: "label",
  price: {target3_price},
  text: "T3 {price} ({r_multiple}R | 20%)",
  color: "#42A5F5"
)

# Risk/Reward Label (summary box)
draw_shape (
  type: "label",
  price: {entry_price},
  text: "R/R: {rr_ratio}:1 | Risk: {risk_pts}pts",
  color: "#757575",
  position: "top_left"
)
```

## Step 10: Screenshot & Report All Levels

```
capture_screenshot (region: "full")
  → Captures all drawn levels and annotations

Generate report listing every drawn level by category
```

## Drawing Conventions Reference

### Color Legend (Institutional Standard)

| Color | Hex | Use Case | Style |
|-------|-----|----------|-------|
| Green | #26A69A | Support / Demand zones | Rectangle or line |
| Red | #EF5350 | Resistance / Supply zones | Rectangle or line |
| Blue | #42A5F5 | VWAP / Target levels / Pivots | Solid line |
| Orange | #FFA726 | Session levels / Time markers | Dashed line |
| Purple | #AB47BC | Order flow / Level 2 / Risk events | Dotted line |
| Yellow | #FFD54F | Fibonacci levels / Key confluence | Solid line |
| Gray | #757575 | Historical levels / Old S/R | Faded / thin |

### Line Style Conventions

| Style | Weight | Use Case |
|-------|--------|----------|
| Solid | 2pt | Primary S/R (weekly/monthly confluence) |
| Solid | 1.5pt | Secondary S/R (daily key levels) |
| Solid | 1pt | VWAP / session opens |
| Dashed | 1.5pt | Time-based separators (session breaks) |
| Dotted | 1pt | Fibonacci secondary levels / extended targets |

### Label Positioning Best Practices

1. **Right-side placement**: Labels on right edge of chart for visibility
2. **Staggered vertical**: Avoid label overlap by offsetting vertically
3. **Format consistency**: "{Level Type} {Price} ({Context})"
   - Example: "Resistance 4050.00 (Weekly High)" ✓
   - Example: "Resist 4050" ✗ (vague context)
4. **Font size**: Small but readable (10-11pt typical)
5. **Background**: Semi-transparent white background (optional, for clarity)

### Zone Dimensions

**Support/Demand Rectangle Width** (height of zone):
- Low liquidity (crypto): 1-2% of price
- Medium liquidity (individual stocks): 0.5-1% of price
- High liquidity (ES, SPY): 0.2-0.5% of price

**Rule of thumb**: Zone height ≈ average daily range × 0.2–0.3

Example:
```
ES daily range = 40 pts typical
Support zone height = 40 × 0.25 = 10 pts
If zone at 4000, draw rectangle from 3995 to 4005
```

## Workflow Summary

1. **Read state** → Establish current price, timeframe, existing levels
2. **Map structurals** → PDH/PDL, PWH/PWL, VWAP, Volume Profile, OR
3. **Calculate Fib** → Identify swing high/low, compute 6 key levels
4. **Draw demand zones** → Green rectangles at support clusters
5. **Draw supply zones** → Red rectangles at resistance clusters
6. **Add trend channels** → Upper/lower trendlines if in trend
7. **Fibonacci lines** → Yellow/gold horizontal lines with labels
8. **Session markers** → Orange vertical dashed lines at session opens/closes
9. **Trade setup** → Green entry, red stop, blue targets with R/R labels
10. **Screenshot** → Full chart with all annotations visible
11. **Report** → List all levels, prices, context, and visual confirmation

## Error Recovery

| Issue | Fix |
|-------|-----|
| Lines not visible | Ensure price is within current chart viewport |
| Labels overlap | Manually reposition by redrawing at offset price |
| Zone color too faint | Increase opacity from 0.15 to 0.25-0.35 |
| Too many lines (cluttered) | Use `draw_clear` and rebuild selectively |
| Timeframe doesn't show line | Ensure line was drawn on correct timeframe |
| Screenshot cuts off labels | Zoom out or pan to ensure right edge visible |

## Advanced: Multi-Timeframe Level Stacking

When drawing on shorter timeframes (1m/5m), also visualize longer-term levels:

```
# On 5-minute chart:
Draw daily levels (PDH, PDL) as orange dashed lines
Draw weekly levels (PWH, PWL) as thicker orange lines
Draw VWAP (from daily) as blue line for reference
→ Enables precise intraday execution within longer-term structure
```

This creates "nested" levels: short-term zones (green/red) inside intermediate zones (orange) inside structural levels (weekly dashed).

## Best Practices

1. **Always label context**: Never draw a line without explaining what it represents
2. **Color consistency**: Stick to the institutional convention — no custom colors
3. **Zone symmetry**: Support and resistance zones should be proportionally sized
4. **Fib priority**: Always draw 61.8% thickest, 50% medium, others lighter
5. **Removal discipline**: Delete levels that price has clearly broken and left behind
6. **Coordinate with timeframe**: Higher TF levels (weekly, monthly) override lower TF levels
7. **Update on new data**: Redraw PDH/PDL, OR, Fib retracement each day/session
8. **Screenshot before trade**: Always capture the full annotated chart before entering
