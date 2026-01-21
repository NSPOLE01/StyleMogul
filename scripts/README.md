# Bulk Import Items Script

This script allows you to bulk import fashion items into your database using a CSV file.

## CSV Format

Your CSV file should have the following columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `brand` | Yes | Brand name | Nike, Zara, Everlane |
| `name` | Yes | Product name | Air Max 90, Classic Tee |
| `category` | Yes | Product category | shoes, tops, dresses, pants, outerwear |
| `price_range` | Yes | Price tier | $, $$, $$$, $$$$ |
| `image_url` | Yes | URL to product image | https://example.com/image.jpg |
| `product_url` | No | Link to product page | https://nike.com/air-max-90 |
| `style_tags` | No | Semicolon-separated tags | casual;athletic;streetwear |

**Note:** If `style_tags` is omitted, GPT-4 Vision will generate them automatically.

## Example CSV

```csv
brand,name,category,price_range,image_url,product_url,style_tags
Nike,Air Max 90,shoes,$$,https://example.com/image.jpg,https://nike.com/air-max-90,casual;athletic;streetwear
Everlane,Organic Cotton Tee,tops,$,https://example.com/image.jpg,https://everlane.com/cotton-tee,minimalist;casual;basics
```

See `sample-items.csv` for a complete example.

## How It Works

1. **Reads your CSV file** - Parses product data
2. **Analyzes images** - Uses GPT-4 Vision to generate descriptions
3. **Generates embeddings** - Creates vector embeddings for recommendations
4. **Inserts into database** - Saves all data to Supabase

## Usage

### Step 1: Prepare your CSV file
Create a CSV file with your product data following the format above.

### Step 2: Start your dev server
```bash
npm run dev
```

### Step 3: Run the import script
```bash
node scripts/import-items.js path/to/your/items.csv
```

Example:
```bash
node scripts/import-items.js scripts/my-products.csv
```

## Processing Details

- Items are processed in batches of 50
- Each item takes ~1-2 seconds to process
- Progress is logged to the console
- Failed items are reported with error messages

## Cost Estimate

For 200 items:
- GPT-4 Vision: ~$1.00
- Embeddings: ~$0.00
- **Total: ~$1-2**

## Tips

- Use placeholder images during testing (e.g., `https://placehold.co/400x500`)
- For real products, ensure image URLs are publicly accessible
- The script has a 100ms delay between items to avoid rate limits
- Check console output for any errors

## Troubleshooting

**"File not found" error:**
- Make sure the CSV path is correct
- Use relative or absolute paths

**API errors:**
- Ensure your dev server is running on `localhost:3000`
- Check that `OPENAI_API_KEY` is set in `.env.local`

**Image analysis fails:**
- Verify image URLs are publicly accessible
- Script will use fallback description if vision fails
