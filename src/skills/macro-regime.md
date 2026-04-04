name: macro-regime
description: Top-down macro regime analysis — identify the current macro environment across equities, bonds, commodities, and FX, then derive the optimal asset allocation and sector rotation implied by the regime. Use when asked for "macro analysis", "regime", "asset allocation", "sector rotation", "risk-on/risk-off", "cross-asset", or "what is the market environment".

---

# Macro Regime Analysis Skill

You are performing a top-down cross-asset macro analysis as a global macro hedge fund PM or CIO would. This maps the current macro regime and derives the optimal portfolio positioning.

## Step 1: Cross-Asset Snapshot

Scan the key macro barometers across asset classes:

```
// Equities — Risk appetite
chart_set_symbol (SPY)  → quote_get + data_get_ohlcv (summary: true)
chart_set_symbol (QQQ)  → quote_get + data_get_ohlcv (summary: true)
chart_set_symbol (IWM)  → quote_get (small cap = risk appetite)
chart_set_symbol (VIX)  → quote_get (fear gauge)

// Bonds — Rate regime
chart_set_symbol (TLT)  → quote_get (long-duration bonds = rate sensitivity)
chart_set_symbol (HYG)  → quote_get (high yield credit = credit risk)
chart_set_symbol (LQD)  → quote_get (investment grade = safer credit)

// Commodities — Inflation/growth
chart_set_symbol (GLD)  → quote_get (gold = inflation + fear)
chart_set_symbol (USO)  → quote_get (oil = growth + geopolitics)
chart_set_symbol (DBC)  → quote_get (broad commodities)

// FX — Dollar regime
chart_set_symbol (UUP)  → quote_get (dollar index ETF)
chart_set_symbol (FXE)  → quote_get (EUR/USD proxy)
```

## Step 2: Regime Classification Matrix

Score each signal and classify:

### Growth Indicator
- SPY + QQQ + IWM all up YTD: Strong growth (+2)
- Mixed equity performance: Slowing growth (0)
- All down with credit spreads widening: Contraction (-2)

### Inflation Indicator
- GLD up, USO up, TLT down: High inflation (+2)
- Mixed: Moderate inflation (0)
- GLD down, USO down, TLT up: Low inflation / deflationary (-2)

### Risk Appetite (Risk-On vs Risk-Off)
- VIX < 15, HYG up, IWM outperforming: Risk-on (+2)
- VIX 15–25: Neutral (0)
- VIX > 25, HYG down, TLT up, GLD up: Risk-off (-2)

### Dollar Regime
- UUP rising: Strong dollar (+2) → headwind for commodities, EM
- UUP falling: Weak dollar (-2) → tailwind for commodities, EM

### Yield Curve
- Short rates < Long rates (normal): Expansion
- Inverted (short > long): Recession warning
- Flattening rapidly: Tightening cycle peak

## Step 3: The Four Macro Regimes

Map growth + inflation scores to the classic macro quadrant:

```
           HIGH INFLATION
                │
    STAGFLATION │  GOLDILOCKS
   Growth-,Inf+ │  Growth+,Inf+
                │
─────────────────────────────── GROWTH
                │
    DEFLATION   │  RECOVERY
   Growth-,Inf- │  Growth+,Inf-
                │
           LOW INFLATION
```

| Regime | Growth | Inflation | Best Assets | Worst Assets |
|--------|--------|-----------|-------------|--------------|
| **Goldilocks** | High | Moderate | Equities, Credit | Cash, Bonds |
| **Stagflation** | Low | High | Commodities, TIPS, Energy | Growth stocks, Long bonds |
| **Deflation** | Low | Low | Treasuries, Utilities, Gold | Commodities, Cyclicals |
| **Recovery** | High | Low | Growth stocks, EM, Small cap | Defensives, Bonds |

**Current regime**: {classify based on scores}

## Step 4: Sector Rotation Map

Based on the regime, identify the optimal sector positioning:

### Goldilocks (Expansion)
- **Overweight**: Technology, Consumer Discretionary, Financials
- **Neutral**: Industrials, Healthcare
- **Underweight**: Utilities, REITs, Consumer Staples

### Stagflation
- **Overweight**: Energy (XLE), Materials (XLB), Agriculture
- **Neutral**: Healthcare, Consumer Staples
- **Underweight**: Technology, Consumer Discretionary, Long-duration

### Deflation/Recession
- **Overweight**: Utilities (XLU), Consumer Staples (XLP), Healthcare (XLV), Long bonds (TLT)
- **Neutral**: Financials (small positions)
- **Underweight**: Energy, Materials, Consumer Discretionary

### Recovery
- **Overweight**: Financials (XLF), Industrials (XLI), Small cap (IWM), Technology
- **Neutral**: Healthcare, Utilities
- **Underweight**: Defensives broadly

## Step 5: Scan Sector ETFs

```
batch_run (
  symbols: ["XLK","XLF","XLE","XLB","XLI","XLY","XLP","XLU","XLV","XLRE","XLC"],
  action: "quote"
)
```

Rank sectors by 20-day performance vs SPY (relative strength).
Identify: top 3 sectors (overweight) vs bottom 3 (underweight/short).

## Step 6: Factor Exposure

In the current regime, which equity factors work?

| Factor | Works in | Underperforms in |
|--------|----------|-----------------|
| **Momentum** | Goldilocks, Recovery | Stagflation, turning points |
| **Value** | Recovery, Stagflation | Goldilocks peak, Deflation |
| **Growth/Quality** | Goldilocks, Deflation | Stagflation |
| **Low Volatility** | Deflation, Uncertainty | Recovery |
| **Small Cap** | Recovery, Goldilocks early | Deflation, Stagflation |

**Current factor bias**: {factors favored by current regime}

## Step 7: Report

```
=== MACRO REGIME ANALYSIS — {DATE} ===

CROSS-ASSET SIGNALS
  Equities (SPY):   {+/-N}% 20D — {signal}
  Small Cap (IWM):  {+/-N}% 20D — {signal}
  Volatility (VIX): {level} — {LOW/ELEVATED/HIGH}
  Long Bonds (TLT): {+/-N}% 20D — {signal}
  High Yield (HYG): {+/-N}% 20D — {signal}
  Gold (GLD):       {+/-N}% 20D — {signal}
  Oil (USO):        {+/-N}% 20D — {signal}
  Dollar (UUP):     {+/-N}% 20D — {STRONG/WEAK}

REGIME SCORES
  Growth:      {score} / 2 → {EXPANSION / SLOWING / CONTRACTION}
  Inflation:   {score} / 2 → {HIGH / MODERATE / LOW}
  Risk Appetite: {RISK-ON / NEUTRAL / RISK-OFF}
  Dollar:      {STRONG / WEAK / NEUTRAL}

CURRENT REGIME: {GOLDILOCKS / STAGFLATION / DEFLATION / RECOVERY}
Confidence: {HIGH / MEDIUM / LOW}

ASSET ALLOCATION TILT
  Equities:    {OVERWEIGHT / NEUTRAL / UNDERWEIGHT} — {detail}
  Fixed Income:{OVERWEIGHT / NEUTRAL / UNDERWEIGHT} — {detail}
  Commodities: {OVERWEIGHT / NEUTRAL / UNDERWEIGHT} — {detail}
  Cash:        {%} — {rationale}

SECTOR ROTATION
  Overweight:  {sector1}, {sector2}, {sector3}
  Neutral:     {sector4}, {sector5}
  Underweight: {sector6}, {sector7}

FACTOR TILT
  Favor:  {factor1}, {factor2}
  Avoid:  {factor3}, {factor4}

TOP TRADE IDEAS THIS REGIME
  1. {trade} — {rationale}
  2. {trade} — {rationale}
  3. {trade} — {rationale}

RISK TO THESIS
  {What would change the regime classification and force a rebalance}
```
