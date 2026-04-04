name: hedge-fund-analysis
description: Institutional hedge fund-style analysis — multi-timeframe confluence, risk/reward mapping, position sizing with Kelly Criterion, portfolio heat, factor neutralization, and trade structuring. Use when asked for "hedge fund analysis", "institutional view", "risk/reward", "position size", "Kelly", "portfolio heat", "factor neutral", or "how would a fund trade this".

---

# Hedge Fund Analysis Skill

You are performing institutional-grade trade analysis as a multi-strategy hedge fund PM would. This combines top-down macro context, systematic signal generation, risk-adjusted position sizing, and structured trade expression.

## Step 1: Multi-Timeframe Confluence Scan

Run this sequence — higher timeframes first, then zoom in:

```
chart_get_state              → current TF and symbol
data_get_ohlcv (summary: true) → price action summary
data_get_study_values        → all indicator readings
data_get_pine_lines          → key price levels
data_get_pine_labels         → annotated levels (PDH, ODH, VAH, VAL, POC)
```

Then switch timeframes to build the full picture:

**Monthly (M)** — Primary trend
```
chart_set_timeframe (M)
quote_get + data_get_ohlcv (summary: true)
```

**Weekly (W)** — Intermediate trend, key S/R
```
chart_set_timeframe (W)
data_get_ohlcv (summary: true)
data_get_study_values
```

**Daily (D)** — Entry regime
```
chart_set_timeframe (D)
data_get_ohlcv (summary: true)
data_get_study_values
data_get_pine_lines
data_get_pine_labels
```

**Intraday (if applicable)** — Execution window
```
chart_set_timeframe (60 or 15)
data_get_ohlcv (summary: true)
```

Return to original timeframe when done.

## Step 2: Structural Signal Matrix

Score each timeframe from -2 to +2:
- **+2**: Strong bullish (momentum + structure + volume confirm)
- **+1**: Mild bullish (2 of 3 factors align)
- **0**: Neutral / conflicting
- **-1**: Mild bearish
- **-2**: Strong bearish

| Timeframe | Score | Key Signal |
|-----------|-------|-----------|
| Monthly | {score} | {signal} |
| Weekly | {score} | {signal} |
| Daily | {score} | {signal} |
| Intraday | {score} | {signal} |
| **COMPOSITE** | **{avg}** | **{bias}** |

Composite > 1.0 → Long bias
Composite < -1.0 → Short bias
-1.0 to 1.0 → No directional edge, avoid or neutral spread

## Step 3: Risk/Reward Mapping

Identify and price the trade:

**Entry Zone**: {price range where you'd initiate}
**Thesis Stop**: {price that invalidates the trade thesis — not arbitrary}
- Should be beyond a structural level (key S/R, VWAP, prior day high/low)
- Stop distance = Entry - Stop (in points and %)

**Target Levels**:
- T1 (50% position): {next key level} — {R multiple}
- T2 (30% position): {measured move / prior structure} — {R multiple}
- T3 (20% position): {extended target} — {R multiple}

**Expected Value Calculation**:
- Win rate estimate: {based on regime and signal strength}%
- Avg win: {weighted avg of targets} × {win rate}
- Avg loss: {stop distance} × {1 - win rate}
- EV = Avg win - Avg loss → must be positive to trade

Minimum acceptable: 2:1 R/R with >40% win rate, or 3:1 with >30%

## Step 4: Kelly Position Sizing

```
Kelly % = W - (1-W)/R

Where:
  W = win rate (estimate from signal strength and regime)
  R = reward/risk ratio (T1 distance / stop distance)
```

**Full Kelly**: {kelly}% of portfolio
**Half Kelly** (recommended — accounts for estimation error): {kelly/2}%
**Quarter Kelly** (conservative): {kelly/4}%

**In dollar terms** (assume $1M AUM as baseline, scale accordingly):
- Full Kelly: ${full_kelly_dollars}
- Half Kelly: ${half_kelly_dollars} ← recommended
- Quarter Kelly: ${quarter_kelly_dollars}

**Max position rule**: Never exceed 5% of AUM in single name, 15% in sector.

## Step 5: Portfolio Heat Check

Before sizing, check correlation risk:

**Identify existing exposure themes**:
- Is this trade long/short risk-on assets?
- What macro factor does it load on? (rates, growth, vol, dollar)
- Is it correlated to existing positions?

**Heat rules**:
- If correlated to 2+ existing positions → reduce size 30-50%
- If adds to a sector/factor already >15% of book → pass or hedge
- If in high-vol regime → reduce all sizes by 25-50%

**Factor neutralization** (if applicable):
- Can you hedge the beta? (SPY puts, sector ETF short)
- Can you hedge the currency? (FX forward equivalent in options)
- Remaining alpha = residual after hedging systematic factors

## Step 6: Trade Structure

Choose the optimal expression:

| Expression | When to use | Cost |
|-----------|------------|------|
| **Long/Short equity** | High conviction, low vol | Zero premium |
| **Long call/put** | Defined risk, high gamma | Premium paid |
| **Call/Put spread** | Reduce premium, cap upside | Reduced cost |
| **Risk reversal** | High skew environments | Can be zero-cost |
| **Ratio spread** | Finance hedge with upside | Variable |
| **Futures** | Index exposure, leverage | Margin |

**Recommended structure for this trade**: {structure}
**Rationale**: {why this expression fits current vol, skew, and conviction}

## Step 7: Execution Plan

```
Entry trigger:    {specific price action signal to execute}
Entry window:     {time of day or candle conditions}
Platform stop:    {hard stop price, GTC order}
Scale-out levels: T1={price}, T2={price}, T3={price}
Max hold period:  {time-based stop if thesis doesn't play out}
Invalidation:     {if X happens, exit regardless of P&L}
```

## Step 8: Report

```
=== HEDGE FUND ANALYSIS: {SYMBOL} ===

MULTI-TIMEFRAME SIGNAL
  Monthly:   {score} — {signal}
  Weekly:    {score} — {signal}
  Daily:     {score} — {signal}
  Composite: {score} — {LONG / SHORT / FLAT}

TRADE SETUP
  Bias:    {LONG / SHORT / FLAT}
  Entry:   {price or zone}
  Stop:    {price} ({distance}% | thesis: {reason})
  T1:      {price} — {R}R ({size}%)
  T2:      {price} — {R}R ({size}%)
  T3:      {price} — {R}R ({size}%)
  EV:      {positive/negative} | Win rate needed: {min_wr}%

SIZING (Half Kelly, $1M AUM)
  Kelly %:    {kelly}% → Half Kelly: {hk}%
  Dollar size: ${hk_dollars}
  Shares/contracts: {qty} at ${entry}

STRUCTURE
  Expression: {equity / call spread / put / etc.}
  Rationale:  {why}

RISK
  Portfolio heat after trade: {%}
  Factor exposure: {growth/value/momentum/etc.}
  Correlated book risk: {yes/no — detail}

EXECUTION
  Trigger:      {specific entry signal}
  Stop order:   GTC at {stop_price}
  Review:       {date/time to reassess if flat}
```
