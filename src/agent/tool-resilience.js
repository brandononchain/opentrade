/**
 * OpenTrade — Tool Error Resilience
 * 
 * Handles the "ui_open_panel: undefined" and "ui_click: undefined" failures
 * by implementing retry logic, fallback strategies, and graceful degradation.
 * 
 * TradingView UI tools depend on DOM state — panels must be visible,
 * buttons must exist. This module wraps tool calls with awareness of
 * these dependencies.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1_000,
  UI_SETTLE_DELAY_MS: 500,
};

// ─── Tool Dependency Map ──────────────────────────────────────────────────────

/**
 * Tools that depend on specific UI state being active.
 * When these fail, we know what prerequisite to try first.
 */
const TOOL_DEPENDENCIES = {
  // Strategy Tester requires the panel to be open
  data_get_strategy_results: {
    requires: 'strategy-tester-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'strategy-tester' } },
    fallback: { tool: 'ui_click', args: { text: 'Strategy Tester' } },
  },
  data_get_trades: {
    requires: 'strategy-tester-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'strategy-tester' } },
    fallback: { tool: 'ui_click', args: { text: 'Strategy Tester' } },
  },
  data_get_equity: {
    requires: 'strategy-tester-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'strategy-tester' } },
  },

  // Pine Editor tools require the editor panel
  pine_set_source: {
    requires: 'pine-editor-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'pine-editor' } },
  },
  pine_smart_compile: {
    requires: 'pine-editor-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'pine-editor' } },
  },
  pine_compile: {
    requires: 'pine-editor-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'pine-editor' } },
  },
  pine_get_errors: {
    requires: 'pine-editor-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'pine-editor' } },
  },
  pine_get_source: {
    requires: 'pine-editor-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'pine-editor' } },
  },
  pine_save: {
    requires: 'pine-editor-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'pine-editor' } },
  },
  pine_new: {
    requires: 'pine-editor-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'pine-editor' } },
  },

  // DOM/depth requires the panel
  depth_get: {
    requires: 'dom-panel',
    prerequisite: { tool: 'ui_open_panel', args: { panel: 'trading' } },
  },
};

// ─── Error Classification ─────────────────────────────────────────────────────

/**
 * Classify a tool error to determine the right recovery strategy.
 */
function classifyError(toolName, error) {
  const msg = typeof error === 'string' ? error : error?.message || String(error);
  const lower = msg.toLowerCase();

  // UI element not found / not visible
  if (
    lower.includes('undefined') ||
    lower.includes('not found') ||
    lower.includes('could not find') ||
    lower.includes('not visible') ||
    lower.includes('no element') ||
    lower.includes('could not open')
  ) {
    return {
      type: 'UI_NOT_READY',
      retryable: true,
      needsPrerequisite: true,
      message: `${toolName} failed because required UI element isn't visible`,
    };
  }

  // Connection issues
  if (
    lower.includes('cdp') ||
    lower.includes('connection') ||
    lower.includes('disconnected') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused')
  ) {
    return {
      type: 'CONNECTION_ERROR',
      retryable: true,
      needsPrerequisite: false,
      message: `${toolName} failed due to connection issue — TradingView may need restart`,
    };
  }

  // Pine Script specific errors (not retryable — need code fix)
  if (
    lower.includes('compilation') ||
    lower.includes('syntax error') ||
    lower.includes('undeclared')
  ) {
    return {
      type: 'PINE_ERROR',
      retryable: false,
      needsPrerequisite: false,
      message: `${toolName} failed with Pine Script error — needs code fix`,
    };
  }

  // Protected/encrypted indicator
  if (lower.includes('protected') || lower.includes('encrypted')) {
    return {
      type: 'PROTECTED_INDICATOR',
      retryable: false,
      needsPrerequisite: false,
      message: `${toolName} cannot read protected indicator — use data_get_study_values instead`,
    };
  }

  // Unknown error
  return {
    type: 'UNKNOWN',
    retryable: false,
    needsPrerequisite: false,
    message: `${toolName} failed: ${msg}`,
  };
}

// ─── Resilient Tool Caller ────────────────────────────────────────────────────

/**
 * Wrap a callTool function with retry logic and dependency resolution.
 * 
 * @param {Function} callTool - The original MCP callTool function
 * @returns {Function} Wrapped callTool with resilience
 */
function createResilientCaller(callTool) {
  // Track which prerequisites we've already tried this session
  const prerequisiteAttempts = new Set();

  return async function resilientCallTool(toolName, input) {
    let lastError;

    for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
      try {
        const result = await callTool(toolName, input);

        // Check for "success: false" in the result
        if (result && typeof result === 'object' && result.success === false) {
          const errorMsg = result.error || result.message || 'Tool returned success: false';
          const classification = classifyError(toolName, errorMsg);

          if (classification.retryable && attempt < RETRY_CONFIG.MAX_RETRIES) {
            // Try running prerequisite if available
            if (classification.needsPrerequisite) {
              await tryPrerequisite(toolName, callTool, prerequisiteAttempts);
            }
            await delay(RETRY_CONFIG.RETRY_DELAY_MS);
            continue;
          }

          // Return the error result — let the agent handle it
          return result;
        }

        // Check for undefined/null result (the exact bug in the screenshot)
        if (result === undefined || result === null) {
          const classification = classifyError(toolName, 'returned undefined');

          if (classification.retryable && attempt < RETRY_CONFIG.MAX_RETRIES) {
            if (classification.needsPrerequisite) {
              await tryPrerequisite(toolName, callTool, prerequisiteAttempts);
            }
            await delay(RETRY_CONFIG.RETRY_DELAY_MS);
            continue;
          }

          return {
            success: false,
            error: `${toolName} returned undefined — UI element may not be available. Try opening the required panel first.`,
            suggestion: getSuggestion(toolName),
          };
        }

        return result;
      } catch (err) {
        lastError = err;
        const classification = classifyError(toolName, err);

        if (classification.retryable && attempt < RETRY_CONFIG.MAX_RETRIES) {
          console.error(
            `[tool-resilience] ${toolName} attempt ${attempt + 1} failed (${classification.type}), retrying...`
          );

          if (classification.needsPrerequisite) {
            await tryPrerequisite(toolName, callTool, prerequisiteAttempts);
          }
          await delay(RETRY_CONFIG.RETRY_DELAY_MS);
          continue;
        }

        throw err;
      }
    }

    // All retries exhausted
    throw lastError || new Error(`${toolName} failed after ${RETRY_CONFIG.MAX_RETRIES + 1} attempts`);
  };
}

/**
 * Try to satisfy a tool's prerequisite (e.g., open a panel before reading from it).
 */
async function tryPrerequisite(toolName, callTool, attempts) {
  const dep = TOOL_DEPENDENCIES[toolName];
  if (!dep || attempts.has(dep.requires)) return;

  attempts.add(dep.requires);
  console.error(`[tool-resilience] Running prerequisite for ${toolName}: ${dep.prerequisite.tool}`);

  try {
    await callTool(dep.prerequisite.tool, dep.prerequisite.args);
    await delay(RETRY_CONFIG.UI_SETTLE_DELAY_MS);
  } catch (prereqErr) {
    console.error(`[tool-resilience] Prerequisite ${dep.prerequisite.tool} also failed: ${prereqErr.message}`);

    // Try fallback if available
    if (dep.fallback) {
      try {
        console.error(`[tool-resilience] Trying fallback: ${dep.fallback.tool}`);
        await callTool(dep.fallback.tool, dep.fallback.args);
        await delay(RETRY_CONFIG.UI_SETTLE_DELAY_MS);
      } catch {
        console.error(`[tool-resilience] Fallback also failed`);
      }
    }
  }
}

/**
 * Get a human-readable suggestion when a tool fails.
 */
function getSuggestion(toolName) {
  const dep = TOOL_DEPENDENCIES[toolName];
  if (dep) {
    return `Try running ${dep.prerequisite.tool}(${JSON.stringify(dep.prerequisite.args)}) first to open the required panel.`;
  }

  const suggestions = {
    ui_open_panel: 'Make sure TradingView is open in Chrome and the Pine Editor tab is visible.',
    ui_click: 'The button or element may not be visible. Try navigating to the correct view first.',
    data_get_indicator: 'This indicator may be protected/encrypted. Use data_get_study_values instead.',
  };

  return suggestions[toolName] || 'Check that TradingView is running and connected.';
}

/**
 * Simple delay helper.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  RETRY_CONFIG,
  TOOL_DEPENDENCIES,
  classifyError,
  createResilientCaller,
  getSuggestion,
};
