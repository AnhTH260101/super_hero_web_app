import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getTierList } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { Trophy, ArrowLeft, Settings, Shield } from 'lucide-react';
import { getTierColor } from '@/lib/tierColors';
import { TierGroup, TierListItem } from '@/types/game';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export default async function TierListPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const tierData = getTierList(gameSlug);
  if (!tierData) notFound();

  // Chuẩn hóa danh sách Tier: ưu tiên tierData.tiers, fallback sang overall nếu data cũ
  let tiers: TierGroup[] = tierData.tiers || [];

  if (tiers.length === 0 && tierData.overall) {
    const keys = Object.keys(tierData.overall);
    tiers = keys.map((key) => ({
      id: key.toLowerCase(),
      name: key,
      color: key === 'S+' ? 'red' : key === 'S' ? 'amber' : 'purple',
      heroes: tierData.overall![key] || [],
    }));
  }

  const totalHeroesRanked = tiers.reduce((acc, t) => acc + t.heroes.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Top */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href={`/${gameSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Hub {game.name}</span>
            </Link>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              <span>Bảng Xếp Hạng Sức Mạnh Meta ({totalHeroesRanked} Tướng)</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Phân cấp sức mạnh nhân vật theo các bậc T0, T1, T2, T3... Đánh giá thực chiến và tối ưu hóa tài nguyên leo top.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href={`/admin/${gameSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 text-xs font-bold transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Quản Lý Tier List</span>
            </Link>
          </div>
        </div>

        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Dynamic Tier Grid */}
        <div className="space-y-6 my-8">
          {tiers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
              <p className="text-slate-400 text-sm">Chưa có bảng xếp hạng nào được thiết lập.</p>
            </div>
          ) : (
            tiers.map((tier) => {
              const colorInfo = getTierColor(tier.color);

              return (
                <div
                  key={tier.id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col md:flex-row shadow-xl"
                >
                  {/* Tier Label Column */}
                  <div
                    className={`md:w-36 flex flex-col items-center justify-center p-6 font-black shrink-0 ${colorInfo.badgeClass}`}
                  >
                    <span className="text-3xl md:text-4xl tracking-tight">{tier.name}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 mt-1">
                      {tier.heroes.length} Nhân vật
                    </span>
                  </div>

                  {/* Heroes in Tier */}
                  <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center">
                    {tier.description && (
                      <p className="text-xs text-slate-400 italic mb-4 pb-2 border-b border-slate-800/80">
                        {tier.description}
                      </p>
                    )}

                    {tier.heroes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {tier.heroes.map((hero) => {
                          const heroDesc = hero.description || hero.note;

                          return (
                            <Link
                              key={`${tier.id}-${hero.heroSlug}`}
                              href={`/${gameSlug}/heroes/${hero.heroSlug}`}
                              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 flex flex-col justify-between group transition-all hover:shadow-lg"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                  {hero.avatar && hero.avatar.startsWith('/') ? (
                                    <img
                                      src={hero.avatar}
                                      alt={hero.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                  ) : (
                                    <span className="text-2xl">🦸</span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-xs text-slate-100 group-hover:text-amber-400 transition-colors truncate">
                                      {hero.name}
                                    </span>
                                    {hero.rarity && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-400">
                                        {hero.rarity}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    {hero.element} {hero.role ? `• ${hero.role}` : ''}
                                  </p>
                                </div>
                              </div>

                              {/* 3. Description cho tướng (Nếu có) */}
                              {heroDesc && (
                                <p className="text-[11px] text-emerald-400/90 leading-relaxed mt-2 pt-2 border-t border-slate-800/60 line-clamp-2">
                                  {heroDesc}
                                </p>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic py-4">
                        Chưa có tướng nào được xếp vào hạng này.
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
