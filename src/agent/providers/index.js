/**
 * Provider Factory
 * Returns a provider instance and model config based on model alias or env config.
 *
 * Usage:
 *   import { getProvider } from './providers/index.js';
 *   const { provider, model } = getProvider();          // uses LLM_MODEL env
 *   const { provider, model } = getProvider('qwen-max'); // explicit
 */
import { getModel, getActiveModelAlias } from '../models.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenAICompatibleProvider } from './openai-compat.js';
import { GoogleProvider } from './google.js';

// Cache provider instances by name (they hold SDK clients — reuse them)
const providerCache = new Map();

function createProvider(providerName) {
  if (providerCache.has(providerName)) return providerCache.get(providerName);

  let instance;
  switch (providerName) {
    case 'anthropic':
      instance = new AnthropicProvider();
      break;
    case 'openai':
    case 'deepseek':
    case 'qwen':
    case 'minimax':
      instance = new OpenAICompatibleProvider(providerName);
      break;
    case 'google':
      instance = new GoogleProvider();
      break;
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }

  providerCache.set(providerName, instance);
  return instance;
}

/**
 * Get a provider + model config.
 * @param {string} [modelAlias] - e.g. 'qwen-max', 'gpt-4.1', 'claude-sonnet'. Defaults to LLM_MODEL env.
 * @returns {{ provider: BaseProvider, model: object }}
 */
export function getProvider(modelAlias) {
  const alias = modelAlias || getActiveModelAlias();
  const modelConfig = getModel(alias);
  const provider = createProvider(modelConfig.provider);
  return { provider, model: modelConfig };
}

/** Clear cached provider instances (useful for tests or key rotation). */
export function clearProviderCache() {
  providerCache.clear();
}

export { AnthropicProvider } from './anthropic.js';
export { OpenAICompatibleProvider } from './openai-compat.js';
export { GoogleProvider } from './google.js';
