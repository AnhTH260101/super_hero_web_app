import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameSlug = searchParams.get('gameSlug') || 'sieu-anh-hung';
    const contentDir = path.join(process.cwd(), 'content/games', gameSlug);
    const itemsPath = path.join(contentDir, 'items.json');
    const catPath = path.join(contentDir, 'item_categories.json');

    const items = fs.existsSync(itemsPath) ? JSON.parse(fs.readFileSync(itemsPath, 'utf-8')) : {};
    const categories = fs.existsSync(catPath) ? JSON.parse(fs.readFileSync(catPath, 'utf-8')) : [];

    return NextResponse.json({ success: true, items, categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameSlug = 'sieu-anh-hung', items, categories, item, deleteId } = body;
    const itemsDir = path.join(process.cwd(), 'content/games', gameSlug);

    if (!fs.existsSync(itemsDir)) {
      fs.mkdirSync(itemsDir, { recursive: true });
    }

    const itemsPath = path.join(itemsDir, 'items.json');
    let currentItems: Record<string, any> = {};
    if (fs.existsSync(itemsPath)) {
      try {
        currentItems = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
      } catch (e) {
        currentItems = {};
      }
    }

    // 1. Lưu / Cập nhật 1 item đơn lẻ (nhanh, nhẹ, không lo tràn dung lượng body)
    if (item && item.id) {
      currentItems[item.id] = item;
      fs.writeFileSync(itemsPath, JSON.stringify(currentItems, null, 2), 'utf-8');

      if (categories && Array.isArray(categories)) {
        const catPath = path.join(itemsDir, 'item_categories.json');
        fs.writeFileSync(catPath, JSON.stringify(categories, null, 2), 'utf-8');
      }

      return NextResponse.json({ success: true, item, message: 'Đã lưu vật phẩm thành công!' });
    }

    // 2. Xóa 1 item đơn lẻ
    if (deleteId) {
      delete currentItems[deleteId];
      fs.writeFileSync(itemsPath, JSON.stringify(currentItems, null, 2), 'utf-8');
      return NextResponse.json({ success: true, message: 'Đã xóa vật phẩm thành công!' });
    }

    // 3. Cập nhật một nhóm item theo patch (batch partial update)
    if (body.patchItems && typeof body.patchItems === 'object') {
      Object.entries(body.patchItems).forEach(([id, patch]: [string, any]) => {
        if (currentItems[id]) {
          currentItems[id] = { ...currentItems[id], ...patch };
        }
      });
      fs.writeFileSync(itemsPath, JSON.stringify(currentItems, null, 2), 'utf-8');
      return NextResponse.json({ success: true, message: 'Đã cập nhật hàng loạt thành công!' });
    }

    // 4. Cập nhật/Gộp danh mục vật phẩm
    if (items && typeof items === 'object') {
      Object.assign(currentItems, items);
      fs.writeFileSync(itemsPath, JSON.stringify(currentItems, null, 2), 'utf-8');
    }

    if (categories && Array.isArray(categories)) {
      const catPath = path.join(itemsDir, 'item_categories.json');
      fs.writeFileSync(catPath, JSON.stringify(categories, null, 2), 'utf-8');
    }

    return NextResponse.json({ success: true, message: 'Đã lưu danh mục và cấu hình vật phẩm thành công!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
