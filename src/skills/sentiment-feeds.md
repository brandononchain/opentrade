name: sentiment-feeds
description: Integrate macro sentiment indicators — Fear & Greed Index, funding rates, open interest, news sentiment, VIX term structure, put/call ratios, social volume. Scores sentiment -100 to +100, identifies extremes as contrarian signals, and cross-references with technical analysis. Use when user asks "market sentiment", "fear and greed", "news flow", "social sentiment", "options flow", "VIX levels".

---

# Sentiment Feeds Integration Skill

You are synthesizing real-time sentiment signals from Fear & Greed Index, macro options data, funding rates, news sentiment, and social volume to identify extremes and generate contrarian trade signals.

## Sentiment Data Sources

| Signal | API Endpoint | Key Metric | Update Freq |
|--------|-------------|-----------|------------|
| Fear & Greed Index (Crypto) | `https://api.alternative.me/fng/` | fng_value (0-100) | Daily |
| Funding Rates (Crypto) | `https://open-api.coinglass.com/api/v1/funding_rates` | 8h_rate across exchanges | Hourly |
| Open Interest | `https://open-api.coinglass.com/api/v1/open_interest` | OI_change_24h, OI total | Hourly |
| VIX Levels (Equities) | TradingView quote_get | VIX last, 52w high/low | Real-time |
| VIX Term Structure | CBOE API or data_get_ohlcv on VIX futures | VIX, VIX1M, VIX3M spreads | Daily |
| Put/Call Ratio (Options) | CoinGlass or CBOE | put_vol / call_vol, money_market ratio | Hourly |
| News Sentiment | RSS aggregation + NLP scoring | bullish/neutral/bearish classification | Real-time |
| Social Volume | Concept-based (X mentions, Reddit activity) | volume_spike_24h vs avg | Hourly |

## Step 1: Chart State & Asset Class Detection

```
chart_get_state
```

Record: symbol, asset class (Equity/Crypto/Commodity/FX), timeframe, current price.

Determine sentiment sources:
- Crypto (BTC, ETH, SOL, etc.) → F&G Index, Funding Rates, Open Interest, Social
- Equities (ES, SPY, QQQ, etc.) → VIX, Put/Call Ratio, Earnings Sentiment
- Commodities (Gold, Oil, etc.) → COT positioning, Geopolitical News
- All assets → News sentiment, options flow

## Step 2: Fear & Greed Index (Crypto Assets Only)

```
Endpoint: https://api.alternative.me/fng/

GET /
Extract:
  - value: 0-100 (0=Maximum Fear, 100=Maximum Greed)
  - value_classification: "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
  - timestamp: when this was computed
  - history: last 30 days of FNG readings
  
Historical percentile:
  - If current value > 90th percentile (last 365 days) = Extreme euphoria zone
  - If current value < 10th percentile (last 365 days) = Extreme panic zone
  - 40-60 = Neutral zone
  
Interpretation:
  FNG > 80:
    - Extreme Greed = Retail euphoria, FOMO peak
    - Technical Signal: Look for resistance/overbought setups for shorts
    - Contrarian: Top-picking opportunity
    
  FNG < 25:
    - Extreme Fear = Capitulation, panic selling
    - Technical Signal: Look for support/oversold setups for longs
    - Contrarian: Bottom-picking opportunity
    
  FNG 40-60:
    - Neutral = Follow technical signals, no sentiment skew
```

## Step 3: Funding Rate Heat Map

```
Endpoint: https://open-api.coinglass.com/api/v1/funding_rates

GET funding across perpetual exchanges:
  Binance Futures, Bybit, OKX, Dydx, Kraken Futures
  
Extract for current symbol:
  - 8h_funding_rate: [e.g., +0.078%]
  - 24h_funding_rate_change: [trending up or down?]
  - funding_rate_percentile: Historical rank of current rate
  - long_percentage: % of positions that are longs
  - short_percentage: % of positions that are shorts
  
Sentiment Scoring:
  Positive Funding (Longs Pay):
    >0.15% = Extreme long bias (+80 sentiment)
    0.10-0.15% = Strong long bias (+50 sentiment)
    0.05-0.10% = Moderate long bias (+25 sentiment)
    0-0.05% = Neutral (+0 sentiment)
    
  Negative Funding (Shorts Pay):
    <-0.05% = Moderate short bias (-25 sentiment)
    -0.10 to -0.05% = Strong short bias (-50 sentiment)
    <-0.10% = Extreme short bias (-80 sentiment)
    
Trend Signal:
  If funding rate at 3-month high + flipping direction = Risk of cascade
  If funding has been positive for >7 days straight = Unsustainable leverage
```

## Step 4: Fetch Open Interest Data

```
Endpoint: https://open-api.coinglass.com/api/v1/open_interest

GET {symbol}/open_interest across exchanges:
  - total_oi: Total open interest (BTC/USD value)
  - oi_change_24h: Dollar amount added/removed in last 24h
  - oi_change_pct_24h: % change
  - oi_percentile: Historical rank
  - long_oi: Dollar value of long positions
  - short_oi: Dollar value of short positions
  
Interpretation:
  OI Rising + Price Rising:
    - New longs entering = Conviction in uptrend
    - But if OI at 90th percentile = Risk of liquidation cascade
    - Sentiment: +40 (bullish positioning but vulnerable)
    
  OI Rising + Price Falling:
    - Shorts piling on = Bearish conviction
    - But creates short squeeze risk
    - Sentiment: -40 (bearish but overstretched)
    
  OI Declining + Price Falling:
    - Deleveraging = Risk-off, capitulation
    - Sentiment: -60 (panic)
    
  OI Declining + Price Rising:
    - Shorts covering = Bullish momentum
    - Clean uptrend, less liquidation risk
    - Sentiment: +60 (bullish and healthy)
```

## Step 5: VIX & Equity Options Flow (Equities Only)

```
For Equity assets (ES, SPY, QQQ, IWM):

A. VIX Level Assessment:
  chart_set_symbol("VIX")
  quote_get
  
  Record: VIX price, 52w high, 52w low, current percentile
  
  VIX Interpretation:
    <15 = Complacency, under-hedging (+60 sentiment, but contrarian short)
    15-20 = Normal volatility expectation (+20 sentiment)
    20-30 = Elevated uncertainty (-20 sentiment)
    30-40 = Fear spike (-50 sentiment)
    >40 = Panic (-80 sentiment, contrarian long signal)
    
  Percentile Context:
    If VIX <20 but at 80th percentile of 52w range = False complacency
    If VIX >30 but at 90th percentile = Capitulation likely priced in

B. VIX Term Structure:
  Compare: VIX (spot) vs VIX1M vs VIX3M futures
  
  Contango (Term Curve Up = Higher future > Current):
    - Market expects volatility to decline
    - Normal risk environment
    - Sentiment: +30 (constructive)
    
  Backwardation (Term Curve Inverted = Current > Future):
    - Market expects immediate crisis, then recovery
    - Acute fear
    - Sentiment: -50 (panic imminent or present)
    
  Calculation: Spread = VIX3M - VIX / normal_spread
  If spread compressed to near 0 = Extreme dislocation risk

C. Put/Call Ratio:
  From options market data (if available via TradingView derivatives):
  put_volume / call_volume
  
  Ratios:
    >1.2 = Extreme hedging demand (-70 sentiment, fear)
    0.9-1.2 = Balanced (+0 sentiment)
    <0.8 = Call buying bias (+60 sentiment, greed)
    
  Money Market Put/Call:
    (Put Open Interest / Call Open Interest) at strikes
    Extreme values = Institutional position concentration
```

## Step 6: Fetch News Sentiment

Using web access, aggregate financial news and score sentiment:

```
Data Sources:
  1. Financial RSS feeds: Reuters, Bloomberg, Financial Times, CNBC
  2. Asset-specific news: Seek Alpha (for stocks), CryptoSlate (for crypto)
  3. Earnings/Event calendars: Economic calendar, earnings dates
  
Process for current symbol:
  - Search news from last 24h relevant to symbol
  - Classify each headline as Bullish (+1), Neutral (0), Bearish (-1)
  - Weight by recency (today's news > yesterday's)
  - Weight by source credibility (Reuters > random blog)
  
Score Calculation:
  News_Sentiment = (sum(bullish_articles) - sum(bearish_articles)) / total_articles
  Result: -1.0 to +1.0, normalize to -100 to +100
  
Extremes to watch:
  - Major negative news (>3 bearish, 0 bullish) = Capitulation setup
  - Major positive news (>3 bullish, 0 bearish) = Euphoria risk
  - News vacuum (0 articles) = Range-bound consolidation
  
Topic Clustering:
  - Regulatory news (crypto): High impact sentiment shift
  - Earnings misses (equities): High impact negative
  - Geopolitical (commodities): Medium impact positive (risk-off rally)
```

## Step 7: Social Volume Signals (Crypto Assets)

```
Concept-based social sentiment (X/Twitter mentions, Reddit):

Ideally integrate with services tracking:
  - Cryptocurrency mentions on X
  - Subreddit activity (r/cryptocurrency, asset-specific)
  - Whale alerts on social (large transactions announced)
  
Calculation:
  Social_Volume_Spike = (current_24h_mentions / 30d_average) - 1
  
  Interpretation:
    >200% above average = Extreme spike (contrarian signal)
      If price already rallied = Reverse soon
      If price collapsed = Bounce setup
      
    100-200% = Above average interest (mild bullish)
    
    <50% = Below average = Consensus apathy (-20 sentiment)
    
Contrarian Application:
  When social volume spikes >300% with one-directional sentiment:
    - Spike on bullish sentiment after 3-month rally = Top formation
    - Spike on bearish sentiment after crash = Bottom formation
    - Retail FOMO = Hedging opportunity for professionals
```

## Step 8: Composite Sentiment Score

Calculate weighted sentiment (-100 to +100):

```
For CRYPTO assets:
  FNG_Score (weight 25%):
    - FNG > 80 = +80
    - FNG < 25 = -80
    - FNG 40-60 = 0
    
  Funding_Score (weight 20%):
    - Extreme positive (>0.15%) = +80
    - Extreme negative (<-0.10%) = -80
    - Moderate = +/-25-50
    
  OI_Score (weight 20%):
    - OI rising + price rising = +50
    - OI rising + price falling = -50
    - OI declining + price rising = +60
    
  News_Score (weight 20%):
    - Positive headlines = +News_Sentiment value
    - Negative headlines = -News_Sentiment value
    
  Social_Score (weight 15%):
    - Spike + rally = -70 (contrarian short)
    - Spike + crash = +70 (contrarian long)
    
  CRYPTO_COMPOSITE = 
    0.25×FNG + 0.20×Funding + 0.20×OI + 0.20×News + 0.15×Social

For EQUITY assets:
  VIX_Score (weight 25%):
    - VIX < 15 = +50 (complacency)
    - VIX 15-20 = 0
    - VIX 20-30 = -50
    - VIX > 40 = -80 (panic)
    
  Put_Call_Score (weight 15%):
    - P/C > 1.2 = -70
    - P/C 0.9-1.2 = 0
    - P/C < 0.8 = +70
    
  VIX_Term_Score (weight 15%):
    - Contango = +30
    - Flat = 0
    - Backwardation = -70
    
  News_Score (weight 25%):
    - As above
    
  Earnings_Score (weight 10%):
    - Upcoming earnings = +0 (neutral until event)
    - Post-beat earnings = +40
    - Post-miss earnings = -40
    
  EQUITY_COMPOSITE = 
    0.25×VIX + 0.15×Put_Call + 0.15×VIX_Term + 0.25×News + 0.10×Earnings

Result: -100 (Maximum Fear) to +100 (Maximum Greed)
```

## Step 9: Identify Sentiment Extremes

```
Extreme Thresholds:
  Sentiment > +75 = EXTREME GREED
    - CONTRARIAN SHORT setup
    - Expect pullback or consolidation
    - Enter shorts on momentum failure
    
  Sentiment 50 to +75 = GREED
    - Moderately bullish bias
    - Follow technical breaks above resistance
    
  Sentiment -25 to +50 = NEUTRAL
    - No strong sentiment skew
    - Follow technical signals only
    
  Sentiment -50 to -25 = FEAR
    - Moderately bearish bias
    - Follow technical breaks below support
    
  Sentiment < -75 = EXTREME FEAR
    - CONTRARIAN LONG setup
    - Expect bounce or capitulation bottom
    - Enter longs on capitulation exhaustion signals

Extremeness Score:
  How extreme is this reading historically?
  
  percentile = (current_sentiment - 365day_min) / (365day_max - 365day_min)
  
  If percentile > 0.95 = Top 5% extreme (highest conviction contrarian)
  If percentile < 0.05 = Bottom 5% extreme (highest conviction contrarian)
  If percentile 0.40-0.60 = Normal zone, low conviction
```

## Step 10: Cross-Reference with TradingView Technical

```
data_get_study_values
```

Extract: RSI, MACD, support/resistance, trend direction.

Confluence check:

```
If Sentiment EXTREME GREED (-75) + RSI OVERBOUGHT (>80) + Price at Resistance:
  → STRONG SHORT signal
  → Confidence: 85-90%
  
If Sentiment EXTREME FEAR (<-75) + RSI OVERSOLD (<20) + Price at Support:
  → STRONG LONG signal
  → Confidence: 85-90%
  
If Sentiment EXTREME + Technical CONFLICTING:
  → MEDIUM conviction (sentiment driving, technicals not aligned yet)
  → Confidence: 60-70%
  
If Sentiment NEUTRAL + Technical CLEAR:
  → FOLLOW TECHNICAL (sentiment not a factor)
```

## Step 11: Screenshot with Sentiment Overlay

```
capture_screenshot
```

Include: current sentiment score visually (colored gauge -100 to +100), extremeness percentile, key sentiment component breakdown.

---

## Output Template

### Sentiment Report

**Asset:** [Symbol] | **Current Price:** [$X] | **Time:** [HHmm UTC]

**Sentiment Composite Score: [+68/100] - GREED**

Sentiment Gauge:
```
EXTREME FEAR ←[████████░░░░░░░░]→ EXTREME GREED
            -100           0          +68    +100
                                      ↑
                                   Current
```

**Component Breakdown:**

| Component | Score | Weight | Contribution | Interpretation |
|-----------|-------|--------|--------------|-----------------|
| Fear & Greed Index | [82/100] | 25% | [+20] | Extreme Greed, retail FOMO |
| Funding Rate | [+0.085%] | 20% | [+50] | Strong long bias, vulnerable |
| Open Interest | [Rising + Price Rising] | 20% | [+40] | New longs entering, conviction |
| News Sentiment | [+0.45] | 20% | [+9] | Positive headlines but mixed |
| Social Volume | [+150% above avg] | 15% | [-15] | Spike = Contrarian short signal |

**Historical Context:**

- Current sentiment [+68] is at [78th percentile] of last 365 days
- Previous extreme greed was [+72] on [Date] → reversed within [5 days]
- Sentiment has been positive for [7 consecutive days] (stretching)

**Equity-Specific (if ES/SPY):**

| Metric | Reading | Status |
|--------|---------|--------|
| VIX Level | [14.2] | Complacent (below 15) |
| VIX Percentile | [30th %ile of 52w] | Low, not historical extreme |
| VIX Term Structure | [Contango +2.5 points] | Normal, constructive |
| Put/Call Ratio | [0.72] | Call buying bias (bullish) |

**Trade Recommendation:**

Signal: **CONTRARIAN SHORT / FADE GREED**
- Confidence: [72%] (extreme sentiment + technical overbought)
- Rationale: Sentiment at 78th percentile (extreme), funding rates at 3-month high (leverage peak), price at resistance. Retail fomo evident in social volume spike. Waiting for momentum failure (RSI divergence, MACD roll) to trigger short.
- Entry: [Market or slight weakness]
- Target: [Support level from chart]
- Stop: [Above resistance]
- Position Size: [Smaller than usual, sentiment extremes can persist]

**Key Risks:**
- Sentiment extremes can extend longer than expected
- If Fear & Greed flips bearish without price breakdown = Whipsaw risk
- News catalyst could shift sentiment rapidly
- Monitor: Funding rate for early reversal signal

---

## Sentiment Extremes Reference Table

| Condition | Sentiment Range | Contrarian Signal | Historical Outcome |
|-----------|-----------------|-------------------|-------------------|
| Extreme Greed | >+80 | SHORT / Fade | Reversal within 1-7 days typical |
| Greed | +50 to +80 | Neutral to slight short bias | Mixed outcomes |
| Neutral | -25 to +50 | Follow technicals | N/A (no sentiment edge) |
| Fear | -50 to -25 | Neutral to slight long bias | Mixed outcomes |
| Extreme Fear | <-75 | LONG / Catch bottom | Bounce within 1-7 days typical |

**Extremeness Percentile Guide:**

- >95th percentile: Unprecedented conditions, highest conviction contrarian
- 90-95th percentile: 6-month extreme, very high conviction
- 80-90th percentile: 3-month extreme, high conviction
- 40-60th percentile: Normal, no conviction (noise)
- <20th percentile: Opposite extreme, reversal setup
