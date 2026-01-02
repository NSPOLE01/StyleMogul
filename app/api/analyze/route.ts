import { NextRequest, NextResponse } from 'next/server';
import { analyzeOutfit } from '@/lib/openai';

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
