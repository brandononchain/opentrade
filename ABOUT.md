# About OpenTrade

## What It Is

OpenTrade is an autonomous AI trading agent that connects frontier language models directly to live TradingView charts. It doesn't screenshot your chart and guess — it reads every indicator value, every drawn line, every data point through Chrome DevTools Protocol, then acts on that data with 50 precision tools.

It is the first open-source project to offer **provider-agnostic LLM routing** for trading — the same agent, the same 50 tools, the same 7 analytical skills — powered by whichever model you choose.

## The Problem

Traders spend hours doing repetitive analytical work: reading indicators across multiple timeframes, calculating position sizes, writing and debugging Pine Script, scanning watchlists for setups. Existing "AI trading tools" are either:

- **Screenshot analyzers** — feed a chart image to GPT and get a vague paragraph back
- **Chatbot wrappers** — natural language over a limited API with no direct chart control
- **Closed-source platforms** — expensive, opaque, locked to one provider

None of them can read your actual indicator values, write compilable Pine Script, execute multi-step quantitative workflows, or let you choose your AI model.

## The Solution

OpenTrade connects any frontier LLM to your TradingView session through a tool-use agent loop:

1. You speak naturally: *"Run quant analysis on this chart"*
2. The agent selects the right skill and orchestrates tool calls
3. Tools read live data directly from TradingView via CDP
4. The LLM processes the data and produces institutional-grade output
5. Results include specific numbers, levels, and actionable trade setups

## Supported Providers

| Provider | Models | Best For |
|----------|--------|----------|
| **Anthropic** | Claude Opus 4, Sonnet 4, Haiku 4 | Best tool-calling reliability |
| **OpenAI** | GPT-4.1, o3, o4-mini | Strongest function calling ecosystem |
| **Google** | Gemini 2.5 Pro, 2.5 Flash | Multimodal chart vision, large context |
| **Alibaba** | Qwen-Max, Plus, Turbo | Strong reasoning at low cost, self-hostable |
| **DeepSeek** | V3, R1 Reasoner | Extreme value — 10-20x cheaper than frontier |
| **MiniMax** | M1 | Best intelligence-per-dollar ratio |

Switch models by changing one line in `.env`. The entire tool interface stays the same.

## Technical Design

**Provider abstraction layer** — A unified interface wraps each SDK (Anthropic, OpenAI, Google GenAI). All providers emit the same response shape: `{ content, stop_reason, usage }`. The agent loop doesn't know or care which LLM is responding.

**Anthropic-native message format** — Internally, messages use Anthropic's format (tool_use/tool_result blocks). Each provider translates on the fly — OpenAI-compatible providers convert to function calling format, Google converts to functionCall/functionResponse parts.

**Model registry** — `src/agent/models.js` defines all 15 models with metadata: context window, max output, pricing, strengths. The factory in `src/agent/providers/index.js` caches and returns the right provider instance.

**50 TradingView tools** — Every tool is a direct CDP (Chrome DevTools Protocol) call into the TradingView tab. No API, no scraping, no screenshots-as-input. The agent reads actual DOM state, Monaco editor contents, chart entity data, and study output values.

## Who Built This

OpenTrade is built by [@brandononchain](https://github.com/brandononchain) — an independent project for the trading and open-source communities.

## License

MIT — do whatever you want with it. Build something great.
