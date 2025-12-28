import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }
  return openaiInstance;
}

export interface OutfitAnalysis {
  styleTags: string[];
  colors: string[];
  description: string;
  categories: string[];
}

/**
 * Analyzes an outfit image using OpenAI Vision API
 */
export async function analyzeOutfit(imageUrl: string): Promise<OutfitAnalysis> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this outfit image and provide:
1. Style tags (e.g., streetwear, minimalist, vintage, preppy, bohemian)
2. Main colors in the outfit
3. A brief description of the overall aesthetic
4. Clothing categories present (e.g., jacket, pants, shoes, accessories)

Respond in JSON format:
{
  "styleTags": ["tag1", "tag2", ...],
  "colors": ["color1", "color2", ...],
  "description": "description here",
  "categories": ["category1", "category2", ...]
}`
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from OpenAI response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generates an embedding vector for text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}
