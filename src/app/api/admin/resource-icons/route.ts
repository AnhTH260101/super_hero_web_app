import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ResourceIconItem {
  name: string;
  url: string;
  folder: string;
  folderLabel: string;
}

export interface ResourceFolderCategory {
  id: string;
  label: string;
  count: number;
}

const RESOURCE_FOLDERS: { id: string; label: string; subpath: string }[] = [
  { id: 'resources_items', label: 'Vật Phẩm Tiêu Chuẩn', subpath: 'resources/items' },
  { id: 'icon_chuyen_sinh', label: 'Chuyển Sinh', subpath: 'icon_chuyen_sinh' },
  { id: 'icon_fate', label: 'Đá Vận Mệnh', subpath: 'icon_fate' },
  { id: 'icon_elemental_stone', label: 'Đá Nguyên Tố', subpath: 'icon_elemental_stone' },
  { id: 'icon_dharma_treasure', label: 'Pháp Bảo', subpath: 'icon_dharma_treasure' },
  { id: 'icon_seasonal_event_resources', label: 'Sự Kiện Theo Mùa', subpath: 'icon_seasonal_event_resources' },
  { id: 'icon_pet', label: 'Trợ Thủ / Pet', subpath: 'icon_pet' },
  { id: 'icon_resources_eather', label: 'Tài Nguyên Eather', subpath: 'icon_resources_eather' },
  { id: 'icon_weapon', label: 'Vũ Khí Chung', subpath: 'icon_weapon' },
  { id: 'icon_weapon_heroes', label: 'Vũ Khí Riêng Tướng', subpath: 'icon_weapon_heroes' },
  { id: 'icon_badge_heroes', label: 'Huy Hiệu Tướng', subpath: 'icon_badge_heroes' },
  { id: 'icon_badge_item', label: 'Huy Hiệu Item', subpath: 'icon_badge_item' },
  { id: 'icon_boss', label: 'Boss', subpath: 'icon_boss' },
  { id: 'icon_event_daily', label: 'Nhiệm Vụ Hàng Ngày', subpath: 'icon_event_daily' },
  { id: 'icon_hero_title', label: 'Danh Hiệu', subpath: 'icon_hero_title' },
  { id: 'sources', label: 'Nguồn Sự Kiện / Hoạt Động', subpath: 'resources/sources' },
];

let cachedAllIcons: ResourceIconItem[] | null = null;
let cachedCategories: ResourceFolderCategory[] | null = null;
let cachedGameSlug: string = '';

function scanAllIcons(gameSlug: string = 'sieu-anh-hung'): { icons: ResourceIconItem[]; categories: ResourceFolderCategory[] } {
  const publicDir = path.join(process.cwd(), 'public', 'images');
  const allIcons: ResourceIconItem[] = [];
  const categories: ResourceFolderCategory[] = [];

  for (const group of RESOURCE_FOLDERS) {
    const fullFolderPath = path.join(publicDir, group.subpath);
    if (!fs.existsSync(fullFolderPath)) continue;

    let groupCount = 0;
    try {
      const files = fs.readdirSync(fullFolderPath);
      for (const file of files) {
        if (file.startsWith('.') || !file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
        allIcons.push({
          name: file,
          url: `/images/${group.subpath}/${file}`,
          folder: group.id,
          folderLabel: group.label,
        });
        groupCount++;
      }
    } catch (err) {
      console.error(`Error reading directory ${fullFolderPath}:`, err);
    }

    categories.push({
      id: group.id,
      label: group.label,
      count: groupCount,
    });
  }

  // Quét thêm thư mục tai-nguyen-anh của game
  const taiNguyenAnhPath = path.join(process.cwd(), 'public', 'games', gameSlug, 'tai-nguyen-anh');
  if (fs.existsSync(taiNguyenAnhPath)) {
    let count = 0;
    try {
      const files = fs.readdirSync(taiNguyenAnhPath);
      for (const file of files) {
        if (file.startsWith('.') || !file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
        allIcons.push({
          name: file,
          url: `/games/${gameSlug}/tai-nguyen-anh/${file}`,
          folder: 'tai_nguyen_anh',
          folderLabel: 'Ảnh Tải Lên (tai-nguyen-anh)',
        });
        count++;
      }
    } catch (err) {
      console.error(`Error reading directory ${taiNguyenAnhPath}:`, err);
    }

    if (count > 0) {
      categories.push({
        id: 'tai_nguyen_anh',
        label: 'Ảnh Tải Lên',
        count,
      });
    }
  }

  return { icons: allIcons, categories };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug') || 'sieu-anh-hung';
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const folder = (searchParams.get('folder') || '').trim();
    const limit = parseInt(searchParams.get('limit') || '120', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const refresh = searchParams.get('refresh') === 'true';

    // Scan hoặc tái sử dụng cache (làm mới nếu có param refresh=true hoặc đổi gameSlug)
    if (refresh || !cachedAllIcons || !cachedCategories || cachedGameSlug !== gameSlug) {
      const scanned = scanAllIcons(gameSlug);
      cachedAllIcons = scanned.icons;
      cachedCategories = scanned.categories;
      cachedGameSlug = gameSlug;
    }

    let filtered = cachedAllIcons;

    // Lọc theo folder nếu có
    if (folder && folder !== 'all') {
      filtered = filtered.filter((ic) => ic.folder === folder);
    }

    // Lọc theo từ khóa tìm kiếm
    if (search) {
      filtered = filtered.filter(
        (ic) =>
          ic.name.toLowerCase().includes(search) ||
          ic.folderLabel.toLowerCase().includes(search) ||
          ic.folder.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      icons: paginated,
      categories: cachedCategories,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
