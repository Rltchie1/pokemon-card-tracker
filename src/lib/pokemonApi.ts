import type { PokemonCard } from '../types';

export function getMarketPrice(card: PokemonCard): number | undefined {
  const prices = card.tcgplayer?.prices;
  if (!prices) return undefined;
  for (const price of Object.values(prices)) {
    if (typeof price.market === 'number') return price.market;
  }
  return undefined;
}

export async function searchPokemonCards(query: string): Promise<PokemonCard[]> {
  const cleanedQuery = query.trim().toLowerCase();
  if (!cleanedQuery) return [];

  // Replace this starter data with a live Pokemon TCG API call after the UI is working.
  const starterCards: PokemonCard[] = [
    {
      id: 'base1-4',
      name: 'Charizard',
      number: '4',
      rarity: 'Rare Holo',
      set: { id: 'base1', name: 'Base Set' },
      images: {
        small: 'https://images.pokemontcg.io/base1/4.png',
        large: 'https://images.pokemontcg.io/base1/4_hires.png'
      },
      tcgplayer: { prices: { holofoil: { market: 399.99 } } }
    },
    {
      id: 'base1-2',
      name: 'Blastoise',
      number: '2',
      rarity: 'Rare Holo',
      set: { id: 'base1', name: 'Base Set' },
      images: {
        small: 'https://images.pokemontcg.io/base1/2.png',
        large: 'https://images.pokemontcg.io/base1/2_hires.png'
      },
      tcgplayer: { prices: { holofoil: { market: 149.99 } } }
    }
  ];

  return starterCards.filter((card) => card.name.toLowerCase().includes(cleanedQuery));
}
