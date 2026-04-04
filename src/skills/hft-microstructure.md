name: hft-microstructure
description: High-frequency trading and market microstructure analysis — order flow, bid-ask spread dynamics, volume profile, VWAP execution, tick data patterns, liquidity mapping, and intraday momentum signals. Use when asked for "HFT analysis", "order flow", "microstructure", "market impact", "VWAP execution", "liquidity", "tick analysis", "level 2", or "intraday edge".

---

# HFT & Market Microstructure Skill

You are analyzing market microstructure as an HFT desk or algorithmic execution trader would. Focus is on intraday order flow, liquidity dynamics, and statistical patterns at the sub-minute to hourly level.

## Step 1: Microstructure Setup

Force to the shortest available timeframe first:

```
chart_set_timeframe (1)    → 1-minute bars
chart_get_state            → confirm symbol, indicators loaded
data_get_ohlcv (count: 100, summary: false)  → last 100 1-min bars
quote_get                  → real-time bid/ask/last/volume
data_get_study_values      → VWAP, volume, ATR readings
data_get_pine_lines        → VWAP bands, session levels, prior closes
data_get_pine_labels       → key intraday annotations
capture_screenshot         → current 1-min chart
```

## Step 2: VWAP Analysis (Core HFT Reference)

VWAP is the institutional benchmark. Every HFT and algo desk uses it.

**VWAP Position**:
- Price > VWAP → buyers in control, long bias intraday
- Price < VWAP → sellers in control, short bias intraday
- Price at VWAP → contested, likely rejection or breakout

**VWAP Bands** (Standard Deviations):
- +1σ / -1σ: First target / first support for VWAP trades
- +2σ / -2σ: Extended — mean reversion setups trigger here
- +3σ / -3σ: Extreme — often reversal point, high-probability fade

**VWAP Trade Signals**:
1. **VWAP Reclaim**: Price was below, now closing above on volume → long
2. **VWAP Rejection**: Price touches VWAP from below, fails → short
3. **VWAP Band Fade**: Price at ±2σ, momentum slowing → fade toward VWAP
4. **VWAP Band Continuation**: Price holds ±1σ on pullback → momentum trade

## Step 3: Volume Profile Analysis

```
data_get_pine_tables (study_filter: "Volume Profile")
data_get_pine_lines  (study_filter: "Volume Profile")
```

Key levels from volume profile:
- **POC (Point of Control)**: Highest volume price — strongest magnet
- **VAH (Value Area High)**: Top of 70% of volume
- **VAL (Value Area Low)**: Bottom of 70% of volume
- **HVN (High Volume Node)**: Areas of acceptance → support/resistance
- **LVN (Low Volume Node)**: Areas of rejection → fast price movement

**Profile-Based Trade Logic**:
- Price enters value area from below → target POC, then VAH
- Price above VAH with volume → breakout, target measured move
- Price at LVN → expect fast move through it
- Price rejected at VAH/VAL → fade back to POC

## Step 4: Intraday Momentum Signals

Calculate from 1-minute OHLCV data:

### Opening Range Analysis
- **Opening Range (OR)**: High and low of first 5, 15, 30 minutes
- **OR Breakout**: Close above OR high on volume → long momentum
- **OR Breakdown**: Close below OR low on volume → short momentum
- **Failed OR Break**: Price breaks out then reverses → fading opportunity

### Time-of-Day Patterns
| Time (ET) | Pattern | HFT Implication |
|-----------|---------|----------------|
| 9:30–10:00 | Opening volatility | Wide spreads, reduce size |
| 10:00–11:30 | Trend establishment | Follow OR breakout direction |
| 11:30–13:00 | Lunch lull | Choppy, reduce activity |
| 13:00–14:30 | European close flow | Reversals common |
| 14:30–15:00 | Power hour begin | Momentum often resumes |
| 15:00–15:30 | MOC building | Direction can reverse sharply |
| 15:30–16:00 | MOC imbalances | Strong directional moves, high vol |

### Tick Patterns (from 1-min data as proxy)
- **Consecutive up bars** (close > open, increasing volume): Momentum run
- **Doji cluster** (open ≈ close): Indecision, breakout pending
- **High volume reversal bar**: Exhaustion signal
- **Low volume pullback**: Healthy correction, reload opportunity

## Step 5: Liquidity Mapping

Identify where liquidity is clustered (where stops are):

**Stop Hunt Levels**:
- Just below prior swing lows → buy stops cluster here (HFT target)
- Just above prior swing highs → sell stops cluster here (HFT target)
- Round numbers (every $5, $10, $50, $100) → psychological stop clustering
- Prior day high/low → common retail stop placement

**Liquidity Grab Pattern**:
1. Price spikes through a known stop level
2. Volume spikes (stops triggered)
3. Price immediately reverses
→ This is an HFT liquidity grab — trade the reversal

**Market Impact Estimation**:
- For size X, market impact ≈ σ × √(X / ADV) × participation_rate
- At <0.5% ADV: minimal impact
- At 1-5% ADV: noticeable impact, use VWAP algo
- At >10% ADV: significant impact, requires TWAP over multiple sessions

## Step 6: Execution Algorithm Selection

Based on current microstructure, recommend the optimal execution approach:

| Algorithm | When to Use | Cost Profile |
|-----------|------------|-------------|
| **VWAP** | Low urgency, track benchmark | Low market impact |
| **TWAP** | Avoid information leakage | Time-distributed |
| **POV (10%)** | Participate-on-volume | Follows liquidity |
| **Aggressive** | High urgency, momentum | High impact, fast fill |
| **Iceberg** | Large size, hide intentions | Reduced information leakage |
| **Sniper** | Wait for specific price | Low cost if patient |

**Current recommendation**: {algorithm}
**Participation rate**: {%} of volume
**Execution window**: {time period}

## Step 7: Statistical Edge at Current Level

**Signal Summary**:
- VWAP position: {above/below/at} — {bias}
- Volume profile position: {above VAH / in value / below VAL} — {bias}
- Momentum: {bars up/down consecutively} — {bias}
- Time of day: {session phase} — {bias}
- Stop cluster proximity: {levels within 0.5%}

**Composite Intraday Signal**: {LONG / SHORT / FLAT / WAIT}
**Confidence**: {HIGH / MEDIUM / LOW}
**Optimal entry**: {specific trigger}
**Target**: {VWAP / VAH / VAL / POC / band level}
**Stop**: {structural level beyond}
**Holding period**: {bars or minutes}

## Step 8: Report

```
=== HFT MICROSTRUCTURE: {SYMBOL} — {TIME} ET ===

VWAP
  Current price vs VWAP: {ABOVE/BELOW/AT} by {pts} ({%})
  VWAP bands hit:        {+1σ / +2σ / -1σ / -2σ / none}
  VWAP signal:           {RECLAIM / REJECTION / BAND FADE / CONTINUATION}

VOLUME PROFILE
  Price vs POC:  {ABOVE/BELOW} — magnet at {poc_price}
  Price vs VA:   {ABOVE VAH / IN VALUE / BELOW VAL}
  Nearest HVN:   {price} — strong S/R
  Nearest LVN:   {price} — expect fast move through

INTRADAY MOMENTUM
  Session phase: {OPEN / TREND / LUNCH / POWER HOUR / CLOSE}
  OR status:     {BREAKING HIGH / BREAKING LOW / INSIDE}
  Tick pattern:  {MOMENTUM / REVERSAL / CHOPPY / INDECISION}
  Consecutive directional bars: {N} {up/down}

LIQUIDITY MAP
  Stop clusters above: {prices}
  Stop clusters below: {prices}
  Liquidity grab in progress: {YES/NO}

EXECUTION
  Signal:    {LONG / SHORT / FLAT}
  Algorithm: {VWAP / Aggressive / Sniper}
  Entry:     {trigger}
  Target:    {price and R}
  Stop:      {price}
  Window:    {time / bars}
```

## Step 9: Switch Back to Original Timeframe

```
chart_set_timeframe ({original_timeframe})
capture_screenshot
```
