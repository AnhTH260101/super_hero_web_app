import React from 'react';
import { notFound } from 'next/navigation';
import { getGameMeta, getGameResources, getGameResourceSources } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { ResourceTableClient } from './ResourceTableClient';
import { Metadata } from 'next';

interface Props {
  params: Promise<{
    gameSlug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) return { title: 'Tài Nguyên Game' };

  return {
    title: `Bách Khoa Toàn Thư Tài Nguyên & Cách Kiếm | ${game.name}`,
    description: `Tổng hợp tất cả các tài nguyên quan trọng, đá rèn, đá vận mệnh, trang bị 12 con giáp, đạo cụ sự kiện và cách thu thập chi tiết trong game ${game.name}.`,
  };
}

export default async function ResourcesPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);

  if (!game) {
    notFound();
  }

  const resources = getGameResources(gameSlug);
  const sources = getGameResourceSources(gameSlug);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Banner & Introduction */}
        <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
              <span>💎 Bách Khoa Toàn Thư</span>
              <span className="w-1 h-1 rounded-full bg-amber-400"></span>
              <span>Cẩm Nang Tân Thủ & Cao Thủ</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Kho Tài Nguyên & Cách Nhận</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl">
              Tra cứu công dụng chi tiết và danh sách tất cả các hoạt động, sự kiện, cửa hàng có thể kiếm từng loại tài nguyên trong game Siêu Anh Hùng.
            </p>
          </div>
        </div>

        {/* Client Interactive Table */}
        <ResourceTableClient 
          initialResources={resources} 
          sources={sources} 
          gameSlug={game.slug}
        />
      </main>
    </div>
  );
}
