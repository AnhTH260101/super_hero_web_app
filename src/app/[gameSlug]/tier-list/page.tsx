import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getTierList } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { Trophy, ArrowLeft, Shield } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export default async function TierListPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const tierData = getTierList(gameSlug);
  if (!tierData) notFound();

  const tiers: Array<'S+' | 'S'> = ['S+', 'S'];

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
            <Trophy className="w-8 h-8 text-red-500" />
            <span>Bảng Xếp Hạng Sức Mạnh (Tier List) Meta</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Đánh giá sức mạnh toàn diện của các tướng trong phiên bản hiện tại. Ưu tiên tài nguyên cho tướng Tier S+ và S để leo top hiệu quả.
          </p>
        </div>

        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Tier Grid */}
        <div className="space-y-6 my-8">
          {tiers.map((tier) => {
            const heroesInTier = tierData.overall[tier] || [];
            if (heroesInTier.length === 0 && tier !== 'S+') return null;

            const badgeBg =
              tier === 'S+'
                ? 'bg-red-500 text-white'
                : tier === 'S'
                ? 'bg-amber-500 text-slate-950'
                : tier === 'A'
                ? 'bg-purple-500 text-white'
                : 'bg-blue-500 text-white';

            return (
              <div
                key={tier}
                className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col sm:flex-row"
              >
                {/* Tier Label Column */}
                <div className={`sm:w-32 flex items-center justify-center p-4 sm:p-6 font-black text-2xl ${badgeBg} shrink-0`}>
                  TIER {tier}
                </div>

                {/* Heroes in Tier */}
                <div className="flex-1 p-4 sm:p-6 flex flex-wrap gap-4 items-center">
                  {heroesInTier.length > 0 ? (
                    heroesInTier.map((hero) => (
                      <Link
                        key={hero.heroSlug}
                        href={`/${gameSlug}/heroes/${hero.heroSlug}`}
                        className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 group transition-all"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {hero.avatar && hero.avatar.startsWith('/') ? (
                            <img src={hero.avatar} alt={hero.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <span className="text-2xl">🦸</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-100 group-hover:text-amber-400 transition-colors">
                              {hero.name}
                            </span>
                            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-400">
                              {hero.rarity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {hero.element} • {hero.role}
                          </p>
                          <p className="text-[10px] text-emerald-400/90 italic mt-0.5">
                            {hero.note}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Chưa có tướng nào được xếp vào hạng này</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
