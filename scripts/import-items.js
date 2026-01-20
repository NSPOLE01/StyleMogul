/**
 * Bulk Import Items Script
 *
 * Usage:
 * 1. Create a CSV file with your product data (see example below)
 * 2. Run: node scripts/import-items.js path/to/your/items.csv
 *
 * CSV Format:
 * brand,name,category,price_range,image_url,style_tags
 * Nike,Air Max 90,shoes,$$,https://example.com/image.jpg,casual;athletic;streetwear
 *
 * Note: style_tags is optional (semicolon separated)
 */

const fs = require('fs');
const path = require('path');

async function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const item = {};

    headers.forEach((header, index) => {
      item[header.trim()] = values[index]?.trim() || '';
    });

    items.push(item);
  }

  return items;
}

async function importItems(csvPath) {
  console.log('Reading CSV file...');
  const items = await parseCSV(csvPath);
  console.log(`Found ${items.length} items to import`);

  // Split into batches of 50 to avoid timeouts
  const batchSize = 50;
  const batches = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  console.log(`Processing in ${batches.length} batch(es)...`);

  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < batches.length; i++) {
    console.log(`\nProcessing batch ${i + 1}/${batches.length}...`);

    const response = await fetch('http://localhost:3000/api/bulk-import-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: batches[i] }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`Batch ${i + 1} complete:`);
      console.log(`  ✓ Success: ${result.results.success}`);
      console.log(`  ✗ Failed: ${result.results.failed}`);

      if (result.results.errors.length > 0) {
        console.log('  Errors:');
        result.results.errors.forEach(err => console.log(`    - ${err}`));
      }

      totalSuccess += result.results.success;
      totalFailed += result.results.failed;
    } else {
      console.error(`Batch ${i + 1} failed:`, result.error);
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total Success: ${totalSuccess}`);
  console.log(`Total Failed: ${totalFailed}`);
}

// Get CSV path from command line argument
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: node scripts/import-items.js path/to/items.csv');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  process.exit(1);
}

importItems(csvPath).catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
