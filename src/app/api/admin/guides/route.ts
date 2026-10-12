import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GuideArticle } from '@/types/game';

export const dynamic = 'force-dynamic';

function getGuidesDir(gameSlug: string): string {
  const dir = path.join(process.cwd(), 'content/games', gameSlug, 'guides');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// GET: Lấy danh sách các bài viết
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug') || 'sieu-anh-hung';
    const guidesDir = getGuidesDir(gameSlug);

    const files = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.json'));
    const guides: GuideArticle[] = [];

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(guidesDir, file), 'utf-8');
        guides.push(JSON.parse(raw));
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    }

    guides.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    return NextResponse.json({ success: true, guides });
  } catch (error) {
    console.error('Error fetching guides:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi đọc danh sách bài viết' }, { status: 500 });
  }
}

// POST: Tạo hoặc cập nhật bài viết
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameSlug = 'sieu-anh-hung', article } = body as { gameSlug: string; article: GuideArticle };

    if (!article || !article.slug || !article.title) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin tiêu đề hoặc slug' }, { status: 400 });
    }

    const guidesDir = getGuidesDir(gameSlug);
    const safeSlug = article.slug.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-');
    const filePath = path.join(guidesDir, `${safeSlug}.json`);

    const dataToSave: GuideArticle = {
      ...article,
      id: article.id || `guide-${Date.now()}`,
      slug: safeSlug,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Đã lưu bài viết thành công!',
      article: dataToSave,
    });
  } catch (error) {
    console.error('Error saving guide:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi lưu bài viết' }, { status: 500 });
  }
}

// DELETE: Xóa bài viết
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug') || 'sieu-anh-hung';
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Thiếu slug bài viết cần xóa' }, { status: 400 });
    }

    const guidesDir = getGuidesDir(gameSlug);
    const filePath = path.join(guidesDir, `${slug}.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true, message: `Đã xóa bài viết ${slug}` });
    } else {
      return NextResponse.json({ success: false, error: 'Bài viết không tồn tại' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting guide:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi xóa bài viết' }, { status: 500 });
  }
}
