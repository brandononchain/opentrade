name: prediction-markets
description: Integrate Polymarket + Kalshi prediction market data with TradingView charts. Maps macro events to market-implied probabilities, computes probability-weighted scenarios, and generates trade recommendations factoring in market-implied odds. Use when user asks "what are the prediction markets saying", "integrate prediction markets", or needs to map events to probabilities.

---

# Prediction Markets Integration Skill

You are integrating real-time prediction market probabilities with TradingView technical analysis to generate probability-weighted trade signals.

## Asset ↔ Prediction Market Mapping

| TradingView Asset | Polymarket Markets | Kalshi Markets | Key Event Driver |
|-------------------|------------------|-----------------|------------------|
| ES (S&P 500) | Fed rate decision, inflation print, unemployment, recession probability | US inflation rate, GDP growth, unemployment claims | Macro data releases, FOMC decisions |
| BTC, ETH (Crypto) | Bitcoin price by date, Ethereum price, crypto regulation (SEC, US policy), ETF approval | Bitcoin price zones, cryptocurrency adoption milestones | Regulatory changes, adoption news |
| GC (Gold) | USD/inflation expectations, geopolitical escalation | Gold price zones, inflation outcomes | Central bank policy, geopolitical events |
| CL (Crude Oil) | OPEC+ production, geopolitical conflict (Russia/Middle East, Iran sanctions) | Oil price ranges | Geopolitical events, supply disruptions |
| EUR/USD | ECB rate decision, European recession, euro crisis | EUR/USD price zones | Central bank divergence, economic data |
| TSLA, Tech | US recession, inflation outcomes, tech tariffs (China trade war), election outcomes | Stock price ranges, sector performance | Election outcomes, regulatory changes |
| VIX | Market volatility expectations, recession probability | VIX level ranges | Macro uncertainty, Fed policy expectations |

## Step 1: Chart State

```
chart_get_state
```

Record: symbol (ES, BTC, GC, CL, etc.), timeframe, current price.

## Step 2: Get Current Quote

```
quote_get
```

Record: last price, daily change, volume.

## Step 3: Fetch Polymarket Markets

Using web access, call Polymarket APIs:

```
1. GET https://gamma-api.polymarket.com/markets
   Filter by keywords matching the asset:
   - ES futures → "Fed rate", "Federal Reserve", "inflation", "unemployment", "recession"
   - BTC → "Bitcoin", "cryptocurrency", "crypto regulation", "crypto ETF"
   - Gold → "inflation", "geopolitical", "USD strength"
   - Oil → "OPEC", "geopolitical", "sanctions", "supply"
   
2. For top 3-5 markets:
   GET https://clob.polymarket.com/markets?conditions=[conditionId]
   Extract:
   - market_question: "Will Bitcoin reach $X by [date]?" / "Will Fed raise rates in [month]?"
   - yes_price: probability of YES outcome (0-1)
   - no_price: probability of NO outcome (0-1)
   - yes_volume: trading volume on YES side
   - no_volume: trading volume on NO side
   - liquidity: total market depth
   - end_date: when this market resolves
```

## Step 4: Fetch Kalshi Markets

```
1. GET https://api.elections.kalshi.com/trade-api/v2/markets
   Filter by asset type and sort by volume/liquidity:
   - For equities: markets on indices, GDP, unemployment, inflation
   - For crypto: Bitcoin/Ethereum price level predictions
   - For commodities: commodity price zones
   
2. For top 3-5 markets:
   GET https://api.elections.kalshi.com/trade-api/v2/markets/{market_id}
   Extract:
   - yes_bid: highest bid price on YES outcome
   - yes_ask: lowest ask price on YES outcome
   - no_bid: highest bid price on NO outcome
   - no_ask: lowest ask price on NO outcome
   - volume_24h: recent trading activity
   - expires_at: market resolution date
```

## Step 5: Compute Probability-Weighted Scenarios

For each major market (keep top 3-5):

```
Bull Case:
  - Identify what must happen for asset to rally
  - From markets: extract prob_bull = yes_price of bullish market
  - From chart: get current RSI, MACD, trend direction
  - Bull scenario price target = current_price × (1 + expected_bull_move%)
  - Probability-weighted = prob_bull × bull_target
  
Bear Case:
  - Identify what must happen for asset to sell off
  - From markets: prob_bear = yes_price of bearish market
  - From chart: identify support levels, downtrend conditions
  - Bear scenario price target = current_price × (1 - expected_bear_move%)
  - Probability-weighted = prob_bear × bear_target
  
Expected Value = (prob_bull × bull_move) + (prob_bear × -bear_move)
Scenario Confidence = market volume / (total volume across all markets) × 100%
```

## Step 6: Get On-Chart Technical Context

```
data_get_study_values
```

Extract: RSI, MACD, Bollinger Bands, ATR, current support/resistance.

## Step 7: Map Prediction Market Events to Chart

Using market dates:

```
1. Identify upcoming catalyst dates (market resolution dates)
2. For ES: Mark "FOMC - 2026-05-06" on chart
3. For BTC: Mark "Crypto regulation decision - 2026-04-15" on chart
4. For Oil: Mark "OPEC meeting - 2026-04-20" on chart

Map as Pine Script annotations (if possible) or note in report:
- Event name
- Market probability
- Expected move (bull vs bear)
- Current price relative to move
```

## Step 8: Compute Kelly-Optimal Position Sizing

```
From prediction markets:
  W (win rate) = probability of directional outcome from market
  R (reward/risk) = bull_move / bear_move
  
Kelly % = W - (1-W)/R
Optimal = Kelly % / 2  (Half Kelly for safety)

Position Size = min(Optimal, 5% of portfolio max)

Example:
  - Market says Fed hike prob = 75% (W=0.75)
  - ES expected to move +2% on hike, -0.5% on hold (R = 2.0/0.5 = 4.0)
  - Kelly = 0.75 - (0.25/4.0) = 0.75 - 0.0625 = 0.6875 = 68.75%
  - Half Kelly = 34.375% (clamp to 5% max)
  - Position = 5% of portfolio
```

## Step 9: Generate Composite Signal

```
Combine:
1. Prediction market probability (qual: > 65% = strong signal, 50-65% = neutral, <50% = counter-signal)
2. Market volume/liquidity (how much confidence in this probability)
3. On-chart technical signal (RSI, MACD, support/resistance)
4. Time to resolution (markets resolving >30 days out = lower urgency)

Output:
  SIGNAL: [STRONG BUY / BUY / HOLD / SELL / STRONG SELL]
  Confidence: X% (based on market volume + technical alignment)
  Entry: Market price
  Target: Bull/Bear scenario from markets
  Stop: Technical support/resistance
  Position Size: X% of portfolio (Half Kelly)
```

## Step 10: Create Pine Script Indicator (Optional)

If markets suggest directional move > 1.5%, write indicator showing:
- Market probability (horizontal line at 50%, shaded bull 50-100%, shaded bear 0-50%)
- Expected move zones (upper band = bull target, lower band = bear target)
- Current price position within scenario cone

```pinescript
//@version=6
indicator("Prediction Market Scenarios", overlay=true)

// Input from analysis
bull_prob = input.float(0.65, "Bull Probability", 0.0, 1.0)
bear_prob = 1.0 - bull_prob
bull_target = input.float(5500, "Bull Target")
bear_target = input.float(5200, "Bear Target")
current = close

// Plot scenario cone
plot(bull_target, "Bull Target", color=color.green, linewidth=2)
plot(bear_target, "Bear Target", color=color.red, linewidth=2)

// Probability bands
hline(0.5, "50% Prob Line", color=color.gray, linestyle=hline.style_dotted)

// Interpretation
bull_zone = (current - bear_target) / (bull_target - bear_target)
bg_color = bull_zone > 0.65 ? color.new(color.green, 80) : 
           bull_zone < 0.35 ? color.new(color.red, 80) : color.new(color.gray, 90)
bgcolor(bg_color, title="Scenario Zone")
```

## Step 11: Screenshot

```
capture_screenshot
```

Verify: prediction markets overlay visible, scenario zones clear, current price position obvious.

---

## Output Template

### Prediction Markets Report

**Asset:** [Symbol] | **Current Price:** [$X]

**Top Markets:**

| Market | Probability (Yes) | Volume | Liquidity | Expires |
|--------|-------------------|--------|-----------|---------|
| [Event 1] | [65%] | [Volume] | [Good/Fair/Poor] | [Date] |
| [Event 2] | [72%] | [Volume] | [Good/Fair/Poor] | [Date] |
| [Event 3] | [48%] | [Volume] | [Good/Fair/Poor] | [Date] |

**Probability-Weighted Scenario:**

Bull Case (Prob: [65%] × Target: [$X] = Expected Value: $[X])
- Catalyst: [Event from markets]
- Technical alignment: [RSI/MACD confirmation?]

Bear Case (Prob: [35%] × Target: [$Y] = Expected Value: $[Y])
- Catalyst: [Event from markets]
- Technical alignment: [Support breakdown?]

**Trade Recommendation:**

Signal: **[STRONG BUY / BUY / HOLD / SELL]**
- Confidence: [X%] (market volume + technical)
- Entry: Market
- Target: $[Bull/Bear]
- Stop: $[Support/Resistance]
- Position Size: [X%] of portfolio (Half Kelly: [Y%])
- Time Horizon: [X days to market resolution]

**Key Risks:**
- [Market may reprice if...]
- [Liquidation level at $X]
- [IV expansion could widen]
