import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GameActivity } from '@/types/game';

export const dynamic = 'force-dynamic';

function getActivitiesFilePath(gameSlug: string): string {
  return path.join(process.cwd(), 'content/games', gameSlug, 'activities.json');
}

// GET: Lấy danh sách cấu hình hoạt động
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug') || 'sieu-anh-hung';
    const filePath = getActivitiesFilePath(gameSlug);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: true, activities: [] });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const activities: GameActivity[] = JSON.parse(raw);
    activities.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi đọc cấu hình hoạt động' }, { status: 500 });
  }
}

// POST: Lưu danh sách cấu hình hoạt động (tạo mới, sửa, xóa, sắp xếp)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameSlug = 'sieu-anh-hung', activities } = body as {
      gameSlug: string;
      activities: GameActivity[];
    };

    if (!Array.isArray(activities)) {
      return NextResponse.json({ success: false, error: 'Dữ liệu hoạt động không hợp lệ' }, { status: 400 });
    }

    const filePath = getActivitiesFilePath(gameSlug);
    fs.writeFileSync(filePath, JSON.stringify(activities, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình hoạt động thành công!',
      activities,
    });
  } catch (error) {
    console.error('Error saving activities:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi lưu cấu hình hoạt động' }, { status: 500 });
  }
}
