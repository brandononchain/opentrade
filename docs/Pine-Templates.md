# Pine Script Template Library

OpenTrade ships 11 production-ready Pine Script v6 templates. All pass static analysis and compile cleanly. Use them directly or ask OpenTrade to modify them.

---

## Using Templates

```
"Load the VWAP bands template"
"Use the z-score mean reversion strategy as a starting point"
"Apply the multi-factor dashboard to my chart"
"Take the momentum factor template and add an RSI filter"
```

---

## Basic Templates

### `ema_ribbon`
**Type:** Indicator | **Overlay:** Yes

Five EMAs (8, 13, 21, 34, 55) with a green/red background showing trend direction. Good visual trend confirmation tool.

**Key inputs:** EMA lengths (all adjustable), source

---

### `rsi_divergence`
**Type:** Indicator | **Overlay:** No

Detects bullish and bearish RSI divergences using pivot highs/lows. Plots triangles when price makes a new extreme but RSI does not confirm.

**Key inputs:** RSI length, pivot lookback left/right

**Signals:**
- 🔺 Green triangle below bar → bullish divergence (price lower low, RSI higher low)
- 🔻 Red triangle above bar → bearish divergence (price higher high, RSI lower high)

---

### `vwap_bands`
**Type:** Indicator | **Overlay:** Yes

VWAP with 3 standard deviation bands calculated from volume-weighted price dispersion. More accurate than simple VWAP ± std(close).

**Key inputs:** Band 1, 2, 3 multipliers

---

### `session_levels`
**Type:** Indicator | **Overlay:** Yes

Plots high and low of the New York, London, and Asia sessions using local session time detection. Shows the prior session's range as horizontal lines.

**Key inputs:** Show NY / London / Asia (toggles)

---

### `ema_cross_strategy`
**Type:** Strategy | **Commission:** 0.05% | **Slippage:** 1 tick

Classic EMA crossover (fast/slow) with optional RSI filter to avoid entries in overbought/oversold conditions. Uses `[1]` indexing to prevent lookahead bias.

**Key inputs:** Fast EMA (9), slow EMA (21), RSI filter toggle, RSI length

---

### `supertrend_strategy`
**Type:** Strategy | **Commission:** 0.05% | **Slippage:** 1 tick

ATR-based supertrend indicator used as both signal and trailing stop. Plots buy/sell signals as shapes on the chart.

**Key inputs:** ATR length (10), ATR multiplier (3.0)

---

## Quantitative Templates

### `zscore_mean_reversion` ⭐
**Type:** Strategy | **Commission:** 0.05% | **Slippage:** 2 ticks

Enters when price is statistically extended from its N-bar mean (z-score beyond threshold) and exits when it reverts. Includes volume and trend filters to avoid fading strong momentum.

**Key inputs:**
- Lookback period (20) — window for mean/stddev calculation
- Entry z-score (2.0) — how many std devs from mean to enter
- Exit z-score (0.5) — how close to mean to exit
- Volume filter (relative volume minimum)
- Trend filter (200 EMA direction)

**When it works:** Mean-reverting markets (negative autocorrelation, vol ratio < 0.8)
**When it fails:** Trending markets — z-score 2.0+ is not a fade, it's a breakout

---

### `vwap_institutional` ⭐
**Type:** Strategy | **Commission:** 0.05% | **Slippage:** 2 ticks

Two entry modes:
1. **Band Fade**: Price touches the ±2σ VWAP band and reverses → trade back to VWAP
2. **VWAP Reclaim**: Price crosses VWAP on above-average volume → momentum trade

ATR-based stop. Target is VWAP (for fades) or opposite band (for reclaims).

**Key inputs:**
- Band multipliers (1.0, 2.0)
- Entry mode (Band Fade / VWAP Reclaim / Both)
- ATR stop multiplier (1.5)

---

### `momentum_factor` ⭐
**Type:** Strategy | **Commission:** 0.05% | **Slippage:** 2 ticks

Institutional-style momentum using a composite score across 1-bar, 5-bar, and 20-bar returns, weighted by recency and z-scored against a 60-bar rolling window. Only enters when momentum z-score > 1.0 in the trend direction.

**Key inputs:**
- Momentum lookbacks (1, 5, 20 bars)
- Weights (0.2, 0.3, 0.5)
- RSI filter to avoid overbought/oversold entries
- ATR stop multiplier

**When it works:** Goldilocks/Recovery macro regimes, positive autocorrelation markets

---

### `opening_range_breakout` ⭐
**Type:** Strategy | **Commission:** 0.05% | **Slippage:** 2 ticks

Calculates the high/low of the first N minutes after market open, then trades the breakout from that range with volume confirmation. Exits at EOD (15:45 ET) or when profit target/stop is hit.

**Key inputs:**
- OR duration (30 minutes)
- Session time (`0930-1600`)
- Volume confirmation multiplier (1.5×)
- ATR range filter (OR must be at least 0.5× ATR)
- Target multiplier (2.0× OR size)
- Stop multiplier (0.5× OR size)

**Best timeframes:** 1-minute or 5-minute intraday charts

---

### `multi_factor_dashboard` ⭐
**Type:** Indicator | **Overlay:** No

Real-time composite scoring dashboard showing four factors:
1. **Momentum** — z-scored composite of 5-bar and 20-bar returns
2. **Mean Reversion** — negative z-score from 20-bar mean (high = oversold)
3. **Volume** — relative volume normalized to [-1, +1]
4. **Trend** — EMA alignment score (9/21/50 EMA)

Weighted composite line plotted with color coding. Table in top-right shows individual scores.

**Key inputs:** Weights for each factor (default: momentum 30%, mean rev 20%, volume 20%, trend 30%)

**Reading the table:**
- Score > +1.0 (green) → Long bias
- Score -1.0 to +1.0 (gray) → Neutral
- Score < -1.0 (red) → Short bias

---

## Commission Reference by Asset

| Asset | Realistic Commission | Slippage |
|-------|---------------------|----------|
| US Equities (retail) | 0.05% | 1–2 ticks |
| US Equities (institutional) | 0.01% | 1 tick |
| Futures (ES, NQ) | $4.50/side | 1 tick |
| Crypto (Binance) | 0.15% | 2–5 ticks |
| FX | 0.02–0.05% | 0.5–2 pips |

Always set realistic commissions. Backtests without commission are meaningless.
