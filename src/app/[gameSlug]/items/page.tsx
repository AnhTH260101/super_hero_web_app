import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGameMeta, getGameItems, getItemCategories, getGameResourceSources } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { ItemCatalogClient } from './ItemCatalogClient';
import { Metadata } from 'next';
import { Box, Sparkles, Settings2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    gameSlug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) return { title: 'Kho Vật Phẩm & Tài Nguyên' };

  return {
    title: `Kho Vật Phẩm & Tài Nguyên (${game.name}) | GameWiki Portal`,
    description: `Tra cứu danh mục vật phẩm, tài nguyên trọng điểm, đá nâng cấp, rương báu, vé chiêu mộ và nguồn kiếm trong game ${game.name}.`,
  };
}

export default async function ItemsPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);

  if (!game) {
    notFound();
  }

  const itemsDict = getGameItems(gameSlug);
  // Chỉ hiển thị các vật phẩm không bị ẩn (is_show !== 0)
  const items = Object.values(itemsDict).filter((item) => item.is_show !== 0);
  const categories = getItemCategories(gameSlug);
  const resourceSources = getGameResourceSources(gameSlug);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Banner & Introduction */}
        <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dữ Liệu Khai Thác Game Engine</span>
              <span className="w-1 h-1 rounded-full bg-amber-400"></span>
              <span>{items.length.toLocaleString('vi-VN')} Vật Phẩm Chuẩn Gốc</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Box className="w-8 h-8 text-amber-400" />
              <span>Kho Vật Phẩm & Tài Nguyên</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Toàn bộ kho tài nguyên trọng điểm, vé quay, rương báu, linh kiện và đạo cụ được chuẩn hóa trực tiếp từ game {game.name}.
              Hỗ trợ tra cứu nhanh công dụng, cách kiếm và nguồn nhận để tối ưu lộ trình phát triển.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href={`/admin/${game.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/50 text-xs font-bold shadow-lg transition-all"
            >
              <Settings2 className="w-4 h-4" />
              <span>Chỉnh Sửa Vật Phẩm (Admin)</span>
            </Link>
          </div>
        </div>

        {/* Client Interactive Item Catalog */}
        <ItemCatalogClient
          items={items}
          categories={categories}
          resourceSources={resourceSources}
          gameSlug={game.slug}
        />
      </main>
    </div>
  );
}
