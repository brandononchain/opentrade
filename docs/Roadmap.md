# Roadmap

OpenTrade is actively developed. This page tracks what's planned, in progress, and completed.

> Want to contribute? See [Contributing](Contributing). PRs welcome on any of the items below.

---

## Recently Shipped ✅

- **7 professional skills** — Chart Analysis, Quant Analysis, Hedge Fund, HFT Microstructure, Portfolio Scanner, Macro Regime, Strategy Backtest
- **11 Pine Script v6 templates** — including institutional quant strategies (z-score MR, VWAP institutional, momentum factor, ORB, multi-factor dashboard)
- **9 new skills (v2)** — Chart Layout Pro, Institutional Drawing, Prediction Markets (Polymarket/Kalshi), On-Chain Analytics (DefiLlama/CoinGecko/CoinGlass/RedStone), Sentiment Feeds, Market Data Universal, Broker Integration, Liquidity Analysis, Financial Instruments
- **6 new Pine templates (v2)** — Liquidity Heatmap, Session Structure Map, Funding Rate Overlay, Multi-Asset Correlation, Institutional Order Flow, Macro Regime Dashboard
- **External data integration** — Polymarket, Kalshi, DefiLlama, CoinGecko, CoinGlass, RedStone, Fear & Greed Index, funding rates, social sentiment
- **Broker + execution knowledge** — IBKR, Alpaca, MetaQuotes MT4/MT5, webhook integration patterns, commission tables
- **Complete instrument coverage** — Equities, futures (ES/NQ/CL/GC/ZN), forex, options, crypto, fixed income, commodities with contract specs and factor knowledge
- **Self-contained architecture** — no external repos required, full CDP engine embedded
- **Static Pine analyzer** — offline error detection before TradingView
- **Browser UI** — WebSocket streaming with inline screenshots
- **Multi-tool fix** — correct Anthropic API message structure for parallel tool calls
- **Auto .env loading** — zero-dependency environment file loader
- **Pure ASCII banner** — renders correctly on all terminals including Windows

---

## In Progress 🔄

- **Improved OHLCV data access** — more reliable bar reading across all symbol types
- **Strategy Tester result parsing** — read all metrics directly from the tester panel
- **Better error recovery** — auto-reconnect when Chrome/TradingView restarts

---

## Planned Features

### High Priority

#### Options Flow Integration
Read implied volatility, put/call ratio, skew, and open interest from TradingView's options chain panel.
```
"What is the IV rank on NVDA?"
"Show me the put/call ratio and skew for SPY"
"Which strike has the most open interest?"
```

#### Alert → Webhook Automation
Connect Pine Script alerts to external webhooks for notification or execution.
```
"When my RSI crosses 70, fire a webhook to my Discord"
"Set up an alert that fires when price breaks above the OR high"
```

#### Pairs Trading Skill
Statistical arbitrage setup detection using co-integration, spread z-score, and half-life of mean reversion.
```
"Analyze the NVDA/AMD spread — is there a pairs trade?"
"What's the z-score on the XLK/SPY ratio?"
```

### Medium Priority

#### ~~Multi-Chart Layout Control~~ ✅ SHIPPED (chart-layout-pro skill)

#### ~~Footprint / Order Flow Imbalance~~ ✅ SHIPPED (institutional_order_flow template + liquidity-analysis skill)

#### Portfolio P&L Tracking
Track paper trades made through replay across sessions, calculate overall portfolio performance.
```
"Add this trade to my paper portfolio"
"What's my total P&L this week from replay practice?"
```

#### Cloud Deployment Automation
One-command Docker setup for running the full stack (Chrome + Xvfb + OpenTrade) on a cloud VM.
```bash
docker-compose up  # starts Chrome with Xvfb + OpenTrade server
```

### Lower Priority

#### Claude Code Integration
Package OpenTrade as an official Claude Code skill installable via `npx skillsadd`.
```bash
npx skillsadd brandononchain/opentrade
```

#### ~~Economic Calendar Integration~~ ✅ SHIPPED (market-data-universal + financial-instruments skills)

#### Insider Flow and Dark Pool Data
Integrate with public data sources for unusual options activity and dark pool prints.

#### Backtesting Report Export
Export strategy backtest results as a structured PDF report with equity curve, drawdown chart, and trade log.

#### Pine Script AI Debugger
When a strategy underperforms, automatically diagnose why — overfitting, regime mismatch, parameter sensitivity — and suggest fixes.

---

## Completed Backlog

| Feature | Shipped |
|---------|---------|
| Core CDP engine | v0.1 |
| 50 embedded tools | v0.2 |
| Browser UI | v0.3 |
| Quant/HFT/Hedge Fund skills | v0.4 |
| Multi-factor Pine templates | v0.4 |
| Static Pine analyzer | v0.2 |
| Multi-tool API fix | v0.3 |
| Pure ASCII terminal banner | v0.3 |
| Auto .env loading | v0.3 |
| Chart Layout Pro + Institutional Drawing skills | v0.5 |
| Prediction Markets (Polymarket/Kalshi) skill | v0.5 |
| On-Chain Analytics (DefiLlama/CoinGlass/RedStone) skill | v0.5 |
| Sentiment Feeds (F&G, funding, social) skill | v0.5 |
| Market Data Universal skill | v0.5 |
| Broker Integration (IBKR/Alpaca/MT5) skill | v0.5 |
| Liquidity Analysis skill | v0.5 |
| Financial Instruments knowledge base skill | v0.5 |
| 6 new Pine templates (liquidity, sessions, funding, correlation, order flow, macro) | v0.5 |

---

## Contributing to the Roadmap

If you want to implement one of these features or have a new idea:

1. Open an issue describing what you want to build
2. Reference the relevant skill file or tool it would extend
3. PRs are reviewed quickly — this is a fast-moving project

See [Contributing](Contributing) for technical guidelines.
