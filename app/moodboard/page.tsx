'use client';

import Link from 'next/link';
import { useState } from 'react';
import Navigation from '@/components/navigation';
import ProtectedRoute from '@/components/protected-route';
import OutfitCard from '@/components/ui/outfit-card';
import ItemCard from '@/components/ui/item-card';

// Mock data - replace with actual Supabase queries
const mockOutfits = [
  {
    id: '1',
    imageUrl: 'https://placehold.co/400x600/f5f5f4/a8a29e?text=Outfit+1',
    styleTags: ['minimalist', 'casual'],
    colors: ['white', 'black', 'gray'],
    description: 'Clean and simple everyday look',
  },
  {
    id: '2',
    imageUrl: 'https://placehold.co/400x600/fce8e6/e35e52?text=Outfit+2',
    styleTags: ['vintage', 'bohemian'],
    colors: ['pink', 'floral', 'green'],
    description: 'Vintage floral dress with bohemian vibes',
  },
];

const mockSavedItems = [
  {
    id: '1',
    brand: 'Everlane',
    name: 'Organic Cotton Tee',
    category: 'tops',
    price_range: '$',
    image_url: 'https://placehold.co/400x500/f5f5f4/a8a29e?text=Organic+Tee',
    description: 'Classic minimalist tee in organic cotton',
    style_tags: ['minimalist', 'casual', 'basics'],
  },
  {
    id: '2',
    brand: 'Reformation',
    name: 'Vintage Floral Dress',
    category: 'dresses',
    price_range: '$$',
    image_url: 'https://placehold.co/400x500/fce8e6/e35e52?text=Floral+Dress',
    description: 'Sustainable floral midi dress',
    style_tags: ['vintage', 'bohemian'],
  },
];

export default function MoodboardPage() {
  const [activeTab, setActiveTab] = useState<'outfits' | 'items'>('outfits');

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-neutral-50">
        <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Your Moodboard
          </h1>
          <p className="text-neutral-600">
            All your saved outfits and favorite items in one place
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('outfits')}
            className={`pb-4 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'outfits'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            My Outfits ({mockOutfits.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-4 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'items'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Saved Items ({mockSavedItems.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'outfits' ? (
          mockOutfits.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockOutfits.map((outfit) => (
                <OutfitCard key={outfit.id} {...outfit} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No outfits yet
              </h3>
              <p className="text-neutral-600 mb-6">
                Upload your first outfit to get started
              </p>
              <Link
                href="/upload"
                className="inline-block bg-primary-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 transition-colors"
              >
                Upload Outfit
              </Link>
            </div>
          )
        ) : (
          mockSavedItems.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockSavedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  brand={item.brand}
                  name={item.name}
                  category={item.category}
                  priceRange={item.price_range}
                  imageUrl={item.image_url}
                  description={item.description}
                  styleTags={item.style_tags}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No saved items yet
              </h3>
              <p className="text-neutral-600 mb-6">
                Upload an outfit to discover items you'll love
              </p>
              <Link
                href="/upload"
                className="inline-block bg-primary-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 transition-colors"
              >
                Start Discovering
              </Link>
            </div>
          )
        )}
      </div>
    </main>
    </ProtectedRoute>
  );
}
