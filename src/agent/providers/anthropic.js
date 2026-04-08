/**
 * Anthropic Provider — Claude models.
 * This wraps the existing behavior so nothing breaks.
 */
import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.js';

export class AnthropicProvider extends BaseProvider {
  constructor() {
    super('anthropic');
    this.client = new Anthropic();
  }

  async chatCompletion({ model, system, messages, tools, maxTokens }) {
    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens || 8096,
      system,
      tools,
      messages,
    });

    return {
      content: response.content,
      stop_reason: response.stop_reason === 'end_turn' ? 'end_turn'
        : response.stop_reason === 'tool_use' ? 'tool_use'
        : response.stop_reason,
      usage: response.usage,
    };
  }
}
