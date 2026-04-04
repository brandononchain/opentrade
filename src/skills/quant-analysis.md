name: quant-analysis
description: Quantitative analysis workflow — statistical edge measurement, return distribution, volatility regime detection, correlation analysis, and factor exposure. Use when asked for "quant analysis", "statistical edge", "return distribution", "volatility regime", "factor analysis", or "is there edge in this setup".

---

# Quantitative Analysis Skill

You are performing institutional-grade quantitative analysis on the current chart. This skill goes beyond technical analysis into statistical measurement of edge, regime detection, and factor decomposition.

## Step 1: Gather Raw Data

```
chart_get_state          → symbol, timeframe, indicator IDs
quote_get                → current price, volume, change
data_get_ohlcv           → count: 200, summary: false  (need full bars for stats)
data_get_study_values    → all indicator readings
```

## Step 2: Compute Statistical Metrics

Using the OHLCV bars, calculate and report:

### Return Distribution
- **Daily/Bar Returns**: (close[i] - close[i-1]) / close[i-1]
- **Mean return** (μ): average of all bar returns
- **Std deviation** (σ): volatility of returns
- **Skewness**: positive = right tail (bullish events larger), negative = left tail (crashes)
- **Kurtosis**: >3 = fat tails (more extreme moves than normal distribution)
- **Sharpe-equivalent**: μ / σ (annualized if daily bars)

### Volatility Regime
- **Realized vol (20-bar)**: σ of last 20 returns × √periods_per_year
- **Realized vol (5-bar)**: σ of last 5 returns × √periods_per_year
- **Vol ratio**: 5-bar vol / 20-bar vol
  - Ratio > 1.5 → expanding volatility (trending or stressed)
  - Ratio < 0.7 → compressing volatility (coiling, breakout likely)
  - Ratio ~1.0 → stable regime

### Momentum Factor
- **1-bar momentum**: last close vs close[1]
- **5-bar momentum**: last close vs close[5]
- **20-bar momentum**: last close vs close[20]
- **Momentum score**: weight 1-bar (0.2) + 5-bar (0.3) + 20-bar (0.5), normalize to [-1, +1]

### Mean Reversion Tendency
- **Z-score of price**: (close - mean_20) / std_20
  - Z > 2 → statistically overbought (2 std deviations above 20-bar mean)
  - Z < -2 → statistically oversold
  - This is the "entry edge" for mean reversion setups
- **Autocorrelation (lag-1)**: correlation of returns[i] with returns[i-1]
  - Positive autocorrelation → trending market (momentum works)
  - Negative autocorrelation → mean-reverting market (fading works)

### Volume Analysis
- **Relative volume**: current volume / avg_volume_20
- **Volume z-score**: (volume - avg_vol) / std_vol
- **OBV trend**: cumulative sum of signed volume — rising = accumulation

### Drawdown
- **Max drawdown**: largest peak-to-trough decline in dataset
- **Current drawdown from high**: (close - rolling_max) / rolling_max
- **Recovery factor**: total_return / max_drawdown

## Step 3: Regime Classification

Based on the above, classify the current market regime:

| Regime | Criteria | Best Strategy |
|--------|----------|---------------|
| **Trending Up** | Momentum > 0.5, autocorr > 0.1, vol ratio > 1 | Trend following, momentum |
| **Trending Down** | Momentum < -0.5, autocorr > 0.1, vol ratio > 1 | Short momentum, puts |
| **Mean Reverting** | Z-score extreme, autocorr < -0.1, vol ratio < 0.8 | Fade extremes, spread |
| **Low Vol Coiling** | Vol ratio < 0.6, narrow range | Breakout systems |
| **High Vol Stressed** | Vol ratio > 2, fat tails | Reduce size, hedge |
| **Choppy/Random** | Low autocorr, low momentum | Avoid, flat |

## Step 4: Edge Assessment

State explicitly:
- **Is there statistical edge right now?** (Yes / Marginal / No)
- **What type of edge?** (Momentum / Mean reversion / Breakout / None)
- **Confidence level?** (based on z-scores and regime clarity)
- **Optimal strategy type given current regime**

## Step 5: Report Format

```
=== QUANT ANALYSIS: {SYMBOL} {TIMEFRAME} ===

RETURN STATS (last {N} bars)
  Mean return:    {μ}%
  Volatility:     {σ}% (annualized: {σ_ann}%)
  Skewness:       {skew} ({interpretation})
  Kurtosis:       {kurt} ({fat/thin} tails)
  Sharpe equiv:   {sharpe}

VOLATILITY REGIME
  5-bar vol:      {v5}%
  20-bar vol:     {v20}%
  Vol ratio:      {ratio} → {EXPANDING / COMPRESSING / STABLE}

MOMENTUM FACTOR
  Score:          {score} / 1.0 → {STRONG BULL / BULL / NEUTRAL / BEAR / STRONG BEAR}
  1-bar:          {pct}%
  5-bar:          {pct}%
  20-bar:         {pct}%

MEAN REVERSION SIGNAL
  Z-score:        {z} ({N} std devs from 20-bar mean)
  Autocorr:       {ac} → {TRENDING / MEAN REVERTING / RANDOM}

VOLUME
  Rel volume:     {rv}x average
  Vol z-score:    {vz}
  OBV trend:      {UP / DOWN / FLAT}

DRAWDOWN
  Current DD:     {dd}% from {N}-bar high
  Max DD (data):  {mdd}%

REGIME: {REGIME_NAME}
EDGE:   {YES / MARGINAL / NO} — {type} — {confidence}%

RECOMMENDATION
  {2-3 sentences on what systematic approach fits current regime}
```

## Step 6: Screenshot

```
capture_screenshot (region: "chart")
```

Include screenshot with report for visual confirmation.
