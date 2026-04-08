/**
 * Google Gemini Provider
 * Handles: Gemini 2.5 Pro/Flash, Gemini 3.x
 * Uses the @google/genai SDK with function calling support.
 */
import { GoogleGenAI } from '@google/genai';
import { BaseProvider } from './base.js';

export class GoogleProvider extends BaseProvider {
  constructor() {
    super('google');
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY not set in environment');
    this.client = new GoogleGenAI({ apiKey });
  }

  async chatCompletion({ model, system, messages, tools, maxTokens }) {
    const geminiContents = this._convertMessages(messages);
    const geminiTools = tools?.length ? this._convertTools(tools) : undefined;

    const config = {
      maxOutputTokens: maxTokens || 8096,
    };
    if (system) config.systemInstruction = system;
    if (geminiTools) config.tools = geminiTools;

    const response = await this.client.models.generateContent({
      model,
      contents: geminiContents,
      config,
    });

    return this._convertResponse(response);
  }

  /** Anthropic messages → Gemini contents */
  _convertMessages(messages) {
    const contents = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        if (Array.isArray(msg.content) && msg.content[0]?.type === 'tool_result') {
          // Tool results → functionResponse parts
          const parts = msg.content.map(tr => ({
            functionResponse: {
              name: tr._toolName || 'tool',
              response: JSON.parse(typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content)),
            },
          }));
          contents.push({ role: 'user', parts });
        } else {
          const text = typeof msg.content === 'string' ? msg.content
            : msg.content.map(b => b.type === 'text' ? b.text : JSON.stringify(b)).join('\n');
          contents.push({ role: 'user', parts: [{ text }] });
        }
      } else if (msg.role === 'assistant') {
        if (typeof msg.content === 'string') {
          contents.push({ role: 'model', parts: [{ text: msg.content }] });
        } else if (Array.isArray(msg.content)) {
          const parts = [];
          for (const block of msg.content) {
            if (block.type === 'text') {
              parts.push({ text: block.text });
            } else if (block.type === 'tool_use') {
              parts.push({
                functionCall: { name: block.name, args: block.input },
              });
            }
          }
          contents.push({ role: 'model', parts });
        }
      }
    }

    return contents;
  }

  /** Anthropic tool schema → Gemini function declarations */
  _convertTools(tools) {
    return [{
      functionDeclarations: tools.map(t => {
        const params = { ...t.input_schema };
        // Gemini doesn't allow 'additionalProperties' at top level in some cases
        delete params.additionalProperties;
        return {
          name: t.name,
          description: t.description || '',
          parameters: Object.keys(params.properties || {}).length ? params : undefined,
        };
      }),
    }];
  }

  /** Gemini response → unified format */
  _convertResponse(response) {
    const content = [];
    const candidate = response.candidates?.[0];
    if (!candidate) {
      return { content: [{ type: 'text', text: '' }], stop_reason: 'end_turn', usage: { input_tokens: 0, output_tokens: 0 } };
    }

    let hasToolCalls = false;
    for (const part of candidate.content?.parts || []) {
      if (part.text) {
        content.push({ type: 'text', text: part.text });
      }
      if (part.functionCall) {
        hasToolCalls = true;
        content.push({
          type: 'tool_use',
          id: `call_${Math.random().toString(36).slice(2, 14)}`,
          name: part.functionCall.name,
          input: part.functionCall.args || {},
        });
      }
    }

    return {
      content,
      stop_reason: hasToolCalls ? 'tool_use' : 'end_turn',
      usage: {
        input_tokens: response.usageMetadata?.promptTokenCount || 0,
        output_tokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }
}
