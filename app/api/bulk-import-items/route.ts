import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CSVItem {
  brand: string;
  name: string;
  category: string;
  price_range: string;
  image_url: string;
  style_tags?: string; // Optional - semicolon separated
}

async function analyzeProductImage(imageUrl: string, productName: string): Promise<{
  description: string;
  styleTags: string[];
  colors: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this fashion product image for "${productName}". Provide:
1. A detailed 2-3 sentence product description
2. 3-5 style tags (e.g., casual, formal, vintage, minimalist, bohemian, athletic, etc.)
3. The dominant colors in the product (2-4 colors, using common color names like black, white, navy, beige, red, etc.)

Format your response as JSON:
{
  "description": "your description here",
  "styleTags": ["tag1", "tag2", "tag3"],
  "colors": ["color1", "color2"]
}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low', // Use low detail to save costs
              },
            },
          ],
        },
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    return {
      description: parsed.description,
      styleTags: parsed.styleTags,
      colors: parsed.colors || [],
    };
  } catch (error) {
    console.error('Error analyzing product image:', error);
    // Fallback to generic description
    return {
      description: `${productName} - a stylish fashion item`,
      styleTags: ['fashion', 'style'],
      colors: [],
    };
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request. Expected an array of items.' },
        { status: 400 }
      );
    }

    console.log(`Starting bulk import of ${items.length} items...`);

    const supabase = getSupabaseAdmin();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process items one by one to avoid rate limits
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as CSVItem;

      try {
        console.log(`Processing item ${i + 1}/${items.length}: ${item.name}`);

        // Analyze image with GPT-4 Vision
        const analysis = await analyzeProductImage(item.image_url, item.name);

        // Use provided style tags or generated ones
        const styleTags = item.style_tags
          ? item.style_tags.split(';').map(tag => tag.trim())
          : analysis.styleTags;

        // Generate embedding
        const embeddingText = `
          Brand: ${item.brand}
          Product: ${item.name}
          Category: ${item.category}
          Style: ${styleTags.join(', ')}
          Colors: ${analysis.colors.join(', ')}
          Description: ${analysis.description}
        `.trim();

        const embedding = await generateEmbedding(embeddingText);

        // Insert into database
        const { error: insertError } = await supabase.from('items').insert({
          brand: item.brand,
          name: item.name,
          category: item.category,
          price_range: item.price_range,
          image_url: item.image_url,
          description: analysis.description,
          style_tags: styleTags,
          colors: analysis.colors,
          embedding: embedding,
          in_stock: true,
        });

        if (insertError) {
          throw insertError;
        }

        results.success++;
        console.log(`✓ Successfully imported: ${item.name}`);

        // Add a small delay to avoid rate limits (optional)
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to import "${item.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(`Bulk import complete. Success: ${results.success}, Failed: ${results.failed}`);

    return NextResponse.json({
      message: 'Bulk import completed',
      results,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
