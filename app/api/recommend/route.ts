import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/openai';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { analysis } = await request.json();

    if (!analysis) {
      return NextResponse.json(
        { error: 'No analysis provided' },
        { status: 400 }
      );
    }

    // Create a text description for embedding
    const embeddingText = `
      Style: ${analysis.styleTags.join(', ')}
      Colors: ${analysis.colors.join(', ')}
      Description: ${analysis.description}
      Categories: ${analysis.categories.join(', ')}
    `.trim();

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);

    const supabase = getSupabaseAdmin();

    // Query similar items using pgvector
    // Note: This uses a simplified approach. In production, you'd use the
    // find_similar_items function from the schema
    const { data: items, error } = await supabase.rpc('find_similar_items', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 12,
    });

    if (error) {
      console.error('Supabase error:', error);
      // Fallback: return all items if vector search fails
      const { data: fallbackItems } = await supabase
        .from('items')
        .select('*')
        .eq('in_stock', true)
        .limit(12);

      return NextResponse.json({
        success: true,
        items: fallbackItems || [],
        fallback: true,
      });
    }

    return NextResponse.json({
      success: true,
      items: items || [],
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
