export interface GameMeta {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  genre: string;
  logo: string;
  banner: string;
  releaseYear: number;
  tags: string[];
  affiliateLinks?: {
    pcEmulator?: string;
    topUpDiscount?: string;
    officialStore?: string;
  };
}

export interface HeroSkillBreakthrough {
  level: number;
  title: string;
  description: string;
}

export interface HeroSkillBadge {
  level: number;
  badgeName?: string;
  description: string;
}

export interface HeroSkill {
  name: string;
  type?: 'ultimate' | 'active' | 'passive' | 'talent';
  icon?: string;
  description: string;
  cooldown?: string;
  energyCost?: string;
  breakthrough?: HeroSkillBreakthrough;
  badge?: HeroSkillBadge;
  skinEffect?: string;
}

export interface HeroRebirthForm {
  slug: string;
  name: string;
  avatar: string;
  rarity: string;
  role: string;
  overview?: string;
}

export interface BaseHeroRef {
  id?: string;
  slug: string;
  name: string;
  avatar: string;
  rarity?: string;
  role?: string;
}

export interface HeroSkin {
  id?: string;
  slug: string;
  name: string;
  avatar: string;
  fullArt?: string;
  costItem?: string;
  costAmount?: number;
  costIcon?: string;
  refreshCostItem?: string;
  refreshCostAmount?: number;
  overview?: string;
  skillEnhancements?: Array<{
    skillName: string;
    description: string;
  }>;
}

export interface AfterlifeMaterial {
  name: string;
  icon: string;
  amount: number;
  type: 'item' | 'hero';
}

export interface DestinyPartner {
  name: string;
  slug: string;
  avatar: string;
}

export interface DestinyItem {
  name: string;
  effect: string;
  heroes: DestinyPartner[];
}

export interface Hero {
  id: string;
  slug: string;
  name: string;
  title: string;
  gameSlug: string;
  avatar: string;
  fullArt?: string;
  element: string; // e.g. "Vũ Trụ", "Công Nghệ", "Siêu Nhiên", "Vật Lý"
  isAfterlifeForm?: boolean;
  isSkinForm?: boolean;
  rarity: 'UR' | 'SSR' | 'SR' | 'R';
  role: 'Tanker' | 'DPS Đơn' | 'DPS AoE' | 'Khống Chế' | 'Hỗ Trợ';
  tier: 'S+' | 'S' | 'A' | 'B' | 'C';
  overview?: string;
  skills: HeroSkill[];
  afterlifeForms?: HeroRebirthForm[];
  baseHero?: BaseHeroRef; // Lối tắt về tướng mặc định (đối với tướng chuyển thế)
  skins?: HeroSkin[];
  afterlifeRequirementsText?: string;
  afterlifeMaterials?: AfterlifeMaterial[];
  destiny?: DestinyItem[];
  exclusiveBadge?: {
    name: string;
    icon: string;
    maxLevel: number;
  };
  effects?: string[];
  recommendedGears?: {
    setName: string;
    description: string;
  }[];
  statPriorities?: string[];
  bestSynergies?: string[]; // Tên hoặc slug tướng kết hợp
  counters?: string[]; // Tướng bị khắc chế / khắc chế
  breakthroughSimData?: BreakthroughSimItem[];
  superEvoSimData?: SuperEvoSimItem[];
}

export interface BreakthroughSimMaterial {
  name: string;
  icon: string;
  amount: number;
  type: 'item' | 'hero';
}

export interface BreakthroughSimItem {
  level: number;
  title: string;
  tierName: string;
  auraColor: string;
  skillName: string;
  skillIcon: string;
  skillDesc: string;
  materials: BreakthroughSimMaterial[];
  starsCount?: number;
  moonsCount?: number;
}

export interface SuperEvoMaterial {
  name: string;
  icon: string;
  slug?: string;
  cardId?: string;
}

export interface SuperEvoSimItem {
  level: number;
  tierLabel?: string;
  frame?: string;
  nameplateColor?: string;
  materials: SuperEvoMaterial[];
  statBonus: string;
  unlockedSkill?: string | null;
  unlockedSkillIcon?: string | null;
}

export interface TierListItem {
  heroSlug: string;
  name: string;
  avatar: string;
  element: string;
  rarity: string;
  role: string;
  note?: string;
  description?: string;
}

export interface TierGroup {
  id: string;
  name: string;
  color: string;
  description?: string;
  heroes: TierListItem[];
}

export interface TierListData {
  tiers?: TierGroup[];
  overall?: Record<string, TierListItem[]>;
  pvp?: Record<string, TierListItem[]>;
  pve?: Record<string, TierListItem[]>;
  boss?: Record<string, TierListItem[]>;
}

export interface Giftcode {
  code: string;
  rewards: string;
  expiration: string;
  status: 'active' | 'expired';
  serverNote?: string;
}

export interface MetaLineup {
  id: string;
  name: string;
  archetype: 'Dồn Sát Thương' | 'Khống Chế Bền Bỉ' | 'Phản Sát Thương' | 'F2P Nông Dân';
  description: string;
  heroes: {
    heroSlug: string;
    name: string;
    avatar: string;
    position: 'Tiền Tuyến' | 'Hậu Phương';
  }[];
  strengths: string[];
  weaknesses: string[];
}
