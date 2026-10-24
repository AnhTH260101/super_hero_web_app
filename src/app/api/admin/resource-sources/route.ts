import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ResourceSource {
  id: string;
  name: string;
  icon: string;
}

function prettifySlug(slug: string): string {
  if (slug === '777') return 'Vòng Quay 777';
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameSlug = searchParams.get('gameSlug') || 'sieu-anh-hung';
    const contentDir = path.join(process.cwd(), 'content', 'games', gameSlug);
    const srcJsonPath = path.join(contentDir, 'resource_sources.json');
    const sourcesDir = path.join(process.cwd(), 'public', 'images', 'resources', 'sources');

    const sources: ResourceSource[] = fs.existsSync(srcJsonPath)
      ? JSON.parse(fs.readFileSync(srcJsonPath, 'utf-8'))
      : [];

    // Lấy toàn bộ file ảnh có trong thư mục sources
    let availableSourceImages: string[] = [];
    if (fs.existsSync(sourcesDir)) {
      availableSourceImages = fs
        .readdirSync(sourcesDir)
        .filter((f) => !f.startsWith('.') && f.match(/\.(png|jpg|jpeg|webp)$/i));
    }

    // Tìm các ảnh chưa được liên kết
    const usedIcons = new Set(sources.map((s) => path.basename(s.icon)));
    const unlinkedImages = availableSourceImages.filter((img) => !usedIcons.has(img));

    return NextResponse.json({
      success: true,
      sources,
      availableSourceImages,
      unlinkedImages,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'Thiếu file tải lên' }, { status: 400 });
      }

      const sourcesDir = path.join(process.cwd(), 'public', 'images', 'resources', 'sources');
      if (!fs.existsSync(sourcesDir)) {
        fs.mkdirSync(sourcesDir, { recursive: true });
      }

      const ext = path.extname(file.name).toLowerCase();
      if (!ext.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) {
        return NextResponse.json({ success: false, error: 'Định dạng file không hợp lệ (chỉ nhận ảnh)' }, { status: 400 });
      }

      const rawStem = path.basename(file.name, ext);
      const safeStem = rawStem
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const finalName = `${safeStem || 'source-icon'}${ext}`;
      const filePath = path.join(sourcesDir, finalName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        fileName: finalName,
        url: `/images/resources/sources/${finalName}`,
        message: `Đã tải ảnh ${finalName} vào images/resources/sources!`,
      });
    }

    const body = await req.json();
    const { action = 'save', gameSlug = 'sieu-anh-hung', sources } = body;
    const contentDir = path.join(process.cwd(), 'content', 'games', gameSlug);
    const srcJsonPath = path.join(contentDir, 'resource_sources.json');
    const sourcesDir = path.join(process.cwd(), 'public', 'images', 'resources', 'sources');

    if (action === 'sync') {
      // Tự động quét từ thư mục public/images/resources/sources
      const currentSources: ResourceSource[] = fs.existsSync(srcJsonPath)
        ? JSON.parse(fs.readFileSync(srcJsonPath, 'utf-8'))
        : [];

      const publicDir = path.join(process.cwd(), 'public');
      // Lọc các source có ảnh còn tồn tại
      const validSources = currentSources.filter((s) => {
        const fullP = path.join(publicDir, s.icon.replace(/^\//, ''));
        return fs.existsSync(fullP);
      });

      const existingIcons = new Set(validSources.map((s) => path.basename(s.icon)));

      let addedCount = 0;
      if (fs.existsSync(sourcesDir)) {
        const files = fs
          .readdirSync(sourcesDir)
          .filter((f) => !f.startsWith('.') && f.match(/\.(png|jpg|jpeg|webp)$/i));

        for (const file of files) {
          if (!existingIcons.has(file)) {
            const stem = file.replace(/\.[^/.]+$/, '');
            validSources.push({
              id: stem,
              name: prettifySlug(stem),
              icon: `/images/resources/sources/${file}`,
            });
            existingIcons.add(file);
            addedCount++;
          }
        }
      }

      fs.writeFileSync(srcJsonPath, JSON.stringify(validSources, null, 2), 'utf-8');
      return NextResponse.json({
        success: true,
        sources: validSources,
        addedCount,
        message: `Đã đồng bộ thành công! Đã thêm mới ${addedCount} nguồn nhận.`,
      });
    }

    if (action === 'save') {
      if (!Array.isArray(sources)) {
        return NextResponse.json({ success: false, error: 'sources must be an array' }, { status: 400 });
      }
      fs.writeFileSync(srcJsonPath, JSON.stringify(sources, null, 2), 'utf-8');
      return NextResponse.json({
        success: true,
        sources,
        message: 'Đã lưu danh sách nguồn nhận / sự kiện thành công!',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
