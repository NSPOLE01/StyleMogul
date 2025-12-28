# StyleMogul - AI-Powered Fashion Discovery

An AI-powered web app that analyzes outfit photos and recommends matching fashion items from curated brands.

## Features

- **AI Outfit Analysis**: Upload photos and get instant AI analysis of style, colors, and aesthetic
- **Smart Recommendations**: Vector similarity search powered by pgvector to find matching items
- **Moodboard**: Save outfits and favorite items in your personal collection
- **Beautiful UI**: Pinterest/Depop-inspired design with smooth animations

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Server Actions)
- **Database**: Supabase (Postgres + pgvector + Storage)
- **AI**: OpenAI GPT-4o (Vision) + text-embedding-3-small
- **Auth**: Supabase Auth (ready to implement)

## Project Structure

```
stylemogul/
├── app/
│   ├── api/
│   │   ├── analyze/          # AI vision analysis endpoint
│   │   └── recommend/        # Recommendation engine
│   ├── upload/               # Upload & analyze page
│   ├── moodboard/            # Saved items page
│   ├── layout.tsx
│   ├── page.tsx              # Home page
│   └── globals.css
├── components/
│   └── ui/
│       ├── upload-dropzone.tsx
│       ├── outfit-card.tsx
│       ├── item-card.tsx
│       ├── style-tag.tsx
│       └── color-swatch.tsx
├── lib/
│   ├── supabase.ts           # Supabase client & types
│   └── openai.ts             # OpenAI helpers
├── supabase-schema.sql       # Database schema
└── package.json
```

## Getting Started

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Enable pgvector extension (should be auto-enabled by the schema)
4. Get your project URL and API keys from Settings > API

### 2. Set up OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Make sure you have access to GPT-4o (Vision) and embeddings

### 3. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

### 1. Upload Flow

1. User uploads an outfit photo
2. Image is sent to `/api/analyze`
3. OpenAI Vision analyzes:
   - Style tags (e.g., "minimalist", "streetwear")
   - Color palette
   - Clothing categories
   - Overall aesthetic description

### 2. Recommendation Flow

1. Analysis data is sent to `/api/recommend`
2. Generate text embedding from analysis
3. Query Supabase using pgvector similarity search
4. Return top matching items with similarity scores

### 3. Vector Similarity

- Each outfit analysis generates a 1536-dim embedding
- Items in the catalog have pre-computed embeddings
- pgvector finds items with similar embeddings (cosine similarity)
- Results are ranked by match percentage

## Database Schema

### Tables

- **profiles**: User profiles (extends Supabase auth)
- **outfits**: Uploaded outfit photos with analysis
- **items**: Fashion product catalog with embeddings
- **saved_items**: User's saved items (moodboard)

### Key Features

- Row Level Security (RLS) policies
- Vector indexes for fast similarity search
- `find_similar_items()` function for recommendations

## Adding Items to Catalog

The schema includes sample items. To add more:

```sql
INSERT INTO items (brand, name, category, price_range, image_url, description, style_tags, colors)
VALUES (
  'Brand Name',
  'Product Name',
  'category',
  '$$',
  'https://image-url.com',
  'Description',
  ARRAY['tag1', 'tag2'],
  ARRAY['color1', 'color2']
);
```

Then generate embeddings (see `lib/openai.ts`).

## Next Steps

### MVP Enhancements
- [ ] Add Supabase Auth (signup/login)
- [ ] Save outfits to database
- [ ] Implement saved items functionality
- [ ] Upload images to Supabase Storage
- [ ] Add filters (price, category, brand)
- [ ] Pagination for recommendations

### Future Features
- [ ] Share outfits with friends
- [ ] Social feed of outfit inspirations
- [ ] Direct product links to brand sites
- [ ] Outfit remix suggestions
- [ ] Style profile & personalization
- [ ] Mobile app (React Native)

## Design System

### Colors
- **Primary**: Coral/Pink tones (#e35e52)
- **Neutral**: Stone grays
- **Background**: Off-white (#fafaf9)

### Components
- Rounded corners (rounded-3xl, rounded-full)
- Soft shadows
- Hover animations (scale, shadow)
- Mobile-first responsive grid

## Contributing

This is a starter template. Feel free to customize:
- Adjust the color scheme in `tailwind.config.ts`
- Modify analysis prompts in `lib/openai.ts`
- Add new components in `components/ui/`
- Extend the database schema

## License

MIT
