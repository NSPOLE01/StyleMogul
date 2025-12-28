'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navigation from '@/components/navigation';
import UploadDropzone from '@/components/ui/upload-dropzone';
import StyleTag from '@/components/ui/style-tag';
import ColorSwatch from '@/components/ui/color-swatch';
import ItemCard from '@/components/ui/item-card';

interface AnalysisResult {
  styleTags: string[];
  colors: string[];
  description: string;
  categories: string[];
}

interface RecommendedItem {
  id: string;
  brand: string;
  name: string;
  category: string;
  price_range: string;
  image_url: string;
  description: string;
  similarity: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Auto-analyze
    await analyzeOutfit(file);
  };

  const analyzeOutfit = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Call analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data.analysis);

      // Get recommendations
      await getRecommendations(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendations = async (analysisData: AnalysisResult) => {
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: analysisData }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.items);
    } catch (err) {
      console.error('Recommendation error:', err);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
    });
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Upload Your Outfit
          </h1>
          <p className="text-neutral-600">
            Share a photo of an outfit you love and discover matching items
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            {!previewUrl ? (
              <UploadDropzone
                onFileSelect={handleFileSelect}
                isUploading={isAnalyzing}
              />
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-neutral-100">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Reset button */}
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    setAnalysis(null);
                    setRecommendations([]);
                  }}
                  className="w-full bg-neutral-200 text-neutral-900 px-6 py-3 rounded-full font-semibold hover:bg-neutral-300 transition-colors"
                >
                  Upload Different Photo
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}
          </div>

          {/* Analysis Section */}
          <div>
            {isAnalyzing ? (
              <div className="bg-white rounded-3xl p-8 shadow-soft text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-neutral-600">Analyzing your outfit...</p>
              </div>
            ) : analysis ? (
              <div className="bg-white rounded-3xl p-6 shadow-soft space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-3">
                    Style Analysis
                  </h2>
                  <p className="text-neutral-700 mb-4">{analysis.description}</p>

                  {/* Style Tags */}
                  {analysis.styleTags.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-neutral-600 mb-2">
                        Style Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.styleTags.map((tag) => (
                          <StyleTag key={tag} label={tag} variant="primary" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {analysis.categories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-neutral-600 mb-2">
                        Items Detected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.categories.map((cat) => (
                          <StyleTag key={cat} label={cat} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  {analysis.colors.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600 mb-2">
                        Color Palette
                      </p>
                      <div className="flex gap-2">
                        {analysis.colors.map((color, i) => (
                          <ColorSwatch key={i} color={color} size="lg" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 shadow-soft text-center text-neutral-500">
                Upload a photo to see AI analysis
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">
              Recommended Items
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendations.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  brand={item.brand}
                  name={item.name}
                  category={item.category}
                  priceRange={item.price_range}
                  imageUrl={item.image_url}
                  description={item.description}
                  similarity={item.similarity}
                  onSave={(id) => console.log('Save item:', id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
