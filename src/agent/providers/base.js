/**
 * Base LLM Provider — abstract interface for all model providers.
 *
 * Every provider must implement:
 *   - chatCompletion({ model, system, messages, tools, maxTokens }) → unified response
 *
 * Unified response shape:
 *   { content: [{ type: 'text', text } | { type: 'tool_use', id, name, input }],
 *     stop_reason: 'end_turn' | 'tool_use',
 *     usage: { input_tokens, output_tokens } }
 */

export class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  /** @abstract */
  async chatCompletion(/* { model, system, messages, tools, maxTokens } */) {
    throw new Error(`${this.name}: chatCompletion() not implemented`);
  }

  /**
   * Convert Anthropic-style tools to this provider's format.
   * Override if the provider uses a different tool schema.
   * Default: pass through (Anthropic format).
   */
  formatTools(tools) {
    return tools;
  }

  /**
   * Convert Anthropic-style messages to this provider's format.
   * Override for providers that use a different message schema (e.g. OpenAI).
   */
  formatMessages(messages) {
    return messages;
  }
}
