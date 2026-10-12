import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getGameGuides } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { GuideArticleRenderer } from '@/components/guide/GuideArticleRenderer';
import { Swords, ArrowLeft, Settings, Plus } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export default async function DailyBossPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  // Lấy các bài viết thuộc danh mục 'boss'
  const allGuides = getGameGuides(gameSlug);
  const bossGuides = allGuides.filter((g) => g.category === 'boss');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href={`/${gameSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Hub {game.name}</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <Swords className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-2">
                  <span>Hoạt Động Săn Boss Hàng Ngày</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Cẩm nang cơ chế, thời gian xuất hiện và đội hình tối ưu sát thương khi săn Boss.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`/admin/${gameSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 text-xs font-bold transition-all shadow"
            >
              <Settings className="w-4 h-4" />
              <span>Quản Lý Bài Viết</span>
            </Link>
          </div>
        </div>

        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Danh Sách Bài Viết Boss Tự Động Render Từ Hệ Thống Block CMS */}
        {bossGuides.length > 0 ? (
          <div className="space-y-8">
            {bossGuides.map((guide) => (
              <GuideArticleRenderer
                key={guide.slug}
                article={guide}
                gameSlug={gameSlug}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-4">
            <p className="text-sm text-slate-400">
              Chưa có bài viết hướng dẫn săn Boss nào. Bạn có thể tự tạo bài viết bằng công cụ trực quan trong trang Quản Trị.
            </p>
            <Link
              href={`/admin/${gameSlug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Bài Viết Boss Ngay</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
