import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getUploadDir(gameSlug: string): string {
  const dir = path.join(process.cwd(), 'public/games', gameSlug, 'tai-nguyen-anh');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// GET: Liệt kê danh sách ảnh trong folder
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug') || 'sieu-anh-hung';
    const uploadDir = getUploadDir(gameSlug);

    const entries = fs.readdirSync(uploadDir, { withFileTypes: true });
    const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

    const files = entries
      .filter((e) => e.isFile() && imageExtensions.has(path.extname(e.name).toLowerCase()))
      .map((e) => {
        const filePath = path.join(uploadDir, e.name);
        const stats = fs.statSync(filePath);
        return {
          name: e.name,
          url: `/games/${gameSlug}/tai-nguyen-anh/${e.name}`,
          size: stats.size,
          mtime: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('Error listing media:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi đọc danh sách ảnh' }, { status: 500 });
  }
}

// POST: Tải ảnh mới lên
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const gameSlug = (formData.get('gameSlug') as string) || 'sieu-anh-hung';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy file tải lên' }, { status: 400 });
    }

    const uploadDir = getUploadDir(gameSlug);

    // Chuẩn hóa tên file an toàn
    const ext = path.extname(file.name).toLowerCase();
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const timestamp = Date.now();
    const safeFilename = `${baseName}_${timestamp}${ext || '.png'}`;
    const targetPath = path.join(uploadDir, safeFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(targetPath, buffer);

    return NextResponse.json({
      success: true,
      file: {
        name: safeFilename,
        url: `/games/${gameSlug}/tai-nguyen-anh/${safeFilename}`,
        size: buffer.length,
        mtime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi upload ảnh' }, { status: 500 });
  }
}
