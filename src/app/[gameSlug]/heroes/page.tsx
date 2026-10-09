import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getGameHeroes } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { HeroesExplorer } from '@/components/game/HeroesExplorer';
import { Shield, ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export default async function HeroesListPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const heroes = getGameHeroes(gameSlug, { includeAfterlife: true, includeSkins: true });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <Link
            href={`/${gameSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Hub {game.name}</span>
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-500" />
            <span>Thư Viện Tướng ({heroes.length})</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tra cứu thông tin chi tiết toàn bộ nhân vật, bao gồm tướng mặc định cốt lõi, cảnh giới chuyển thế và hệ thống trang phục skin.
          </p>
        </div>

        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Client-side Search & Interactive Multi-Filter Component */}
        <div className="my-8">
          <HeroesExplorer heroes={heroes} gameSlug={gameSlug} />
        </div>
      </main>
    </div>
  );
}
