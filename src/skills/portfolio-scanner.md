name: portfolio-scanner
description: Systematic multi-symbol portfolio scan — rank symbols by momentum, volatility, relative strength, and statistical signal strength. Produces a ranked watchlist with actionable signals. Use when asked to "scan my watchlist", "rank these symbols", "find the best setup", "relative strength", "portfolio scan", or "which symbol has the best setup".

---

# Portfolio Scanner Skill

You are running a systematic scan across multiple symbols to rank them by signal strength and identify the highest-probability setups. This is how a quant fund screens for opportunities every morning.

## Step 1: Get the Symbol List

Ask the user for symbols if not provided. Default to checking the TradingView watchlist:

```
watchlist_get    → retrieve current watchlist symbols
```

Or use the user-specified list. Maximum efficient scan: 20 symbols.

## Step 2: Systematic Batch Scan

For each symbol, collect the same data in a consistent format using batch operations where possible:

```
batch_run (symbols: [...], action: "quote")    → prices and changes for all
```

Then iterate through key symbols for deeper analysis:

```
For each symbol:
  chart_set_symbol ({symbol})
  chart_set_timeframe (D)           → daily for screening
  data_get_ohlcv (count: 50, summary: false)  → 50 bars for stats
  data_get_study_values             → RSI, MACD, ATR readings
  data_get_pine_lines               → key levels
```

## Step 3: Score Each Symbol (0–100)

Calculate a composite score for each symbol across 5 factors:

### Factor 1: Momentum Score (0–20 pts)
- 1-day return > 1% and positive: 5 pts
- 5-day return > 3%: 5 pts
- 20-day return > 8%: 5 pts
- 50-day return trend (up): 5 pts

### Factor 2: RSI Score (0–20 pts)
- RSI 50–65 (bullish but not overbought): 20 pts
- RSI 65–70: 15 pts
- RSI 40–50: 10 pts
- RSI 70+ (overbought): 5 pts
- RSI 30–40: 5 pts
- RSI <30 (oversold — mean reversion potential): 15 pts

### Factor 3: Volatility/ATR Score (0–20 pts)
- ATR as % of price (normalized vol):
  - 1–2% daily ATR: 20 pts (ideal — enough move, not excessive)
  - 2–4% daily ATR: 15 pts
  - 0.5–1% daily ATR: 10 pts (too quiet)
  - >4% daily ATR: 5 pts (too risky unless sized down)

### Factor 4: Volume Confirmation (0–20 pts)
- Relative volume > 1.5x on up days: 20 pts
- Relative volume 1.0–1.5x: 15 pts
- Relative volume 0.7–1.0x: 10 pts
- High volume on down days: 0 pts (distribution)

### Factor 5: Structure/Trend Score (0–20 pts)
- Price > 20 EMA > 50 EMA > 200 EMA: 20 pts
- Price > 20 EMA > 50 EMA: 15 pts
- Price > 20 EMA: 10 pts
- Price < 20 EMA: 5 pts
- Price < all EMAs: 0 pts

**Total score = sum of all factors (0–100)**

## Step 4: Classify Each Symbol

| Score | Classification | Action |
|-------|---------------|--------|
| 80–100 | **STRONG BUY** | High priority, size up |
| 65–79 | **BUY** | Good setup, standard size |
| 50–64 | **WATCH** | Monitor, wait for trigger |
| 35–49 | **NEUTRAL** | No edge, skip |
| 20–34 | **AVOID** | Weak structure |
| 0–19 | **SHORT CANDIDATE** | Bearish setup |

## Step 5: Relative Strength Ranking

Calculate relative strength vs a benchmark:

```
chart_set_symbol (SPY)    → get SPY 20-day return
```

For each symbol:
- **RS = Symbol 20-day return - SPY 20-day return**
- RS > +5%: Outperforming significantly → strong relative strength
- RS 0–5%: Mild outperformance
- RS -5% to 0%: Mild underperformance
- RS < -5%: Significantly underperforming → avoid or short

## Step 6: Identify Top 3 Setups

From the ranked list, identify the top 3 setups and provide:

For each:
1. **Why it scored high**: Key factors
2. **Entry trigger**: Specific price action signal
3. **Key level to watch**: S/R from Pine levels
4. **Risk level**: Stop placement
5. **Target**: First logical target
6. **Position size**: Based on ATR-based sizing (1% risk / ATR stop)

## Step 7: ATR-Based Position Sizing

For each top setup:
```
ATR stop = 2 × ATR(14) from entry
Position size = (Account Risk $) / (ATR stop in $)

Example ($100K account, 0.5% risk per trade = $500 risk):
  ATR(14) = $2.50
  ATR stop = $5.00
  Position size = $500 / $5.00 = 100 shares
```

## Step 8: Screenshot Top Setups

```
For each top 3 symbol:
  chart_set_symbol ({symbol})
  capture_screenshot (region: "chart")
```

## Step 9: Report

```
=== PORTFOLIO SCAN RESULTS — {DATE} ===
Scanned: {N} symbols | Timeframe: Daily | Benchmark: SPY

RANKINGS
╔════╦════════╦═══════╦═══════╦══════════╦══════╦══════════════╗
║ # ║ Symbol ║ Score ║ RS    ║ 20D Ret  ║ RSI  ║ Signal       ║
╠════╬════════╬═══════╬═══════╬══════════╬══════╬══════════════╣
║ 1 ║ {SYM}  ║ {N}/100║ +{N}%║ +{N}%    ║ {N}  ║ STRONG BUY   ║
║ 2 ║ {SYM}  ║ {N}/100║ +{N}%║ +{N}%    ║ {N}  ║ BUY          ║
║ 3 ║ {SYM}  ║ {N}/100║ +{N}%║ +{N}%    ║ {N}  ║ BUY          ║
...
╚════╩════════╩═══════╩═══════╩══════════╩══════╩══════════════╝

TOP 3 SETUPS

#1: {SYMBOL} — Score {N}/100
  Entry trigger:  {specific signal}
  Entry zone:     ${price}
  Stop:           ${price} (${dist} / {%})
  Target:         ${price} ({R}R)
  Size ($100K):   {N} shares (0.5% risk)
  RS vs SPY:      +{N}% outperforming

#2: {SYMBOL} — Score {N}/100
  [same format]

#3: {SYMBOL} — Score {N}/100
  [same format]

AVOID LIST
  {SYMBOL}: Score {N} — {reason}
  {SYMBOL}: Score {N} — {reason}

SHORT CANDIDATES (Score < 20)
  {SYMBOL}: Score {N} — {reason}
```
