# OpenTrade Documentation

> The most powerful open-source TradingView AI agent. Powered by Claude.

---

## Getting Started

| Page | Description |
|------|-------------|
| [Installation](Installation) | Clone, configure, launch |
| [Connecting TradingView](Connecting-TradingView) | Chrome CDP setup on Mac, Windows, Linux |
| [Your First Analysis](First-Analysis) | Run your first chart analysis |
| [Configuration](Configuration) | Environment variables and settings |

## Skills Reference

| Skill | Description |
|-------|-------------|
| [Chart Analysis](Skill-Chart-Analysis) | Full chart reading — indicators, levels, bias |
| [Quantitative Analysis](Skill-Quant-Analysis) | Statistical edge, vol regime, z-score, factor scoring |
| [Hedge Fund Analysis](Skill-Hedge-Fund) | Multi-timeframe confluence, Kelly sizing, trade structure |
| [HFT & Microstructure](Skill-HFT-Microstructure) | Order flow, VWAP, volume profile, execution algos |
| [Portfolio Scanner](Skill-Portfolio-Scanner) | Multi-symbol scoring, relative strength ranking |
| [Macro Regime](Skill-Macro-Regime) | Cross-asset regime detection, sector rotation |
| [Strategy Backtesting](Skill-Strategy-Backtest) | Pine Script strategy loop, tester metrics |

## Pine Script

| Page | Description |
|------|-------------|
| [Pine Script Development](Pine-Development) | Full write → compile → fix → save workflow |
| [Template Library](Pine-Templates) | All 11 built-in templates with usage |
| [Static Analyzer](Pine-Static-Analyzer) | Offline error detection before TradingView |
| [v6 Standards](Pine-v6-Standards) | Required patterns, lookahead bias prevention |

## Tools Reference

| Page | Description |
|------|-------------|
| [All 50 Tools](Tools-Reference) | Complete tool reference with parameters |
| [Chart Tools](Tools-Chart) | Symbol, timeframe, indicator control |
| [Data Tools](Tools-Data) | Reading indicators, OHLCV, Pine drawings |
| [Pine Tools](Tools-Pine) | Editor injection, compilation, saving |
| [Replay Tools](Tools-Replay) | Historical replay and practice trading |

## Advanced

| Page | Description |
|------|-------------|
| [Quant Standards](Quant-Standards) | Kelly Criterion, vol regimes, z-scores, Kelly math |
| [Architecture](Architecture) | How OpenTrade works under the hood |
| [Running in the Cloud](Cloud-Deployment) | VPS + Xvfb setup, Cloudflare tunnels |
| [Contributing](Contributing) | How to add skills, tools, and templates |
| [Roadmap](Roadmap) | What's coming next |

---

## Quick Reference

```bash
node src/cli/index.js                          # interactive chat
node src/cli/index.js chat "analyze my chart"  # single command
node src/cli/index.js pine "write RSI indicator" # Pine Script
node src/cli/index.js server                   # browser UI :7842
node src/cli/index.js analyze file.pine        # static analysis
node src/cli/index.js health                   # connection check
```

---

*OpenTrade is open source under MIT license. Pull requests welcome.*
