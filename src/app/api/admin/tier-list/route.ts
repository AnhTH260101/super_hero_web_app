import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { TierGroup } from '@/types/game';

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
  const tierPath = path.join(process.cwd(), 'content/games', targetGame, 'tier-list.json');

  if (!fs.existsSync(tierPath)) {
    return NextResponse.json({ tiers: [] });
  }

  try {
    const raw = fs.readFileSync(tierPath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi đọc file tier list' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Không có quyền quản trị!' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { gameSlug, tiers } = body as { gameSlug?: string; tiers?: TierGroup[] };
    const targetGame = gameSlug || 'sieu-anh-hung';
    const tierPath = path.join(process.cwd(), 'content/games', targetGame, 'tier-list.json');

    if (!Array.isArray(tiers)) {
      return NextResponse.json({ error: 'Dữ liệu tiers không hợp lệ!' }, { status: 400 });
    }

    const payload = { tiers };
    fs.writeFileSync(tierPath, JSON.stringify(payload, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Đã lưu bảng xếp hạng thành công!',
      tiersCount: tiers.length,
    });
  } catch (error) {
    console.error('Error saving tier list:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lưu bảng xếp hạng!' }, { status: 500 });
  }
}
