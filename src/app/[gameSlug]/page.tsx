import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getGameHeroes, getGiftcodes, getTierList } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { ScopedSearchBar } from '@/components/search/ScopedSearchBar';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { Shield, Swords, Gift, Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export default async function GameHubPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const heroes = getGameHeroes(gameSlug);
  const giftcodes = getGiftcodes(gameSlug);
  const activeCodes = giftcodes.filter(c => c.status === 'active');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Scoped Search Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-black text-white mb-2">
            <span>{game.logo}</span>
            <span>{game.name}</span>
          </div>
          <p className="text-xs text-slate-400 mb-6">{game.tagline}</p>
          <ScopedSearchBar gameMeta={game} heroes={heroes} />
        </div>

        {/* Affiliate / Monetization Banner */}
        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-8">
          <Link
            href={`/${gameSlug}/heroes`}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition-colors">
                  Thư Viện Tướng
                </h4>
                <p className="text-xs text-slate-400">{heroes.length} Nhân vật</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href={`/${gameSlug}/tier-list`}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-red-500/50 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm group-hover:text-red-400 transition-colors">
                  Bảng Xếp Hạng
                </h4>
                <p className="text-xs text-slate-400">Meta Tier S+ / S</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href={`/${gameSlug}/giftcodes`}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm group-hover:text-emerald-400 transition-colors">
                  Giftcode Tân Thủ
                </h4>
                <p className="text-xs text-emerald-400 font-semibold">{activeCodes.length} Mã còn hạn</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Featured Heroes Preview */}
        <section className="my-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Tướng Nổi Bật Đang Hot</span>
            </h3>
            <Link href={`/${gameSlug}/heroes`} className="text-xs text-amber-400 hover:underline">
              Xem tất cả →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {heroes.map((hero) => (
              <Link
                key={hero.slug}
                href={`/${gameSlug}/heroes/${hero.slug}`}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 group transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      {hero.avatar && hero.avatar.startsWith('/') ? (
                        <img src={hero.avatar} alt={hero.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <span className="text-2xl">🦸</span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                      Tier {hero.tier}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition-colors">
                    {hero.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                    {hero.title}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">{hero.element}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">{hero.role}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-amber-400 flex items-center justify-between">
                  <span>Chi tiết kỹ năng & build</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
