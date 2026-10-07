import AnthropicFoundry from '@anthropic-ai/foundry-sdk';

export interface FoundryConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
}

// Models often wrap JSON in ```json fences or add text around it, so extract the outermost object
export function parseJsonResponse<T>(response: string): T {
  const withoutFences = response.replace(/```(?:json)?/gi, '').trim();
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');

  if (start === -1 || end <= start) {
    throw new Error('Die KI-Antwort enthält kein JSON: ' + response);
  }

  return JSON.parse(withoutFences.substring(start, end + 1)) as T;
}

export type JsonSchema = { [key: string]: unknown };

export async function sendPromptToFoundry(
  config: FoundryConfig,
  prompt: string,
  schema?: JsonSchema,
  maxTokens = 2048,
): Promise<string> {
  if (!config.endpoint || !config.apiKey) {
    throw new Error('KI-Endpunkt und API-Key müssen angegeben werden.');
  }

  const client = new AnthropicFoundry({
    apiKey: config.apiKey,
    baseURL: config.endpoint,
    defaultHeaders: { 'anthropic-version': '2023-06-01' },
    // The key is entered by the user at runtime and never bundled into the frontend
    dangerouslyAllowBrowser: true,
  });

  const message = await client.messages.create({
    model: config.deploymentName,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    ...(schema ? { output_config: { format: { type: 'json_schema', schema } } } : {}),
  });

  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n');
}
