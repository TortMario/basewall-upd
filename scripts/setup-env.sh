#!/bin/bash

# OneStream Setup Script
# This script helps set up the development environment

echo "🚀 OneStream Mini App Setup"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
  echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
  cp .env.local .env.local.backup
fi

# Copy example env file
echo "📝 Creating .env.local from template..."
cp .env.local.example .env.local

echo ""
echo "✅ .env.local created!"
echo ""
echo "📋 Next steps:"
echo "1. Fill in your Supabase credentials in .env.local"
echo "2. Deploy the contract: npm run deploy:contract"
echo "3. Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local"
echo "4. Run the database schema: supabase/schema.sql in your Supabase SQL editor"
echo "5. (Optional) Seed the database: npx tsx scripts/seed.ts"
echo "6. Start dev server: npm run dev"
echo ""

