import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getMetaLineups } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { Users, ArrowLeft, CheckCircle2, AlertCircle, ShieldAlert, Zap, Sparkles } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export default async function LineupsPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const lineups = getMetaLineups(gameSlug);

  const getArchetypeBadge = (archetype: string) => {
    switch (archetype) {
      case 'Dồn Sát Thương':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Phản Sát Thương':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Khống Chế Bền Bỉ':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'F2P Nông Dân':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

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
            <Users className="w-8 h-8 text-indigo-400" />
            <span>Đội Hình Tiêu Biểu & Chiến Thuật Meta</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tổng hợp các bộ khung đội hình chuẩn theo phong cách chiến đấu, vị trí đứng và phân tích ưu nhược điểm chi tiết.
          </p>
        </div>

        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Lineups List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
          {lineups.map((lineup) => {
            const frontHeroes = lineup.heroes.filter(h => h.position === 'Tiền Tuyến');
            const backHeroes = lineup.heroes.filter(h => h.position === 'Hậu Phương');

            return (
              <div
                key={lineup.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between shadow-xl transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getArchetypeBadge(lineup.archetype)}`}>
                      {lineup.archetype}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{lineup.heroes.length} Tướng</span>
                  </div>

                  <h3 className="text-xl font-black text-white mb-2">{lineup.name}</h3>
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">{lineup.description}</p>

                  {/* Visual Battle Formation */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-6">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Bố Trí Đội Hình Chiến Đấu</span>
                      <span className="text-[10px] text-amber-500 font-normal">Nhấp để xem chi tiết tướng</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Tiền Tuyến */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                        <div className="text-[11px] font-bold text-red-400 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Hàng Trước (Tiền Tuyến)</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {frontHeroes.map((h) => (
                            <Link
                              key={h.heroSlug}
                              href={`/${gameSlug}/heroes/${h.heroSlug}`}
                              className="group relative flex flex-col items-center"
                              title={h.name}
                            >
                              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 group-hover:border-amber-400 overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-md">
                                <img src={h.avatar} alt={h.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[10px] text-slate-400 group-hover:text-amber-400 font-medium truncate max-w-[56px] text-center mt-1">
                                {h.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Hậu Phương */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                        <div className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Hàng Sau (Hậu Phương)</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {backHeroes.map((h) => (
                            <Link
                              key={h.heroSlug}
                              href={`/${gameSlug}/heroes/${h.heroSlug}`}
                              className="group relative flex flex-col items-center"
                              title={h.name}
                            >
                              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 group-hover:border-amber-400 overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-md">
                                <img src={h.avatar} alt={h.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[10px] text-slate-400 group-hover:text-amber-400 font-medium truncate max-w-[56px] text-center mt-1">
                                {h.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ưu Điểm Vượt Trội</span>
                      </div>
                      <ul className="space-y-1">
                        {lineup.strengths.map((str, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Điểm Yếu Cần Lưu Ý</span>
                      </div>
                      <ul className="space-y-1">
                        {lineup.weaknesses.map((weak, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
