name: Financial Instruments
description: Comprehensive knowledge base across all asset classes, contract specs, fundamentals, and trading mechanics

# Financial Instruments Skill

You are a multi-asset research analyst with institutional-grade knowledge spanning equities, futures, forex, options, crypto, bonds, and commodities. Your role is to rapidly identify any financial instrument, provide complete contract specifications, market structure context, key fundamental drivers, and trading mechanics. You deliver structured instrument profiles with all relevant metrics.

---

## EQUITIES

### Market Structure & Exchange Types

**Primary Exchanges (USA):**

| Exchange | Securities | Trading Hours | Maker | Taker | Characteristics |
|----------|-----------|---------------|-------|-------|-----------------|
| NYSE | Stocks, ETFs | 9:30-16:00 ET | -0.04% | +0.05% | Primary market, official listed venue |
| NASDAQ | Tech-heavy stocks, ETFs | 9:30-16:00 ET | -0.04% | +0.05% | Smaller companies, tech concentration |
| CBOE | Options, VIX futures | Varies by product | Variable | Variable | Volatility specialist |
| FINRA (ATS) | Dark pools, 100+ venues | 4:00-20:00 ET (pre/after) | Variable | Variable | Off-exchange trading, reduced transparency |

**Pre/After-Hours Trading:**
- Pre-market: 4:00-9:30 ET (limited liquidity, wide spreads, extended settlement)
- After-hours: 4:00-8:00 ET (illiquid, higher slippage)
- Avoid unless necessary (news trades)

### Corporate Actions Impact

| Action | Ex-Date Effect | Trading Adjustment | Example |
|--------|----------------|-------------------|---------|
| **Dividend** | Stock ↓ by dividend amount | Adjust position cost basis | Stock $100, $2 div → adjusted $98 |
| **Stock Split** | 2:1 split: share qty × 2, price ÷ 2 | Adjust contracts, leverage | 100 @ $200 → 200 @ $100 |
| **Stock Buyback** | Supply ↓ → EPS accretion | Positive (earnings per share ↑) | Share count: 1B → 950M = EPS ↑ 5% |
| **Rights Issue** | New shares dilute existing | Adjust position size downward | Existing holders offer to buy at discount |
| **Merger/Acquisition** | Acquirer stock may fall, target rises | Arbitrage opportunity (merger spread) | Target jumps to deal price, arbitrage tight |

### Fundamental Metrics Deep Dive

```
Valuation Ratios:
P/E (Price/Earnings) = Stock Price / Annual EPS
  < 10: Value trap or undiscovered gem
  10-15: Cheap (requires growth catalyst)
  15-25: Fair value range (mature profitable)
  25-50: Growth (tech, biotech)
  > 50: Speculation (pre-profit or very high growth expectation)

EV/EBITDA = Enterprise Value / EBITDA
  < 5x: Distressed or declining
  5-10x: Fair value
  10-15x: Growth premium
  > 15x: Speculation or high-growth

PEG Ratio = P/E / Expected Growth Rate
  < 1.0: Undervalued (growth cheaper than valuation implies)
  1.0-2.0: Fair value
  > 2.0: Overvalued (paying too much for growth)

FCF Yield = Free Cash Flow / Market Cap
  > 10%: Deep value (money-printing machine)
  5-10%: Attractive
  < 5%: Premium valuation (growth story required)

Debt/EBITDA = Total Debt / EBITDA
  < 2x: Conservative (low bankruptcy risk)
  2-4x: Moderate leverage
  > 6x: High leverage (distressed risk)
```

### Sector Classification (GICS: Global Industry Classification Standard)

**11 Sectors, 24 Industry Groups:**

| Sector | Key Industries | Characteristics |
|--------|----------------|-----------------|
| **Energy** | Oil/Gas, Utilities | Cyclical, commodity exposure, high dividend |
| **Financials** | Banks, Insurance, Real Estate | Interest rate sensitive, economic bellwether |
| **Healthcare** | Pharmaceuticals, Medical Devices, Services | Defensive, aging population tailwind |
| **Industrials** | Heavy Equipment, Manufacturing, Logistics | Cyclical, capex-dependent |
| **Info Tech** | Software, Semiconductors, IT Services | High growth, low dividend, currency risk |
| **Materials** | Metals, Mining, Chemicals | Cyclical, commodity price driven |
| **Consumer Discretionary** | Retail, Auto, Restaurants | Highly cyclical, economically sensitive |
| **Consumer Staples** | Packaged Food, Beverages, Tobacco | Defensive, recession-resistant |
| **Communication Services** | Telecom, Media, Entertainment | Slow growth, stable dividend |
| **Real Estate** | REITs, Property Management | Income-focused, leverage play |
| **Utilities** | Electric, Gas, Water | Defensive, regulatory-driven returns |

### Factor Exposures (Quant Investing)

```
Factor: Value
Definition: Cheap valuation (low P/E, high dividend yield)
Performance: Does well in recovery, inflationary periods
Current regime (Apr 2026): Underperforming (tech strength)

Factor: Growth
Definition: High earnings growth, revenue expansion
Performance: Thrives in low-rate environments, risk-on sentiment
Current regime: Outperforming (tech bull market)

Factor: Momentum
Definition: Recent price trends (stocks up 3-12 months tend to stay up)
Performance: Works in trending markets, fails in reversals
Current regime: Working (uptrend since late 2024)

Factor: Quality
Definition: High ROE, stable earnings, strong FCF
Performance: Defensive (down in crashes, down less in rallies)
Current regime: Defensive positioning (risk-off tilt)

Factor: Low Volatility
Definition: Low beta stocks (down less in crashes)
Performance: Outperforms in risk-off, underperforms in risk-on
Current regime: Lagging (high-vol growth stocks leading)

Factor: Size
Definition: Market cap (small-cap, mid-cap, large-cap)
Small-cap: Higher returns historically, more volatile
Large-cap: Stable, dividend-paying, institutional flows
Current regime: Large-cap beating small-cap (risk-off behavior)
```

---

## FUTURES

### Contract Specifications Reference Table

**Stock Index Futures:**

| Contract | Exchange | Tick Size | Point Value | Annual Margin | Trading Hours | Settlement |
|----------|----------|-----------|------------|--------------|---------------|------------|
| **ES** (E-mini S&P 500) | CME | 0.25 | $12.50 | $5,950 | 23:00-22:00 CT daily | Cash-settled |
| **NQ** (E-mini NASDAQ) | CME | 0.25 | $20 | $4,950 | 23:00-22:00 CT daily | Cash-settled |
| **YM** (E-mini Dow) | CME | 1 | $5 | $5,500 | 23:00-22:00 CT daily | Cash-settled |
| **RTY** (E-mini Russell 2000) | CME | 0.25 | $12.50 | $1,650 | 23:00-22:00 CT daily | Cash-settled |

**Energy Futures:**

| Contract | Exchange | Tick Size | Point Value | Margin | Expiry | Trading Hours |
|----------|----------|-----------|------------|--------|--------|---------------|
| **CL** (WTI Crude Oil) | NYMEX | $0.01 | $1,000 | $3,000 | Monthly (9 days before) | 17:00-16:00 CT |
| **NG** (Natural Gas) | NYMEX | $0.001 | $10,000 | $2,500 | Monthly | 17:00-16:00 CT |
| **RB** (RBOB Gasoline) | NYMEX | $0.0001 | $4,200 | $2,000 | Monthly | 17:00-16:00 CT |
| **HO** (Heating Oil) | NYMEX | $0.0001 | $4,200 | $1,800 | Monthly | 17:00-16:00 CT |

**Metals Futures:**

| Contract | Exchange | Tick Size | Point Value | Margin | Contract Size | Expiry |
|----------|----------|-----------|------------|--------|----------------|--------|
| **GC** (Gold) | COMEX | $0.10 | $100 | $2,970 | 100 troy oz | Monthly (3rd last bus day) |
| **SI** (Silver) | COMEX | $0.001 | $5,000 | $2,500 | 5,000 troy oz | Monthly |
| **HG** (Copper) | COMEX | $0.0005 | $2,500 | $2,200 | 25,000 lbs | Monthly |

**Interest Rate Futures (US Treasury):**

| Contract | Exchange | Tick Size | Point Value | Margin | Settlement | Duration |
|----------|----------|-----------|------------|--------|------------|----------|
| **ZB** (30-Year Bond) | CBOT | 1/32 | $31.25 | $3,410 | Physical delivery | 15-25 years |
| **ZN** (10-Year Note) | CBOT | 1/32 | $31.25 | $2,160 | Physical delivery | 6.5-10 years |
| **ZF** (5-Year Note) | CBOT | 1/32 | $15.625 | $1,540 | Physical delivery | 4.75-5.25 years |
| **GE** (Eurodollar/90-day rate) | CME | 0.0025 | $25 | $600 | Cash-settled | Quarterly (IMM dates) |

### Contract Mechanics & Roll Dates

**Example: ES (E-mini S&P 500) Quarterly Expiration:**

```
Quarterly expiration (3rd Friday of Mar, Jun, Sep, Dec):
March 2026: ESH26 (H = March)
June 2026: ESM26 (M = June)
September 2026: ESU26 (U = September)
December 2026: ESZ26 (Z = December)

Volume migration (2 weeks before expiration):
Week 1-2 of month: Current contract (ESH26) highest volume
Week 3: Volume begins shifting to next contract (ESM26)
Week 4 (expiry week): ESM26 becomes "front" contract

Rolling mechanics:
- Sell ESH26 (March) @ 5,200.25
- Buy ESM26 (June) @ 5,205.50
- Cost: 5.25 points = 5.25 × $12.50 = $65.625 loss (contango carry cost)
```

**Margin Calculation (Portfolio Approach - IB standard):**

```
Notional Value = ES price × multiplier × qty
ES @ 5,200 × $50 (ES multiplier) × 1 contract = $260,000 notional

Margin requirement (typical):
Initial margin: 5,950 (initiating position)
Maintenance margin: 4,760 (holding position)

Leverage: $260,000 notional / $5,950 margin = 43.7x leverage!
```

### Futures Basis, Carry & Convenience Yield

**Basis = Futures Price - Spot Price**

```
Normal market (Contango):
Spot Gold: $2,350/oz
6-month futures: $2,365/oz
Basis: +$15 (positive, futures premium)
Carry cost: Storage ($0.50/oz) + Financing (6% rate × 6 months = ~$70)
Conclusion: Futures should trade ~$70 higher (actual basis shows fair value)

Inverted market (Backwardation):
Spot WTI: $82/bbl
1-month futures: $79/bbl
Basis: -$3 (negative, futures discount)
Reason: Supply shortage or immediate demand (convenience yield)
Setup: Arbitrage? Buy futures, sell spot, capture basis

Carry trade (positive carry):
Treasury bill carry: Borrow @ 4.5%, invest in 6-month futures yielding 5.5%
Profit: 1% × capital (low risk, vol-neutral)
Risk: Basis risk, financing costs change
```

### Major Contract Specifications (At-a-glance)

```
Highest Volume Contracts (2026):
1. ES (E-mini S&P) - 1.2B contracts/year, tightest spread (1 tick)
2. NQ (E-mini Nasdaq) - 800M/year
3. CL (WTI Crude) - 600M/year, $0.01 tick
4. GE (Eurodollar) - 400M/year, 0.0025 tick
5. GC (Gold) - 300M/year, $0.10 tick

For day trading: ES, NQ, CL (tightest spreads, best liquidity)
For swing trading: Any of above + ZB/ZN (bonds, lower daily vol)
For physical hedging: GC, SI, HG (metals), CL (energy)
```

---

## FOREX

### Major Pairs with Pip Values

**Major Pairs (liquid, tight spreads):**

| Pair | Definition | Pip Value (per 100k lot) | Typical Spread | Characteristics |
|------|-----------|------------------------|-----------------|-----------------|
| **EURUSD** | Euro/US Dollar | $10 | 1-2 pips | Most liquid, core pair |
| **GBPUSD** | British Pound/USD | $10 | 2-3 pips | Volatile, news-driven |
| **USDJPY** | US Dollar/Japanese Yen | $10 | 1-2 pips | Safe-haven flows (BoJ policy) |
| **USDCHF** | US Dollar/Swiss Franc | $10 | 1.5-2 pips | Risk-off indicator (CHF strength) |
| **AUDUSD** | Australian Dollar/USD | $10 | 2-3 pips | China commodity proxy |
| **NZDUSD** | New Zealand Dollar/USD | $10 | 3-5 pips | Lower volume than majors |
| **USDHKD** | US Dollar/Hong Kong $ | $10 | 5-10 pips | Pegged to USD (limited vol) |

**Exotic Pairs (wider spreads, less liquid):**

| Pair | Pip Value | Typical Spread | Trading Note |
|------|-----------|-----------------|---------------|
| **USDMXN** | $10 | 10-20 pips | Mexico emerging market |
| **USDBRL** | $10 | 50-100 pips | Brazil, high volatility |
| **EURHUF** | $10 | 30-50 pips | Central Europe, illiquid |
| **USDRUB** | $10 | 500+ pips | Russia, heavily restricted post-2022 |
| **USDCNH** | $10 | 100+ pips | China offshore yuan (restricted access) |

### Interest Rate Differentials (Carry Trade Driver)

**Definition:**
```
Carry = Interest rate differential between two currencies

Example (April 2026 estimates):
USDJPY:
  US 10Y yield: 3.8%
  Japan 10Y yield: 0.5%
  Carry: 3.3% annual premium for shorting JPY, longing USD
  
Setup: Borrow JPY @ 0.5%, invest in USD assets @ 3.8% = 3.3% profit annually
Leverage: If 10:1 margin = 33% annual return (if basis stable)
Risk: JPY strengthens on risk-off (lose principal, plus carry unwind)

AUDUSD:
  Australia 10Y: 3.6%
  US 10Y: 3.8%
  Carry: -0.2% (NEGATIVE, small cost to hold AUD)
  But: AUD sensitive to China growth (commodity proxy)
  
If China accelerates → AUD rallies (capital gains >> carry cost)
If China decelerates → AUD falls (capital losses + carry loss)
```

### Central Bank Intervention & Policy

**Major Central Banks & Current Stance (Apr 2026):**

```
Federal Reserve (US):
- Target rate: 4.5% (peak cycle, likely hold or cut in H2 2026)
- EURUSD impact: Rate cuts → USD weaker (EURUSD higher)
- Next FOMC: May 1, 2026 (likely hold)

European Central Bank (ECB):
- Deposit rate: 3.75% (restricted by Germany's conservative bias)
- EURUSD impact: Lagging Fed cuts → carry to USD (EURUSD lower)
- Next rate decision: June 2026

Bank of Japan (BoJ):
- Policy rate: 0.5% (staying ultra-loose, negative real rates)
- USDJPY impact: Massive carry advantage to USD (USDJPY up)
- Risk: Rate hike shock would trigger violent JPY strength

People's Bank of China (PBOC):
- LPR (Loan Prime Rate): 3.35% (accommodative)
- USDCNH impact: Cuts support yuan weakness (USDCNH up)
- Risk: Capital flight if cuts perceived as growth weakness signal
```

### Session Overlaps & Liquidity Windows

```
Best liquidity windows (GMT):
1. London open (08:00) - Asian close (08:30): European currencies tight
2. New York open (13:00) - tight spreads on all majors
3. European afternoon (12:00-16:00): Best overall liquidity
4. Tokyo close (07:00): Asian FX tight

Worst times (avoid thin pairs):
- Tokyo close only (4:00-8:00 GMT): Asian-only liquidity
- Sydney only (21:00-08:00 GMT): Very thin
- US holiday: GBPUSD spreads widen to 10+ pips

Daily range by session:
London: 100-200 pips typical
New York: 150-300 pips typical
Tokyo: 40-100 pips typical
```

---

## OPTIONS

### The Greeks: Delta, Gamma, Theta, Vega, Rho

```
DELTA = Rate of change of option price vs underlying stock price
  Call delta: 0 to +1 (increases as stock rises)
  Put delta: 0 to -1 (increases as stock falls)
  
  ATM (At-the-money) call: Delta ≈ 0.5 (50% of stock move passes through)
  ITM (In-the-money) call: Delta ≈ 0.8 (80% of stock move)
  OTM (Out-of-the-money) call: Delta ≈ 0.2 (20% of stock move)
  
  Trading use: Delta = proxy for probability of finishing ITM
  Delta 0.5 call = ~50% chance to be ITM at expiration

GAMMA = Rate of change of delta (curvature, convexity)
  High gamma: Delta changes rapidly (non-linear payoff, explosive moves)
  Low gamma: Delta changes slowly (predictable payoff)
  
  ATM options: Highest gamma (fast delta changes)
  Far ITM/OTM: Low gamma (delta barely changes)
  
  Risk: High gamma = big losses if misjudging direction
  Opportunity: Sell high gamma into volatility, profit from theta decay

THETA = Time decay (loss per day due to time passage)
  Positive theta: Your position loses value each day (short options, wrong directionally)
  Negative theta: You lose from time decay (long options, expensive strategy)
  
  At-the-money call 30 DTE (days to expiration): Theta ≈ -$0.05/day
  = Lose $0.05 × 100 shares = $5 per contract per day (if nothing else moves)
  
  Last week to expiration: Theta accelerates
  Day before expiration (1 DTE): Theta ≈ -$0.50/day (last day bleed-out)
  
  Strategy: Sell options 30-60 DTE (decay accelerates in last month)

VEGA = Sensitivity to implied volatility (IV) changes
  +Vega: Long options benefit if IV rises (sell options if expecting IV drop)
  -Vega: Short options benefit if IV falls (buy options if expecting IV spike)
  
  IV percentile 90 (very high): Options overpriced → SELL
  IV percentile 10 (very low): Options cheap → BUY
  
  Pre-earnings: IV typically 50-100% above normal (buy puts/calls = expensive)
  Post-earnings: IV crashes 40-60% (short volatility is the play)

RHO = Sensitivity to interest rate changes (minor for short-dated options)
  Rarely used for day trading
  Relevant for: Long-dated options, bonds, major macro moves
```

### Core Options Strategies

**Income Strategies (Sell premium for income):**

```
Covered Call:
  Structure: Own 100 shares, sell 1 call above current price
  Profit: Premium collected + dividends
  Loss: Shares called away if stock rises above strike
  Setup: Sell call 10-20% above current price
  Example: Own 100 AAPL @ $191, sell $200 call @ $2 premium
    Income: $200
    Max profit: $2 + (200-191)×100 = $1,100 if called away
    Risk: Shares called away (miss upside above $200)

Naked Put Sale (Income + buying opportunity):
  Structure: Sell put below current price
  Profit: Premium collected if stock stays above strike
  Risk: Buy stock at strike if it falls (large loss possible)
  Setup: Sell put 10-20% below current price, have cash to buy
  Example: AAPL @ $191, sell $170 put @ $1.50 premium
    Income: $150
    Worst case: Buy 100 AAPL @ $170 (have $17,000 cash reserved)
    Break-even: $170 - $1.50 = $168.50

Cash-Secured Put (Conservative):
  Same as naked put but reserve cash for potential assignment
  Max loss: Put strike × 100 - premium collected
  Best for: Identifying stocks to own at lower prices, income generation
```

**Directional Strategies (Buy calls/puts for exposure, profit from moves):**

```
Long Call (Bullish):
  Buy call, profit if stock rises
  Cost: Premium (fixed maximum loss)
  Profit: Unlimited (stock rises)
  Break-even: Strike + premium paid
  Example: Buy $200 call on AAPL @ $2 (cost $200)
    Break-even: $202
    Profit at $205: ($205 - $200) × 100 - $200 = $300
    Loss if AAPL @ $191: $200 (premium lost)

Long Put (Bearish):
  Buy put, profit if stock falls
  Cost: Premium (fixed maximum loss)
  Profit: Strike - stock price - premium
  Break-even: Strike - premium paid
  Example: Buy $170 put on AAPL @ $1.50 (cost $150)
    Break-even: $168.50
    Profit if AAPL @ $160: ($170 - $160) × 100 - $150 = $850

Bull Call Spread (Lower cost, capped profit):
  Buy call (lower strike), sell call (higher strike)
  Cost: Reduced by selling premium
  Max profit: Difference between strikes - net debit
  Break-even: Lower strike + net debit
  Example: Buy $195 call @ $3, sell $200 call @ $1 (net debit $2)
    Cost: $200
    Max profit: ($200 - $195) × 100 - $200 = $300
    Risk: $200 (cost of spread)
    Works best: Expect modest upside, reduce cost vs long call
```

**Volatility Strategies (Straddles, Strangles):**

```
Long Straddle (High volatility bet):
  Buy call + buy put at same strike
  Profit: If stock moves > total premium paid
  Cost: 2x premium
  Setup: Buy ATM straddle before earnings (expect 5%+ move)
  Example: AAPL @ $191, buy $191 call @ $3, buy $191 put @ $3
    Cost: $600
    Profit if stock moves to $197+ or $185- (>6% move)
    Loss if stock stays $185-$197
    Break-even: $191 ± $6

Long Strangle (Lower cost than straddle):
  Buy OTM call + buy OTM put (different strikes)
  Cost: Less than straddle (buying cheaper OTM options)
  Profit: Requires bigger move to break-even, but lower cost
  Setup: Buy $195 call @ $2 + buy $187 put @ $2
    Cost: $400
    Profit if stock moves >$195 or <$187 (4%+ move)
    Lower cost than straddle, requires bigger % move

Iron Condor (Sell volatility, range-bound):
  Sell OTM call + buy farther OTM call + sell OTM put + buy farther OTM put
  Profit: Premium collected if stock stays in range
  Risk: Capped (width of short strikes)
  Best for: Low volatility, stock in trading range
  Setup: AAPL @ $191, range $185-$197, sell calls/puts outside range
    Sell $195 call / buy $200 call
    Sell $187 put / buy $182 put
    Collect: $0.50-$1.00 premium (profit if stock stays $187-$195)
    Risk: Width - premium ($5 × 100 - premium, typically $300-$400)
```

### IV (Implied Volatility) Regimes

```
IV Rank (0-100 scale):
  IV Rank < 20: Very low volatility (options cheap)
    → BUY options (straddles, strangle spreads)
    → SELL premium strategies (iron condor) likely fail
    → Expect volatility to expand (come back to mean)

IV Rank 20-50: Normal volatility
    → Directional strategies (buy call/put spreads)
    → Balanced risk/reward

IV Rank 50-80: Elevated volatility
    → SELL premium strategies (iron condor, covered call)
    → Buy volatility = expensive (IV already expanded)

IV Rank > 80: Extreme volatility (panic/euphoria)
    → Aggressively SELL premium (reversion to mean coming)
    → VIX > 40: Terminal volatility, often marks trend changes

Example:
XYZ stock normal IV: 25
IV Rank 5 (very low): options cheap, buy calls if bullish
IV Rank 95 (extreme): options expensive, sell calls if bullish, sell puts if neutral
```

---

## CRYPTO

### Token Classifications

```
Layer 1 Blockchains (Settlement layers):
- Bitcoin (BTC): Store of value, strongest security, slow/expensive
- Ethereum (ETH): Smart contracts, most dApps, 12-15 TPS, $0.50-$10/tx
- Solana (SOL): High speed (65k TPS), low fees, centralization risk
- Avalanche (AVAX): EVM-compatible, moderate speed/cost
- Polygon (MATIC): Ethereum scaling, L2 solution

Layer 2 Scaling (on Ethereum):
- Arbitrum (ARB): Optimistic rollups, large TVL
- Optimism (OP): Optimistic rollups, multi-client future
- Dydx (DYDX): Decentralized derivatives trading
- Starknet (STRK): Zero-knowledge proofs, most complex

DeFi Protocols (Decentralized Finance):
- Uniswap (UNI): Decentralized exchange, most volume
- Aave (AAVE): Lending protocol, largest TVL
- Curve (CRV): Stablecoin/low-slippage DEX
- MakerDAO (MKR): Stablecoin issuer (DAI)
- Compound (COMP): Lending, first to token (governance)

Meme Coins (High volatility, community-driven):
- Dogecoin (DOGE): Original (2013), 1.3B market cap
- Shiba Inu (SHIB): Ethereum-based, 2021 pump, cultural
- Risk: 99% of meme coins go to zero, Rug pull risk

AI/Compute Tokens:
- Render (RNDR): Distributed GPU rendering
- Fetch (FET): AI agent infrastructure
- Immutable X (IMX): NFT L2 scaling
- Theta (THETA): Decentralized video streaming

Real World Assets (RWA) - Emerging:
- Ondo (ONDO): Tokenized Treasury bonds, 5%+ yield
- Pendle (PENDLE): Yield trading (buy/sell future yield)
- Lido (LIDO): Liquid staking derivative
```

### Exchange Types & Fee Structures

**Centralized Exchanges (CEX) - Familiar broker model:**

```
Binance:
  Volume: $1.5T daily (largest)
  Fees: 0.1% maker / 0.1% taker (volume discounts available)
  Coins: 500+, most liquid
  Leverage: Up to 125x (extreme risk)
  Security: Hacks in 2022-2023 (though recovered)

Kraken:
  Volume: $100B+ daily
  Fees: 0.16% maker / 0.26% taker (professional grade)
  Coins: 200+
  Leverage: Up to 50x
  Regulation: US-based, transparent, strong security

Coinbase:
  Volume: $200B daily
  Fees: 0.6% maker/taker (retail-friendly)
  Coins: 150+
  Regulation: SEC oversight, publicly traded
  Pro-level: Coinbase Pro (lower fees)

OKX:
  Volume: $900B daily
  Fees: 0.08% maker / 0.1% taker (among lowest)
  Coins: 400+
  Regulation: Cayman Islands, but serving retail
  Derivatives: Strong perpetual futures

ByBit:
  Volume: $600B daily
  Fees: 0.1% maker / 0.1% taker
  Coins: 300+
  Derivatives: 100x leverage (extremely risky)
```

**Decentralized Exchanges (DEX) - Non-custodial:**

```
Uniswap V3:
  Volume: $100-200M daily (varies)
  Fees: 0.01% to 1% (fee tier varies by pair)
  Liquidity: Concentrated liquidity (smaller pools, wider slippage)
  Advantage: No KYC, no account risk
  Disadvantage: Slippage on larger trades, no leverage

Curve Finance:
  Volume: $30-50M daily
  Fees: 0.04% (specialized for stablecoin/similar assets)
  Liquidity: Deep on stable pairs
  Advantage: Low slippage for stable trades
  Disadvantage: Poor for non-stable pairs

dYdX:
  Volume: $200-500M daily (derivatives)
  Fees: 0.05% maker / 0.2% taker (on-chain)
  Leverage: Up to 20x
  Advantage: Non-custodial margin trading, self-custody
  Disadvantage: Slower, higher gas costs
```

### On-Chain Metrics That Matter

```
Network Activity Metrics:

1. Active Addresses (Daily/Monthly):
   BTC daily: 1-2M addresses (active users sending coins)
   ETH daily: 500K-1M addresses
   Interpretation: Rising = adoption, falling = disengagement

2. Transaction Value (USD volume on-chain):
   BTC: $50-100B daily
   ETH: $20-40B daily
   Interpretation: Rising = real use, falling = speculation dying

3. Adjusted Transfer Value (excludes noise):
   Removes exchange movements, self-transactions
   True on-chain activity measure

4. MVRV Ratio = Market Value / Realized Value:
   > 3.5: Extreme greed (top signal)
   2.0-3.5: Frothy
   1.0-2.0: Fair value
   < 1.0: Capitulation (bottom signal)

5. Exchange Inflow/Outflow:
   Large inflow to exchange = Selling pressure coming
   Large outflow = Accumulation (bullish)
   
   BTC whales moving 1,000+ BTC to exchange:
   → $40M+ incoming sale pressure (expect decline)
```

### Halving Cycles & Tokenomics

```
Bitcoin Halving (every 210,000 blocks ≈ 4 years):
2024 halving: April 20, 2024 (HAPPENED)
  Block reward: 6.25 BTC → 3.125 BTC per block
  Annual supply inflation: 1.7% → 0.85%
  Miner revenue cut in half (survival squeeze)
  Historical pattern: 12-18 months post-halving = bull market
  
Ethereum (no halving, but changing issuance):
  Post-Merge (Sept 2022): Deflationary (burn > issuance)
  Current daily issuance: 1,500 ETH
  Daily burn (EIP-1559): 2,000 ETH (net deflationary)
  Effect: Supply declining, scarcity narrative

Token Unlock Schedules (huge risk):
  Project unlocks 10% of circulating supply:
  → Selling pressure from team/VCs
  → Price usually declines 10-30% in month post-unlock
  
  Example: Arbitrum (ARB)
  March 2023 unlock: 62.5M ARB unlocked (large dumping)
  Price: $2.50 → $1.10 (56% drop)
```

### Liquidation Heatmaps & Leverage Risk

```
Perpetual Futures (25-125x leverage):

Funding Rate (paid every 8 hours):
Positive: Longs paying shorts (bullish signal - crowded longs)
Negative: Shorts paying longs (bearish signal - crowded shorts)

Extreme funding (>0.1% per 8h = 13% annualized):
→ Leverage is extreme, liquidation risk high
→ Contrarian trade: Fade the crowded position

Example (April 2026 hypothetical):
BTC perpetual funding: +0.12% per 8h
OI: 1.2M BTC in perpetual leverage (all-time high)
Long liquidation zone: $38,000 (if price drops $6k from $44k)
Setup: Short with stops above resistance, target below long liquidations

Liquidation cascade:
Price breaks below $38k → Long liquidation starts
Cascades: $37.8k, $37.5k, $37k, $36.5k (waterfall)
Risk: Gap down execution, cascading losses
Opportunity: Buy the capitulation (after cascade clears)
```

---

## FIXED INCOME (BONDS)

### Yield Curve Shapes & Interpretations

**Normal Curve (steep):**
```
Maturity:  1Y    2Y    5Y   10Y   30Y
Yield:   3.5%  3.7%  4.0%  4.2%  4.5%

Interpretation: Risk premium increases with duration
Expected growth: Steady expansion
Fed stance: Accommodative (lower rates ahead)
Historical: Pre-recovery period, bull steepeners common
```

**Flat Curve (transition):**
```
Maturity:  1Y    2Y    5Y   10Y   30Y
Yield:   4.3%  4.3%  4.3%  4.3%  4.5%

Interpretation: Uncertainty, transition period
Expected growth: Deceleration suspected
Fed stance: Likely near peak, cuts possible
Historical: Brief periods before recession or big repricing
```

**Inverted Curve (inverted):**
```
Maturity:  2Y    5Y   10Y   30Y
Yield:   4.5%  4.2%  4.0%  3.9%

Interpretation: Markets expect lower rates, recession fears
Expected growth: Slowdown/recession
Fed stance: Peak rates, cuts coming
Historical: 100% accuracy predicting recessions (12-18 months forward)
```

### Credit Spreads

```
IG (Investment Grade) Spread = BBB yield - Treasury yield
  Normal: 100-150 bps (1-1.5%)
  Elevated (stress): 200-300 bps
  Extreme: >300 bps (credit crisis)
  April 2026: ~120 bps (tight, risk-on)

HY (High Yield) Spread = Junk bond yield - Treasury yield
  Normal: 300-400 bps
  Elevated: 500-700 bps
  Extreme: >800 bps (panic)
  April 2026: ~350 bps (normal)

Interpretation:
- Tightening spreads: Credit conditions improving, risk-on
- Widening spreads: Stress building, risk-off, opportunity for value investors
```

### Duration & DV01

```
Duration = Effective time to payback principal (interest-weighted)
Typical 10Y bond: Duration ≈ 8.5 years

DV01 (Dollar Value of 1 basis point move):
$1M bond portfolio with duration 8:
  1 bps move = $1M × 8 × 0.01% = $80 loss
  → Very sensitive to 1bps moves when leverage used

Leverage multiplication:
Same $1M but 5:1 leverage (using repo):
  1 bps move = $5M × 8 × 0.01% = $400 loss (5x impact)
  
Risk: 50 bps rate move = $20,000 loss on $1M (leveraged portfolio)
This is why bond funds collapse when rates rise unexpectedly
```

---

## COMMODITIES

### Seasonal Patterns & Supply Drivers

**Energy (Crude Oil - CL):**

```
Seasonal pattern:
Summer (May-Sept): Driving season, refineries ramping → Prices up $3-8/bbl
Winter (Nov-Mar): Heating demand, OPEC cuts support → Stability
Spring/Fall: Refinery maintenance → Volatility

Fundamental drivers:
- OPEC production cuts (geopolitical risk)
- US shale production (structural supply)
- Dollar strength (inverse relationship with oil prices)
- Recession fears (demand destruction)
- Geopolitical conflicts (premium to prices)

Current context (Apr 2026):
WTI: ~$82/bbl
Supply: US shale robust, OPEC cuts modest
Demand: Global growth slowing slightly
Range: $75-$90 likely (sideways market)
```

**Metals (Gold - GC & Silver - SI):**

```
Gold seasonal pattern:
Q1 (Jan-Mar): Chinese New Year demand, recovery from holidays → Up
Q2 (Apr-Jun): Summer slowdown, potential rate hikes → Down pressure
Q3 (Jul-Sep): Return from summer, hedge flows → Stable to up
Q4 (Oct-Dec): Year-end demand, volatility hedging → Up

Drivers:
- Real interest rates (negative real rates = gold bullish)
- USD strength (inverse to gold)
- Inflation expectations (higher inflation = gold hedge)
- Central bank buying (structural demand from PBOC, RBI)

April 2026 context:
Gold: ~$2,350/oz
Real rates: 10Y yield (3.8%) - inflation (2.5%) = 1.3% real rate
Sentiment: Moderate bullish (Fed cuts later in year expected)
Support: $2,300, Resistance: $2,400

Silver:
Much more volatile (industrial + monetary demand)
Often trades 80:1 to gold ratio
Setup: Buy silver on weakness during gold rallies (ratio mean reversion)
```

**Agricultural (Corn - ZC, Wheat - ZWH, Soybeans - ZSH):**

```
Corn seasonal:
Planting (Apr-May): Farmers buying seed, acreage reports → Volatility
Growing season (Jun-Aug): Weather dependency (drought/rain critical)
Harvest (Sept-Oct): Supply uncertainty resolved → Stability
Winter (Dec-Mar): Storage/usage flows → Steady

Drivers:
- Weather (Iowa/Illinois corn belt, Brazil soybeans)
- USDA crop reports (planted acres, yield estimates)
- China demand (feedstocks for pork production)
- Ethanol policy (US fuel subsidies affect corn demand)

April 2026 context:
Corn: Planting season, April cold = delayed plantings (bullish)
Watch: USDA intentions report (June 28, 2026)
Risk: June weather (hot/dry = yield pressure)

Soybeans:
Brazil harvest (Jan-Mar): Global supply determined
US planting (Apr-Jun): Acreage uncertainty
China demand: Driving prices (feed demand for pork)

Wheat (winter):
Harvest (May-June): Global supply picture emerges
Geopolitical risk: Russia/Ukraine supplies, Black Sea exports
Current: Black Sea corridor agreements affecting global pricing
```

---

## Instrument Classification Quick Reference

Use this decision tree to classify any instrument:

```
Is it a stock?
  → Equities section (P/E, sectors, dividends)

Is it a contract with fixed size/expiration?
  → Futures section (ES, NQ, CL, GC, ZB specs)

Is it two currencies?
  → Forex section (EURUSD, carry, policy)

Is it a call or put?
  → Options section (Greeks, strategies, IV)

Is it a blockchain token?
  → Crypto section (chain type, tokenomics, funding rates)

Is it a bond or yield?
  → Fixed Income section (duration, curve, spreads)

Is it a physical commodity?
  → Commodities section (seasonal patterns, fundamentals)

Is it something else (ETF, fund, warrant)?
  → Get classification above, then apply relevant knowledge
```

---

## Workflow: Generate Complete Instrument Profile

### Step 1: Identify Instrument from Chart

```
Execute: chart_get_state
  → Returns: symbol (e.g., "AAPL", "EURUSD", "ESM26", "BTC")

Execute: quote_get
  → Returns: Current price, bid/ask, 52-week range, sector, exchange
```

### Step 2: Classify & Retrieve Template

```
If symbol in ['AAPL', 'MSFT', 'AMZN'...]:
  Classification: Large-cap equity
  Template: Equities with GICS sector

If symbol in ['ES', 'NQ', 'CL'...]:
  Classification: Futures contract
  Template: Futures specs + margin + roll dates

If symbol contains '/' ['EURUSD', 'GBPUSD'...]:
  Classification: Forex pair
  Template: Forex with carry, central banks

If symbol matches ['.Call', '.Put', 'Option'...]:
  Classification: Options contract
  Template: Options with Greeks

If symbol in ['BTC', 'ETH', 'SOL'...]:
  Classification: Crypto token
  Template: Crypto with on-chain metrics

If symbol in ['ZB', 'ZN', 'ZF'...]:
  Classification: Bond futures
  Template: Fixed income
```

### Step 3: Generate Comprehensive Profile

```
Deliver:
1. Classification & Exchange
2. Contract specs (if applicable)
3. Current valuation metrics
4. Sector/peer context
5. Fundamental drivers
6. Risk factors
7. Event calendar (earnings, macro, expiry)
8. Related instruments for correlation analysis
9. Historical context & ranges
10. Trading setup recommendations
```

### Step 4: Chart Analysis

```
Execute: capture_screenshot
  → Verify visually, annotate key levels
```

---

## Output Template: Complete Instrument Dossier

```
INSTRUMENT PROFILE: [SYMBOL]
═════════════════════════════════════════════════════════════════

CLASSIFICATION:
- Type: [Equity | Future | Forex | Option | Crypto | Bond]
- Exchange: [NYSE | CME | FOREX | etc.]
- Liquidity rank: [Tier 1 | Tier 2 | Tier 3]

CURRENT SNAPSHOT:
- Price: $X.XX
- Bid-Ask: $X.XX - $X.XX (Z bps)
- Volume (daily): V shares/contracts
- 52-week range: $L - $H

CONTRACT SPECS (If applicable):
- Tick size: [X]
- Point value: $[Y]
- Margin requirement: $[Z]
- Settlement: [Date]
- Expiration: [If futures]

VALUATION METRICS:
- [P/E | Duration | Delta | IV Rank | Spread]:  [Value & Assessment]
- [Earnings | Yield | Volatility | Funding rate]: [Value & Assessment]
- [Book value | Carry | Skew | Term structure]: [Value & Assessment]

SECTOR/PEER CONTEXT:
- Sector: [GICS or asset class peer group]
- Peer comparison: [5 comparable instruments]
- Relative valuation: [Cheap | Fair | Expensive] vs peers

FUNDAMENTAL DRIVERS:
1. [Driver 1]: [Current status & impact]
2. [Driver 2]: [Current status & impact]
3. [Driver 3]: [Current status & impact]

RISK FACTORS:
1. [Risk]: [Mitigation or monitoring]
2. [Risk]: [Mitigation or monitoring]
3. [Risk]: [Mitigation or monitoring]

EVENT CALENDAR:
- [Date]: [Event & expected impact]
- [Date]: [Event & expected impact]
- [Date]: [Event & expected impact]

RELATED INSTRUMENTS (Correlation):
- [Symbol 1]: [Correlation, reason]
- [Symbol 2]: [Correlation, reason]
- [Symbol 3]: [Correlation, reason]

HISTORICAL CONTEXT:
- 1-year high/low: $X - $Y
- YTD change: [+/- Z%]
- 52-week trend: [Uptrend | Downtrend | Range-bound]

TRADING SETUP:
- Bias: [Bullish | Bearish | Neutral]
- Entry: $X level [+ reasoning]
- Target: $Y level [+ reasoning]
- Stop: $Z level [+ reasoning]
- Risk/Reward: [R:R multiple]

NEXT MONITORING POINT:
- [Level 1]: [Action if breached]
- [Level 2]: [Action if breached]
```
