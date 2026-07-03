export type PokemonCard = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  set?: {
    id: string;
    name: string;
    printedTotal?: number;
    total?: number;
  };
  images?: {
    small?: string;
    large?: string;
  };
  tcgplayer?: {
    url?: string;
    updatedAt?: string;
    prices?: Record<string, { market?: number; low?: number; mid?: number; high?: number }>;
  };
};

export type CollectionItem = {
  id: string;
  card: PokemonCard;
  quantity: number;
  condition: string;
  purchasePrice?: number;
  notes?: string;
  frontPhotoUri?: string;
  backPhotoUri?: string;
  createdAt: string;
};
