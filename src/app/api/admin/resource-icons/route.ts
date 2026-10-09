import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const limit = parseInt(searchParams.get('limit') || '120', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const indexPath = path.join(
      process.cwd(),
      'content',
      'games',
      'sieu-anh-hung',
      'available_icons.json'
    );

    if (!fs.existsSync(indexPath)) {
      return NextResponse.json({ icons: [], total: 0 });
    }

    const raw = fs.readFileSync(indexPath, 'utf-8');
    const allIcons: string[] = JSON.parse(raw);

    const filtered = search
      ? allIcons.filter((ic) => ic.toLowerCase().includes(search))
      : allIcons;

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      icons: paginated.map((name) => ({
        name,
        url: `/images/resources/game_items/${name}`,
      })),
      total,
      page,
      limit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
