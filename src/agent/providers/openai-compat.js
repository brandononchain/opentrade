/**
 * OpenAI-Compatible Provider
 * Handles: OpenAI (GPT-5.x, o3, o4-mini), DeepSeek, Qwen, MiniMax
 * All use the OpenAI chat completions format with different base URLs.
 */
import OpenAI from 'openai';
import { BaseProvider } from './base.js';

// Endpoint configs for each provider
const ENDPOINTS = {
  openai:   { baseURL: 'https://api.openai.com/v1',               envKey: 'OPENAI_API_KEY' },
  deepseek: { baseURL: 'https://api.deepseek.com/v1',             envKey: 'DEEPSEEK_API_KEY' },
  qwen:     { baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', envKey: 'QWEN_API_KEY' },
  minimax:  { baseURL: 'https://api.minimaxi.chat/v1',            envKey: 'MINIMAX_API_KEY' },
};

export class OpenAICompatibleProvider extends BaseProvider {
  /**
   * @param {'openai'|'deepseek'|'qwen'|'minimax'} providerName
   */
  constructor(providerName) {
    super(providerName);
    const endpoint = ENDPOINTS[providerName];
    if (!endpoint) throw new Error(`Unknown OpenAI-compatible provider: ${providerName}`);

    const apiKey = process.env[endpoint.envKey];
    if (!apiKey) throw new Error(`${endpoint.envKey} not set in environment`);

    this.client = new OpenAI({
      apiKey,
      baseURL: endpoint.baseURL,
    });
  }

  async chatCompletion({ model, system, messages, tools, maxTokens }) {
    // Convert Anthropic message format → OpenAI format
    const oaiMessages = this._convertMessages(system, messages);
    const oaiTools = tools?.length ? this._convertTools(tools) : undefined;

    const params = {
      model,
      messages: oaiMessages,
      max_tokens: maxTokens || 4096,
    };
    if (oaiTools) params.tools = oaiTools;

    const response = await this.client.chat.completions.create(params);
    return this._convertResponse(response);
  }

  /** Anthropic messages → OpenAI messages */
  _convertMessages(system, messages) {
    const out = [];
    if (system) {
      out.push({ role: 'system', content: system });
    }

    for (const msg of messages) {
      if (msg.role === 'user') {
        // Handle tool_result arrays (Anthropic format)
        if (Array.isArray(msg.content) && msg.content[0]?.type === 'tool_result') {
          for (const tr of msg.content) {
            out.push({
              role: 'tool',
              tool_call_id: tr.tool_use_id,
              content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content),
            });
          }
        } else {
          out.push({
            role: 'user',
            content: typeof msg.content === 'string' ? msg.content
              : msg.content.map(b => b.type === 'text' ? b.text : JSON.stringify(b)).join('\n'),
          });
        }
      } else if (msg.role === 'assistant') {
        if (typeof msg.content === 'string') {
          out.push({ role: 'assistant', content: msg.content });
        } else if (Array.isArray(msg.content)) {
          // May contain text + tool_use blocks
          const textParts = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
          const toolCalls = msg.content.filter(b => b.type === 'tool_use').map(b => ({
            id: b.id,
            type: 'function',
            function: { name: b.name, arguments: JSON.stringify(b.input) },
          }));

          const assistantMsg = { role: 'assistant' };
          if (textParts) assistantMsg.content = textParts;
          if (toolCalls.length) assistantMsg.tool_calls = toolCalls;
          out.push(assistantMsg);
        }
      }
    }

    return out;
  }

  /** Anthropic tool schema → OpenAI function calling format */
  _convertTools(tools) {
    return tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description || '',
        parameters: t.input_schema || { type: 'object', properties: {} },
      },
    }));
  }

  /** OpenAI response → unified response format */
  _convertResponse(response) {
    const choice = response.choices[0];
    const content = [];

    if (choice.message.content) {
      content.push({ type: 'text', text: choice.message.content });
    }

    if (choice.message.tool_calls?.length) {
      for (const tc of choice.message.tool_calls) {
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        });
      }
    }

    const stopReason = choice.finish_reason === 'tool_calls' ? 'tool_use'
      : choice.finish_reason === 'stop' ? 'end_turn'
      : choice.finish_reason;

    return {
      content,
      stop_reason: stopReason,
      usage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0,
      },
    };
  }
}
