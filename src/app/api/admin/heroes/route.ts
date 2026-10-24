import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ADMIN_SECRET = 'admin123';

function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const cookieToken = req.cookies.get('admin_token')?.value;
  return token === ADMIN_SECRET || cookieToken === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Không có quyền quản trị!' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetGame = searchParams.get('gameSlug') || 'sieu-anh-hung';

  // 1. Đọc danh sách tướng đang hoạt động
  const heroesDir = path.join(process.cwd(), 'content/games', targetGame, 'heroes');
  const heroes: any[] = [];
  if (fs.existsSync(heroesDir)) {
    const heroFiles = fs.readdirSync(heroesDir).filter(f => f.endsWith('.json'));
    for (const f of heroFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(heroesDir, f), 'utf-8'));
        heroes.push(data);
      } catch {}
    }
  }

  // 2. Đọc danh sách tướng trong thùng rác
  const trashDir = path.join(process.cwd(), 'content/games', targetGame, 'trash');
  const deletedHeroes: any[] = [];
  if (fs.existsSync(trashDir)) {
    const files = fs.readdirSync(trashDir).filter(f => f.endsWith('.json'));
    for (const f of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(trashDir, f), 'utf-8'));
        deletedHeroes.push(data);
      } catch {}
    }
  }

  return NextResponse.json({ success: true, heroes, deletedHeroes });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Không có quyền quản trị!' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, gameSlug, heroSlugs, heroSlug } = body;
    const targetGame = gameSlug || 'sieu-anh-hung';
    const heroesDir = path.join(process.cwd(), 'content/games', targetGame, 'heroes');
    const trashDir = path.join(process.cwd(), 'content/games', targetGame, 'trash');
    const tierListPath = path.join(process.cwd(), 'content/games', targetGame, 'tier-list.json');

    if (!fs.existsSync(trashDir)) {
      fs.mkdirSync(trashDir, { recursive: true });
    }

    const deletedHeroesPath = path.join(process.cwd(), 'content/games', targetGame, 'deleted_heroes.json');

    // Hàm tiện ích đọc danh sách đen
    const loadDeletedRegistry = () => {
      if (fs.existsSync(deletedHeroesPath)) {
        try {
          return JSON.parse(fs.readFileSync(deletedHeroesPath, 'utf-8'));
        } catch {
          return {};
        }
      }
      return {};
    };

    const saveDeletedRegistry = (reg: Record<string, any>) => {
      fs.writeFileSync(deletedHeroesPath, JSON.stringify(reg, null, 2), 'utf-8');
    };

    // 1. Hành động XÓA (Di chuyển vào thùng rác / bảng tạm)
    if (action === 'delete') {
      const slugsToDelete: string[] = Array.isArray(heroSlugs) ? heroSlugs : [heroSlug];
      let count = 0;
      const registry = loadDeletedRegistry();

      for (const slug of slugsToDelete) {
        if (!slug) continue;
        const sourcePath = path.join(heroesDir, `${slug}.json`);
        const targetTrashPath = path.join(trashDir, `${slug}.json`);

        if (fs.existsSync(sourcePath)) {
          let heroName = slug;
          try {
            const heroData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
            heroName = heroData.name || slug;
          } catch {}

          // Di chuyển file sang thư mục trash
          fs.copyFileSync(sourcePath, targetTrashPath);
          fs.unlinkSync(sourcePath);

          // Ghi nhớ vĩnh viễn vào danh sách đen
          registry[slug] = {
            slug,
            name: heroName,
            deletedAt: new Date().toISOString(),
            reason: 'Admin deleted via dashboard'
          };

          count++;
        }
      }

      saveDeletedRegistry(registry);

      // Xóa khỏi tier-list.json
      if (fs.existsSync(tierListPath)) {
        try {
          const tierData = JSON.parse(fs.readFileSync(tierListPath, 'utf-8'));
          for (const cat of ['overall', 'pvp', 'pve', 'boss']) {
            if (tierData[cat]) {
              for (const t of Object.keys(tierData[cat])) {
                tierData[cat][t] = tierData[cat][t].filter(
                  (item: any) => !slugsToDelete.includes(item.heroSlug)
                );
              }
            }
          }
          fs.writeFileSync(tierListPath, JSON.stringify(tierData, null, 2), 'utf-8');
        } catch (e) {
          console.error('Error updating tier-list after delete:', e);
        }
      }

      return NextResponse.json({
        success: true,
        count,
        message: `Đã đưa ${count} tướng vào Bảng Tạm Thùng Rác và lưu danh sách loại trừ!`
      });
    }

    // 2. Hành động KHÔI PHỤC (Restore từ thùng rác về lại heroes)
    if (action === 'restore') {
      const slugsToRestore: string[] = Array.isArray(heroSlugs) ? heroSlugs : [heroSlug];
      let count = 0;
      const registry = loadDeletedRegistry();

      for (const slug of slugsToRestore) {
        if (!slug) continue;
        const trashPath = path.join(trashDir, `${slug}.json`);
        const heroPath = path.join(heroesDir, `${slug}.json`);

        if (fs.existsSync(trashPath)) {
          fs.copyFileSync(trashPath, heroPath);
          fs.unlinkSync(trashPath);
          delete registry[slug];
          count++;
        }
      }

      saveDeletedRegistry(registry);

      return NextResponse.json({
        success: true,
        count,
        message: `Đã khôi phục thành công ${count} tướng!`
      });
    }

    // 3. Hành động XÓA VĨNH VIỄN khỏi thùng rác
    if (action === 'purge') {
      const slugsToPurge: string[] = Array.isArray(heroSlugs) ? heroSlugs : [heroSlug];
      let count = 0;
      const registry = loadDeletedRegistry();

      for (const slug of slugsToPurge) {
        const trashPath = path.join(trashDir, `${slug}.json`);
        if (fs.existsSync(trashPath)) {
          fs.unlinkSync(trashPath);
          registry[slug] = {
            slug,
            deletedAt: new Date().toISOString(),
            purged: true,
            reason: 'Permanently purged by admin'
          };
          count++;
        }
      }

      saveDeletedRegistry(registry);

      return NextResponse.json({ success: true, count, message: `Đã dọn sạch vĩnh viễn ${count} mục!` });
    }

    return NextResponse.json({ error: 'Action không hợp lệ!' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
