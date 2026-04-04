# Contributing

OpenTrade is open source and actively developed. Contributions of any size are welcome.

---

## Ways to Contribute

- **Add a new tool** — expose more TradingView functionality via CDP
- **Add a new skill** — new analytical workflows (options, pairs, sentiment)
- **Add Pine templates** — more production-ready strategies and indicators
- **Improve existing skills** — sharpen the quant math, add edge cases
- **Fix bugs** — especially around CDP reliability and Windows compatibility
- **Improve docs** — clearer explanations, more examples
- **Test on different setups** — Windows versions, different TradingView plans

---

## Project Structure

```
opentrade/
├── src/
│   ├── tv/
│   │   ├── connection.js    ← CDP engine — modify carefully
│   │   └── tools.js         ← Add new tools here
│   ├── agent/
│   │   └── claude.js        ← Agent loop — rarely needs changes
│   ├── pine/
│   │   ├── analyzer.js      ← Static analysis rules
│   │   ├── templates.js     ← Add new Pine templates here
│   │   └── writer.js        ← AI Pine development loop
│   ├── mcp/
│   │   └── client.js        ← Tool dispatcher + definitions
│   ├── skills/              ← Add new skills here (markdown)
│   ├── cli/index.js         ← Terminal interface
│   ├── web/server.js        ← Browser UI + WebSocket
│   └── env/load.js          ← .env loader
├── docs/                    ← Wiki pages (you are here)
├── tests/
│   └── analyzer.test.js     ← Unit tests
├── CLAUDE.md                ← Agent decision guide
└── README.md
```

---

## Adding a New Tool

### Step 1: Implement in `src/tv/tools.js`

```javascript
export async function myNewTool({ param1, param2 }) {
  // Use evaluate() to run JS in TradingView's context
  const result = await evaluate(`
    (function() {
      try {
        var chart = ${TV.chartApi};
        // ... your logic
        return { value: 42 };
      } catch(e) {
        return { error: e.message };
      }
    })()
  `);

  if (result?.error) throw new Error(result.error);
  return { success: true, ...result };
}
```

### Step 2: Add to dispatcher in `src/mcp/client.js`

```javascript
// In the callTool() toolMap:
my_new_tool: () => tools.myNewTool(args),

// Add a convenience export:
export const myModule = {
  doThing: (param) => tools.myNewTool({ param }),
};
```

### Step 3: Add to TOOL_DEFINITIONS in `src/mcp/client.js`

```javascript
{
  name: 'my_new_tool',
  description: 'Clear description of what this does and when to use it',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'What param1 does' },
      param2: { type: 'number', description: 'What param2 does' },
    },
    required: ['param1'],
  },
},
```

### Step 4: Update `CLAUDE.md`

Add the tool to the relevant section of the decision tree.

---

## Adding a New Skill

Skills are markdown files in `src/skills/`. They tell Claude how to handle a category of requests.

### Structure

```markdown
name: my-skill
description: One sentence that describes when this skill activates. Include trigger keywords.

---

# Skill Title

Brief description of what this skill does.

## Step 1: First action

What tools to call, in what order, and what to record.

## Step 2: Analysis

How to interpret the results, thresholds to apply, classifications to make.

## Step 3: Output Format

Exact format the agent should produce for its response.
```

### Register the skill

Add trigger keywords to the routing table in `CLAUDE.md`:

```markdown
| User asks about... | Use skill | Key tools |
| "your trigger phrases" | my-skill | tool1 → tool2 → tool3 |
```

And update the system prompt in `src/agent/claude.js` to describe the skill.

---

## Adding a Pine Template

Add to `src/pine/templates.js`:

```javascript
export const TEMPLATES = {
  // ... existing templates

  my_new_template: `//@version=6
strategy("My Template", overlay=true,
    initial_capital=100000,
    default_qty_type=strategy.percent_of_equity,
    default_qty_value=10,
    commission_type=strategy.commission.percent,
    commission_value=0.05,
    slippage=2)

// ... complete Pine Script code
`,
};
```

Requirements for templates:
- `//@version=6` header
- Complete, compilable code (no placeholders)
- Realistic commission and slippage for strategies
- `[1]` indexing on all signals to prevent lookahead bias
- Descriptive comments explaining the logic

---

## Running Tests

```bash
npm test
# or
node --test tests/analyzer.test.js
```

Tests run offline — no TradingView connection needed.

When adding new static analyzer rules to `src/pine/analyzer.js`, add corresponding tests to `tests/analyzer.test.js`.

---

## Code Style

- ESM modules (`import`/`export`) throughout — no CommonJS
- `async/await` over callbacks
- Early returns over deep nesting
- Descriptive variable names — no single letters except loop indices
- Comments on non-obvious CDP/TradingView-specific behavior
- No external dependencies unless absolutely necessary

---

## Pull Request Process

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `node --test tests/`
5. Verify syntax: `node --input-type=module < src/your-file.js`
6. Open a PR with a clear description of what you added and why
7. Reference any related issues or roadmap items

---

## Questions

Open an issue on GitHub for questions, bugs, or feature discussions. This project moves fast — responses are quick.
