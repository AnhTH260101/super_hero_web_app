import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameSlug = searchParams.get('gameSlug') || 'sieu-anh-hung';
    const contentDir = path.join(process.cwd(), 'content/games', gameSlug);

    const resPath = path.join(contentDir, 'resources.json');
    const srcPath = path.join(contentDir, 'resource_sources.json');

    const resources = fs.existsSync(resPath) ? JSON.parse(fs.readFileSync(resPath, 'utf-8')) : [];
    const sources = fs.existsSync(srcPath) ? JSON.parse(fs.readFileSync(srcPath, 'utf-8')) : [];

    return NextResponse.json({ success: true, resources, sources });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameSlug = 'sieu-anh-hung', resources, sources } = body;
    const contentDir = path.join(process.cwd(), 'content/games', gameSlug);

    if (resources && Array.isArray(resources)) {
      const resPath = path.join(contentDir, 'resources.json');
      fs.writeFileSync(resPath, JSON.stringify(resources, null, 2), 'utf-8');
    }

    if (sources && Array.isArray(sources)) {
      const srcPath = path.join(contentDir, 'resource_sources.json');
      fs.writeFileSync(srcPath, JSON.stringify(sources, null, 2), 'utf-8');
    }

    return NextResponse.json({ success: true, message: 'Dữ liệu tài nguyên đã được lưu thành công!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
