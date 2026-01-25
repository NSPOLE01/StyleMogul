-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Outfits table
CREATE TABLE IF NOT EXISTS public.outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  style_tags TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  description TEXT,
  categories TEXT[] DEFAULT '{}',
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

-- Policies for outfits
CREATE POLICY "Users can view their own outfits"
  ON public.outfits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outfits"
  ON public.outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfits"
  ON public.outfits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfits"
  ON public.outfits FOR DELETE
  USING (auth.uid() = user_id);

-- Items table (fashion products from curated brands)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_range TEXT, -- e.g., "$", "$$", "$$$"
  image_url TEXT NOT NULL,
  description TEXT,
  style_tags TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  embedding vector(1536),
  product_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Policies for items (public read access)
CREATE POLICY "Items are viewable by everyone"
  ON public.items FOR SELECT
  USING (true);

-- Saved items / Moodboard table
CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  outfit_id UUID REFERENCES public.outfits ON DELETE SET NULL,
  item_id UUID REFERENCES public.items ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- Policies for saved_items
CREATE POLICY "Users can view their own saved items"
  ON public.saved_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved items"
  ON public.saved_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved items"
  ON public.saved_items FOR DELETE
  USING (auth.uid() = user_id);

-- Collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Policies for collections
CREATE POLICY "Users can view their own collections"
  ON public.collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS outfits_user_id_idx ON public.outfits(user_id);
CREATE INDEX IF NOT EXISTS outfits_created_at_idx ON public.outfits(created_at DESC);
CREATE INDEX IF NOT EXISTS items_category_idx ON public.items(category);
CREATE INDEX IF NOT EXISTS items_brand_idx ON public.items(brand);
CREATE INDEX IF NOT EXISTS saved_items_user_id_idx ON public.saved_items(user_id);
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS collections_created_at_idx ON public.collections(created_at DESC);

-- Create vector similarity search indexes
CREATE INDEX IF NOT EXISTS outfits_embedding_idx ON public.outfits
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS items_embedding_idx ON public.items
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to find similar items based on outfit embedding
CREATE OR REPLACE FUNCTION find_similar_items(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL,
  filter_price_range text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  brand text,
  name text,
  category text,
  price_range text,
  image_url text,
  description text,
  style_tags text[],
  colors text[],
  product_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    items.id,
    items.brand,
    items.name,
    items.category,
    items.price_range,
    items.image_url,
    items.description,
    items.style_tags,
    items.colors,
    items.product_url,
    1 - (items.embedding <=> query_embedding) as similarity
  FROM public.items
  WHERE
    (filter_category IS NULL OR items.category = filter_category)
    AND (filter_price_range IS NULL OR items.price_range = filter_price_range)
    AND items.in_stock = true
    AND 1 - (items.embedding <=> query_embedding) > match_threshold
  ORDER BY items.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Insert some sample items (you can customize these)
INSERT INTO public.items (brand, name, category, price_range, image_url, description, style_tags, colors) VALUES
  ('Everlane', 'Organic Cotton Tee', 'tops', '$', 'https://placehold.co/400x500/f5f5f4/a8a29e?text=Organic+Tee', 'Classic minimalist tee in organic cotton', ARRAY['minimalist', 'casual', 'basics'], ARRAY['white', 'black', 'gray']),
  ('Reformation', 'Vintage Floral Dress', 'dresses', '$$', 'https://placehold.co/400x500/fce8e6/e35e52?text=Floral+Dress', 'Sustainable floral midi dress with vintage vibes', ARRAY['vintage', 'bohemian', 'sustainable'], ARRAY['pink', 'green', 'floral']),
  ('Nike', 'Air Max Sneakers', 'shoes', '$$', 'https://placehold.co/400x500/e7e5e4/57534e?text=Air+Max', 'Iconic streetwear sneakers', ARRAY['streetwear', 'athletic', 'casual'], ARRAY['white', 'black', 'red']),
  ('Levi''s', '501 Original Jeans', 'bottoms', '$$', 'https://placehold.co/400x500/d6d3d1/44403c?text=501+Jeans', 'Classic straight-leg denim jeans', ARRAY['classic', 'vintage', 'casual'], ARRAY['blue', 'black', 'denim']),
  ('Mango', 'Oversized Blazer', 'outerwear', '$$', 'https://placehold.co/400x500/f5f5f4/78716c?text=Blazer', 'Modern oversized tailored blazer', ARRAY['preppy', 'minimalist', 'professional'], ARRAY['beige', 'black', 'gray'])
ON CONFLICT DO NOTHING;
