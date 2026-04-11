/**
 * Tests for context-manager.js and tool-resilience.js
 * Run: node --test src/agent/__tests__/context-manager.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateTokens,
  estimateHistoryTokens,
  truncateToolResult,
  truncateString,
  pruneHistory,
  safeToolResultContent,
  sanitizeToolInput,
  CONFIG,
} from '../context-manager.js';
import {
  classifyError,
  createResilientCaller,
  getSuggestion,
} from '../tool-resilience.js';

// ─── Token Estimation ─────────────────────────────────────────────────────────

describe('estimateTokens', () => {
  it('estimates string tokens conservatively', () => {
    const text = 'Hello world, this is a test string for token estimation.';
    const tokens = estimateTokens(text);
    // ~55 chars / 3.5 ≈ 16 tokens
    assert.ok(tokens > 10 && tokens < 25, `Got ${tokens}`);
  });

  it('handles null/undefined', () => {
    assert.equal(estimateTokens(null), 0);
    assert.equal(estimateTokens(undefined), 0);
    assert.equal(estimateTokens(''), 0);
  });

  it('estimates array content blocks', () => {
    const content = [
      { type: 'text', text: 'Hello world' },
      { type: 'tool_use', name: 'quote_get', input: { symbol: 'AAPL' }, id: '123' },
    ];
    const tokens = estimateTokens(content);
    assert.ok(tokens > 5, `Expected >5 tokens, got ${tokens}`);
  });
});

describe('estimateHistoryTokens', () => {
  it('estimates message array', () => {
    const messages = [
      { role: 'user', content: 'Analyze my chart' },
      { role: 'assistant', content: 'I will analyze your chart now.' },
    ];
    const tokens = estimateHistoryTokens(messages);
    assert.ok(tokens > 10, `Expected >10 tokens, got ${tokens}`);
  });
});

// ─── Truncation ───────────────────────────────────────────────────────────────

describe('truncateString', () => {
  it('does not truncate short strings', () => {
    const short = 'Hello world';
    assert.equal(truncateString(short, 1000), short);
  });

  it('truncates long strings with marker', () => {
    const long = 'x'.repeat(10_000);
    const truncated = truncateString(long, 1_000);
    assert.ok(truncated.length < 1_200, `Got length ${truncated.length}`);
    assert.ok(truncated.includes('TRUNCATED'));
  });

  it('handles non-string input', () => {
    const obj = { key: 'value', nested: { deep: true } };
    const result = truncateString(obj, 1000);
    assert.ok(typeof result === 'string');
  });
});

describe('truncateToolResult', () => {
  it('truncates pine_get_source', () => {
    const hugeSource = Array.from({ length: 500 }, (_, i) => `line ${i}: var x = ${i}`).join('\n');
    const result = truncateToolResult('pine_get_source', hugeSource);
    assert.ok(result.length < hugeSource.length, 'Should be shorter');
    assert.ok(result.includes('truncated'), 'Should mention truncation');
  });

  it('truncates large OHLCV data', () => {
    const bars = Array.from({ length: 500 }, (_, i) => ({
      time: 1700000000 + i * 60,
      open: 100 + i,
      high: 101 + i,
      low: 99 + i,
      close: 100.5 + i,
      volume: 1000,
    }));
    const data = JSON.stringify({ bars, symbol: 'AAPL' });
    const result = truncateToolResult('data_get_ohlcv', data);
    const parsed = JSON.parse(result);
    assert.ok(parsed.bars.length <= CONFIG.MAX_OHLCV_BARS, `Got ${parsed.bars.length} bars`);
    assert.ok(parsed._truncated === true);
  });

  it('leaves small results untouched', () => {
    const small = JSON.stringify({ success: true, price: 150.25 });
    const result = truncateToolResult('quote_get', small);
    assert.equal(result, small);
  });
});

// ─── Input Sanitization ───────────────────────────────────────────────────────

describe('sanitizeToolInput', () => {
  it('caps OHLCV count at 200', () => {
    const input = { count: 500, summary: false };
    const sanitized = sanitizeToolInput('data_get_ohlcv', input);
    assert.equal(sanitized.count, 200);
  });

  it('leaves normal OHLCV requests alone', () => {
    const input = { count: 100, summary: true };
    const sanitized = sanitizeToolInput('data_get_ohlcv', input);
    assert.equal(sanitized.count, 100);
  });

  it('caps pine label requests', () => {
    const input = { max_labels: 200 };
    const sanitized = sanitizeToolInput('data_get_pine_labels', input);
    assert.equal(sanitized.max_labels, 50);
  });

  it('caps batch_run symbols', () => {
    const symbols = Array.from({ length: 20 }, (_, i) => `SYM${i}`);
    const input = { symbols, action: 'screenshot' };
    const sanitized = sanitizeToolInput('batch_run', input);
    assert.equal(sanitized.symbols.length, 10);
  });
});

// ─── History Pruning ──────────────────────────────────────────────────────────

describe('pruneHistory', () => {
  it('does not prune small histories', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];
    const pruned = pruneHistory(messages);
    assert.equal(pruned.length, 2);
  });

  it('prunes large histories', () => {
    // Create a history that exceeds the threshold
    const messages = Array.from({ length: 100 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'x'.repeat(10_000), // ~10K chars each = ~2.8K tokens × 100 = ~280K tokens
    }));
    const pruned = pruneHistory(messages);
    assert.ok(pruned.length < messages.length, `Pruned from ${messages.length} to ${pruned.length}`);
    assert.ok(pruned.length >= CONFIG.MIN_MESSAGES_TO_KEEP);
  });

  it('keeps minimum messages', () => {
    const messages = Array.from({ length: 200 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'x'.repeat(50_000),
    }));
    const pruned = pruneHistory(messages);
    assert.ok(pruned.length >= CONFIG.MIN_MESSAGES_TO_KEEP);
  });
});

// ─── Error Classification ─────────────────────────────────────────────────────

describe('classifyError', () => {
  it('classifies undefined as UI_NOT_READY', () => {
    const result = classifyError('ui_open_panel', 'undefined');
    assert.equal(result.type, 'UI_NOT_READY');
    assert.ok(result.retryable);
  });

  it('classifies connection errors', () => {
    const result = classifyError('chart_get_state', 'CDP connection refused');
    assert.equal(result.type, 'CONNECTION_ERROR');
    assert.ok(result.retryable);
  });

  it('classifies Pine Script errors as non-retryable', () => {
    const result = classifyError('pine_smart_compile', 'Compilation error: undeclared identifier');
    assert.equal(result.type, 'PINE_ERROR');
    assert.ok(!result.retryable);
  });

  it('classifies protected indicator errors', () => {
    const result = classifyError('data_get_indicator', 'This indicator is protected');
    assert.equal(result.type, 'PROTECTED_INDICATOR');
    assert.ok(!result.retryable);
  });
});

// ─── Resilient Caller ─────────────────────────────────────────────────────────

describe('createResilientCaller', () => {
  it('passes through on success', async () => {
    const mockCallTool = async () => ({ success: true, price: 150 });
    const resilientCall = createResilientCaller(mockCallTool);
    const result = await resilientCall('quote_get', { symbol: 'AAPL' });
    assert.deepEqual(result, { success: true, price: 150 });
  });

  it('returns error object for undefined results', async () => {
    let calls = 0;
    const mockCallTool = async () => {
      calls++;
      return undefined;
    };
    const resilientCall = createResilientCaller(mockCallTool);
    const result = await resilientCall('ui_open_panel', { panel: 'pine-editor' });
    assert.equal(result.success, false);
    assert.ok(result.error.includes('undefined'));
    assert.ok(calls > 1, `Expected retries, got ${calls} calls`);
  });

  it('provides suggestions for known tools', () => {
    const suggestion = getSuggestion('pine_set_source');
    assert.ok(suggestion.includes('ui_open_panel'));
  });
});

console.log('All context manager tests passed ✓');
