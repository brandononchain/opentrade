# Quantitative Standards

OpenTrade applies institutional-grade quantitative methods across its analysis skills. This page documents the exact math, thresholds, and frameworks used.

---

## Volatility Regime Detection

The core method for classifying market conditions uses the ratio of short-term to long-term realized volatility.

```
5-bar realized vol  = stddev(daily_returns, 5)  × √(periods_per_year)
20-bar realized vol = stddev(daily_returns, 20) × √(periods_per_year)

Volatility Ratio = 5-bar vol / 20-bar vol
```

| Ratio | Regime | Best Strategy Type |
|-------|--------|-------------------|
| > 2.0 | **High Vol / Stressed** | Reduce all position sizes 50% |
| 1.5–2.0 | **Expanding** | Trending market — momentum works |
| 0.8–1.5 | **Stable** | Balanced — both work |
| 0.5–0.8 | **Compressing** | Coiling — breakout setup building |
| < 0.5 | **Low Vol / Coiling** | Wait for breakout with volume |

---

## Z-Score Mean Reversion Signal

Measures how many standard deviations price is from its recent mean.

```
Z = (current_price - SMA(price, 20)) / StdDev(price, 20)
```

| Z-Score | Interpretation | Signal |
|---------|---------------|--------|
| > +2.5 | Extreme overbought | Strong mean reversion SHORT |
| +2.0 to +2.5 | Statistically overbought | Fade setup |
| +1.0 to +2.0 | Extended | Caution on longs |
| -1.0 to +1.0 | Neutral zone | No edge |
| -1.0 to -2.0 | Extended down | Caution on shorts |
| -2.0 to -2.5 | Statistically oversold | Fade setup |
| < -2.5 | Extreme oversold | Strong mean reversion LONG |

**When to use:** Z-score works best when autocorrelation is negative (mean-reverting market). When autocorrelation is positive (trending), z-score signals are traps.

---

## Autocorrelation (Trend vs Mean Reversion)

Measures whether today's return predicts tomorrow's return.

```
Autocorr(lag=1) = correlation(returns[t], returns[t-1])
```

| Autocorrelation | Market Type | Best Strategy |
|----------------|------------|---------------|
| > +0.15 | Trending | Momentum — buy winners, sell losers |
| 0 to +0.15 | Mildly trending | Trend following with tight stops |
| -0.15 to 0 | Mildly mean reverting | Fade extremes |
| < -0.15 | Strong mean reversion | Aggressive fade + quick exits |

---

## Momentum Factor Score

Composite momentum across three lookback periods, weighted by recency:

```
Raw Momentum = (0.2 × 1-bar return) + (0.3 × 5-bar return) + (0.5 × 20-bar return)

Z-score of Raw Momentum (60-bar rolling):
  momZ = (Raw - SMA(Raw, 60)) / StdDev(Raw, 60)
```

| momZ | Signal |
|------|--------|
| > +1.5 | Strong bull momentum — long |
| +0.5 to +1.5 | Mild bull momentum |
| -0.5 to +0.5 | Neutral |
| -0.5 to -1.5 | Mild bear momentum |
| < -1.5 | Strong bear momentum — short |

---

## Kelly Criterion Position Sizing

The Kelly formula maximizes long-run geometric growth rate.

```
Kelly % = W - (1 - W) / R

Where:
  W = estimated win rate (decimal: 0.55 = 55%)
  R = average win / average loss (reward/risk ratio)
```

**Example:**
```
Win rate = 55%,  R/R = 2:1

Kelly = 0.55 - (1 - 0.55) / 2.0
      = 0.55 - 0.225
      = 0.325 = 32.5%
```

### Fractional Kelly (Always Use This)

Full Kelly is theoretically optimal but practically dangerous — estimation error in W and R causes ruin.

| Fraction | Risk Level | When to use |
|----------|-----------|-------------|
| Full Kelly (K) | Aggressive | Never in practice |
| Half Kelly (K/2) | Moderate | High-conviction setups |
| Quarter Kelly (K/4) | Conservative | New strategies, uncertain edge |
| Tenth Kelly (K/10) | Very conservative | Live testing a new system |

**OpenTrade always recommends Half Kelly** as the default.

### Position Size Limits

Regardless of Kelly output, apply these hard limits:
- Single name: max 5% of portfolio
- Single sector: max 15% of portfolio
- During vol ratio > 2.0: reduce all sizes by 50%

---

## Return Distribution Metrics

| Metric | Formula | Interpretation |
|--------|---------|---------------|
| **Mean (μ)** | Average of bar returns | Expected return per period |
| **Std Dev (σ)** | Standard deviation of returns | Volatility |
| **Annualized Vol** | σ × √(periods per year) | For daily: × √252, for hourly: × √(252×6.5) |
| **Sharpe Equivalent** | μ / σ | Risk-adjusted return (before subtracting risk-free rate) |
| **Skewness** | 3rd moment | Positive = right tail; negative = left tail (crash risk) |
| **Kurtosis** | 4th moment | > 3 = fat tails (extreme moves more common than normal) |

---

## Risk Metrics for Backtesting

| Metric | Minimum | Good | Excellent |
|--------|---------|------|-----------|
| **Profit Factor** | 1.25 | 1.5 | 2.0+ |
| **Win Rate** | 40% | 50% | 60%+ |
| **Max Drawdown** | < 30% | < 20% | < 10% |
| **Total Trades** | 30 | 100 | 250+ |
| **Sharpe Ratio** | 0.5 | 1.0 | 1.5+ |
| **Calmar Ratio** | 0.5 | 1.0 | 2.0+ |
| **Expectancy** | > 0 | > $50/trade | > $200/trade |

### Lookahead Bias Prevention

All Pine Script strategies must use `[1]` indexing on signals:

```pinescript
// WRONG — uses current bar's close to enter on same bar
if close > ema20
    strategy.entry("Long", strategy.long)

// CORRECT — confirms on previous bar, enters on current bar open
if close[1] > ema20[1]
    strategy.entry("Long", strategy.long)
```

---

## The Four Macro Regimes

| Regime | Growth | Inflation | Key Assets | Avoid |
|--------|--------|-----------|-----------|-------|
| **Goldilocks** | High | Moderate | Tech, Growth stocks, Credit | Bonds, Defensives |
| **Stagflation** | Low | High | Energy, Metals, TIPS | Growth stocks, Long bonds |
| **Deflation** | Low | Low | Treasuries, Gold, Utilities | Commodities, Cyclicals |
| **Recovery** | High | Low | Small cap, Financials, Industrials | Defensives |

**Regime Classification:**
```
Growth score:    SPY + QQQ 20-day momentum + IWM vs SPY RS
Inflation score: GLD + USO 20-day momentum + TLT direction (inverse)

High growth  = growth_score > 0.5
High inflation = inflation_score > 0.5
```

---

## Volume Profile Key Levels

| Level | Definition | Trading Use |
|-------|-----------|-------------|
| **POC** (Point of Control) | Highest volume price | Strongest magnet; price returns here |
| **VAH** (Value Area High) | Top of 70% of volume | Resistance above; breakout confirmation above |
| **VAL** (Value Area Low) | Bottom of 70% of volume | Support below; breakdown confirmation below |
| **HVN** (High Volume Node) | Local volume peak | Acts as support/resistance |
| **LVN** (Low Volume Node) | Local volume trough | Price moves fast through here |

**Value Area Rule:**
- Price opens above VA and holds → bullish, target VAH extension
- Price opens inside VA → rotational, trade between VAH/VAL
- Price opens below VA and holds → bearish, target VAL extension

---

## VWAP Standard Deviations

| Band | Distance | Typical Behavior |
|------|---------|-----------------|
| ±1σ | ~68% of price action | Pullback support/resistance |
| ±2σ | ~95% of price action | Extended — mean reversion setups |
| ±3σ | ~99.7% of price action | Extreme — high-probability fade |

**VWAP Trade Types:**
- **Reclaim**: Price crossed below VWAP then reclaims it on volume → long
- **Rejection**: Price approaches VWAP from below, stalls, reverses → short
- **Band Fade**: Price at ±2σ with momentum slowing → fade toward VWAP
- **Continuation**: Price pulls back to ±1σ and holds → add to momentum trade
