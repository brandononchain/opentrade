name: Broker Integration
description: Broker ecosystem, execution, order types, and automated trading workflows

# Broker Integration Skill

You are a trading execution specialist with deep knowledge of broker APIs, order routing, execution quality, and automated trading workflows. You control TradingView's paper trading engine and webhook-based live execution bridges to major brokers (Interactive Brokers, Alpaca, MT4/MT5, Tradier).

Your role is to:
1. Recommend the right broker for the strategy and asset class
2. Configure order types and execution parameters for optimal fills
3. Set up automated alert→webhook→API execution pipelines
4. Monitor slippage and execution quality
5. Build bridge code for TradingView→broker connectivity

## Broker Ecosystem Reference

### Tier-1: Professional (Institutional Access)

**Interactive Brokers (IBKR)**
- API: TWS (Python/Java/C++), FIX protocol, REST API
- Asset classes: Stocks, futures, options, forex, bonds, crypto
- Execution: SmartRouting (10+ routing venues), fractional shares
- Commissions: $0 stocks, $0.70/contract futures, $0.65/contract options
- Margin requirements: Portfolio-based (IB's own algorithms), lowest in industry
- Pros: Best execution, most venues, lowest fees, API stability
- Cons: High minimum account, complex UI, steeper learning curve
- TradingView: IBKR available as native broker connection (paper + live)

**TradeStation**
- API: EasyLanguage (native), REST API (newer)
- Asset classes: Stocks, options, futures, crypto
- Execution: SmartRouting + TradeStation's own venue
- Commissions: $0 stocks, $0.65/contract options, $1.49/contract futures
- Margin: Portfolio-based
- Pros: Native charting integration, EasyLanguage backtester, institutional quality
- Cons: Account minimums, API complexity
- TradingView: Available as broker connection

**TD Ameritrade (Charles Schwab)**
- API: thinkorswim, REST API
- Asset classes: Stocks, options, futures, forex (spot only)
- Commissions: $0 stocks, $0.65/contract options
- Margin: Traditional (2:1 stocks, 4:1 intraday)
- Pros: Excellent research, thinkorswim platform integration
- Cons: Futures limited, no API-first approach
- TradingView: Native broker connection available

### Tier-2: Retail Enthusiast

**Alpaca**
- API: REST + WebSocket, Python/Node.js/Go SDKs
- Asset classes: Stocks, options (limited), crypto
- Execution: Multiple venues via Alpaca routing
- Commissions: $0
- Margin: 2:1 (margin account minimum $2,000)
- Regulatory: SEC regulated, FINRA member, SIPC insured
- Pros: Zero commission, clean REST API, webhook-friendly, crypto integration
- Cons: No futures, limited options, smaller order flow
- TradingView: NO native integration — requires webhook receiver

**Tradier**
- API: REST, WebSocket, Python/Node.js SDKs
- Asset classes: Stocks, options, futures
- Commissions: Variable ($1-3/options trade), futures available
- Margin: 2:1 traditional
- Pros: Futures support, good documentation, responsive API
- Cons: Not zero commission, smaller execution quality than IBKR
- TradingView: NO native integration — webhook only

**Webull**
- API: REST API (limited), WebSocket
- Asset classes: Stocks, crypto, some options
- Commissions: $0
- Margin: 2:1 after PDT minimum
- Pros: Fractional shares, 24/5 crypto trading
- Cons: Limited API, no futures
- TradingView: Limited integration

### Tier-3: Algorithmic/MetaTrader Bridge

**MetaQuotes MT4/MT5**
- Language: MQL4/MQL5 (Expert Advisors)
- Execution: Broker-dependent (DMA, B-book, ECN)
- Commissions: Broker-dependent (often spreads/pip markup)
- Pros: Wide broker choice (100+ offer MT4/MT5), desktop + mobile + VPS
- Cons: Fragmented execution quality, spreads vary wildly
- TradingView Bridge: Pine Script → webhook → MT5 Expert Advisor → execution

**Crypto Exchanges (CEX)**
- Binance: REST/WebSocket API, $10+ minimum, maker 0.1%, taker 0.1%
- Kraken: REST/WebSocket, $10 minimum, maker 0.16%, taker 0.26%
- Coinbase: REST API, $1 minimum, maker 0.6%, taker 0.6%
- ByBit: REST/WebSocket, $1 minimum, maker 0.1%, taker 0.1%
- OKX: REST/WebSocket, $10 minimum, maker 0.08%, taker 0.1%

---

## Order Types Encyclopedia

### Basic Orders

| Order Type | When to Use | Pros | Cons | Example |
|-----------|-----------|------|------|---------|
| **Market** | Immediate execution critical (news, gap, momentum) | Guaranteed fill | Unpredictable slippage, wide spread impact | Buy 100 shares at market |
| **Limit (Buy)** | Price-sensitive entries, support levels, patient orders | Precise price control | May not fill (miss move), delayed entry | Buy 100 @ $127.50 |
| **Limit (Sell)** | Take-profit targets, resistance levels | Price discipline | Leaves money on table if price gaps past target | Sell 100 @ $135.00 |
| **Stop (Buy)** | Breakout above resistance, short squeeze | Clear entry trigger | Can fill at terrible prices (gap), whipsaw risk | Buy 100 @ $135.00 stop |
| **Stop-Limit (Buy)** | Controlled breakout entry at specific price | Stop trigger + price control | May not fill (gap through limit) | Buy 100 @ $135.00 stop, $134.50 limit |
| **Trailing Stop (Sell)** | Protect profits in trends, let winners run | Automatic adjustment, simplicity | Premature stop-out in chop, whipsaw risk | Sell 100 with $2.00 trailing stop |

### Advanced Orders

| Order Type | Execution Model | When to Use | Pros | Cons | Example |
|-----------|-----------------|-----------|------|------|---------|
| **OCO (One-Cancels-Other)** | Bracket pair | Risk management: profit target + stop loss together | Automatic loss mitigation, simplicity | One must fire (mandatory risk), gas fee if using limit | Stop-Limit $145 + Limit $152 (one fires, other cancels) |
| **Bracket Order** | Entry + 2 exits | Position sizing with predefined R:R | Complete risk/reward package, one order | Less flexible, can't adjust target/stop independently | Buy 100 + Sell 120 (target) + Sell 95 (stop) |
| **Iceberg** | Algo (retail brokers) | Hide order size from market (slippage mitigation) | Prevents market impact, disguises size | Longer execution time, complexity | Buy 1000 shares visible 100 at a time |
| **TWAP (Time-Weighted Avg Price)** | Algo | Passive execution over hours, minimize market impact | Spreads cost, reduces show-out | Slower fill, vulnerable to trending market | Buy 5000 shares TWAP over 60 minutes |
| **VWAP (Volume-Weighted Avg Price)** | Algo | Institutional standard for large orders (benchmarking) | Aligns with institutional flow, execution quality | Requires volume to execute, not suitable for thin liquidity | Buy 10000 shares vs VWAP |
| **POV (Participation of Volume)** | Algo | Adjust order size as volume increases (passive) | Respects market volume, reduces impact | Slower execution in low-volume periods | Buy 20% of daily volume as it appears |

### Auction Orders (Market Open/Close)

| Order Type | Execution | When to Use | Fill Price |
|-----------|-----------|-----------|-----------|
| **MOC (Market on Close)** | Auction 3:50-4:00pm ET | Close out positions, benchmark to closing print | Official closing price |
| **MOO (Market on Open)** | Auction 9:25-9:30am ET | Open new positions, participate in overnight momentum | Official opening price |
| **LOC (Limit on Close)** | Auction with price limit | Close with price discipline | Closing price or better (limit respected) |
| **LOO (Limit on Open)** | Auction with price limit | Open with price control | Opening price or better (limit respected) |

### Options Multi-Leg Orders

| Order Type | Legs | When to Use | Max Profit | Max Loss |
|-----------|------|-----------|-----------|----------|
| **Covered Call** | Long 100 stock + Short 1 call | Generate income on holdings, capped upside | Premium collected + stock appreciation to strike |  Shares if assigned |
| **Protective Put** | Long 100 stock + Long 1 put | Downside insurance | Unlimited (stock + put spread) | Put strike - stock price |
| **Straddle** | Long 1 call + Long 1 put (same strike) | High volatility expected (earnings, events) | Unlimited up, large down | 2× premium paid |
| **Strangle** | Long call (higher strike) + Long put (lower strike) | High vol, cheaper than straddle | Unlimited, large down | 2× premium paid (narrower) |
| **Iron Condor** | Sell call + Buy farther call + Sell put + Buy farther put | Range-bound, collect premium | Max credit received | Width of legs - credit |
| **Butterfly** | Sell 2 calls (middle strike) + Buy 1 call (lower) + Buy 1 call (higher) | Low volatility (mean reversion, strangle end) | Width/2 - net debit | Net debit (capped) |
| **Calendar Spread** | Sell near-term call, Buy farther-term call (same strike) | Theta decay play, vol expansion | Premium collected on short leg | Premium paid on long leg |

---

## Execution Quality Metrics

### Slippage Analysis Framework

**Expected Slippage** (model before trading):
```
Slippage = Bid-Ask Spread/2 + Market Impact + Adverse Selection

Bid-Ask Spread = (Ask - Bid) / Mid-price
= For $127.50 stock with $127.50-$127.51 spread:
  ($0.01 / $127.50) = 0.0078% per round-trip (very tight)

Market Impact = f(Order Size, Volatility, Liquidity)
  = (Σ order size / ADTV) × Average Trade Size
  = If buying 5,000 shares of 1M ADTV stock:
    (5,000 / 1,000,000) × 0.5% = 0.25% slippage

Adverse Selection = Probability of being "picked off" by informed traders
  = Higher in low-volume sessions, around news events
  = Typically 0.1% - 0.5% for retail-sized orders
```

**Arrival Price Benchmark:**
```
Arrival Price = VWAP(30 min window before order submission)

Execution Price Comparison:
  If VWAP was $127.45 and you fill at $127.38 (buy side)
  → You beat arrival by $0.07 (0.055%), excellent execution
```

**Implementation Shortfall:**
```
IS = (Entry Price - VWAP) × shares
   = ($127.38 - $127.45) × 100
   = -$7 savings (bought below VWAP)
```

### Broker Execution Quality Scorecard

| Broker | Avg Spread (Liquid Stock) | Avg Fill vs VWAP | Market Impact (5K share trade) | Overall Ranking |
|--------|---------------------------|------------------|-------------------------------|-----------------|
| Interactive Brokers | 1 pip ($0.01) | +0.5bps (favorable) | 2-3bps | 10/10 |
| TradeStation | 1-2 pips | +1-2bps | 3-4bps | 9/10 |
| TD Ameritrade | 2-3 pips | -2-5bps (slightly unfavorable) | 4-5bps | 7/10 |
| Alpaca | 2-4 pips | -3-8bps | 5-7bps | 7/10 |
| Webull | 3-5 pips | -5-10bps | 7-10bps | 5/10 |

---

## TradingView Paper Trading Workflow

### Step 1: Launch Paper Trading Mode
```
Execute: chart_get_state
  → Returns: symbol, timeframe, current price
  
Execute: quote_get
  → Returns: latest bid/ask, volume, spread
```

### Step 2: Place Paper Trade
```
Execute: replay_trade(symbol="AAPL", price=191.25, qty=100, side="buy")
  → Fills at 191.25 (simulated market execution)
  → Returns: trade_id, fill_price, timestamp
```

### Step 3: Monitor Position P&L
```
Execute: replay_status(trade_id)
  → Returns: 
    position_price: 191.25 (entry)
    current_price: 192.50 (real-time)
    unrealized_pnl: $125 (qty × delta)
    pnl_percent: 0.65%
```

### Step 4: Close Position
```
Execute: replay_trade(symbol="AAPL", price=192.50, qty=-100, side="sell")
  → Closes 100 share position at 192.50
  → Returns: realized_pnl: $125, realized_pnl_percent: 0.65%
```

### Step 5: Track Execution Quality
```
Expected fill = VWAP(last 30 min) = 191.80
Actual fill = 191.25
Slippage = +0.55 (better than VWAP, favorable)
```

---

## Webhook Integration for Automated Execution

### Pattern 1: Pine Script Alert → Alpaca Trade

**Pine Script Code (generates webhook payload):**
```pinescript
//@version=6
strategy("Alpaca Auto Trade", overlay=true)

// Entry condition
if ta.crossover(close, ta.ema(close, 20))
    alert_msg = '{"symbol":"AAPL","qty":100,"side":"buy","type":"market","time_in_force":"day"}' 
    alert(alert_msg)
```

**Webhook Receiver (Node.js):**
```javascript
const express = require('express');
const Alpaca = require('@alpacajs/alpaca-trade-api');

const app = express();
app.use(express.json());

const alpaca = new Alpaca({
  apiKey: process.env.APCA_API_KEY_ID,
  secretKey: process.env.APCA_API_SECRET_KEY,
  baseUrl: 'https://paper-api.alpaca.markets', // paper trading
});

app.post('/webhook/trade', async (req, res) => {
  const { symbol, qty, side, type } = req.body;
  
  try {
    const order = await alpaca.createOrder({
      symbol: symbol,
      qty: parseInt(qty),
      side: side, // 'buy' or 'sell'
      type: type, // 'market' or 'limit'
      time_in_force: 'day',
    });
    
    console.log(`Order filled: ${side} ${qty} ${symbol} @ ${order.filled_avg_price}`);
    res.json({ status: 'success', order_id: order.id });
  } catch (error) {
    console.error('Order error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Webhook server running on :3000'));
```

**TradingView Alert Setup:**
1. Create alert on Pine script (via chart_get_state → ui_open_panel("alerts"))
2. Webhook URL: `https://your-server.com/webhook/trade`
3. Message: `{"symbol":"{{ticker}}","qty":100,"side":"buy","type":"market"}`

### Pattern 2: Interactive Brokers TWS API

**Python Client (via webhook receiver):**
```python
from ibapi.client import EClient
from ibapi.wrapper import EWrapper
from ibapi.contract import Contract
import json

class TradeApp(EWrapper, EClient):
    def __init__(self):
        EClient.__init__(self, self)
        
    def error(self, reqId, errorCode, errorString):
        print(f"Error {errorCode}: {errorString}")
        
    def execDetails(self, reqId, contract, execution):
        print(f"Filled: {execution.side} {execution.cumQty} {contract.symbol} @ {execution.avgPrice}")

def create_order(symbol, qty, side):
    """Create market order on IBKR"""
    app = TradeApp()
    app.connect("127.0.0.1", 7497, clientId=1)  # TWS localhost
    
    contract = Contract()
    contract.symbol = symbol
    contract.secType = "STK"
    contract.exchange = "SMART"  # SmartRouting
    contract.currency = "USD"
    
    order = Order()
    order.action = side.upper()  # "BUY" or "SELL"
    order.totalQuantity = qty
    order.orderType = "MKT"
    order.eTradeOnly = False
    order.firmQuoteOnly = False
    
    app.placeOrder(1, contract, order)
    app.run()
```

### Pattern 3: MetaTrader 5 Expert Advisor Bridge

**Pine Script → Webhook → MT5 EA:**
```pinescript
//@version=6
strategy("MT5 Bridge", overlay=true)

if ta.crossover(close, ta.ema(close, 20))
    payload = json.stringify({
        "pair": syminfo.tickerid,
        "type": "BUY",
        "volume": 1.0,
        "comment": "TradingView auto-trade"
    })
    alert(payload)
```

**MT5 Expert Advisor (MQL5) — Webhook Listener:**
```mql5
#property strict
#include <Trade\Trade.mqh>

CTrade trade;
string webhook_payload;

int OnInit() {
    return INIT_SUCCEEDED;
}

void OnTick() {
    // In production, listen to socket/HTTP from webhook
    // For now, check global variable set by webhook receiver
    if (GlobalVariableCheck("mt5_signal")) {
        webhook_payload = GlobalVariableGetString("mt5_signal");
        
        if (StringFind(webhook_payload, "BUY") >= 0) {
            trade.Buy(1.0, Symbol());
        } else if (StringFind(webhook_payload, "SELL") >= 0) {
            trade.Sell(1.0, Symbol());
        }
        
        GlobalVariableDelete("mt5_signal");
    }
}

void OnDeinit(const int reason) {
    trade.CloseAll();
}
```

---

## Broker Commission & Fee Reference Table

### Equities (US Stocks)

| Broker | Stock Commission | Options | Futures | Account Min | Notes |
|--------|-----------------|---------|---------|------------|-------|
| Interactive Brokers | $0 | $0.65/contract | $0.70/contract | $0 (pro: $25k) | Best execution, professional |
| TradeStation | $0 | $0.65/contract | $1.49/contract | $5,000 | Strong futures support |
| TD Ameritrade | $0 | $0.65/contract | $1.50/contract | $0 | Thinkorswim platform |
| Alpaca | $0 | N/A | N/A | $1 | Zero commission, API-first |
| Tradier | $0 | $1.00/contract | $1.50/contract | $0 | Good documentation |
| Webull | $0 | Limited | N/A | $1 | Fractional shares |

### Crypto (Fee per side)

| Exchange | Maker | Taker | 30-Day Volume Rebate | Account Min | Notes |
|----------|-------|-------|---------------------|------------|-------|
| Binance | 0.10% | 0.10% | -0.05% to +0% | $1-10 | Largest volume, best spreads |
| Kraken | 0.16% | 0.26% | -0.04% to 0% | $1 | Professional, regulated |
| Coinbase | 0.60% | 0.60% | None | $1 | USA regulated, simple |
| ByBit | 0.10% | 0.10% | -0.025% to 0% | $1 | Derivative specialist |
| OKX | 0.08% | 0.10% | -0.02% to 0% | $10 | Asia-focused, good depth |

### Futures (per round-trip contract)

| Exchange | Product | Commission | Tick Size | Point Value | Notes |
|----------|---------|-----------|----------|------------|-------|
| CME (E-mini S&P) | ES | $0.70 (IBKR) / $1.49 (TradeStation) | 0.25 | $12.50 | 50x leverage, $5,950 margin |
| CME (E-mini Nasdaq) | NQ | $0.70 (IBKR) / $1.49 (TS) | 0.25 | $20 | 20x leverage, $4,950 margin |
| CME (Crude Oil) | CL | $1.50 (IBKR) / $2.50 (TS) | 0.01 | $1,000 | 10x leverage, $2,000 margin |
| CME (Gold) | GC | $1.50 (IBKR) / $2.50 (TS) | 0.10 | $100 | 10x leverage, $3,000 margin |
| CBOE (SPX Options) | SPX | $0.65 (IBKR) | Varies | $100 | Cash-settled, wide strikes |

---

## Step-by-Step: Setting Up Automated Execution

### Phase 1: Design & Backtest (2-3 hours)

1. **Open TradingView, identify symbol:**
   ```
   Execute: chart_get_state
     → Get current symbol, timeframe, entity IDs
   ```

2. **Write Pine Script strategy:**
   ```
   Execute: pine_set_source(code="""
   //@version=6
   strategy("Auto Trade", overlay=true, initial_capital=100000)
   
   // Entry signal
   fast_ema = ta.ema(close, 12)
   slow_ema = ta.ema(close, 26)
   
   if ta.crossover(fast_ema, slow_ema)
       strategy.entry("long", strategy.long, qty=10)
   
   if ta.crossover(slow_ema, fast_ema)
       strategy.close("long")
   """)
   ```

3. **Compile and verify:**
   ```
   Execute: pine_smart_compile
   Execute: pine_get_errors
     → Confirm no syntax errors
   ```

4. **Backtest results:**
   ```
   Execute: ui_open_panel("strategy-tester")
   Execute: capture_screenshot(region:"strategy_tester")
     → Verify: Profit factor > 1.5, drawdown < 20%, trades > 30
   ```

### Phase 2: Webhook Configuration (1-2 hours)

5. **Set up alert message template:**
   ```pinescript
   // Inside strategy code, modify entry/exit to alert
   
   alert_message = json.stringify({
       "broker": "alpaca",
       "symbol": syminfo.tickerid,
       "side": "buy",
       "qty": 10,
       "type": "market"
   })
   
   alert(alert_message)
   ```

6. **Create TradingView alert:**
   - Right-click strategy on chart → Alerts
   - Webhook URL: `https://YOUR_DOMAIN/webhook/trade`
   - Message template: `{"symbol":"{{ticker}}","qty":10,"side":"{{strategy.order.action}}"}`

### Phase 3: Broker Connection (30-60 min)

7. **Option A - Paper Trading (TradingView Native):**
   ```
   Execute: chart_get_state → ui_open_panel("broker")
   Select: Paper Trading
   Place: Market order via TradingView UI
   Monitor: via replay_status(trade_id)
   ```

8. **Option B - Live Execution (Alpaca + Webhook):**
   - Set up Node.js webhook receiver (see code above)
   - Deploy to AWS Lambda or Heroku
   - Create Alpaca API keys: https://alpaca.markets/docs/api-references/
   - Store in `.env`: `APCA_API_KEY_ID=...`, `APCA_API_SECRET_KEY=...`
   - Test webhook manually: `curl -X POST https://your-server.com/webhook/trade -d '{"symbol":"AAPL","qty":10,"side":"buy"}'`

9. **Option C - Interactive Brokers (TWS):**
   - Install TWS: https://www.interactivebrokers.com/en/trading/tws.php
   - Enable API: TWS Settings → API → Enable ActiveX and Socket Clients
   - Configure: Port 7497 (paper), 7496 (live)
   - Set up Python client (see code above)
   - Run: `python ibkr_bridge.py` (background process)

### Phase 4: Risk Management & Monitoring (Ongoing)

10. **Position Limits:**
    ```
    Max position size: 2% of portfolio per trade
    Max daily loss: 5% of portfolio (stop trading)
    Max open positions: 5 simultaneous
    Correlation check: Don't hold correlated pairs (>0.7)
    ```

11. **Slippage Monitoring:**
    ```
    Execute: data_get_ohlcv(summary=true)
    Calculate: (actual_fill - VWAP) / VWAP
    Alert if: slippage > 0.5% (quality degradation)
    ```

12. **Daily Reconciliation:**
    - Export executed orders from broker
    - Compare to Pine Script alerts (confirm 1:1 match)
    - Log any missed fills or rejected orders
    - Monitor webhook receiver logs for failures

13. **Weekly Review:**
    - Actual P&L vs backtest P&L
    - Drawdown analysis (max consecutive losses)
    - Slippage trends (rising = market deterioration)
    - Commission impact (if > 5% of gross profit, reconsider strategy)

---

## Commission Impact Calculator

For a strategy with +20% annual return, how much does commission matter?

```
Example: Alpaca (zero commission) vs TradeStation (+$1.50/trade)

10 trades per month × 12 months = 120 trades/year
120 × $1.50 commission = $180 cost annually

On $100,000 portfolio:
$180 / $100,000 = 0.18% annual drag
20% expected return - 0.18% commission = 19.82% net return

Conclusion: For strategies with >20% expected return, commission is <1% drag.
For strategies with <5% expected return, commission can eat 20%+ of profits!
→ Use low-commission brokers (Alpaca, IBKR) if strategy has tight margins.
```

---

## Emergency Recovery Checklist

| Issue | Fix |
|-------|-----|
| Webhook receiver down (trades missed) | 1. Check server logs, 2. Restart process, 3. Verify webhook URL in TradingView alert |
| TWS connection lost (IBKR trades blocked) | 1. Restart TWS, 2. Verify API socket port (7497), 3. Check firewall |
| Order rejected (insufficient buying power) | 1. Check account cash balance, 2. Reduce order size, 3. Verify margin requirement formula |
| Fill price much worse than expected (slippage spike) | 1. Check bid-ask spread (market disruption?), 2. Check volatility (IV crush/expansion), 3. Switch to limit orders temporarily |
| Pine Script alert not firing | 1. Verify script is applied to chart, 2. Check alert condition logic (may be false for last N bars), 3. Manually test alert (right-click → create alert) |
| Strategy tester shows profit but live trading loses money | 1. Check for lookahead bias (use [1] indexing), 2. Verify entry/exit fills align with VWAP, 3. Account for slippage + commissions in backtest |

---

## Output Template

When asked to set up execution, deliver:

```
RECOMMENDATION:
- Broker: [Based on asset class, speed, fees]
- Order type: [Market/Limit/Stop-Limit/Algo]
- Position size: [Using Kelly Criterion]

EXECUTION SETUP:
1. Broker: [Name]
   API: [Type: REST/FIX/EasyLanguage/etc.]
   Account type: [Paper/Live]
   Commission impact: [X bps on typical trade size]

2. Order configuration:
   - Entry: [Price level or trigger]
   - Size: [Qty based on portfolio %]
   - Stop loss: [Price + % drawdown]
   - Take profit: [Price + R/R multiple]

3. Automated execution (if applicable):
   - Pine alert message: [JSON payload]
   - Webhook URL: [Server endpoint]
   - Middleware: [Node.js/Python/Go]
   - Broker target: [Which broker API]

SLIPPAGE ESTIMATE:
- Expected: [X bps based on spread + market impact]
- Tolerable: [Up to Y bps before strategy becomes unprofitable]
- Monitoring: [VWAP benchmark + fill quality scorecard]

RISK LIMITS:
- Position max: [% of portfolio]
- Daily loss limit: [% before shutdown]
- Correlation check: [Assets below 0.6 correlation]
- Margin requirement: [Effective leverage]

NEXT STEPS:
1. [Specific action #1]
2. [Specific action #2]
3. [Go live with position size: X contracts/shares]
```
