/**
 * Unit tests for Pine Script static analyzer.
 * No TradingView or Anthropic API needed.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert';

// Dynamic import since it's ESM
const { analyzeStatic, generateTemplate, developScript } = await import('../src/pine/analyzer.js');

describe('Pine Script Static Analyzer', () => {
  test('detects missing version declaration', () => {
    const src = `indicator("Test", overlay=false)\nplot(close)`;
    const result = analyzeStatic(src);
    assert.ok(result.issues.some(i => i.message.includes('version')));
  });

  test('passes clean v6 indicator', () => {
    const src = `//@version=6
indicator("My Indicator", overlay=false)
length = input.int(14, "Length")
value = ta.rsi(close, length)
plot(value, "RSI")`;
    const result = analyzeStatic(src);
    assert.strictEqual(result.version, 6);
    assert.strictEqual(result.type, 'indicator');
    assert.strictEqual(result.clean, true);
    assert.strictEqual(result.summary.errors, 0);
  });

  test('detects array out of bounds', () => {
    const src = `//@version=6
indicator("Test", overlay=false)
arr = array.new<float>(3)
val = array.get(arr, 5)
plot(val)`;
    const result = analyzeStatic(src);
    assert.ok(result.issues.some(i => i.message.includes('out of bounds')));
    assert.ok(result.issues.some(i => i.severity === 'error'));
  });

  test('detects deprecated study() in v6', () => {
    const src = `//@version=6
study("Old Script", overlay=false)
plot(close)`;
    const result = analyzeStatic(src);
    assert.ok(result.issues.some(i => i.message.includes('indicator()')));
  });

  test('detects missing strategy commission', () => {
    const src = `//@version=6
strategy("My Strategy", overlay=true)
if close > open
    strategy.entry("Long", strategy.long)`;
    const result = analyzeStatic(src);
    assert.ok(result.issues.some(i => i.message.includes('commission')));
  });

  test('detects missing declaration', () => {
    const src = `//@version=6
length = input.int(14, "Length")
plot(ta.rsi(close, length))`;
    const result = analyzeStatic(src);
    assert.ok(result.issues.some(i => i.message.includes('Missing')));
    assert.strictEqual(result.clean, false);
  });
});

describe('Pine Script Template Generator', () => {
  test('generates valid indicator template', () => {
    const src = generateTemplate('indicator', { title: 'Test Indicator' });
    assert.ok(src.includes('//@version=6'));
    assert.ok(src.includes('indicator('));
    assert.ok(src.includes('input.int'));
    assert.ok(src.includes('plot('));
  });

  test('generates valid strategy template', () => {
    const src = generateTemplate('strategy', { title: 'Test Strategy' });
    assert.ok(src.includes('//@version=6'));
    assert.ok(src.includes('strategy('));
    assert.ok(src.includes('commission'));
    assert.ok(src.includes('strategy.entry'));
  });

  test('generates valid library template', () => {
    const src = generateTemplate('library', { title: 'My Library' });
    assert.ok(src.includes('//@version=6'));
    assert.ok(src.includes('library('));
    assert.ok(src.includes('export '));
  });

  test('generated templates pass static analysis', () => {
    for (const type of ['indicator', 'strategy', 'library']) {
      const src = generateTemplate(type, { title: 'Test' });
      const result = analyzeStatic(src);
      assert.strictEqual(result.version, 6, `${type} should be v6`);
      const errors = result.issues.filter(i => i.severity === 'error');
      assert.strictEqual(errors.length, 0, `${type} should have no errors, got: ${errors.map(e => e.message).join(', ')}`);
    }
  });
});
