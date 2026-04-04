# Roadmap

OpenTrade is actively developed. This page tracks what's planned, in progress, and completed.

> Want to contribute? See [Contributing](Contributing). PRs welcome on any of the items below.

---

## Recently Shipped ✅

- **7 professional skills** — Chart Analysis, Quant Analysis, Hedge Fund, HFT Microstructure, Portfolio Scanner, Macro Regime, Strategy Backtest
- **11 Pine Script v6 templates** — including institutional quant strategies (z-score MR, VWAP institutional, momentum factor, ORB, multi-factor dashboard)
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

#### Multi-Chart Layout Control
Switch between and analyze multiple chart panes simultaneously.
```
"Open a 4-panel layout with SPY, QQQ, IWM, and VIX"
"Analyze all four panes and compare structures"
```

#### Footprint / Order Flow Imbalance
Read delta and volume imbalance data from footprint chart indicators.
```
"What's the cumulative delta on ES today?"
"Show me where the aggressive buying is happening"
```

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

#### Economic Calendar Integration
Pull earnings dates, Fed meetings, CPI releases and factor them into analysis.
```
"What economic events are this week that could affect my position?"
"When does NVDA report earnings?"
```

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

---

## Contributing to the Roadmap

If you want to implement one of these features or have a new idea:

1. Open an issue describing what you want to build
2. Reference the relevant skill file or tool it would extend
3. PRs are reviewed quickly — this is a fast-moving project

See [Contributing](Contributing) for technical guidelines.
