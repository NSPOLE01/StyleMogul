import { NextRequest, NextResponse } from 'next/server';
import { analyzeOutfit, generateEmbedding } from '@/lib/openai';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('Analyzing image...');

    // Analyze the outfit using OpenAI Vision
    const analysis = await analyzeOutfit(image);

    console.log('Analysis complete:', analysis);

    // Get authenticated user from request
    const supabase = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');

    if (authHeader) {
      try {
        // Extract token from "Bearer <token>"
        const token = authHeader.replace('Bearer ', '');

        // Verify the token and get user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (!authError && user) {
          // Upload image to Supabase Storage
          const base64Data = image.split(',')[1] || image;
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${user.id}-${Date.now()}.jpg`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('outfits')
            .upload(fileName, buffer, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false,
            });

          if (!uploadError && uploadData) {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('outfits')
              .getPublicUrl(fileName);

            // Generate embedding for the outfit
            const embeddingText = `
              Style: ${analysis.styleTags.join(', ')}
              Colors: ${analysis.colors.join(', ')}
              Description: ${analysis.description}
              Categories: ${analysis.categories.join(', ')}
            `.trim();

            const embedding = await generateEmbedding(embeddingText);

            // Save outfit to database
            const { data: outfitData, error: dbError } = await supabase
              .from('outfits')
              .insert({
                user_id: user.id,
                image_url: publicUrl,
                style_tags: analysis.styleTags,
                colors: analysis.colors,
                description: analysis.description,
                categories: analysis.categories,
                embedding: embedding,
              })
              .select()
              .single();

            if (!dbError) {
              console.log('Outfit saved to database:', outfitData);
            } else {
              console.error('Error saving outfit to database:', dbError);
            }
          } else {
            console.error('Error uploading image:', uploadError);
          }
        }
      } catch (authErr) {
        console.error('Auth error:', authErr);
        // Continue without saving - just return analysis
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    console.error('Error message:', error?.message);
    console.error('Error details:', error?.response?.data || error?.cause);

    return NextResponse.json(
      {
        error: 'Failed to analyze outfit',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
