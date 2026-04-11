/**
 * Pine Script v6 Linter Engine
 * Comprehensive static analysis based on awesome-pinescript style guides,
 * anti-repainting rules, performance analysis, and security checks.
 *
 * Categories:
 *   1. Repainting Detection — catches lookahead, request.security gaps, real-time leaks
 *   2. Lookahead Bias — [0] index on signals, calc_on_every_tick traps
 *   3. Performance — excessive bar lookback, nested loops, unnecessary redraws
 *   4. Style Guide — naming conventions, indentation, declaration order
 *   5. Security — input injection, external data trust, webhook secrets
 *   6. Strategy Quality — missing stops, unrealistic fills, no commission
 *   7. Best Practices — v6 idioms, deprecated patterns, missing guards
 */

// ═══════════════════════════════════════════════════════════════════════
// RULE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

const SEVERITY = { ERROR: 'error', WARNING: 'warning', INFO: 'info', HINT: 'hint' };

const RULES = {

  // ── Repainting Detection ──

  'repaint/security-no-lookahead': {
    id: 'repaint/security-no-lookahead',
    severity: SEVERITY.ERROR,
    category: 'repainting',
    message: 'request.security() without lookahead=barmerge.lookahead_off may repaint',
    check(line, i, ctx) {
      if (/request\.security\s*\(/.test(line) &&
          !line.includes('lookahead') &&
          !ctx.lines.slice(i, i + 3).join(' ').includes('lookahead')) {
        return true;
      }
    },
  },

  'repaint/security-lookahead-on': {
    id: 'repaint/security-lookahead-on',
    severity: SEVERITY.ERROR,
    category: 'repainting',
    message: 'barmerge.lookahead_on causes repainting — use lookahead_off with [1] offset instead',
    check(line) {
      return /lookahead_on/.test(line);
    },
  },

  'repaint/realtime-close': {
    id: 'repaint/realtime-close',
    severity: SEVERITY.WARNING,
    category: 'repainting',
    message: 'Using close without [1] offset in conditions may repaint on real-time bars',
    check(line, i, ctx) {
      // Only flag if line is a condition/signal assignment using close without offset
      if (/(?:if|:=|=)\s*.*\bclose\b/.test(line) &&
          !/close\[\d+\]/.test(line) &&
          !/(?:plot|bgcolor|barcolor|fill|label|line|box|table)/.test(line) &&
          !/(src|source|input)/.test(line)) {
        // Check if it's used in entry logic
        if (/(?:strategy\.|signal|entry|condition|trigger|cross)/.test(line) ||
            ctx.isStrategy) {
          return true;
        }
      }
    },
  },

  'repaint/calc-on-every-tick': {
    id: 'repaint/calc-on-every-tick',
    severity: SEVERITY.ERROR,
    category: 'repainting',
    message: 'calc_on_every_tick=true causes strategy to execute on every tick — set to false',
    check(line) {
      return /calc_on_every_tick\s*=\s*true/.test(line);
    },
  },

  'repaint/process-orders-on-close': {
    id: 'repaint/process-orders-on-close',
    severity: SEVERITY.WARNING,
    category: 'repainting',
    message: 'process_orders_on_close=true fills at close price — gives unrealistic fills',
    check(line) {
      return /process_orders_on_close\s*=\s*true/.test(line);
    },
  },

  'repaint/barstate-entry': {
    id: 'repaint/barstate-entry',
    severity: SEVERITY.ERROR,
    category: 'repainting',
    message: 'Using barstate.isconfirmed/isrealtime in entry logic causes repainting',
    check(line, i, ctx) {
      if (/barstate\.is(?:confirmed|realtime|new)/.test(line)) {
        // Check surrounding context for entry logic
        const nearby = ctx.lines.slice(Math.max(0, i - 2), i + 3).join(' ');
        if (/strategy\.entry|strategy\.order/.test(nearby)) {
          return true;
        }
      }
    },
  },

  'repaint/timenow': {
    id: 'repaint/timenow',
    severity: SEVERITY.WARNING,
    category: 'repainting',
    message: 'timenow changes on every tick — results will differ on historical vs live bars',
    check(line) {
      return /\btimenow\b/.test(line);
    },
  },

  // ── Lookahead Bias ──

  'lookahead/signal-no-offset': {
    id: 'lookahead/signal-no-offset',
    severity: SEVERITY.WARNING,
    category: 'lookahead',
    message: 'Signal condition uses [0] (current bar) — consider [1] to avoid lookahead bias in backtests',
    check(line, i, ctx) {
      if (!ctx.isStrategy) return false;
      // Match: if condition → strategy.entry (without [1] on indicators)
      if (/(?:longEntry|shortEntry|longCondition|shortCondition|buySignal|sellSignal)\s*=/.test(line)) {
        const rhs = line.split('=').slice(1).join('=');
        // Check if any ta.* or indicator reference lacks [1]
        if (/ta\.\w+\(/.test(rhs) && !/\[\d+\]/.test(rhs)) {
          return true;
        }
      }
    },
  },

  'lookahead/future-ref': {
    id: 'lookahead/future-ref',
    severity: SEVERITY.ERROR,
    category: 'lookahead',
    message: 'Negative bar offset (future reference) detected — this creates lookahead bias',
    check(line) {
      return /\[-\d+\]/.test(line) && !/\/\//.test(line.split(/\[-/)[0]);
    },
  },

  // ── Performance ──

  'perf/excessive-lookback': {
    id: 'perf/excessive-lookback',
    severity: SEVERITY.WARNING,
    category: 'performance',
    message: 'Lookback > 500 bars may cause slow calculation and max_bars_back issues',
    check(line) {
      const m = line.match(/(?:length|lookback|period|len)\s*=\s*(?:input\.\w+\()?\s*(\d+)/);
      if (m && parseInt(m[1]) > 500) return true;
    },
  },

  'perf/nested-for-loop': {
    id: 'perf/nested-for-loop',
    severity: SEVERITY.WARNING,
    category: 'performance',
    message: 'Nested for loops can cause O(n²) performance — consider array methods or ta.* builtins',
    check(line, i, ctx) {
      if (/^\s*for\s+/.test(line)) {
        // Check if we're already inside a for loop
        let depth = 0;
        for (let j = Math.max(0, i - 50); j < i; j++) {
          if (/^\s*for\s+/.test(ctx.lines[j])) depth++;
          // Rough heuristic: check indentation
        }
        const indent = line.match(/^(\s*)/)[1].length;
        if (indent >= 8) return true; // Likely nested
      }
    },
  },

  'perf/max-boxes-lines': {
    id: 'perf/max-boxes-lines',
    severity: SEVERITY.INFO,
    category: 'performance',
    message: 'Creating drawing objects in a loop without max_*_count limits may hit Pine limits',
    check(line, i, ctx) {
      if (/(?:box|line|label|polyline)\.new\(/.test(line)) {
        // Check if inside a for loop
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (/^\s*for\s+/.test(ctx.lines[j])) {
            // Check if indicator has max limits
            if (!ctx.source.includes('max_boxes_count') &&
                !ctx.source.includes('max_lines_count') &&
                !ctx.source.includes('max_labels_count')) {
              return true;
            }
          }
        }
      }
    },
  },

  'perf/request-security-loop': {
    id: 'perf/request-security-loop',
    severity: SEVERITY.ERROR,
    category: 'performance',
    message: 'request.security() inside a loop is extremely expensive — extract outside the loop',
    check(line, i, ctx) {
      if (/request\.security\(/.test(line)) {
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (/^\s*for\s+/.test(ctx.lines[j])) return true;
        }
      }
    },
  },

  // ── Style Guide ──

  'style/tab-indent': {
    id: 'style/tab-indent',
    severity: SEVERITY.WARNING,
    category: 'style',
    message: 'Use 4 spaces for indentation — tabs cause Pine compilation errors',
    check(line) {
      return /\t/.test(line);
    },
  },

  'style/trailing-whitespace': {
    id: 'style/trailing-whitespace',
    severity: SEVERITY.HINT,
    category: 'style',
    message: 'Trailing whitespace',
    check(line) {
      return /\S\s+$/.test(line);
    },
  },

  'style/line-length': {
    id: 'style/line-length',
    severity: SEVERITY.HINT,
    category: 'style',
    message: 'Line exceeds 120 characters — consider breaking for readability',
    check(line) {
      return line.length > 120;
    },
  },

  'style/input-no-group': {
    id: 'style/input-no-group',
    severity: SEVERITY.INFO,
    category: 'style',
    message: 'input.*() missing group= parameter — group inputs for better UX in settings panel',
    check(line) {
      return /input\.\w+\(/.test(line) && !line.includes('group=') && !line.includes('group =');
    },
  },

  'style/magic-number': {
    id: 'style/magic-number',
    severity: SEVERITY.INFO,
    category: 'style',
    message: 'Magic number in calculation — consider using input.*() or a named constant',
    check(line) {
      // Skip comments, version, inputs, plots
      if (/^\s*\/\//.test(line)) return false;
      if (/input\.|plot|hline|version|color\.|size\.|location\./.test(line)) return false;
      // Flag standalone numbers in calculations
      if (/(?:ta\.\w+\([^)]*,\s*)(\d{2,})/.test(line)) {
        const m = line.match(/ta\.\w+\([^)]*,\s*(\d{2,})/);
        if (m && !line.includes('input.')) return true;
      }
    },
  },

  'style/declaration-order': {
    id: 'style/declaration-order',
    severity: SEVERITY.HINT,
    category: 'style',
    message: 'Recommended order: //@version → declaration → imports → inputs → calculations → signals → execution → plots',
    check(line, i, ctx) {
      // Only check if inputs appear after calculations
      if (/input\.\w+\(/.test(line) && i > 10) {
        for (let j = 0; j < i; j++) {
          if (/ta\.\w+\(/.test(ctx.lines[j])) return true;
        }
      }
    },
  },

  // ── Security ──

  'security/hardcoded-secret': {
    id: 'security/hardcoded-secret',
    severity: SEVERITY.ERROR,
    category: 'security',
    message: 'Possible hardcoded secret/API key — use input.string with tooltip instead',
    check(line) {
      return /(?:api_?key|secret|password|token)\s*=\s*["'][^"']{8,}["']/.test(line.toLowerCase());
    },
  },

  'security/webhook-url-exposed': {
    id: 'security/webhook-url-exposed',
    severity: SEVERITY.WARNING,
    category: 'security',
    message: 'Webhook URL hardcoded — consider using input.string() for flexibility',
    check(line) {
      return /https?:\/\/[^\s"']+(?:webhook|hook|api|notify)/.test(line.toLowerCase());
    },
  },

  // ── Strategy Quality ──

  'strategy/no-stop-loss': {
    id: 'strategy/no-stop-loss',
    severity: SEVERITY.WARNING,
    category: 'strategy',
    message: 'Strategy has entries but no stop loss — add strategy.exit() with stop= parameter',
    check(line, i, ctx) {
      // Only check once at end
      if (i !== ctx.lines.length - 1) return false;
      if (!ctx.isStrategy) return false;
      if (ctx.source.includes('strategy.entry') &&
          !ctx.source.includes('stop=') &&
          !ctx.source.includes('strategy.exit') &&
          !ctx.source.includes('strategy.close')) {
        return true;
      }
    },
  },

  'strategy/no-commission': {
    id: 'strategy/no-commission',
    severity: SEVERITY.WARNING,
    category: 'strategy',
    message: 'Strategy missing commission settings — backtest results will be unrealistically optimistic',
    check(line, i, ctx) {
      if (i !== ctx.lines.length - 1) return false;
      if (!ctx.isStrategy) return false;
      return !ctx.source.includes('commission_type') && !ctx.source.includes('commission_value');
    },
  },

  'strategy/no-slippage': {
    id: 'strategy/no-slippage',
    severity: SEVERITY.INFO,
    category: 'strategy',
    message: 'Strategy missing slippage parameter — add slippage=1 or higher for realistic backtest',
    check(line, i, ctx) {
      if (i !== ctx.lines.length - 1) return false;
      if (!ctx.isStrategy) return false;
      return !ctx.source.includes('slippage');
    },
  },

  'strategy/no-initial-capital': {
    id: 'strategy/no-initial-capital',
    severity: SEVERITY.INFO,
    category: 'strategy',
    message: 'Strategy uses default initial_capital — set explicitly for reproducible results',
    check(line, i, ctx) {
      if (i !== ctx.lines.length - 1) return false;
      if (!ctx.isStrategy) return false;
      return !ctx.source.includes('initial_capital');
    },
  },

  'strategy/pyramiding-unset': {
    id: 'strategy/pyramiding-unset',
    severity: SEVERITY.INFO,
    category: 'strategy',
    message: 'Strategy defaults to pyramiding=0 (no adding to positions) — set explicitly if intended',
    check(line, i, ctx) {
      if (i !== ctx.lines.length - 1) return false;
      if (!ctx.isStrategy) return false;
      if (ctx.source.includes('strategy.entry') && !ctx.source.includes('pyramiding')) {
        return true;
      }
    },
  },

  // ── Best Practices ──

  'best/study-deprecated': {
    id: 'best/study-deprecated',
    severity: SEVERITY.ERROR,
    category: 'best-practice',
    message: 'study() is deprecated in v6 — use indicator()',
    check(line) {
      return /\bstudy\s*\(/.test(line);
    },
  },

  'best/security-deprecated': {
    id: 'best/security-deprecated',
    severity: SEVERITY.WARNING,
    category: 'best-practice',
    message: 'security() is deprecated — use request.security()',
    check(line) {
      return /\bsecurity\s*\(/.test(line) && !line.includes('request.security');
    },
  },

  'best/input-deprecated': {
    id: 'best/input-deprecated',
    severity: SEVERITY.WARNING,
    category: 'best-practice',
    message: 'input() is deprecated — use input.int(), input.float(), input.string(), etc.',
    check(line) {
      return /\binput\s*\(/.test(line) && !/input\.\w+/.test(line);
    },
  },

  'best/na-comparison': {
    id: 'best/na-comparison',
    severity: SEVERITY.ERROR,
    category: 'best-practice',
    message: 'Cannot compare with == na or != na — use na() function instead',
    check(line) {
      return /[=!]=\s*na\b/.test(line) || /\bna\s*[=!]=/.test(line);
    },
  },

  'best/missing-na-guard': {
    id: 'best/missing-na-guard',
    severity: SEVERITY.WARNING,
    category: 'best-practice',
    message: 'request.security() result used without na() guard — may produce NaN on some bars',
    check(line, i, ctx) {
      if (/=\s*request\.security\(/.test(line)) {
        const varName = line.match(/(\w+)\s*=/)?.[1];
        if (varName) {
          // Check if nz() or na() is used with this variable in next 10 lines
          const following = ctx.lines.slice(i + 1, i + 15).join('\n');
          if (!following.includes(`na(${varName})`) &&
              !following.includes(`nz(${varName})`)) {
            return true;
          }
        }
      }
    },
  },

  'best/no-version': {
    id: 'best/no-version',
    severity: SEVERITY.ERROR,
    category: 'best-practice',
    message: 'Missing //@version declaration — add //@version=6 on line 1',
    check(line, i, ctx) {
      if (i === 0 && !ctx.source.includes('//@version')) return true;
    },
  },

  'best/var-in-loop': {
    id: 'best/var-in-loop',
    severity: SEVERITY.WARNING,
    category: 'best-practice',
    message: 'var declaration inside a loop has no effect — var only persists across bars, not loop iterations',
    check(line, i, ctx) {
      if (/\bvar\s+/.test(line)) {
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (/^\s*for\s+/.test(ctx.lines[j])) return true;
        }
      }
    },
  },

  'best/plot-in-condition': {
    id: 'best/plot-in-condition',
    severity: SEVERITY.ERROR,
    category: 'best-practice',
    message: 'plot()/hline() cannot be inside if/for blocks — Pine requires them at global scope',
    check(line) {
      const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
      if (indent >= 4 && /\b(?:plot|hline|fill|bgcolor|barcolor)\s*\(/.test(line)) {
        return true;
      }
    },
  },

  'best/max-bars-back-needed': {
    id: 'best/max-bars-back-needed',
    severity: SEVERITY.INFO,
    category: 'best-practice',
    message: 'Large offset detected — may need max_bars_back() to avoid runtime errors',
    check(line) {
      const m = line.match(/\[(\d+)\]/);
      if (m && parseInt(m[1]) > 200) return true;
    },
  },
};


// ═══════════════════════════════════════════════════════════════════════
// LINTER ENGINE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Lint Pine Script v6 source code.
 * @param {string} source - Pine Script source code
 * @param {object} options - Linting options
 * @param {string[]} options.disable - Rule IDs to disable
 * @param {string[]} options.categories - Categories to enable (default: all)
 * @param {string} options.minSeverity - Minimum severity to report
 * @returns {LintResult}
 */
export function lintPineScript(source, options = {}) {
  const {
    disable = [],
    categories = null,
    minSeverity = 'hint',
  } = options;

  const severityOrder = { hint: 0, info: 1, warning: 2, error: 3 };
  const minSev = severityOrder[minSeverity] || 0;

  const lines = source.split('\n');
  const isStrategy = /\bstrategy\s*\(/.test(source);
  const isLibrary = /\blibrary\s*\(/.test(source);

  const ctx = {
    source,
    lines,
    isStrategy,
    isLibrary,
    isIndicator: !isStrategy && !isLibrary,
  };

  const diagnostics = [];

  for (const [ruleId, rule] of Object.entries(RULES)) {
    // Skip disabled rules
    if (disable.includes(ruleId)) continue;

    // Filter by category
    if (categories && !categories.includes(rule.category)) continue;

    // Filter by severity
    if (severityOrder[rule.severity] < minSev) continue;

    // Run rule against each line
    for (let i = 0; i < lines.length; i++) {
      try {
        if (rule.check(lines[i], i, ctx)) {
          diagnostics.push({
            line: i + 1,
            column: 1,
            severity: rule.severity,
            ruleId: rule.id,
            category: rule.category,
            message: rule.message,
            source: lines[i].trim(),
          });
        }
      } catch (e) {
        // Rule threw — skip silently
      }
    }
  }

  // Sort by line number, then severity
  diagnostics.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  // Summary
  const summary = {
    errors: diagnostics.filter(d => d.severity === 'error').length,
    warnings: diagnostics.filter(d => d.severity === 'warning').length,
    info: diagnostics.filter(d => d.severity === 'info').length,
    hints: diagnostics.filter(d => d.severity === 'hint').length,
    total: diagnostics.length,
  };

  // Quality score: 100 - (errors*10 + warnings*3 + info*1)
  const score = Math.max(0, Math.min(100,
    100 - (summary.errors * 10 + summary.warnings * 3 + summary.info * 1)));

  // Grade
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return {
    diagnostics,
    summary,
    score,
    grade,
    clean: summary.errors === 0,
    categories: [...new Set(diagnostics.map(d => d.category))],
  };
}

/**
 * Get all available rule IDs.
 */
export function listRules() {
  return Object.values(RULES).map(r => ({
    id: r.id,
    severity: r.severity,
    category: r.category,
    message: r.message,
  }));
}

/**
 * Format lint results as a human-readable report.
 */
export function formatLintReport(result) {
  const lines = [];

  lines.push(`Pine Script Lint Report — Grade: ${result.grade} (${result.score}/100)`);
  lines.push('═'.repeat(60));

  if (result.diagnostics.length === 0) {
    lines.push('✅ No issues found!');
    return lines.join('\n');
  }

  // Group by category
  const byCategory = {};
  for (const d of result.diagnostics) {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push(d);
  }

  for (const [cat, diags] of Object.entries(byCategory)) {
    lines.push(`\n── ${cat.toUpperCase()} (${diags.length}) ──`);
    for (const d of diags) {
      const icon = d.severity === 'error' ? '❌' :
                   d.severity === 'warning' ? '⚠️' :
                   d.severity === 'info' ? 'ℹ️' : '💡';
      lines.push(`  ${icon} Line ${d.line}: ${d.message}`);
      lines.push(`     ${d.source.substring(0, 80)}`);
    }
  }

  lines.push(`\nSummary: ${result.summary.errors} errors, ${result.summary.warnings} warnings, ` +
             `${result.summary.info} info, ${result.summary.hints} hints`);

  return lines.join('\n');
}

/**
 * Quick repainting check — returns true if code likely repaints.
 */
export function detectsRepainting(source) {
  const result = lintPineScript(source, { categories: ['repainting', 'lookahead'] });
  return {
    repaints: result.summary.errors > 0,
    issues: result.diagnostics,
    confidence: result.summary.errors > 2 ? 'high' :
                result.summary.errors > 0 ? 'medium' :
                result.summary.warnings > 0 ? 'low' : 'none',
  };
}

/**
 * Strategy-specific quality audit.
 */
export function auditStrategy(source) {
  if (!/\bstrategy\s*\(/.test(source)) {
    return { isStrategy: false, message: 'Not a strategy script' };
  }

  const result = lintPineScript(source, {
    categories: ['strategy', 'repainting', 'lookahead'],
  });

  const checks = {
    hasCommission: /commission_type/.test(source),
    hasSlippage: /slippage/.test(source),
    hasInitialCapital: /initial_capital/.test(source),
    hasStopLoss: /stop\s*=/.test(source) || /strategy\.exit/.test(source),
    hasTakeProfit: /limit\s*=/.test(source) || /profit/.test(source),
    hasPositionSizing: /default_qty_type/.test(source),
    usesBarOffset: /\[1\]/.test(source),
    noCalcOnEveryTick: !/calc_on_every_tick\s*=\s*true/.test(source),
    noProcessOnClose: !/process_orders_on_close\s*=\s*true/.test(source),
  };

  const passCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const qualityScore = Math.round((passCount / totalChecks) * 100);

  return {
    isStrategy: true,
    checks,
    qualityScore,
    grade: qualityScore >= 90 ? 'A' : qualityScore >= 70 ? 'B' : qualityScore >= 50 ? 'C' : 'D',
    lintResult: result,
    recommendation: qualityScore < 70
      ? 'Strategy needs improvement for realistic backtesting'
      : qualityScore < 90
      ? 'Strategy is good but could be tightened'
      : 'Strategy meets professional backtesting standards',
  };
}
