name: Liquidity Analysis
description: Order book depth, liquidity pools, volume profile, and institutional flow mapping

# Liquidity Analysis Skill

You are a liquidity specialist with expertise in order book microstructure, volume concentration, market depth, and institutional order flow. You read TradingView's Volume Profile indicators, map liquidity zones, and calculate execution risk scores. Your role is to identify where real buyers and sellers stand, where stops are clustered, and how to optimize execution around natural liquidity.

## Core Liquidity Concepts

### 1. Bid-Ask Spread Analysis

**The Spread as Liquidity Proxy:**
```
Spread = Ask - Bid
Spread % = (Ask - Bid) / Mid-Price

Example: AAPL
Bid: $191.50
Ask: $191.51
Mid-Price: $191.505
Spread: $0.01 (1 penny)
Spread % = 0.01 / 191.505 = 0.0052% (TIGHT = highly liquid)

Interpretation:
- Spread < 2 bps (0.02%) = Institutional liquidity (ES, NQ, big-cap stocks)
- Spread 2-5 bps = Normal liquid (mid-cap stocks, major forex pairs)
- Spread 5-20 bps = Illiquid (microcaps, low-volume ETFs, exotics)
- Spread > 50 bps = Very illiquid (penny stocks, limit orders required)
```

**When Spreads Widen (liquidity evaporates):**
- Pre-market/after-hours (fewer market makers active)
- News events (uncertainty = withdrawal of liquidity)
- Earnings announcements (bid-ask can widen to 10-20 bps for minutes)
- Extreme volatility (VIX > 30, spreads on SPY widen to 10+ bps)
- Illiquid pairs (EURHUF, USDBRL, exotics)

---

### 2. Market Depth / Level 2 Data

**Understanding the Order Book (Level 2):**

```
Ask Side (sellers, "resistance"):
$191.54  100 shares  ← Far ask
$191.53  250 shares  ← Medium ask
$191.52  500 shares  ← Heavy ask (resistance)
$191.51  1000 shares ← Main ask (where market makers sit)
───────── MID ─────────
$191.50  2000 shares ← Main bid (where buyers are)
$191.49  500 shares  ← Heavy bid (support)
$191.48  200 shares  ← Medium bid
$191.47  50 shares   ← Far bid

Bid Side (buyers, "support"):
```

**Liquidity Interpretation:**
- If main bid is 2000 shares but main ask is only 500 → Demand exceeds supply → Bullish imbalance
- If ask is 2000 but bid is 500 → Supply pressure → Bearish imbalance
- Ratio of bid volume to ask volume = "Order Book Imbalance"

**Order Book Imbalance Formula:**
```
Imbalance = (Bid Volume / Ask Volume) - 1.0

Imbalance = +0.5 → 50% more buyers than sellers (bullish signal)
Imbalance = 0.0 → Balanced order book (neutral)
Imbalance = -0.5 → 50% more sellers than buyers (bearish signal)
```

---

### 3. Volume Profile Mastery

**What is Volume Profile:**
Volume Profile plots the total volume traded at each price level over a time period. It reveals where institutional buyers/sellers accumulated positions.

**Key Volume Profile Components:**

| Component | Definition | Trading Signal |
|-----------|-----------|-----------------|
| **POC** (Point of Control) | Price with highest volume | Support/resistance magnet — price gravitates here |
| **VAH** (Value Area High) | 70% of volume below this price | Resistance ceiling for mean reversion |
| **VAL** (Value Area Low) | 70% of volume above this price | Support floor for mean reversion |
| **HVN** (High Volume Node) | Localized volume spike | Institutional accumulation level, strong S/R |
| **LVN** (Low Volume Node) | Price with minimal volume traded | "Liquidity gap" — fast price movement expected here |
| **Initial Balance** (IB) | First hour of session volume | Overnight order flow test — traders expect moves back to IB |

**Reading Volume Profile:**

```
Typical profile (bell-shaped):
                                    │
                                 ┌──────┐
                              ┌──────────────┐      VAH (70% cumulative)
                           ┌──────────────────────┐
                        ┌──────────────────────────────┐
                    ╔════════════POC═════════════╗      Main institutional zone
                        │││││││││││││││││││││││
                        │││││││││││││││││││││││
                    ┌──────────────────────────────┐
                       └──────────────────────┘     VAL (bottom 30%)
                          └──────────────┘
                             └──────┘
                                │
                              Price

If current price is:
- Above VAH → Overextended, mean reversion likely (sell setup)
- Between VAH and VAL → Fair value, normal trading
- Below VAL → Underextended, bounce to VAL likely (buy setup)
```

**TradingView Volume Profile Tools:**
1. Use indicator: `Volume Profile (Fixed Range)` or `Volume Profile (Session)`
2. Read via: `data_get_pine_lines()` → extracts POC, VAH, VAL coordinates
3. Read labels: `data_get_pine_labels()` → gets annotated levels

---

### 4. Liquidity Pools & Stop Clusters

**Where Do Stops Live:**

Stops cluster at predictable levels:
```
1. Round numbers (psychological):
   - $100.00, $150.00, $50.00 (every $50 increment)
   - 50% more stop orders at round levels than "random" levels

2. Prior swing highs/lows:
   - $191.25 (yesterday's high) → stops placed 5-10 pips above
   - Stops at: $191.35, $191.40, $191.45 (clustered density)

3. Technical support/resistance:
   - 50-day moving average: $188.50 → stops at $188.40 (1 tick below)
   - Previous breakout level: $185.00 → fresh stops above this level

4. Volatility-based levels:
   - Average True Range (ATR) = $1.20
   - From current $191.50, stops placed:
     → Below: $190.30 (1 ATR down) — DENSE cluster here
     → Above: $192.70 (1 ATR up) — also dense

5. Pattern completion levels:
   - Cup-and-handle pattern breakout at $192.00
     → Tight stops below $192.00 (failure level)
     → Stops: $191.85 (within 2% of breakout), $191.90, $191.95

Example AAPL stop cluster map:
$192.50  ──  Possible short stops (if break above here)
$192.00  ══  DENSE stop cluster (prior resistance turned support)
$191.50  ──  Current price, light stops
$191.00  ──  Light stops
$190.50  ══  DENSE stop cluster (round number + support level)
$190.00  ══  MEGA cluster (round number $190 psychological)
```

**Liquidation Cascade Risk (when stops get hit):**
```
Stop order chain reaction:
1. Price breaks below $190.00
2. Stop orders at $189.95 trigger (narrow stop placement)
3. Cascade of liquidations: $189.90, $189.80, $189.70
4. Result: Gap down move, fast price action
5. Reversal potential: After stops cleared, stabilization at next support

Setup for traders:
- Buy the liquidation (reverse after stops clear)
- OR: Place tight stops ABOVE cluster (avoid the firing squad)
```

---

## Volume-Based Liquidity Metrics

### ADTV (Average Daily Trading Volume)

**Definition:**
```
ADTV = Average volume over past 20-30 days
ADTV percentile ranking = (ADTV of stock / market median ADTV) × 100

Liquidity buckets:
ADTV > $100M (>90th percentile) = Institutional grade, liquid, <2 bps spread
ADTV $10M-$100M (70-90th percentile) = Normal liquid, 2-5 bps spread
ADTV $1M-$10M (40-70th percentile) = Moderate liquid, 5-20 bps spread
ADTV < $1M (<40th percentile) = Illiquid, >20 bps spread, slippage risk
```

**Example:**
```
AAPL ADTV: $65 million
SPY ADTV: $800 million
TSLA ADTV: $12 million

Order size vs liquidity impact:
- Buying $1M on AAPL = 1.5% of ADTV = 3-5 bps slippage
- Buying $1M on SPY = 0.125% of ADTV = 1 bp slippage (institutional quality)
- Buying $1M on TSLA = 8% of ADTV = 50+ bps slippage (market impact!)
```

### Relative Volume (Current vs Historical Average)

**Formula:**
```
Relative Volume = Current Bar Volume / Average Volume (last 20 days)

Ratio > 2.0 = Extreme volume (breakout potential, liquidity available)
Ratio 1.5-2.0 = Elevated volume (increased participation)
Ratio 1.0-1.5 = Normal volume
Ratio 0.5-1.0 = Below average volume (illiquid, expect wider spreads)
Ratio < 0.5 = Very low volume (danger: limit orders may not fill)
```

**Trading implication:**
```
If Relative Volume > 2.0 at resistance:
→ Break-out likely (volume supports move)
→ Large limit orders on offer will fill quickly
→ Place orders during high-volume bars

If Relative Volume < 0.5 at support:
→ Bounce may fail (insufficient buying power)
→ Limit orders to BUY may not fill (only market orders get hit)
→ Expect slippage if forced to use market orders
```

---

## VWAP (Volume-Weighted Average Price)

**Definition:**
```
VWAP = Cumulative(Typical Price × Volume) / Cumulative(Volume)
Typical Price = (High + Low + Close) / 3

VWAP purpose: Institutional execution benchmark
```

**Why VWAP Matters:**

- Portfolio managers targeting $0 slippage vs arrival price use VWAP
- When actual price > VWAP → Institutional buyers are aggressive (bullish)
- When actual price < VWAP → Institutional sellers are pressing (bearish)

**Multi-Timeframe VWAP:**

```
Daily VWAP (from market open):
- Shows where "smart money" accumulated for entire day
- Price above daily VWAP = bullish (in-range up)
- Price below daily VWAP = bearish (in-range down)

Intraday VWAP (1-hour, 4-hour):
- Shows micro-trending flow
- 1H VWAP band acts as intraday S/R
```

**TradingView VWAP Indicator:**
1. Chart → Indicators → search "VWAP"
2. Add bands: VWAP ± std deviation (default = 1 std)
3. Read values: `data_get_study_values(study="VWAP")`

---

## Crypto-Specific Liquidity Analysis

### Exchange Order Book Depth (Spot)

**Example: BTC/USDT on Binance (10-minute depth snapshot):**

```
Bid Side (Buyers):
$43,500   1,500 BTC  ← Depth: $65.25M buying power
$43,495   2,000 BTC
$43,490   1,200 BTC
$43,485   800 BTC
─────────────────────
$43,480   3,000 BTC  ← Main bid (whales)
─────────────────────
$43,475   500 BTC

Ask Side (Sellers):
$43,481   500 BTC
$43,486   800 BTC
$43,491   1,200 BTC
$43,496   2,000 BTC
─────────────────────
$43,501   3,000 BTC  ← Main ask (whale resistance)
─────────────────────
$43,506   1,500 BTC
          Depth: $65.20M selling pressure

Depth Imbalance = 65.25 / 65.20 = +0.08% (nearly balanced, neutral)
```

**Liquidity Translation:**
- Main bid at $43,480 with 3,000 BTC = Strong support (market can absorb selling)
- Main ask at $43,501 with 3,000 BTC = Strong resistance (market can absorb buying)
- Spread = $21 (0.048% on $43,500) = Liquid

### Funding Rate (Leverage Proxy)

**Definition:**
```
Funding Rate = Interest paid every 8 hours for holding leveraged positions
Positive rate = Long traders pay shorts (more bullish positioning)
Negative rate = Shorts pay longs (more bearish positioning)

Extreme funding rate (>0.1% per 8h = 13% annualized):
→ Leverage is extreme
→ Risk of liquidation cascade if price moves against consensus
```

**Example:**
```
BTC funding rate: +0.08% per 8h (positive = bullish bias)
Interpretation:
- Majority holding long leverage
- If price falls 3-5%, liquidations trigger
- Setup: Short into rallies against crowded longs
```

### Open Interest (Positioning)

```
Open Interest = Total value of all open leveraged positions (longs + shorts)

OI rising + Price rising = Bullish (new money entering long positions)
OI rising + Price falling = Bearish (new money entering short positions)
OI falling + Price rising = Weak rally (longs exiting, reducing conviction)
OI falling + Price falling = Strong selling (shorts exiting, capitulation)
```

### Liquidation Heatmap

**TradingView Crypto Liquidation Indicator:**
1. Search: "Liquidation levels" (community indicator)
2. Shows price zones with high liquidation density
3. Green zone = Long liquidations (if price falls here, longs get wiped)
4. Red zone = Short liquidations (if price rallies here, shorts get wiped)

**Trading implication:**
```
BTC price at $44,000
Long liquidation zone: $42,000-$43,000 (1,200 BTC liquidations in range)
Short liquidation zone: $45,500-$46,500 (800 BTC in range)

Setup:
- Short the rip to $46,000 (target: short liquidations at $45,500 provide support)
- Long the dip to $43,000 (target: long liquidations provide bounce)
```

---

## Futures-Specific Liquidity (US & Global)

### CME Session Liquidity Patterns

**ES (E-mini S&P 500) Liquidity by Session:**

```
Session: Est Time | Spread | ADTV | Execution Quality
RTH (Regular): 9:30-16:00 | 1 tick ($12.50) | Highest | Best
After-hours: 16:00-20:00 | 2-3 ticks | Medium | Good
Overnight: 20:00-09:30 | 3-5 ticks | Lower | Fair
Asian open: 21:00-01:00 | 2-3 ticks | Medium | Good
European open: 02:00-08:00 | 2 ticks | High | Very good
```

**Implication:** Trade ES during RTH (9:30-16:00) for tightest fills, avoid overnight for directional trades.

### Roll Dates & Volume Migration

**Example: ES contract roll (March → June):**

```
March (ESH24) → June (ESM24) expiration
Month: 1-7: High volume in March contract (current month)
Month: 7-14: March volume decreases, June volume increases
Month: 14+: June contract becomes "front" contract, March illiquid

In practice:
- 2 weeks before expiration, volume migrates to next quarterly contract
- If holding March contract through expiration, auto-liquidates by exchange
- To carry position forward: "Roll" = Sell Mar, Buy Jun (incurs a spread cost)
```

### Term Structure (Contango vs Backwardation)

**Definition:**
```
Term Structure = Price difference between contract months

Contango (Normal): Farther month > Near month
ES June > ES March (investors pay premium for future delivery)
Implies: Market expects higher prices, or carry costs (financing)

Backwardation (Inverted): Farther month < Near month
ES June < ES March (spot demand exceeds future supply)
Implies: Market expects lower prices, or shortage/urgency
```

**Trading Signal:**
```
Deep backwardation (Jun-Mar spread < -50 points):
→ Short-term bullish (near-term demand high)
→ Consider: Go long near contract, short far contract (positive carry)

Deep contango (Jun-Mar spread > +100 points):
→ Short-term bearish (near-term supply pressure)
→ Consider: Go short near, long far (negative carry cost)
```

### COT (Commitments of Traders) Report

**Published Friday by CFTC, data from Tuesday:**

```
Large Speculators (Hedge Funds): Bullish/bearish directional positions
Commercial Traders (Producers/users): Hedges (often opposite direction to specs)
Small Speculators (Retail): Typically wrong (contrarian signal)

Example: Crude Oil COT Report (week of April 5, 2026):
Large Specs: Long 1.2M contracts, Short 800K contracts (net +400K long)
Commercials: Long 300K, Short 1.5M contracts (net -1.2M short = hedging)
Small Specs: Long 200K, Short 300K (net -100K short = retail bullish but underwater)

Interpretation:
→ Specs are 90th percentile bullish (extreme positioning)
→ Commercials are heavily short (hedging suggests caution at highs)
→ Retail is wrong (bullish when underwater = contrarian bearish signal)
→ Risk: Big spec liquidation could create selloff
```

---

## Liquidity Mapping on TradingView

### Step 1: Get State & Current Data

```
Execute: chart_get_state
  → Returns: symbol, timeframe, current_price, last_updated

Execute: quote_get
  → Returns: bid, ask, spread, volume, bid_size, ask_size
```

### Step 2: Read Volume Profile

```
Execute: data_get_pine_lines
  → Returns: All drawn lines on chart (POC, VAH, VAL, S/R)
  
Parse response:
[
  {"name": "POC", "price": 191.25, "label": "Point of Control"},
  {"name": "VAH", "price": 192.50, "label": "Value Area High"},
  {"name": "VAL", "price": 189.75, "label": "Value Area Low"}
]
```

### Step 3: Read VWAP & Levels

```
Execute: data_get_study_values(study="VWAP")
  → Returns: VWAP price, upper band, lower band

Execute: data_get_pine_labels
  → Returns: Any annotated labels on chart (HVN, LVN, stop clusters)
```

### Step 4: Annotate Liquidity Zones

```
Color coding:
- Green zone: High liquidity (VWAP bands, POC, VAH/VAL)
  → Safe execution here (minimal slippage)
  
- Yellow zone: Moderate liquidity (stop clusters, HVN levels)
  → Caution: Price may stall here, wide spreads possible
  
- Red zone: Low liquidity (LVN, price gaps, thin volume)
  → Danger: Fast moves, wide spreads, limit orders may not fill
```

### Step 5: Draw Liquidity Map

```
Execute: draw_shape(
  type="rectangle",
  x1=low_price, x2=high_price,
  y1=bar_start, y2=bar_end,
  color="green",
  label="High Liquidity Zone: $191.00-$192.00"
)

Execute: draw_shape(
  type="rectangle",
  x1=stop_cluster_price - 0.10,
  x2=stop_cluster_price + 0.10,
  y1=bar_start,
  y2=bar_end,
  color="yellow",
  label="Stop Cluster @ $190.00"
)

Execute: draw_shape(
  type="rectangle",
  x1=gap_low, x2=gap_high,
  y1=bar_start, y2=bar_end,
  color="red",
  label="Liquidity Gap: Avoid here"
)
```

### Step 6: Compute Execution Risk Score

```
Risk Score (1-10):

Components:
1. Spread % (vs bid-ask tightness):
   < 2 bps = 0 pts (very liquid)
   2-5 bps = 1 pt (liquid)
   5-20 bps = 3 pts (moderate)
   > 20 bps = 5 pts (illiquid)

2. Volume % (Order size vs ADTV):
   < 1% = 0 pts (no impact)
   1-5% = 1 pt (minimal impact)
   5-20% = 3 pts (noticeable impact)
   > 20% = 5 pts (major market impact)

3. Time of Day:
   RTH 10:00-15:00 = 0 pts (peak liquidity)
   RTH 09:30-10:00, 15:00-16:00 = 1 pt (normal)
   Pre-market, After-hours = 3 pts (lower liquidity)
   Overnight = 5 pts (minimal market makers)

4. Volatility Regime:
   Normal (VIX <15) = 0 pts
   Elevated (VIX 15-25) = 2 pts
   High (VIX 25-40) = 4 pts
   Extreme (VIX > 40) = 5 pts

Example calculation:
AAPL, buy 500 shares (0.3% ADTV), 10:30am, normal vol, 1bp spread
Risk = 0 + 0 + 0 + 0 = 1/10 (very safe)

TSLA, buy 10,000 shares (15% ADTV), 15:45, high vol, 5bp spread
Risk = 3 + 3 + 1 + 4 = 11/10 → CAP @ 10/10 (dangerous, expect slippage)
```

---

## Execution Strategy Recommendations by Risk Score

| Risk Score | Execution Method | Expected Slippage | Example |
|-----------|-----------------|------------------|---------|
| 1-2 | Market order (immediate) | 1-2 bps | Large-cap, RTH |
| 3-4 | Limit order within spread | 2-5 bps | Mid-cap, RTH |
| 5-6 | Split into 3-4 limit orders | 5-10 bps | Small-cap, full size |
| 7-8 | VWAP/TWAP algo (30 min window) | 10-20 bps | Illiquid, large size |
| 9-10 | Post order (spread out over hours) | 20-50 bps | Very illiquid, avoid |

---

## Volume Profile Workflow on TradingView

### Workflow: Identify Liquidity Voids

1. **Add Volume Profile indicator:**
   ```
   Chart → Indicators → Volume Profile
   Settings: Fixed Range (last 50 bars)
   ```

2. **Read values:**
   ```
   Execute: data_get_study_values(study="Volume Profile")
     → Returns array of [price_level, volume_traded]
   
   Find LVN (Low Volume Nodes):
   - Prices with <5% of median volume in that range
   - These are "liquidity gaps" where price will move fast
   ```

3. **Annotate voids:**
   ```
   If gap detected between $191.80 and $192.20 (no volume):
   - Draw rectangle with red dashed border
   - Label: "Liquidity Void - Fast Move Expected"
   - Price won't stop here on reversal, will gap through
   ```

4. **Trading setup:**
   ```
   If approaching liquidity void from below:
   - LONG only if: Strong momentum + support below void
   - Risk: Price may gap through void on reversal
   
   If approaching liquidity void from above:
   - SHORT only if: Strong momentum + resistance above void
   - Risk: Price gapping down through void on reversal
   ```

---

## Practical Liquidity Analysis Checklist

Before placing any trade, answer:

```
□ What is the bid-ask spread? (< 2bps = liquid, > 10bps = illiquid)
□ How many shares/contracts in order book at best bid/ask? (enough for my size?)
□ What is ADTV? (my order size as % of ADTV?)
□ Estimated slippage: [X bps] (acceptable?)
□ Current relative volume vs average? (high = good liquidity, low = bad)
□ Where is price relative to VWAP? (above = bullish, below = bearish)
□ Where are volume clusters (POC, VAH/VAL)? (support/resistance zones?)
□ Where are liquidity voids (LVN)? (avoid if scaling out)
□ What time of day? (RTH better than pre-market)
□ Is this during a volatile event (earnings, FOMC)? (expect wider spreads)
□ What is execution risk score? (1-3 = safe, 7-10 = dangerous)
```

---

## Output Template

When asked to analyze liquidity:

```
LIQUIDITY PROFILE: [SYMBOL]
═══════════════════════════════════════════════════════════════

SPREAD ANALYSIS:
- Current bid-ask: $X.YZ - $X.YZ (spread: Z bps)
- Spread vs historical: [Tight | Normal | Wide]
- Reason for spread width: [If abnormal]

ORDER BOOK DEPTH:
- Main bid: [Qty] contracts @ [Price] (support level)
- Main ask: [Qty] contracts @ [Price] (resistance level)
- Imbalance: [+X% bias toward buyers | -X% bias toward sellers | Balanced]
- Ability to absorb [Your Order Size]: [Excellent | Good | Moderate | Poor]

VOLUME PROFILE:
- POC (Point of Control): $X.XX [Support | Resistance | Neutral]
- VAH (Value Area High): $X.XX
- VAL (Value Area Low): $X.XX
- LVN (Low Volume Node): $X.XX-$X.XX [Liquidity void - avoid here]
- Current price vs VAL/VAH: [Overbought | Fair value | Oversold]

ADTV LIQUIDITY METRICS:
- ADTV: $X million (Percentile: Yth)
- Your order as % of ADTV: Z%
- Estimated market impact: [A bps slippage]
- Relative volume (current vs avg): [Ratio]

VWAP & INSTITUTIONAL FLOW:
- Session VWAP: $X.XX
- Current price vs VWAP: [Above | Below] by [X bps]
- Institutional sentiment: [Accumulating | Distributing | Neutral]

STOP CLUSTER ANALYSIS:
- Dense stop zone 1: $X.XX (Density: [High | Medium])
- Dense stop zone 2: $X.XX (Density: [High | Medium])
- Liquidation risk if price breaks [Level]: [Moderate | High]

EXECUTION RISK SCORE: [X/10]
- Spread component: [X pts]
- Volume component: [X pts]
- Time-of-day component: [X pts]
- Volatility component: [X pts]

EXECUTION RECOMMENDATION:
1. Method: [Market | Limit | VWAP | Algo]
2. Entry price: $X.XX [Precise limit level]
3. Size: [Qty] [Full size OK | Split into N tranches]
4. Expected slippage: [X-Y bps]
5. Alternative: [If risk score high, suggest smaller size or different timing]

LIQUIDITY MAP:
[ASCII or chart description of green/yellow/red zones]

NEXT STEPS:
1. [Specific action if executing now]
2. [Alternative if market conditions worsen]
```
