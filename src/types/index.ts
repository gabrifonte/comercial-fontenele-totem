export type ScreenId = 'totem-roleta' | 'estoque-brindes';

export interface PrizeItem {
  id: string;
  sliceNumber: number;
  name: string;
  category: string;
  sku: string;
  initialStock: number;
  currentStock: number;
  deliveredCount: number;
  color: string;
  textColor: string;
  isSpecial?: boolean;
  isActive: boolean;
  iconType?: 'trena' | 'chaves' | 'brocas' | 'vale' | 'balde' | 'bone' | 'chaveiro' | 'ferramentas';
  imageUrl?: string;
}

export interface DrawRecord {
  id: string;
  drawNumber: number;
  prizeId: string;
  prizeName: string;
  timestamp: string;
  delivered: boolean;
}
