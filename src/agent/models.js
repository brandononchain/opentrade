/**
 * Model Registry — all supported models with metadata.
 *
 * Each model entry defines:
 *   - provider: which provider class to use
 *   - model: the exact model ID to send to the API
 *   - tier: 'flagship' | 'balanced' | 'fast' | 'budget'
 *   - context: max context window in tokens
 *   - maxOutput: max output tokens
 *   - costPer1kInput / costPer1kOutput: USD per 1K tokens
 *   - strengths: what it's best at
 *
 * Usage:
 *   import { MODELS, getModel, listModels } from './models.js';
 *   const m = getModel('gpt-5.4');
 */

export const MODELS = {
  // ── Anthropic Claude ──────────────────────────────────────────
  'claude-opus': {
    provider: 'anthropic',
    model: 'claude-opus-4-20250514',
    displayName: 'Claude Opus 4',
    tier: 'flagship',
    context: 1_000_000,
    maxOutput: 128_000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    strengths: ['tool calling', 'reasoning', 'code generation', 'long context'],
  },
  'claude-sonnet': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    tier: 'balanced',
    context: 1_000_000,
    maxOutput: 64_000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    strengths: ['tool calling', 'balanced cost/quality', 'code generation'],
  },
  'claude-haiku': {
    provider: 'anthropic',
    model: 'claude-haiku-4-20250506',
    displayName: 'Claude Haiku 4',
    tier: 'fast',
    context: 200_000,
    maxOutput: 64_000,
    costPer1kInput: 0.001,
    costPer1kOutput: 0.005,
    strengths: ['speed', 'low cost', 'simple tasks'],
  },

  // ── OpenAI ────────────────────────────────────────────────────
  'gpt-4.1': {
    provider: 'openai',
    model: 'gpt-4.1',
    displayName: 'GPT-4.1',
    tier: 'balanced',
    context: 1_000_000,
    maxOutput: 32_768,
    costPer1kInput: 0.002,
    costPer1kOutput: 0.008,
    strengths: ['tool calling', 'function calling', 'large ecosystem'],
  },
  'gpt-4.1-mini': {
    provider: 'openai',
    model: 'gpt-4.1-mini',
    displayName: 'GPT-4.1 Mini',
    tier: 'fast',
    context: 1_000_000,
    maxOutput: 32_768,
    costPer1kInput: 0.0004,
    costPer1kOutput: 0.0016,
    strengths: ['speed', 'low cost', 'function calling'],
  },
  'o3': {
    provider: 'openai',
    model: 'o3',
    displayName: 'OpenAI o3',
    tier: 'flagship',
    context: 200_000,
    maxOutput: 100_000,
    costPer1kInput: 0.002,
    costPer1kOutput: 0.008,
    strengths: ['deep reasoning', 'math', 'complex analysis'],
  },
  'o4-mini': {
    provider: 'openai',
    model: 'o4-mini',
    displayName: 'OpenAI o4-mini',
    tier: 'balanced',
    context: 200_000,
    maxOutput: 100_000,
    costPer1kInput: 0.0011,
    costPer1kOutput: 0.0044,
    strengths: ['reasoning', 'tool use', 'cost-effective reasoning'],
  },

  // ── Google Gemini ─────────────────────────────────────────────
  'gemini-2.5-pro': {
    provider: 'google',
    model: 'gemini-2.5-pro-preview-05-06',
    displayName: 'Gemini 2.5 Pro',
    tier: 'flagship',
    context: 1_000_000,
    maxOutput: 65_536,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.01,
    strengths: ['multimodal', 'long context', 'reasoning', 'chart vision'],
  },
  'gemini-2.5-flash': {
    provider: 'google',
    model: 'gemini-2.5-flash-preview-05-20',
    displayName: 'Gemini 2.5 Flash',
    tier: 'fast',
    context: 1_000_000,
    maxOutput: 65_536,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    strengths: ['speed', 'multimodal', 'low cost', 'long context'],
  },

  // ── Alibaba Qwen ──────────────────────────────────────────────
  'qwen-max': {
    provider: 'qwen',
    model: 'qwen-max',
    displayName: 'Qwen-Max',
    tier: 'flagship',
    context: 256_000,
    maxOutput: 16_384,
    costPer1kInput: 0.0016,
    costPer1kOutput: 0.0064,
    strengths: ['multilingual', 'tool use', 'reasoning', 'hybrid thinking'],
  },
  'qwen-plus': {
    provider: 'qwen',
    model: 'qwen-plus',
    displayName: 'Qwen-Plus',
    tier: 'balanced',
    context: 131_072,
    maxOutput: 16_384,
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.002,
    strengths: ['balanced cost/quality', 'tool use', 'code generation'],
  },
  'qwen-turbo': {
    provider: 'qwen',
    model: 'qwen-turbo',
    displayName: 'Qwen-Turbo',
    tier: 'fast',
    context: 1_000_000,
    maxOutput: 8_192,
    costPer1kInput: 0.0003,
    costPer1kOutput: 0.0006,
    strengths: ['speed', 'low cost', '1M context'],
  },

  // ── DeepSeek ──────────────────────────────────────────────────
  'deepseek-chat': {
    provider: 'deepseek',
    model: 'deepseek-chat',
    displayName: 'DeepSeek V3',
    tier: 'balanced',
    context: 128_000,
    maxOutput: 8_192,
    costPer1kInput: 0.00027,
    costPer1kOutput: 0.0011,
    strengths: ['extreme value', 'reasoning', 'code generation'],
  },
  'deepseek-reasoner': {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    displayName: 'DeepSeek R1',
    tier: 'flagship',
    context: 128_000,
    maxOutput: 64_000,
    costPer1kInput: 0.00055,
    costPer1kOutput: 0.0022,
    strengths: ['deep reasoning', 'math', 'chain of thought'],
  },

  // ── MiniMax ───────────────────────────────────────────────────
  'minimax': {
    provider: 'minimax',
    model: 'MiniMax-M1',
    displayName: 'MiniMax M1',
    tier: 'balanced',
    context: 1_000_000,
    maxOutput: 16_384,
    costPer1kInput: 0.0003,
    costPer1kOutput: 0.0011,
    strengths: ['extreme value', 'long context', 'reasoning'],
  },
};

/** Get a model config by alias. Throws if not found. */
export function getModel(alias) {
  const m = MODELS[alias];
  if (!m) {
    const available = Object.keys(MODELS).join(', ');
    throw new Error(`Unknown model "${alias}". Available: ${available}`);
  }
  return { alias, ...m };
}

/** Get alias for a raw model ID (e.g. 'claude-sonnet-4-20250514' → 'claude-sonnet') */
export function resolveModelId(modelId) {
  for (const [alias, cfg] of Object.entries(MODELS)) {
    if (cfg.model === modelId) return alias;
  }
  return null;
}

/** List all models, optionally filtered by provider or tier. */
export function listModels({ provider, tier } = {}) {
  return Object.entries(MODELS)
    .filter(([, m]) => (!provider || m.provider === provider) && (!tier || m.tier === tier))
    .map(([alias, m]) => ({ alias, ...m }));
}

/** Get the active model alias from env, or fall back to default. */
export function getActiveModelAlias() {
  return process.env.LLM_MODEL || 'claude-sonnet';
}
