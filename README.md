# Pokemon Card Tracker

Mobile-first Pokemon card collection tracker built with Expo, React Native, Supabase, and the Pokemon TCG API.

## Current starter status

This repo now has a working first-pass mobile app shell:

- Search screen
- Card detail screen
- Add-to-collection form
- Quantity, condition, purchase price, and notes
- Front/back card photo picker
- Collection dashboard with total cards and estimated value
- Supabase database schema
- Pokemon card database sync script

Important: the first search client uses two starter cards while the UI is being built. The next issue is replacing that stub with the live Pokemon TCG API search call or with Supabase-backed search after syncing cards.

## Getting started

```bash
npm install
npm run start
```

Open the project in Expo Go or an emulator.

## Environment setup

Copy the template file and fill in your values:

```bash
cp env.example .env
```

Required later:

```txt
EXPO_PUBLIC_POKEMON_TCG_API_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase setup

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Create/confirm the `card-photos` storage bucket.
5. Add auth before connecting the collection screen to cloud persistence.

## Sync all Pokemon cards into Supabase

The `scripts/sync-pokemon-cards.mjs` script pulls cards from the Pokemon TCG API page by page and upserts them into the `cards` table.

Set temporary environment variables in PowerShell:

```powershell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
$env:POKEMON_TCG_API_KEY="your-pokemon-tcg-api-key-optional"
```

Then run:

```powershell
npm run sync:cards
```

Do not put the Supabase service role key inside the mobile app. Only use it locally for sync scripts or on a secure server.

## Recommended next build order

1. Replace starter card data with live Supabase card search.
2. Add account login.
3. Save collection items to Supabase.
4. Upload card photos to Supabase Storage.
5. Add wishlist and price refresh features.
