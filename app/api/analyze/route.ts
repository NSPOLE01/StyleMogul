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

    // Analyze the outfit using OpenAI Vision
    const analysis = await analyzeOutfit(image);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze outfit' },
      { status: 500 }
    );
  }
}
