/**
 * Pine Script v6 Utilities
 * Combines static analysis from pine-script-v6-extension with
 * live TradingView compilation via the MCP server.
 */
import { pine, capture } from '../mcp/client.js';

// ── Static Analysis (offline, no TV needed) ──

/**
 * Validate Pine Script v6 syntax and common mistakes.
 * Based on PineStaticAnalyzer from pine-script-v6-extension.
 */
export function analyzeStatic(source) {
  const lines = source.split('\n');
  const issues = [];
  let version = null;

  // Detect version
  for (const line of lines) {
    const m = line.match(/^\s*\/\/@version=(\d+)/);
    if (m) { version = parseInt(m[1]); break; }
  }

  if (!version) {
    issues.push({ line: 1, severity: 'warning', message: 'No //@version declaration. Defaulting to version 5 behavior.' });
  }

  // Check for v6-only features used in wrong version
  if (version && version < 6) {
    const v6Only = ['matrix.', 'map.', 'polyline.', 'chart.point.', 'strategy.risk.'];
    for (let i = 0; i < lines.length; i++) {
      for (const feat of v6Only) {
        if (lines[i].includes(feat)) {
          issues.push({ line: i + 1, severity: 'error', message: `${feat} requires //@version=6` });
        }
      }
    }
  }

  // Check for array out-of-bounds
  const arrayVars = new Map();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track array.new declarations
    const newMatch = line.match(/(\w+)\s*=\s*array\.new(?:<\w+>)?\((\d+)/);
    if (newMatch) {
      arrayVars.set(newMatch[1], { size: parseInt(newMatch[2]), line: i + 1 });
    }

    // Check array.get / array.set calls
    const getMatch = line.match(/array\.get\((\w+),\s*(\d+)\)/);
    if (getMatch) {
      const arr = arrayVars.get(getMatch[1]);
      if (arr && parseInt(getMatch[2]) >= arr.size) {
        issues.push({
          line: i + 1,
          severity: 'error',
          message: `array.get(${getMatch[1]}, ${getMatch[2]}): index out of bounds (size=${arr.size})`,
        });
      }
    }

    // Check unguarded array.first() / array.last()
    if (line.includes('array.first(') || line.includes('array.last(')) {
      const varMatch = line.match(/array\.(first|last)\((\w+)\)/);
      if (varMatch) {
        const guardPattern = new RegExp(`array\\.size\\(${varMatch[2]}\\)\\s*[>]`);
        if (!lines.slice(Math.max(0, i - 3), i).some(l => guardPattern.test(l))) {
          issues.push({
            line: i + 1,
            severity: 'warning',
            message: `array.${varMatch[1]}(${varMatch[2]}): no size guard found — may throw on empty array`,
          });
        }
      }
    }

    // Strategy without commission
    if (line.match(/strategy\s*\(/) && !source.includes('commission')) {
      issues.push({ line: i + 1, severity: 'info', message: 'strategy() missing commission settings (commission_type, commission_value)' });
    }

    // Deprecated v4/v5 syntax in v6
    if (version === 6) {
      if (line.includes('study(')) {
        issues.push({ line: i + 1, severity: 'error', message: 'Use indicator() instead of study() in Pine v6' });
      }
      if (line.match(/\bsecurity\b/)) {
        issues.push({ line: i + 1, severity: 'warning', message: 'request.security() is preferred over security() in Pine v6' });
      }
    }

    // Missing na check on series used in comparisons
    if (line.match(/\bna\b/) === null && line.match(/([a-z_]\w*)\s*[><=!]+\s*\d+/)) {
      // Heuristic: if variable could be na (used from request.security etc), flag it
      // This is a lightweight check — not exhaustive
    }
  }

  // Check for required declaration
  const hasIndicator = /\bindicator\s*\(/.test(source);
  const hasStrategy = /\bstrategy\s*\(/.test(source);
  const hasLibrary = /\blibrary\s*\(/.test(source);

  if (!hasIndicator && !hasStrategy && !hasLibrary) {
    issues.push({ line: 1, severity: 'error', message: 'Missing indicator(), strategy(), or library() declaration' });
  }

  return {
    version,
    type: hasStrategy ? 'strategy' : hasLibrary ? 'library' : 'indicator',
    issues,
    clean: issues.filter(i => i.severity === 'error').length === 0,
    summary: {
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
    },
  };
}

/**
 * Generate a Pine Script v6 template.
 */
export function generateTemplate(type = 'indicator', opts = {}) {
  const {
    title = 'My Indicator',
    overlay = false,
    shortTitle = '',
  } = opts;

  if (type === 'strategy') {
    return `//@version=6
strategy("${title}", overlay=${overlay}, commission_type=strategy.commission.percent, commission_value=0.05, slippage=1)

// ── Inputs ──
lengthFast = input.int(9, "Fast Length", minval=1)
lengthSlow = input.int(21, "Slow Length", minval=1)

// ── Calculations ──
emaFast = ta.ema(close, lengthFast)
emaSlow = ta.ema(close, lengthSlow)

// ── Entry / Exit Logic ──
longCondition  = ta.crossover(emaFast, emaSlow)
shortCondition = ta.crossunder(emaFast, emaSlow)

if longCondition
    strategy.entry("Long", strategy.long)
if shortCondition
    strategy.entry("Short", strategy.short)

// ── Plots ──
plot(emaFast, "Fast EMA", color.blue)
plot(emaSlow, "Slow EMA", color.orange)
`;
  }

  if (type === 'library') {
    return `//@version=6
// @description ${title}
library("${title.replace(/\s+/g, '_')}", overlay=${overlay})

// @function Returns the EMA of a series
// @param src The source series
// @param len The lookback period
// @returns EMA value
export ema(float src, simple int len) =>
    ta.ema(src, len)
`;
  }

  // Default: indicator
  return `//@version=6
indicator("${title}"${shortTitle ? `, shorttitle="${shortTitle}"` : ''}, overlay=${overlay})

// ── Inputs ──
length = input.int(14, "Length", minval=1, group="Settings")
source = input.source(close, "Source", group="Settings")

// ── Calculations ──
value = ta.rsi(source, length)
ma    = ta.ema(value, 9)

// ── Plots ──
plot(value, "Value", color.blue)
plot(ma, "Signal", color.orange)
hline(70, "Overbought", color.red,   linestyle=hline.style_dashed)
hline(30, "Oversold",   color.green, linestyle=hline.style_dashed)
`;
}

/**
 * Full Pine Script development loop:
 * Write → Analyze → Inject → Compile → Fix → Verify
 */
export async function developScript(source, opts = {}) {
  const { maxRetries = 5, screenshot = true } = opts;
  const log = opts.log || console.log;

  // Step 1: Static analysis
  log('📋 Running static analysis...');
  const staticResult = analyzeStatic(source);
  if (!staticResult.clean) {
    log(`⚠️  Static issues: ${staticResult.summary.errors} errors, ${staticResult.summary.warnings} warnings`);
    for (const issue of staticResult.issues) {
      log(`  [${issue.severity.toUpperCase()}] Line ${issue.line}: ${issue.message}`);
    }
    if (staticResult.summary.errors > 0) {
      return { success: false, phase: 'static_analysis', issues: staticResult.issues };
    }
  }

  // Step 2: Server-side check (no chart needed)
  log('🔍 Server-side validation...');
  let checkResult;
  try {
    checkResult = await pine.check(source);
    if (checkResult.errors?.length > 0) {
      log('❌ Server check errors:', checkResult.errors);
    }
  } catch (e) {
    log('⚠️  Server check unavailable, proceeding to live compile');
  }

  // Step 3: Inject into editor
  log('💉 Injecting into TradingView editor...');
  const setResult = await pine.setSource(source);
  if (!setResult.success) {
    return { success: false, phase: 'inject', error: setResult.error };
  }

  // Step 4: Compile loop
  let lastErrors = [];
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log(`🔨 Compiling (attempt ${attempt}/${maxRetries})...`);
    const compileResult = await pine.smartCompile();

    const errorsResult = await pine.getErrors();
    lastErrors = errorsResult.errors || [];

    if (lastErrors.length === 0) {
      log('✅ Compilation successful!');

      // Step 5: Screenshot
      if (screenshot) {
        log('📸 Taking verification screenshot...');
        const ss = await capture.screenshot('chart');
        return { success: true, compiled: true, screenshot: ss };
      }

      return { success: true, compiled: true };
    }

    log(`❌ ${lastErrors.length} compile error(s):`);
    for (const err of lastErrors) {
      log(`  Line ${err.line}: ${err.message}`);
    }

    if (attempt === maxRetries) break;
    log('🤖 Agent should fix errors and retry...');
  }

  return {
    success: false,
    phase: 'compile',
    errors: lastErrors,
    message: 'Max compile retries reached',
  };
}
