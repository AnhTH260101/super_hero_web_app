import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getGuideBySlug } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { GuideArticleRenderer } from '@/components/guide/GuideArticleRenderer';
import { ArrowLeft, Settings } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string; guideSlug: string }>;
}

export default async function GuideDetailPage({ params }: Props) {
  const { gameSlug, guideSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const article = getGuideBySlug(gameSlug, guideSlug);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Navigation Top */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${gameSlug}/daily/boss`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Danh Sách Hoạt Động</span>
          </Link>

          <Link
            href={`/admin/${gameSlug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 text-xs font-bold transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Chỉnh Sửa Bài Này</span>
          </Link>
        </div>

        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Render Bài Viết */}
        <GuideArticleRenderer article={article} gameSlug={gameSlug} />
      </main>
    </div>
  );
}
