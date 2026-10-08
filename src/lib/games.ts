import fs from 'fs';
import path from 'path';
import { GameMeta, Hero, TierListData, Giftcode, MetaLineup } from '@/types/game';

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
  const directPath = path.join(CONTENT_DIR, gameSlug, 'heroes', `${heroSlugOrId}.json`);
  if (fs.existsSync(directPath)) {
    try {
      return JSON.parse(fs.readFileSync(directPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  // Tra cứu linh hoạt theo id hoặc slug
  const heroes = getGameHeroes(gameSlug, { includeAfterlife: true, includeSkins: true });
  return heroes.find(h => h.id === heroSlugOrId || h.slug === heroSlugOrId) || null;
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
    return JSON.parse(fs.readFileSync(codePath, 'utf-8'));
  } catch {
    return [];
  }
}

export function getMetaLineups(gameSlug: string): MetaLineup[] {
  const lineupPath = path.join(CONTENT_DIR, gameSlug, 'lineups.json');
  if (!fs.existsSync(lineupPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(lineupPath, 'utf-8'));
  } catch {
    return [];
  }
}
