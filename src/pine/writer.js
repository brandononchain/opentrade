/**
 * Pine Script AI Writer
 * Multi-turn AI-driven Pine Script development with automatic compile-fix loop.
 * Uses Claude to write, analyze, fix, and verify Pine Script v6.
 */
import Anthropic from '@anthropic-ai/sdk';
import { pine, capture } from '../mcp/client.js';
import { analyzeStatic, developScript } from './analyzer.js';
import { getTemplate, listTemplates } from './templates.js';

const PINE_SYSTEM = `You are an expert Pine Script v6 developer. Your job is to write, analyze, and fix Pine Script code.

## Pine Script v6 Rules
- Always start with //@version=6
- Use indicator(), strategy(), or library() — never study()
- Indent with 4 spaces (not tabs, not braces)
- All inputs use input.*() functions with group= parameter
- Comments use // not /* */
- Variable names: camelCase
- Constants: UPPER_SNAKE_CASE

## Code Quality Standards
- Every indicator needs at minimum: version, declaration, at least one input, at least one plot
- Every strategy needs: commission settings, default_qty_type, entry AND exit logic
- All plots must have descriptive names
- Use color.new() for transparency: color.new(color.blue, 80) = 80% transparent blue

## When Fixing Errors
- Read the EXACT error message and line number
- Fix ONLY the reported issue — don't refactor working code
- Common fixes:
  - "Mismatched input" → check indentation (must be 4 spaces)
  - "Undeclared identifier" → check spelling, ensure declared before use
  - "Cannot call X with argument type Y" → check Pine v6 type system
  - "study() is deprecated" → change to indicator()

## Output Format
When writing Pine Script, output ONLY the raw code — no markdown fences, no explanation before the code.
After the code, add a brief explanation of what it does.`;

/**
 * AI-powered Pine Script writer with automatic compile-fix loop.
 * Returns the final source code and compilation status.
 */
export async function writePineScript(prompt, opts = {}) {
  const {
    maxCompileAttempts = 5,
    template = null,
    log = console.log,
    compileInTV = true,
  } = opts;

  const client = new Anthropic();

  // Step 1: Generate initial code
  log('🤖 Writing Pine Script...');

  const messages = [];

  // Use template as starting point if specified
  let templateCode = null;
  if (template) {
    templateCode = getTemplate(template);
    if (templateCode) {
      messages.push({
        role: 'user',
        content: `Here is a starting template to modify:\n\n${templateCode}\n\nModify it to: ${prompt}`,
      });
    }
  }

  if (!templateCode) {
    messages.push({
      role: 'user',
      content: `Write a complete Pine Script v6 for: ${prompt}

Requirements:
- //@version=6 header
- Proper indicator() or strategy() declaration
- All inputs with input.*() and group= parameter
- Complete, runnable code
- Output ONLY the raw Pine Script code`,
    });
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: PINE_SYSTEM,
    messages,
  });

  let source = response.content[0].text.trim();

  // Clean up if Claude wrapped in markdown (shouldn't happen but just in case)
  source = source.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();

  log(`📝 Generated ${source.split('\n').length} lines of Pine Script`);

  // Step 2: Static analysis
  const staticResult = analyzeStatic(source);
  if (!staticResult.clean) {
    log(`⚠️  Static issues found: ${staticResult.summary.errors} errors`);

    // Ask Claude to fix static issues
    const fixMessages = [
      ...messages,
      { role: 'assistant', content: source },
      {
        role: 'user',
        content: `The static analyzer found these issues:\n${
          staticResult.issues.map(i => `Line ${i.line} [${i.severity.toUpperCase()}]: ${i.message}`).join('\n')
        }\n\nFix these issues. Output ONLY the corrected Pine Script code.`,
      },
    ];

    const fixResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: PINE_SYSTEM,
      messages: fixMessages,
    });

    source = fixResponse.content[0].text.trim()
      .replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
    log('✅ Static issues fixed');
  }

  // Step 3: Server-side check (no TV needed)
  try {
    log('🔍 Server-side validation...');
    const checkResult = await pine.check(source);
    if (checkResult.errors?.length > 0) {
      log(`⚠️  Server check: ${checkResult.errors.length} error(s)`);
    }
  } catch (e) {
    log('⚠️  Server check unavailable');
  }

  // Step 4: Compile in TradingView with fix loop
  if (compileInTV) {
    let currentSource = source;
    let lastErrors = [];

    for (let attempt = 1; attempt <= maxCompileAttempts; attempt++) {
      log(`🔨 Compile attempt ${attempt}/${maxCompileAttempts}...`);

      // Inject
      await pine.setSource(currentSource);
      // Compile
      await pine.smartCompile();
      // Check errors
      const errResult = await pine.getErrors();
      lastErrors = errResult.errors || [];

      if (lastErrors.length === 0) {
        log('✅ Compiled successfully!');
        source = currentSource;

        // Screenshot to verify
        log('📸 Verifying on chart...');
        const ss = await capture.screenshot('chart');

        // Save
        await pine.save();
        log('💾 Saved to TradingView cloud');

        return {
          success: true,
          source,
          compiled: true,
          attempts: attempt,
          screenshot: ss,
        };
      }

      log(`❌ ${lastErrors.length} error(s) on attempt ${attempt}`);
      for (const e of lastErrors) {
        log(`   Line ${e.line}: ${e.message}`);
      }

      if (attempt === maxCompileAttempts) break;

      // Ask Claude to fix compile errors
      log('🤖 AI fixing compile errors...');
      const errorContext = lastErrors
        .map(e => `Line ${e.line}: ${e.message}`)
        .join('\n');

      const fixResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: PINE_SYSTEM,
        messages: [
          { role: 'user', content: `Fix these Pine Script compilation errors:\n\n${errorContext}\n\nOriginal code:\n${currentSource}\n\nOutput ONLY the corrected Pine Script.` },
        ],
      });

      currentSource = fixResponse.content[0].text.trim()
        .replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
    }

    return {
      success: false,
      source,
      compiled: false,
      errors: lastErrors,
    };
  }

  // Return without compiling
  return { success: true, source, compiled: false };
}

/**
 * AI-powered Pine Script debugger.
 * Takes existing source + error messages and returns fixed code.
 */
export async function debugPineScript(source, errors) {
  const client = new Anthropic();

  const errorStr = errors.map(e => `Line ${e.line || '?'}: ${e.message}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: PINE_SYSTEM,
    messages: [{
      role: 'user',
      content: `Debug and fix this Pine Script. Here are the compilation errors:\n\n${errorStr}\n\nHere is the source:\n\n${source}\n\nOutput ONLY the corrected Pine Script code.`,
    }],
  });

  let fixed = response.content[0].text.trim()
    .replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();

  return {
    fixed,
    analysis: analyzeStatic(fixed),
  };
}

/**
 * Explain what a Pine Script does in plain English.
 */
export async function explainPineScript(source) {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: 'You are a Pine Script expert. Explain Pine Script code clearly and concisely for traders.',
    messages: [{
      role: 'user',
      content: `Explain what this Pine Script indicator/strategy does:\n\n${source}\n\nProvide:\n1. What it does in 1-2 sentences\n2. Key parameters and their defaults\n3. What signals/plots it generates\n4. Ideal use cases`,
    }],
  });

  return response.content[0].text;
}
