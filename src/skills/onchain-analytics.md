name: onchain-analytics
description: Analyze blockchain and DeFi metrics for crypto assets. Integrates whale tracking, DEX/CEX volume ratios, liquidation levels, stablecoin flows, funding rates, and DeFi TVL. Maps on-chain signals to TradingView chart levels and generates composite on-chain + technical trade signals. Use when analyzing crypto assets or user asks "on-chain metrics", "whale tracking", "funding rates", "liquidation map".

---

# On-Chain Analytics Skill

You are performing deep on-chain analysis of crypto assets, integrating DeFi protocol metrics, whale wallet tracking, and market microstructure signals with TradingView technical analysis.

## Data Source Reference

| Metric | Primary API | Endpoint | Key Fields |
|--------|------------|----------|-----------|
| TVL by Protocol | DefiLlama | `https://api.llama.fi/protocols` | tvl, name, symbol |
| Stablecoin Supply | DefiLlama | `https://api.llama.fi/stablecoins` | symbol, total_supply, mint_burn_24h |
| DEX Volume | DefiLlama | `https://api.llama.fi/overview/dexs` | volume_24h, volume_change |
| Whale Wallets | Dune Analytics | `https://api.dune.com/api/v1/query/[query_id]/results` | wallet_address, token_balance, tx_history |
| Token Metrics | CoinGecko | `https://api.coingecko.com/api/v3/coins/{id}` | market_cap, 24h_volume, circulating_supply |
| Funding Rates | CoinGlass | `https://open-api.coinglass.com/api/v1/funding_rates` | symbol, exchange, rate_8h |
| Liquidation Levels | CoinGlass | `https://open-api.coinglass.com/api/v1/liquidation_data` | price, quantity_btc |
| Yield Opportunities | DefiLlama | `https://api.llama.fi/yields` | project, apy, tvl |
| Price Feeds | RedStone | `https://api.redstone.finance/prices?symbols=BTC,ETH` | symbol, price, timestamp |

## Step 1: Chart State & Asset Identification

```
chart_get_state
```

Record: symbol (BTC, ETH, SOL, AVAX, etc.), timeframe, exchange (Binance, FTX, Coinbase notation), current price.

## Step 2: Get Real-Time Price & Volume

```
quote_get
data_get_ohlcv(summary:true)
```

Record: current price, 24h high/low, 24h volume, price change %.

## Step 3: Fetch DeFi TVL & Protocol Health

```
Endpoint: https://api.llama.fi/protocols

For the identified asset (if applicable):
  GET /protocols
  Filter by related protocols (e.g., for SOL: Raydium, Magic Eden, Phantom; for ETH: Uniswap, Aave, Lido)
  
  Extract for each:
    - tvl: Total Value Locked (USD)
    - tvl_change_7d: 7-day trend
    - tvl_change_30d: 30-day trend
    - fees_24h: Protocol revenue
    
Calculate: TVL_momentum = (tvl_30d - tvl_7d) / tvl_7d
  - >5% growth = Bullish flow into ecosystem
  - <-5% decline = Bearish flow outflows
  - -5% to +5% = Neutral/consolidating
```

## Step 4: Analyze Stablecoin Supply & Capital Flows

```
Endpoint: https://api.llama.fi/stablecoins

GET all stablecoins (USDT, USDC, DAI, FRAX, USDE, etc.)
Track: total_supply, 24h_change, 24h_mint, 24h_burn

Calculate:
  Net_Supply_Change = sum(mint) - sum(burn) over past 24h
  
Interpretation:
  - Net positive (mints > burns) = New capital entering market → Bullish
  - Net negative (burns > mints) = Capital leaving market → Bearish
  - Magnitude: >$500M daily net change = Significant signal
  
For each chain:
  USDT_on_Ethereum, USDC_on_Ethereum, USDT_on_Solana, etc.
  Compare supply across chains to identify capital concentration
```

## Step 5: Fetch DEX vs CEX Volume Ratio

```
Endpoint: https://api.llama.fi/overview/dexs

GET volume_24h from DEX aggregator
Compare to CEX volume (from quote_get or CoinGecko)

Calculate:
  DEX_Ratio = DEX_volume / (DEX_volume + CEX_volume)
  
Thresholds:
  >0.35 = High decentralization, institutional flow fragmented
  0.25-0.35 = Healthy balance
  <0.25 = Centralized exchange dominance, retail/CEX control
  
Liquidity_Signal:
  If DEX volume rising faster than CEX = Smart money moving to protocols
  If CEX volume spiking = Leveraged retail activity or liquidation cascade setup
```

## Step 6: Whale Tracking & Accumulation Signals

```
Data Source: CoinGecko + manual Dune Analytics queries (if available)

For major assets (BTC, ETH, SOL):
  1. Identify top 10 whale wallets (holders with >1000 BTC / >10000 ETH)
  2. Track last 30 days:
     - Are whales accumulating (net inflow to whale addresses)?
     - Are whales distribution (net outflow)?
     - Volume of whale movements
     
  Alternative (if Dune unavailable):
    Use CoinGecko API to identify:
    - top_10_holders_percentage: % of supply held by top 10
    - top_10_holders_change_24h: accumulation/distribution trend
    
  Interpret:
    - Whales accumulating near support = Bullish confluence
    - Whales distributing into strength = Bearish signal
    - Large whale movements = Likely to trigger stops/liquidations
```

## Step 7: Fetch Funding Rate Heat Map

```
Endpoint: https://open-api.coinglass.com/api/v1/funding_rates

GET funding rates across major perpetual exchanges:
  - Binance Futures
  - Bybit
  - OKX
  - Dydx
  
Extract:
  - symbol: BTC, ETH, SOL, etc.
  - 8h_funding_rate: Current 8-hour rate
  - 24h_funding_rate_change: Trend
  - long_short_ratio: % longs vs shorts
  
Interpretation:
  Positive funding (longs pay shorts):
    - >0.10% per 8h = Extreme long bias, cascade risk
    - 0.05-0.10% = Elevated long positioning
    - 0-0.05% = Neutral
    
  Negative funding (shorts pay longs):
    - <-0.05% = Extreme short bias, short squeeze risk
    - Sudden flip from positive to negative = Short covering imminent
    
Signal:
  - When funding rate at 7-8 month highs + price at resistance = Short into strength
  - When funding rate bottomed + price at support = Long into bounce
  - Funding 2x normal = Liquidation cascade setup (price shock likely)
```

## Step 8: Map Liquidation Levels from CoinGlass

```
Endpoint: https://open-api.coinglass.com/api/v1/liquidation_data?symbol=BTC

Extract liquidation heatmap:
  - price_levels: [$X, $Y, $Z, ...]
  - liquidation_volume_by_level: quantity in BTC/ETH at each level
  - long_liquidations: volume of underwater long positions
  - short_liquidations: volume of underwater short positions
  
Identify concentration:
  - Single level with >$500M liquidations = Major cascade point
  - Cluster of levels = Zone of vulnerability
  
Map to chart:
  - Draw horizontal lines at major liquidation clusters
  - Shade zones above price (short liquidations) and below (long liquidations)
  - Label: "L: $X" for liquidation levels
  
Interpretation:
  - If price approaching liquidation zone from below = Risk of bounce
  - If price above major liquidations = Support zone to defend
  - Liquidations clustered at round numbers ($50k for BTC) = Retail stop cluster
```

## Step 9: Cross-Reference with On-Chain Metrics

Build composite on-chain health score:

```
Score_Component_1: TVL_Trend
  (if TVL growing 5%+ in 7d → +25 points, if declining >5% → -25 points)
  
Score_Component_2: Stablecoin_Flow
  (if net minting 24h → +20 points, if net burning → -20 points)
  
Score_Component_3: Funding_Rate
  (if normal/negative → +20 points, if extreme positive → -20 points)
  
Score_Component_4: Whale_Activity
  (if accumulating → +20 points, if distributing → -20 points)
  
Score_Component_5: DEX_Volume_Trend
  (if DEX volume increasing → +15 points, decreasing → -15 points)
  
On_Chain_Health = sum(all components) / 100 (normalize to 0-100)

Thresholds:
  >70 = Strongly bullish on-chain conditions
  50-70 = Bullish
  40-50 = Neutral
  30-40 = Bearish
  <30 = Strongly bearish on-chain conditions
```

## Step 10: Get Technical Context from Chart

```
data_get_study_values
data_get_pine_lines
```

Extract: RSI, MACD, Bollinger Bands, current support/resistance levels, trend direction.

## Step 11: Compute Composite Signal

```
Combine on-chain score with technical:

If On_Chain_Health >70 AND Technical_Bullish:
  → STRONG BUY (confluence of on-chain + technical)
  Confidence: 80-90%
  
If On_Chain_Health >70 AND Technical_Bearish:
  → BUY (on-chain strength despite technicals, contrarian)
  Confidence: 60-70%
  
If On_Chain_Health 40-50 AND Technical_Bullish:
  → BUY (technical leads on-chain, accumulation phase)
  Confidence: 60-70%
  
If On_Chain_Health <30 AND price near liquidation level:
  → SELL or avoid (risk/reward poor)
  Confidence: 70-80%
```

## Step 12: Write Pine Script Indicator (Optional)

If on-chain signals are strong, create indicator showing on-chain levels:

```pinescript
//@version=6
indicator("On-Chain Heatmap", overlay=true)

// Liquidation levels
long_liq_zone = input.float(15000, "Long Liquidation Level")
short_liq_zone = input.float(20000, "Short Liquidation Level")
whale_accumulation_level = input.float(17500, "Whale Accumulation Zone")

// TVL/Stablecoin flow indicator (lower pane alternative)
tvl_trend = input.float(0.05, "TVL 7d % Change")
stablecoin_net = input.float(500, "Stablecoin Net Mint 24h (M)")

// Plot levels
plot(long_liq_zone, "Long Liq", color=color.red, linewidth=1, linestyle=hline.style_dotted)
plot(short_liq_zone, "Short Liq", color=color.green, linewidth=1, linestyle=hline.style_dotted)
plot(whale_accumulation_level, "Whale Zone", color=color.orange, linewidth=2)

// Shade liquidation zones
bgcolor(close < long_liq_zone ? color.new(color.red, 85) : na, title="Long Liq Zone")
bgcolor(close > short_liq_zone ? color.new(color.green, 85) : na, title="Short Liq Zone")

// On-chain health color
health_color = tvl_trend > 0.05 and stablecoin_net > 0 ? color.green :
               tvl_trend < -0.05 and stablecoin_net < 0 ? color.red : color.gray
barcolor(health_color, alpha=20, title="On-Chain Health")
```

## Step 13: Screenshot

```
capture_screenshot
```

Verify: liquidation levels visible, on-chain health clear, whale/funding signals marked.

---

## Output Template

### On-Chain Analytics Report

**Asset:** [Symbol] | **Current Price:** [$X] | **Chain:** [Ethereum/Solana/etc]

**DeFi Ecosystem Health:**

| Protocol | TVL (USD) | 7d Change | 30d Change | Status |
|----------|-----------|-----------|-----------|--------|
| [Protocol 1] | $[X]M | [+5%] | [-2%] | Active |
| [Protocol 2] | $[X]M | [+12%] | [+8%] | Growing |
| [Protocol 3] | $[X]M | [-8%] | [-15%] | Declining |

**TVL Momentum:** [Bullish/Neutral/Bearish] | Score: [+25/-0/-25]

**Capital Flow Analysis:**

Stablecoin Supply (24h):
- USDT: [+$200M minting / -$150M burning]
- USDC: [+$100M minting / -$50M burning]
- Net: [$+150M] [BULLISH - Capital inflowing]

DEX vs CEX Volume:
- DEX Volume 24h: [$X]M | CEX Volume: [$Y]M
- DEX Ratio: [28%] [Healthy institutional balance]
- Trend: [DEX growing faster = Smart money to protocols]

**Liquidation Heatmap:**

| Price Level | Long Liq Vol | Short Liq Vol | Risk Level |
|------------|--------------|---------------|-----------|
| $[X] | [500 BTC] | [100 BTC] | [CRITICAL] |
| $[Y] | [300 BTC] | [400 BTC] | [HIGH] |
| $[Z] | [200 BTC] | [200 BTC] | [MEDIUM] |

**Funding Rate Status:**

- Current 8h Rate: [+0.078%] [Elevated long bias]
- 24h Change: [+0.015% trend upward]
- Exchange Consensus: Bybit 0.075%, Binance 0.082%, OKX 0.071%
- Long/Short Ratio: 62% longs / 38% shorts
- Risk: [Cascade risk if rate remains elevated]

**Whale Activity:**

- Top 10 Holders: [32.5%] of supply
- 30d Trend: [Accumulating near $17,500]
- Recent Large Transactions: [3 wallets moved 500+ BTC in 24h] [Neutral/No clear direction]

**On-Chain Health Score: [75/100] - BULLISH**

Breakdown: TVL +25pts | Stablecoin Flow +20pts | Funding -10pts | Whale Accumulation +20pts | DEX Trend +10pts

**Composite Trade Signal:**

Signal: **BUY** (On-Chain Bullish + Technical Pullback)
- On-Chain Health: [75/100] Strong positive conditions
- Technical Alignment: RSI 42 (oversold setup on daily), MACD bearish divergence
- Confluence: Capital flowing in (stablecoin mints) + whales accumulating near $17,500 = Bullish for bounce
- Confidence: [72%]
- Entry: Market or dip to $17,500 support
- Target: $19,200 (above short liquidation cluster)
- Stop: $16,500 (below whale zone + long liquidations)
- Risk/Reward: 1700 target / 1000 risk = 1.7:1 (acceptable)

**Key Risks:**

- If liquidations at $15,000 cascade → cascade to $14,000
- Stablecoin flow could reverse if macro sentiment shifts
- Funding rate at 7-month high = Short-term pullback possible
- Monitor: BTC dominance (if <50% = alt season weakness) and ETH TVL (if declining = risk-off sentiment)
