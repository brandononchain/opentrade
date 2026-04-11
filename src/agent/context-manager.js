/**
 * OpenTrade — Context Window Manager
 * 
 * Prevents the "prompt is too long: 234746 tokens > 200000 maximum" error
 * by actively managing conversation history size, truncating large tool results,
 * and pruning old messages when approaching the token limit.
 * 
 * Drop-in module — import and wrap your existing agentTurn() loop.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  // Anthropic API limits
  MAX_CONTEXT_TOKENS: 200_000,

  // Reserve tokens for system prompt + tools schema + current response
  // System prompt ~4K + tools schema ~8K + response buffer ~8K = ~20K reserved
  RESERVED_TOKENS: 25_000,

  // Maximum usable tokens for conversation history
  get MAX_HISTORY_TOKENS() {
    return this.MAX_CONTEXT_TOKENS - this.RESERVED_TOKENS;
  },

  // Warning threshold — start pruning when history exceeds this
  PRUNE_THRESHOLD: 150_000,

  // Per-message limits
  MAX_TOOL_RESULT_CHARS: 8_000,    // Truncate individual tool results beyond this
  MAX_PINE_SOURCE_CHARS: 4_000,    // Pine Script source code limit
  MAX_OHLCV_BARS: 100,             // Cap OHLCV bar count in results
  MAX_SCREENSHOT_CHARS: 500,       // Screenshots are just file paths

  // History management
  MIN_MESSAGES_TO_KEEP: 4,         // Always keep at least the last 2 exchanges
  MAX_TOOL_LOOPS: 15,              // Maximum tool-use loops per turn (prevents runaway)
};

// ─── Token Estimation ─────────────────────────────────────────────────────────

/**
 * Rough token count estimation.
 * ~4 chars per token for English text, ~3 for code/JSON.
 * This is intentionally conservative (overestimates) to prevent overflow.
 */
function estimateTokens(content) {
  if (!content) return 0;

  if (typeof content === 'string') {
    return Math.ceil(content.length / 3.5);
  }

  if (Array.isArray(content)) {
    return content.reduce((sum, block) => {
      if (block.type === 'text') return sum + estimateTokens(block.text);
      if (block.type === 'tool_use') return sum + estimateTokens(JSON.stringify(block.input)) + 50;
      if (block.type === 'tool_result') return sum + estimateTokens(block.content) + 20;
      if (block.type === 'image') return sum + 1000; // Images use ~1K tokens
      return sum + estimateTokens(JSON.stringify(block));
    }, 0);
  }

  return Math.ceil(JSON.stringify(content).length / 3.5);
}

/**
 * Estimate total tokens in a messages array.
 */
function estimateHistoryTokens(messages) {
  return messages.reduce((sum, msg) => {
    return sum + estimateTokens(msg.content) + 10; // +10 for role/metadata overhead
  }, 0);
}

// ─── Tool Result Truncation ───────────────────────────────────────────────────

/**
 * Known large-output tools and their truncation strategies.
 */
const TRUNCATION_RULES = {
  // Pine Script source can be 200KB+ — always truncate
  pine_get_source: (result) => {
    if (typeof result === 'string' && result.length > CONFIG.MAX_PINE_SOURCE_CHARS) {
      const lines = result.split('\n');
      const header = lines.slice(0, 20).join('\n');
      const footer = lines.slice(-10).join('\n');
      return `${header}\n\n... [${lines.length - 30} lines truncated — use pine_get_source to read full code] ...\n\n${footer}`;
    }
    return result;
  },

  // OHLCV data — cap bars and summarize
  data_get_ohlcv: (result) => {
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      if (parsed.bars && Array.isArray(parsed.bars) && parsed.bars.length > CONFIG.MAX_OHLCV_BARS) {
        const kept = parsed.bars.slice(-CONFIG.MAX_OHLCV_BARS);
        return JSON.stringify({
          ...parsed,
          bars: kept,
          _truncated: true,
          _original_count: parsed.bars.length,
          _kept_count: kept.length,
        });
      }
      return typeof result === 'string' ? result : JSON.stringify(parsed);
    } catch {
      return truncateString(result, CONFIG.MAX_TOOL_RESULT_CHARS);
    }
  },

  // Screenshots are just file paths — tiny
  capture_screenshot: (result) => {
    return truncateString(result, CONFIG.MAX_SCREENSHOT_CHARS);
  },

  // Strategy results can be verbose
  data_get_strategy_results: (result) => {
    return truncateString(result, CONFIG.MAX_TOOL_RESULT_CHARS);
  },

  // Trade lists
  data_get_trades: (result) => {
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      if (parsed.trades && Array.isArray(parsed.trades) && parsed.trades.length > 20) {
        return JSON.stringify({
          ...parsed,
          trades: parsed.trades.slice(-20),
          _truncated: true,
          _original_count: parsed.trades.length,
        });
      }
      return typeof result === 'string' ? result : JSON.stringify(parsed);
    } catch {
      return truncateString(result, CONFIG.MAX_TOOL_RESULT_CHARS);
    }
  },

  // Equity curve data
  data_get_equity: (result) => {
    return truncateString(result, CONFIG.MAX_TOOL_RESULT_CHARS);
  },

  // Pine Script console output
  pine_get_console: (result) => {
    return truncateString(result, 2_000);
  },

  // Batch results can be huge
  batch_run: (result) => {
    return truncateString(result, CONFIG.MAX_TOOL_RESULT_CHARS * 2); // Allow more for multi-symbol
  },
};

/**
 * Truncate a string with a marker showing what was cut.
 */
function truncateString(str, maxLen) {
  if (typeof str !== 'string') str = JSON.stringify(str);
  if (!str || str.length <= maxLen) return str;

  const halfLen = Math.floor((maxLen - 100) / 2);
  return (
    str.slice(0, halfLen) +
    `\n\n... [TRUNCATED: ${str.length - maxLen} chars removed to fit context window] ...\n\n` +
    str.slice(-halfLen)
  );
}

/**
 * Apply truncation rules to a tool result before adding to history.
 */
function truncateToolResult(toolName, resultStr) {
  // Apply tool-specific truncation if available
  const rule = TRUNCATION_RULES[toolName];
  if (rule) {
    const truncated = rule(resultStr);
    return typeof truncated === 'string' ? truncated : JSON.stringify(truncated);
  }

  // Default: cap at MAX_TOOL_RESULT_CHARS
  return truncateString(resultStr, CONFIG.MAX_TOOL_RESULT_CHARS);
}

// ─── History Pruning ──────────────────────────────────────────────────────────

/**
 * Prune conversation history to fit within token limits.
 * Strategy: Remove oldest message pairs (user + assistant) first,
 * but always keep the system context and most recent exchanges.
 */
function pruneHistory(messages) {
  let tokens = estimateHistoryTokens(messages);

  if (tokens <= CONFIG.PRUNE_THRESHOLD) {
    return messages; // No pruning needed
  }

  console.error(`[context-manager] History at ~${tokens} tokens, pruning...`);
  const pruned = [...messages];

  // Remove messages from the front (oldest first)
  // Keep at least MIN_MESSAGES_TO_KEEP from the end
  while (
    pruned.length > CONFIG.MIN_MESSAGES_TO_KEEP &&
    estimateHistoryTokens(pruned) > CONFIG.PRUNE_THRESHOLD
  ) {
    const removed = pruned.shift();
    const removedTokens = estimateTokens(removed.content);
    console.error(
      `[context-manager] Pruned ${removed.role} message (~${removedTokens} tokens)`
    );
  }

  // If still too large after removing old messages, truncate tool results in remaining
  if (estimateHistoryTokens(pruned) > CONFIG.PRUNE_THRESHOLD) {
    for (const msg of pruned) {
      if (msg.role === 'user' && Array.isArray(msg.content)) {
        msg.content = msg.content.map((block) => {
          if (block.type === 'tool_result' && typeof block.content === 'string') {
            return {
              ...block,
              content: truncateString(block.content, 2_000),
            };
          }
          return block;
        });
      }
    }
  }

  const finalTokens = estimateHistoryTokens(pruned);
  console.error(
    `[context-manager] Pruned from ${messages.length} to ${pruned.length} messages (~${tokens} → ~${finalTokens} tokens)`
  );

  return pruned;
}

// ─── Safe Tool Result Handling ────────────────────────────────────────────────

/**
 * Safely stringify a tool result, applying truncation.
 */
function safeToolResultContent(toolName, result) {
  let resultStr;
  try {
    resultStr = typeof result === 'string' ? result : JSON.stringify(result);
  } catch {
    resultStr = String(result);
  }
  return truncateToolResult(toolName, resultStr);
}

// ─── Input Sanitization ───────────────────────────────────────────────────────

/**
 * Sanitize tool inputs before calling — prevent sending huge payloads.
 * Enforces the context management rules from CLAUDE.md.
 */
function sanitizeToolInput(toolName, input) {
  const sanitized = { ...input };

  switch (toolName) {
    case 'data_get_ohlcv':
      // Force summary mode unless explicitly requesting bars
      if (sanitized.count && sanitized.count > 200) {
        console.error(
          `[context-manager] Capping OHLCV count from ${sanitized.count} to 200`
        );
        sanitized.count = 200;
      }
      break;

    case 'pine_get_source':
      // Warn — this tool can return 200KB+
      console.error(
        '[context-manager] WARNING: pine_get_source can return 200KB+. Consider using pine_get_errors or pine_get_console instead.'
      );
      break;

    case 'data_get_pine_labels':
      // Cap labels
      if (!sanitized.max_labels || sanitized.max_labels > 50) {
        sanitized.max_labels = 50;
      }
      break;

    case 'data_get_pine_lines':
    case 'data_get_pine_tables':
    case 'data_get_pine_boxes':
      // Encourage study_filter
      if (!sanitized.study_filter) {
        console.error(
          `[context-manager] TIP: Use study_filter on ${toolName} to reduce payload size`
        );
      }
      break;

    case 'batch_run':
      // Cap batch size
      if (sanitized.symbols && sanitized.symbols.length > 10) {
        console.error(
          `[context-manager] Capping batch_run symbols from ${sanitized.symbols.length} to 10`
        );
        sanitized.symbols = sanitized.symbols.slice(0, 10);
      }
      break;
  }

  return sanitized;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  CONFIG,
  estimateTokens,
  estimateHistoryTokens,
  truncateToolResult,
  truncateString,
  pruneHistory,
  safeToolResultContent,
  sanitizeToolInput,
};
