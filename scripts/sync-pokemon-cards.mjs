import { writeFileSync } from 'node:fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY;

const PAGE_SIZE = 250;
const POKEMON_API_URL = 'https://api.pokemontcg.io/v2/cards';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

function getMarketPrice(card) {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  for (const price of Object.values(prices)) {
    if (typeof price.market === 'number') return price.market;
  }

  return null;
}

function mapCard(card) {
  return {
    pokemon_tcg_id: card.id,
    name: card.name,
    set_id: card.set?.id ?? null,
    set_name: card.set?.name ?? null,
    card_number: card.number ?? null,
    rarity: card.rarity ?? null,
    image_small: card.images?.small ?? null,
    image_large: card.images?.large ?? null,
    market_price: getMarketPrice(card),
    raw_data: card,
    updated_at: new Date().toISOString(),
  };
}

async function fetchCardsPage(page) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    orderBy: 'set.releaseDate,number',
  });

  const headers = POKEMON_TCG_API_KEY ? { 'X-Api-Key': POKEMON_TCG_API_KEY } : {};
  const response = await fetch(`${POKEMON_API_URL}?${params.toString()}`, { headers });

  if (!response.ok) {
    throw new Error(`Pokemon TCG API failed on page ${page}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function upsertCards(cards) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/cards?on_conflict=pokemon_tcg_id`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(cards.map(mapCard)),
  });

  if (!response.ok) {
    throw new Error(`Supabase upsert failed: ${response.status} ${await response.text()}`);
  }
}

async function main() {
  let page = 1;
  let synced = 0;
  let totalCount = null;

  while (true) {
    const result = await fetchCardsPage(page);
    const cards = result.data ?? [];

    if (totalCount === null) totalCount = result.totalCount ?? null;
    if (cards.length === 0) break;

    await upsertCards(cards);
    synced += cards.length;

    console.log(`Synced page ${page}: ${cards.length} cards. Total synced: ${synced}${totalCount ? ` / ${totalCount}` : ''}`);

    if (cards.length < PAGE_SIZE) break;
    page += 1;
  }

  writeFileSync('last-card-sync.json', JSON.stringify({ synced, totalCount, finishedAt: new Date().toISOString() }, null, 2));
  console.log(`Done. Synced ${synced} cards.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
