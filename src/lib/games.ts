import fs from 'fs';
import path from 'path';
import { GameMeta, Hero, TierListData, Giftcode, GuideArticle, GameActivity, GameItem, ItemCategory } from '@/types/game';

const CONTENT_DIR = path.join(process.cwd(), 'content/games');

export function getAllGames(): GameMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const folders = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const games: GameMeta[] = [];
  for (const folder of folders) {
    const metaPath = path.join(CONTENT_DIR, folder, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const raw = fs.readFileSync(metaPath, 'utf-8');
        games.push(JSON.parse(raw));
      } catch (err) {
        console.error(`Error reading meta for ${folder}:`, err);
      }
    }
  }
  return games;
}

export function getGameMeta(slug: string): GameMeta | null {
  const metaPath = path.join(CONTENT_DIR, slug, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  } catch {
    return null;
  }
}

export function getGameHeroes(gameSlug: string, options?: { includeAfterlife?: boolean; includeSkins?: boolean }): Hero[] {
  const heroesDir = path.join(CONTENT_DIR, gameSlug, 'heroes');
  if (!fs.existsSync(heroesDir)) return [];
  const files = fs.readdirSync(heroesDir).filter(f => f.endsWith('.json'));
  const heroes: Hero[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(heroesDir, file), 'utf-8');
      const data: Hero = JSON.parse(raw);
      // Lọc bỏ tướng chuyển thế và trang phục skin ở thư viện ngoài
      if (!options?.includeAfterlife && data.isAfterlifeForm) {
        continue;
      }
      if (!options?.includeSkins && data.isSkinForm) {
        continue;
      }
      heroes.push(data);
    } catch (err) {
      console.error(`Error reading hero ${file}:`, err);
    }
  }
  return heroes;
}

export function getHeroBySlug(gameSlug: string, heroSlugOrId: string): Hero | null {
  let hero: Hero | null = null;
  const directPath = path.join(CONTENT_DIR, gameSlug, 'heroes', `${heroSlugOrId}.json`);
  if (fs.existsSync(directPath)) {
    try {
      hero = JSON.parse(fs.readFileSync(directPath, 'utf-8'));
    } catch {
      return null;
    }
  } else {
    // Tra cứu linh hoạt theo id hoặc slug
    const heroes = getGameHeroes(gameSlug, { includeAfterlife: true, includeSkins: true });
    hero = heroes.find(h => h.id === heroSlugOrId || h.slug === heroSlugOrId) || null;
  }

  if (hero && (hero.isAfterlifeForm || hero.isSkinForm) && !hero.baseHero) {
    const baseHeroes = getGameHeroes(gameSlug, { includeAfterlife: false, includeSkins: false });
    const base = baseHeroes.find(h => 
      h.afterlifeForms?.some(af => af.slug === hero?.slug) ||
      h.skins?.some(s => s.slug === hero?.slug) ||
      (hero?.slug.startsWith('ct-') && h.slug === hero?.slug.replace(/^ct-/, ''))
    );
    if (base) {
      hero.baseHero = {
        id: base.id,
        slug: base.slug,
        name: base.name,
        avatar: base.avatar,
        rarity: base.rarity,
        role: base.role,
      };
    }
  }

  return hero;
}

export function getTierList(gameSlug: string): TierListData | null {
  const tierPath = path.join(CONTENT_DIR, gameSlug, 'tier-list.json');
  if (!fs.existsSync(tierPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(tierPath, 'utf-8'));
  } catch {
    return null;
  }
}

export function getGiftcodes(gameSlug: string): Giftcode[] {
  const codePath = path.join(CONTENT_DIR, gameSlug, 'giftcodes.json');
  if (!fs.existsSync(codePath)) return [];
  try {
    const list: Giftcode[] = JSON.parse(fs.readFileSync(codePath, 'utf-8'));
    const now = new Date();
    const currentYear = now.getFullYear();

    // Tự động kiểm tra hạn sử dụng và cập nhật status
    return list.map((item) => {
      if (item.status === 'expired') return item;
      const str = (item.expiration || '').trim().toLowerCase();
      if (
        str.includes('vô thời hạn') ||
        str.includes('vô hạn') ||
        str.includes('không') ||
        str.includes('có hạn')
      ) {
        return item;
      }

      // DD/MM/YYYY
      const fullDate = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (fullDate) {
        const day = parseInt(fullDate[1], 10);
        const month = parseInt(fullDate[2], 10) - 1;
        let year = parseInt(fullDate[3], 10);
        if (year < 100) year += 2000;
        const expDate = new Date(year, month, day, 23, 59, 59);
        if (now > expDate) {
          return { ...item, status: 'expired' as const };
        }
      }

      // DD/MM
      const shortDate = str.match(/(\d{1,2})[\/\-](\d{1,2})/);
      if (shortDate) {
        const day = parseInt(shortDate[1], 10);
        const month = parseInt(shortDate[2], 10) - 1;
        const expDate = new Date(currentYear, month, day, 23, 59, 59);
        if (now > expDate) {
          return { ...item, status: 'expired' as const };
        }
      }

      return item;
    });
  } catch {
    return [];
  }
}

export function getGameResources(gameSlug: string): import('@/types/game').ResourceItem[] {
  const resPath = path.join(CONTENT_DIR, gameSlug, 'resources.json');
  if (!fs.existsSync(resPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(resPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function getGameResourceSources(gameSlug: string): import('@/types/game').ResourceSource[] {
  const srcPath = path.join(CONTENT_DIR, gameSlug, 'resource_sources.json');
  if (!fs.existsSync(srcPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function getGameGuides(gameSlug: string): GuideArticle[] {
  const guidesDir = path.join(CONTENT_DIR, gameSlug, 'guides');
  if (!fs.existsSync(guidesDir)) return [];
  const files = fs.readdirSync(guidesDir).filter(f => f.endsWith('.json'));
  const articles: GuideArticle[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(guidesDir, file), 'utf-8');
      const article: GuideArticle = JSON.parse(raw);
      articles.push(article);
    } catch (err) {
      console.error(`Error reading guide ${file}:`, err);
    }
  }
  // Sắp xếp theo ngày cập nhật mới nhất
  return articles.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

export function getGuideBySlug(gameSlug: string, guideSlug: string): GuideArticle | null {
  const guidePath = path.join(CONTENT_DIR, gameSlug, 'guides', `${guideSlug}.json`);
  if (fs.existsSync(guidePath)) {
    try {
      return JSON.parse(fs.readFileSync(guidePath, 'utf-8'));
    } catch {
      return null;
    }
  }
  const allGuides = getGameGuides(gameSlug);
  return allGuides.find(g => g.slug === guideSlug || g.id === guideSlug) || null;
}

export function getGameActivities(gameSlug: string): GameActivity[] {
  const actPath = path.join(CONTENT_DIR, gameSlug, 'activities.json');
  if (!fs.existsSync(actPath)) return [];
  try {
    const list: GameActivity[] = JSON.parse(fs.readFileSync(actPath, 'utf-8'));
    return list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  } catch {
    return [];
  }
}

export function getActivityBySlug(gameSlug: string, activitySlug: string): GameActivity | null {
  const list = getGameActivities(gameSlug);
  return list.find(a => a.slug === activitySlug || a.id === activitySlug) || null;
}

export function getGameItems(gameSlug: string): Record<string, GameItem> {
  const itemsPath = path.join(CONTENT_DIR, gameSlug, 'items.json');
  if (!fs.existsSync(itemsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading items for ${gameSlug}:`, err);
    return {};
  }
}

export function getGameItemById(gameSlug: string, itemId: string): GameItem | null {
  const items = getGameItems(gameSlug);
  return items[itemId] || null;
}

export function getItemCategories(gameSlug: string): ItemCategory[] {
  const catPath = path.join(CONTENT_DIR, gameSlug, 'item_categories.json');
  if (!fs.existsSync(catPath)) {
    return [
      { id: 'ticket', name: 'Vé & Thẻ chiêu mộ', icon: '🎟️' },
      { id: 'stamina', name: 'Thể lực & Sức sống', icon: '⚡' },
      { id: 'chest_key', name: 'Rương & Chìa khóa', icon: '🎁' },
      { id: 'upgrade_material', name: 'Đá & Tinh hoa nâng cấp', icon: '💎' },
      { id: 'equip_material', name: 'Linh kiện & Bản vẽ trang bị', icon: '🛡️' },
      { id: 'event', name: 'Đạo cụ sự kiện', icon: '🎉' },
      { id: 'general', name: 'Vật phẩm tiêu hao khác', icon: '📜' },
    ];
  }
  try {
    return JSON.parse(fs.readFileSync(catPath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading categories for ${gameSlug}:`, err);
    return [];
  }
}




