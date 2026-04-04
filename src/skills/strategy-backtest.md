name: strategy-backtest
description: Pine Script v6 strategy development and backtesting workflow — write a strategy, compile it, run the TradingView Strategy Tester, read performance metrics, and iterate to improve results. Use when asked to "backtest", "test a strategy", "strategy tester", "optimize", "write a strategy and test it", or "what are the strategy results".

---

# Strategy Backtest Skill

You are building and testing a systematic trading strategy using TradingView's Strategy Tester. The goal is a statistically valid, realistic backtest with proper commission, slippage, and position sizing.

## Step 1: Define Strategy Parameters

Before writing code, clarify with the user:
- **Asset class**: Equity / Futures / Crypto / FX
- **Timeframe**: What TF to test on
- **Logic type**: Trend following / Mean reversion / Breakout / Multi-factor
- **Entry signals**: What triggers a trade
- **Exit signals**: Fixed target + stop / Trailing stop / Signal-based exit
- **Lookback period**: How much history to test

## Step 2: Write the Strategy

Write a complete Pine Script v6 strategy with REALISTIC settings:

```pinescript
//@version=6
strategy(
    title           = "{Strategy Name}",
    overlay         = true,
    initial_capital = 100000,
    currency        = currency.USD,
    default_qty_type  = strategy.percent_of_equity,
    default_qty_value = 10,                    // 10% per trade
    commission_type   = strategy.commission.percent,
    commission_value  = 0.05,                  // 0.05% = $5 per $10K — realistic for equities
    slippage          = 2,                     // 2 ticks slippage
    calc_on_every_tick = false,                // bar close only
    process_orders_on_close = false            // realistic fills
)
```

**Commission by asset class**:
- US Equities: 0.05% (retail) or 0.01% (institutional)
- Futures (ES, NQ): $4.50/side = set in dollars
- Crypto: 0.1% maker / 0.2% taker (Binance) → use 0.15%
- FX: 0.5–2 pip spread → convert to %

**Slippage**:
- Liquid US equities: 1–2 ticks
- Less liquid: 3–5 ticks
- Futures: 1 tick
- Crypto: 2–5 ticks

## Step 3: Code Standards for Valid Backtests

Critical rules to prevent lookahead bias:
```pinescript
// WRONG — uses current bar data for entry on current bar:
if close > ema20
    strategy.entry("Long", strategy.long)

// CORRECT — use [1] to confirm on PREVIOUS bar:
if close[1] > ema20[1]
    strategy.entry("Long", strategy.long)
```

Always use:
- `barstate.isconfirmed` or `[1]` indexing for signals
- `strategy.exit()` with both `loss` and `profit` in ticks
- Position sizing formula in the `default_qty_value` or via `qty` parameter

## Step 4: Inject and Compile

```
pine_set_source ({complete strategy code})
pine_smart_compile
pine_get_errors
```

If errors: fix and recompile (up to 5 attempts). Do not proceed until 0 errors.

## Step 5: Open Strategy Tester

```
ui_open_panel ("strategy-tester")
```

Wait 3 seconds for results to load, then:

```
capture_screenshot (region: "strategy_tester")
```

## Step 6: Read Strategy Results

```
data_get_pine_tables (study_filter: "Strategy")
```

Key metrics to extract and interpret:

### Performance Metrics

| Metric | What it means | Minimum acceptable |
|--------|--------------|-------------------|
| **Net Profit %** | Total return over test period | Depends on period |
| **Profit Factor** | Gross profit / Gross loss | > 1.5 (> 2.0 = excellent) |
| **Max Drawdown** | Worst peak-to-trough loss | < 20% (< 10% = excellent) |
| **Win Rate** | % of winning trades | > 40% (depends on R/R) |
| **Avg Win / Avg Loss** | R/R realized | > 1.5:1 |
| **Total Trades** | Sample size | > 30 (> 100 = statistically valid) |
| **Sharpe Ratio** | Risk-adjusted return | > 1.0 (> 1.5 = good) |
| **Calmar Ratio** | Return / Max DD | > 1.0 |
| **Expectancy** | EV per trade $ | Must be positive |

### Red Flags (Strategy Likely Overfit or Broken)
- Win rate > 80% with low R/R → curve fitting
- Profit factor > 4.0 with < 30 trades → not enough data
- Max DD > 30% → too risky even if profitable
- Huge net profit from a few massive trades → not robust
- Sharp equity curve drop in recent period → regime change

## Step 7: Walk-Forward Validation

Check if the strategy holds in out-of-sample data:

```
// Split test: use first 70% as in-sample, last 30% as out-of-sample
// In TradingView: use date range filter in Strategy Tester

ui_evaluate ({code to set strategy tester date range})
capture_screenshot (region: "strategy_tester")
```

Compare in-sample vs out-of-sample:
- Profit factor drops < 50% → acceptable degradation
- Profit factor drops > 70% → likely overfit, do not trade

## Step 8: Optimization (if needed)

If initial results are weak, iterate on:
1. **Signal parameters**: Adjust indicator lengths (±20% from initial)
2. **Filter additions**: Add trend filter (price > 200 EMA) or volatility filter (ATR percentile)
3. **Exit adjustment**: Test fixed stop vs ATR-based vs trailing
4. **Timeframe**: Test one timeframe up and one down

**Avoid**: Optimizing too many parameters simultaneously (curve fitting).
**Rule**: Max 3 free parameters optimized. Each additional parameter needs 30+ more trades.

## Step 9: Final Report

```
=== STRATEGY BACKTEST REPORT ===
Strategy:   {name}
Symbol:     {symbol}
Timeframe:  {TF}
Period:     {start} to {end} ({N} bars)

SETTINGS
  Commission:    {%}
  Slippage:      {ticks}
  Position size: {% equity}
  Initial cap:   ${amount}

RESULTS
  Net Profit:    {$} ({%})
  Profit Factor: {N}
  Max Drawdown:  {$} ({%})
  Win Rate:      {%}
  Total Trades:  {N}
  Avg Win:       ${N}
  Avg Loss:      ${N}
  Expectancy:    ${N}/trade

RISK METRICS
  Sharpe Ratio:  {N}
  Calmar Ratio:  {N}
  Avg MAE:       {%}  (Maximum Adverse Excursion)
  Avg MFE:       {%}  (Maximum Favorable Excursion)

VERDICT
  {TRADE IT / PAPER TRADE FIRST / NEEDS IMPROVEMENT / REJECT}
  Rationale: {2-3 sentences}

NEXT STEPS
  {specific improvements to try or go-live checklist}
```

## Step 10: Save Strategy

```
pine_save
```

Save with a descriptive name including version and date: `StrategyName_v1_2024`.
