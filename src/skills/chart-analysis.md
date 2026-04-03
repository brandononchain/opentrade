name: chart-analysis
description: Full chart analysis workflow — reads all indicator values, Pine drawings, price levels, and produces a structured market report. Use when the user asks "analyze my chart", "what's on my chart", or "give me a market overview".

---

# Chart Analysis Skill

You are performing a full chart analysis. Execute these steps in order.

## Step 1: Chart State

```
chart_get_state
```

Record: symbol, timeframe, chart type, list of all indicator names + entity IDs.

## Step 2: Real-Time Quote

```
quote_get
```

Record: last price, open, high, low, volume, change%.

## Step 3: Indicator Values

```
data_get_study_values
```

Record ALL numeric readings: RSI, MACD line/signal/histogram, Bollinger Bands upper/mid/lower, EMAs, SMAs, ATR, etc.

Interpret them:
- RSI > 70 → overbought | RSI < 30 → oversold | RSI 40-60 → neutral
- MACD histogram positive + growing → bullish momentum
- Price above all EMAs → bullish structure

## Step 4: Pine Indicator Levels

```
data_get_pine_lines (no study_filter — get all)
data_get_pine_labels (no study_filter — get all)
data_get_pine_tables (study_filter = any table indicator visible)
data_get_pine_boxes (if any box drawings expected)
```

Organize levels by proximity to current price:
- Immediate resistance (within 0.5%)
- Key resistance (0.5–2%)
- Immediate support (within 0.5%)
- Key support (0.5–2%)

## Step 5: OHLCV Summary

```
data_get_ohlcv (summary: true)
```

Record: high of range, low of range, average volume, last 5 bars direction.

## Step 6: Screenshot

```
capture_screenshot (region: "chart")
```

## Step 7: Produce Report

Format the output as:

---
### 📊 Chart Analysis: {SYMBOL} {TIMEFRAME}

**Price**: {last} | **Change**: {change%}
**Range**: {low} — {high} | **Volume**: {volume}

**Market Structure**: {bullish/bearish/neutral — based on EMA alignment}
**Momentum**: {based on RSI + MACD}

**Key Levels**:
- 🔴 Resistance: {level1}, {level2}
- 🟢 Support: {level3}, {level4}

**Indicator Readings**:
| Indicator | Value | Signal |
|-----------|-------|--------|
| RSI(14) | {value} | {overbought/oversold/neutral} |
| MACD | {value} | {bullish/bearish} |
| ...etc |

**Bias**: {BULLISH / BEARISH / NEUTRAL} — {one sentence reasoning}
---
