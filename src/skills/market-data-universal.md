name: market-data-universal
description: Comprehensive financial market data access for ANY instrument — equities, futures, forex, crypto, bonds, commodities, options, ETFs, indices. Builds complete instrument profile with real-time + historical data, fundamentals, derivatives, correlation context, and historical percentiles. Use when user asks "give me the full picture", "instrument profile", "complete data on", "market context", or needs cross-asset analysis.

---

# Market Data Universal Skill

You are building a comprehensive instrument dossier integrating real-time quotes, historical context, fundamental data, derivatives, correlation maps, calendar events, and historical percentile rankings across all asset classes.

## Asset Class Data Hierarchy

### 1. EQUITIES & INDICES

**Real-Time Data (TradingView Priority):**

```
chart_get_state
quote_get

Extract:
  - symbol, exchange
  - last_price, bid, ask, bid_ask_spread
  - 24h change, 52w high/low, 52w change %
  - volume, avg_volume_30d
  - market_cap (if index), PE ratio (if individual stock)
  
Percentile Rankings (vs 52w):
  Current_Price_Percentile = (price - 52w_low) / (52w_high - 52w_low)
  
  >0.90 = Trading near 52w highs (bullish structure, overbought zone risk)
  0.70-0.90 = Upper half of range (bullish bias)
  0.50-0.70 = Middle of range (neutral)
  0.30-0.50 = Lower half of range (bearish bias)
  <0.30 = Trading near 52w lows (capitulation, oversold zone opportunity)
  
Volume Percentile:
  Current_Volume_Percentile = (today_vol - 30d_min) / (30d_max - 30d_min)
  
  >0.80 = High volume (conviction move, important)
  0.50-0.80 = Above average
  <0.50 = Below average (weak move, vulnerable to reversal)
```

**Historical Data (TradingView):**

```
chart_set_timeframe(D)  [Daily bars]
data_get_ohlcv(count:250)  [1 year of daily bars]

Extract:
  - 52w high/low/range
  - 200d moving average (primary trend proxy)
  - 50d moving average (intermediate trend)
  - Current price vs all major moving averages
  
Trend Classification:
  If price > 200d SMA AND 200d > 50d SMA > 20d SMA = UPTREND (bullish structure)
  If price < 200d SMA AND 200d < 50d SMA < 20d SMA = DOWNTREND (bearish structure)
  If moving averages compressed = Consolidation (low volatility period)
  
Volatility Context:
  Calculate 20d ATR, compare to 52w ATR average
  If current ATR > 52w avg ATR = Elevated volatility (event/breakout risk)
  If current ATR < 52w avg ATR = Compressed volatility (coiling pattern)
```

**Fundamental Data (For Equities):**

```
From TradingView (if available):
  data_get_study_values → Extract PE ratio, EPS, dividend yield, profit margin

Alternative sources (web access):
  1. Edgar (SEC filings): Most recent 10-K for revenue, net income, debt
     GET https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=[ticker]
     
  2. Yahoo Finance API-equivalent or manual scrape:
     - Market Cap
     - P/E Ratio
     - Dividend Yield
     - Earnings Growth Rate
     - Debt/Equity Ratio
     
Valuation Percentile (vs peer group or sector):
  If PE in top 10% of sector = Expensive (risk of multiple compression)
  If PE in bottom 10% of sector = Cheap (value opportunity, possible value trap)
  
Earnings Calendar:
  Next earnings date (if within 30 days = binary event risk)
  Historical EPS surprises (beat/miss trend)
```

**Equity Options Data:**

```
For any stock with liquid options (SPY, QQQ, TSLA, etc.):

From TradingView or external options flow aggregators:
  - Implied Volatility (IV) — extract at-the-money IV
  - IV Rank (IV percentile vs 52w) = How elevated is IV?
  - Put/Call ratio for stock
  - Largest OI strikes (institutional positioning clusters)
  - Unusual activity (if available): large blocks, dark pool activity
  
IV Percentile Interpretation:
  >80th %ile = High IV, expensive options (sell premium, expect reversion)
  20-80th %ile = Normal IV
  <20th %ile = Low IV, cheap options (buy premium, expect expansion)
  
Positioning Signal:
  Heavily OI concentrated at strike X = Gamma pinning risk at that level
  If current price below major call OI cluster = Call holders need upside
  If current price above major put OI cluster = Put holders need downside
  
Unusual Options Activity:
  Large put buyer = Hedging, bearish forecast
  Large call buyer = Bullish conviction
  Put/Call ratio inversion = Reversal signal
```

---

### 2. FUTURES & COMMODITIES

**Real-Time Data:**

```
chart_get_state
quote_get

For futures, record:
  - Current price, bid/ask spread
  - Expiration date (if spread is widening = near contract change)
  - Open interest (how much money at risk in this contract)
  - Volume (liquidity proxy)
  - Basis vs spot (if applicable)
  
Special tracking (Commodities):
  - Settlement price
  - Daily trading range
  - Position limits (exchanges specify max positions to prevent manipulation)
```

**Historical Data:**

```
chart_set_timeframe(D)
data_get_ohlcv(count:500)  [2 years of data for seasonal patterns]

Extract:
  - Seasonal patterns (e.g., Oil tends to spike in winter, decline in summer)
  - Multi-year trend (Oil in bull market vs bear market context)
  - Current price percentile vs 10-year range (for very old contracts)
```

**Commodity Curves (Contango/Backwardation):**

```
For futures with multiple expiries (Oil: CLK6, CLM6, CLN6, CLU6, CLZ6):

Fetch prices across calendar spreads:
  Nearby contract (CLK6, most liquid)
  3-month contract (CLM6)
  6-month contract (CLU6)
  12-month contract (CLZ6)
  
Calculate:
  Contango = (6m_price - 1m_price) / 1m_price × 100%
  
  Interpretation:
    Contango >5% = Storage costs high, supply abundant, bullish structure risk
    Contango 2-5% = Normal
    Contango <2% = Tight supply or extreme demand
    
    Backwardation (negative contango) = Extreme scarcity, emergency buying
    
Seasonality:
  Compare current curve shape vs 5-year average
  If current backwardation but historical contango = Supply shock signal
```

**COT Positioning (Commitment of Traders) — For Commodity Futures:**

```
Source: CFTC COT reports (weekly)
Available for all major futures: Crude Oil, Gold, Treasury Bonds, FX, etc.

Fetch positioning:
  - Commercial (hedgers): Their net long/short position
  - Managed Money (specs/CTAs): Their net position (large money flows)
  - Other (retail/small funds): Their position
  
Calculate positioning ratio:
  Managed_Money_Ratio = (MM_longs - MM_shorts) / (MM_longs + MM_shorts)
  
  >0.60 = Extreme long positioning (specs overleveraged long)
    Risk: Short squeeze or correction
  -0.60 = Extreme short positioning (specs overleveraged short)
    Risk: Bounce/squeeze
  ±0.20 to 0.60 = Normal
  
Positioning Trend:
  If specs continuously adding to longs while price stalls = Trap setup
  If specs adding to shorts while price rallies = Capitulation imminent
  
Hedger Positioning:
  If commercials (hedgers) are net short = Bullish (producers selling forward at lows)
  If commercials are net long = Bearish (producers covering, expecting lower prices)
```

---

### 3. FIXED INCOME & BONDS

**Real-Time Data:**

```
For major bond ETFs (SHV, TLT, BND) or individual bonds:

quote_get

Extract:
  - Yield to maturity (YTM)
  - Duration (interest rate sensitivity: high duration = high rate sensitivity)
  - Current yield vs coupon (discount/premium)
  - Bid/ask spread (liquidity indicator)
  
Yield Curve Context:
  Compare 2y, 5y, 10y, 30y yields:
  - If 2y > 10y = Inverted curve (historical recession predictor)
  - If curve steepening = Expectations of economic improvement
  - If curve flattening = Expectations of slower growth or deflation
```

**Historical Data & Credit Spreads:**

```
For bonds:

data_get_ohlcv(count:500)
Extract:
  - Option-adjusted spread (OAS) = risk premium over Treasuries
  - Credit rating (Moody's, S&P)
  
For credit spreads:
  Fetch: IG (Investment Grade) spread index, HY (High Yield) spread index
  
  Spread Interpretation:
    IG spread <100 bps = Tight, risk-on sentiment
    IG spread 100-150 bps = Normal
    IG spread >200 bps = Widening, risk-off/fear
    
    HY spread <350 bps = Tight, bubble risk
    HY spread 400-600 bps = Normal
    HY spread >700 bps = Distressed, capitulation
    
  Spread Trend:
    If spreads widening despite stable rates = Credit deterioration signal
    If spreads tightening amid rate cuts = Risk-on
```

**Duration-Adjusted Return Opportunity:**

```
Calculate:
  Real_Yield = Nominal_Yield - Inflation_Expectations
  
  If 10y Treasury at 3.50% and inflation expectations 2.5% = Real yield +1.0% (unattractive)
  If 10y Treasury at 2.00% and inflation expectations 2.5% = Real yield -0.5% (negative, no income value)
  
Positioning Signal:
  If real yields deeply negative = Bonds unattractively priced (sell)
  If real yields positive and >2% = Bonds attractively priced (buy)
```

---

### 4. FOREX (Foreign Exchange)

**Real-Time Data:**

```
chart_get_state
quote_get

For EUR/USD, GBP/USD, USD/JPY, etc.:
  - Current spot price
  - Bid/ask spread (tightest for majors like EURUSD, wider for exotics)
  - 24h change (minor, usually <1%)
```

**Interest Rate Differentials (Carry Trade Signal):**

```
For EUR/USD:
  EUR_Rate = ECB policy rate
  USD_Rate = Fed policy rate
  
  Carry_Differential = USD_Rate - EUR_Rate
  
  If USD_Rate significantly higher = Positive carry to hold USD
    → EUR/USD likely to weaken (carry unwinding risk if rates reverse)
  If EUR_Rate higher = Positive carry to hold EUR
    → EUR/USD likely to strengthen
    
This explains 70% of major pair movements over 3-month periods.
```

**Central Bank Calendar:**

```
Fetch upcoming central bank meetings + policy expectations:
  - Fed FOMC (8x yearly)
  - ECB Governing Council (6x yearly)
  - BOJ (policy decisions)
  - BOE (MPC meetings)
  
Signal:
  1. If rate hike expected and data supports = Currency strengthens ahead of meeting
  2. If hike priced in but data disappoints = Currency tanks on meeting day
  3. If meeting > 1 month away = Less immediate catalyst
```

**Technical Support/Resistance (Multi-Year):**

```
chart_set_timeframe(W)  [Weekly]
data_get_ohlcv(count:260)  [5 years of weekly data]

Map:
  Major support levels (broken multiple times, always bounced)
  Major resistance levels (never broken)
  
These define the "established range" for the pair.
If price breaks outside 5-year range = Structural shift in cross.
```

**Positioning (Speculative vs Commercial):**

```
CFTC Commitments of Traders (for FX futures):
  - Commercials (banks hedging real flows): Large net positions
  - Managed Money (hedge funds, CTAs): Trend-following flows
  
Signal:
  If MM are extremely long while price rises = Momentum exhaustion risk
  If MM are extremely short while price falls = Capitulation bounce risk
```

---

### 5. CRYPTOCURRENCY

**Real-Time Data:**

```
chart_get_state
quote_get

Extract:
  - Price, 24h change, 24h high/low
  - 24h volume (on major exchanges: Binance, Kraken, Coinbase)
  - Market cap (total supply × price)
  - Market cap dominance (BTC dominance = BTC market cap / total crypto cap)
  
Dominance Interpretation:
  BTC dominance >50% = Risk-on or BTC strength, alts underperform
  BTC dominance <45% = Alt season potential, alts outperform
  BTC dominance declining rapidly = Capital flowing from BTC to alts
  
Volume Spikes:
  If 24h volume 3x normal = Capitulation (if price down) or euphoria (if price up)
```

**Historical Data & Cycles:**

```
data_get_ohlcv(count:1000)  [4 years of daily data]

For Bitcoin/Ethereum:
  - Multiple halvings (BTC every 4 years)
  - Current position in halving cycle
  - Typical post-halving patterns (2-6 months pump phase)
  
Volatility Context:
  Calculate historical volatility (20d, 60d, 200d rolling)
  
  If current volatility at 5-year extremes = Unusual move (confirm on-chain)
  If current volatility suppressed = Coiling pattern (breakout setup)
```

**On-Chain Metrics (See onchain-analytics skill for full detail):**

```
Supplement with:
  - TVL trends (DefiLlama)
  - Stablecoin supply changes
  - Whale wallet movements
  - Liquidation maps (CoinGlass)
  - Funding rates (elevated long = cascade risk)
```

---

### 6. OPTIONS & DERIVATIVES

**Equity Options:**

```
For any liquid option chain (SPY, QQQ, TLT, IWM):

Extract:
  - Implied Volatility (IV) ← most important
  - IV by strike (skew) and expiry (term structure)
  - Open Interest concentration (gamma clustering)
  - Put/Call ratio (institutional hedging vs retail betting)
  
IV Skew Pattern:
  Normal skew: IV higher for out-of-the-money puts (hedging demand)
  Reverse skew: IV higher for calls (bullish expectation)
  Flat skew: IV uniform across strikes (balanced)
  
Gamma Exposure:
  If large OI concentrated at strike X:
    → Market makers hedge by buying/selling underlying
    → Creates support/resistance at X (gamma pinning)
    → Expiration day can see large move as gamma unwinds

Unusual Activity:
  Track: Large call buyers, large put buyers, ratio spreads
  Interpret: Institutional view on direction/volatility expectations
```

**Volatility Index (VIX) — Options Market Sentiment:**

```
VIX = 30-day implied volatility of S&P 500 options

chart_set_symbol("VIX")
quote_get

VIX Levels & Interpretation:
  <12 = Complacency, historically leads to VIX spike
  12-15 = Low volatility, normal for bull markets
  15-20 = Moderate
  20-30 = Elevated uncertainty
  30-50 = Crisis/panic
  >50 = Capitulation panic
  
VIX Mean Reversion:
  VIX does NOT stay elevated for long (historical mean ≈16-18)
  If VIX >40 for >5 days = Exhaustion, soon reverting
  
VIX vs Price Divergence:
  If price rallies but VIX unchanged/rising = Weak rally (distribution)
  If price falls but VIX falling = Panic support emerging
```

---

## Step 1: Chart State & Asset Class Detection

```
chart_get_state
```

Identify: Symbol, exchange, asset class (Equity/Futures/Crypto/etc.), current timeframe.

## Step 2: Real-Time Quote + Percentile Rankings

```
quote_get
data_get_ohlcv(summary:true)
```

Extract current price and percentile vs 52-week range.

## Step 3: Asset Class-Specific Historical Analysis

Based on detected asset class, execute relevant historical analysis:

```
If EQUITY or INDEX:
  → chart_set_timeframe(D); data_get_ohlcv(count:250)
  → Trend analysis vs moving averages
  → Fundamental data (P/E, earnings, revenue)
  
If FUTURES/COMMODITY:
  → data_get_ohlcv(count:500)
  → Curve analysis (contango/backwardation)
  → COT positioning
  
If FIXED INCOME:
  → Fetch yield curve context
  → Credit spread analysis
  → Duration-adjusted returns
  
If FOREX:
  → Interest rate differential analysis
  → Central bank calendar
  → Technical major levels (5y+)
  
If CRYPTO:
  → data_get_ohlcv(count:1000)
  → Halving cycle position
  → Dominance trends
  → On-chain supplement (optional)
```

## Step 4: Derivatives Analysis

```
If equity with liquid options:
  data_get_study_values → IV, skew
  Implied move calculation
  Gamma positioning
  
If major index:
  chart_set_symbol("VIX")
  quote_get → VIX level + term structure
```

## Step 5: Correlation Map (Cross-Asset Context)

For any symbol, identify what typically moves WITH it:

```
Correlation Guide:

EQUITIES (SPY):
  + Positively correlated: Tech (QQQ), Risk appetite
  - Negatively correlated: Bonds (TLT), Utilities (XLU), Gold (GLD)
  Triggers: Fed policy, earnings, growth expectations

HIGH YIELD BONDS (HYG):
  + Positively correlated: Equities (SPY), Risk appetite
  - Negatively correlated: Treasuries, USD strength
  Triggers: Credit spreads, recession fears

USD:
  + Positively correlated: DXY, real rates
  - Negatively correlated: Gold, emerging markets, commodities
  Triggers: Fed policy, real yields, geopolitics

GOLD (GC):
  + Positively correlated: Inflation expectations, USD weakness
  - Negatively correlated: Real rates, strong USD
  Triggers: Fed policy, geopolitical risk

OIL (CL):
  + Positively correlated: Risk appetite, OPEC cuts
  - Negatively correlated: USD strength, demand destruction
  Triggers: Geopolitics, demand data, OPEC decisions

BTC:
  + Positively correlated: Risk appetite, liquidity, alt season
  - Negatively correlated: Real rates (when yields spike)
  Triggers: Regulatory news, adoption milestones, macro liquidations

For current symbol:
  1. Identify primary driver (macro, micro, sentiment)
  2. Identify correlated assets that lead/lag this symbol
  3. Check if correlated assets confirming or diverging
  4. Divergence = Warning or opportunity
```

## Step 6: Calendar Events & Catalysts

```
Fetch upcoming events that affect this asset:

EQUITIES:
  - Earnings dates (binary events)
  - Fed announcements
  - Economic data (CPI, employment, GDP)
  
COMMODITIES:
  - OPEC meetings (oil)
  - Inventory reports (oil, natural gas)
  - Weather (agriculture)
  - Geopolitical developments
  
CRYPTO:
  - Regulatory announcements
  - Protocol upgrades
  - Adoption milestones
  - Macroeconomic (Fed policy)
  
FOREX:
  - Central bank meetings
  - Interest rate decisions
  - Major economic data releases
  
BONDS:
  - Fed decisions
  - CPI, PCE (inflation data)
  - Employment reports
  - Treasury auctions

Time to Event:
  <5 days = Extreme event risk, position sizing reduction
  5-30 days = Elevated event risk, vol may expand
  >30 days = Lower event risk
```

## Step 7: Screenshot & Compiled Dossier

```
capture_screenshot
```

Verify all relevant information visible on chart.

---

## Output Template

### Complete Instrument Dossier

**Instrument:** [Symbol] | **Exchange:** [Exchange] | **Asset Class:** [Type] | **Current Price:** [$X]

---

### REAL-TIME SNAPSHOT

| Metric | Value | Context |
|--------|-------|---------|
| Current Price | $[X] | |
| 52w High / Low | $[H] / $[L] | Price percentile: [75th %ile] (upper half) |
| 24h Change | [+2.3%] | Volume: [X]M ([110% of 30d avg]) |
| Bid/Ask Spread | [±$0.05] | Liquidity: [Good/Fair/Poor] |
| 30d Volatility | [18.5%] | 52w volatility avg: [16.2%] (slightly elevated) |

---

### TECHNICAL STRUCTURE

Trend:
- Price vs 200d MA: [Above] (bullish structure)
- 200d > 50d > 20d MA: [Yes] (uptrend intact)
- Support Levels: $[X], $[Y], $[Z] (major reversal risk at $X)
- Resistance Levels: $[A], $[B] (next breakout target $B)

Momentum:
- RSI: [62] (neutral, room to rally)
- MACD: [Bullish divergence forming]
- ATR: [0.45] (above 52w avg, volatility elevated)

---

### ASSET CLASS SPECIFICS

**[For Equities]:**

Fundamentals:
- P/E Ratio: [22.3] vs sector [20.1] (slight premium)
- Dividend Yield: [1.8%] (below 52w avg [2.1%])
- Earnings Growth: [+12% YoY] (healthy)
- Next Earnings: [2026-04-25] (15 days out, binary event risk)

---

**[For Commodities]:**

Curve Structure:
- 3-month spread: [+$1.45/barrel] (Contango 3.2%, normal)
- 12-month spread: [+$3.20/barrel] (Steepening curve)
- Interpretation: [Storage cost elevated, market expects supply abundance]

COT Positioning:
- Managed Money: [Net long, +0.58 ratio] (extreme long bias)
- Commercial Hedgers: [Net short, -0.42 ratio] (producers locking in sales)
- Trend: [MM adding longs 3 weeks straight = Potential trap]

---

**[For Crypto]:**

On-Chain:
- BTC Dominance: [48.2%] (alt season conditions)
- TVL Trend: [+8.7% 7d] (capital flowing into DeFi)
- Whale Accumulation: [3 large wallets added 500+ BTC] (neutral)
- Funding Rate: [+0.082% / 8h] (long bias building, moderate risk)

---

**[For Options]:**

Implied Volatility:
- 30-day IV: [22.3%] (65th percentile, moderately elevated)
- IV Skew: [Normal — OTM puts have higher IV] (hedging demand)
- Largest OI Clusters: [$500 calls: 150k OI] [$450 puts: 140k OI] (wide range OI)
- Gamma Risk: [Expiration $475 = gamma pinning risk]

---

### CORRELATION CONTEXT

Primary Driver: [Fed policy → Real yields → Risk appetite]

What Moves With This Asset:
- High Correlation (+0.80): [Related equity/sector, e.g., SPY for TSLA]
- Negative Correlation (-0.75): [Bonds if equity, USD if commodity]
- Lead/Lag: [Asset A leads by 2-3 days]
- Current Status: [Correlated assets confirming / diverging] = [Bullish confluence / Divergence warning]

---

### UPCOMING CATALYSTS (Next 60 Days)

| Date | Event | Potential Impact |
|------|-------|-----------------|
| 2026-04-15 | FOMC Decision | High — Rate decision expected |
| 2026-04-25 | Q1 Earnings | High — Binary event |
| 2026-05-06 | CPI Release | Medium — Inflation data |

Earliest binary event: [2026-04-15] ([5 days out]) → Reduce position size

---

### SUMMARY & POSITIONING

**Overall Assessment:** [BULLISH but overbought on shorter timeframe]

Strength: Uptrend intact, technicals supported by fundamentals, correlation positive
Weakness: Price percentile high (75th), IV normal, event risk in 15 days
Risk/Reward: [2:1 R/R for long, 1.5:1 R/R for short]

**Recommended Approach:**
- [If bullish bias]: Buy dips toward $[Support], target $[Resistance]
- [If neutral]: Wait for post-earnings clarity (5-15 days)
- [If hedging]: Consider OTM puts for defined risk

**Position Sizing:**
- Standard allocation: [X%] of portfolio
- Event risk adjusted: Reduce to [Y%] for earnings week
- Conviction level: [70%] (technical + fundamental support)

