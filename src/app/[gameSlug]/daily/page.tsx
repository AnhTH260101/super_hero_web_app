import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getGameActivities, getGameGuides } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import {
  Calendar,
  ArrowLeft,
  ChevronRight,
  Swords,
  Flame,
  Trophy,
  Sparkles,
  Shield,
  Crown,
  Target,
  Settings,
  BookOpen,
} from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

function renderActivityIcon(iconName?: string) {
  if (iconName === 'Swords') return <Swords className="w-6 h-6" />;
  if (iconName === 'Flame') return <Flame className="w-6 h-6" />;
  if (iconName === 'Trophy') return <Trophy className="w-6 h-6" />;
  if (iconName === 'Sparkles') return <Sparkles className="w-6 h-6" />;
  if (iconName === 'Shield') return <Shield className="w-6 h-6" />;
  if (iconName === 'Crown') return <Crown className="w-6 h-6" />;
  if (iconName === 'Target') return <Target className="w-6 h-6" />;
  if (iconName?.startsWith('/') || iconName?.startsWith('http')) {
    return <img src={iconName} alt="" className="w-full h-full object-cover" />;
  }
  return <Calendar className="w-6 h-6" />;
}

function getActivityColorClass(color?: string) {
  if (color === 'red') return 'bg-red-500/10 border-red-500/30 text-red-400 group-hover:border-red-500/60';
  if (color === 'amber') return 'bg-amber-500/10 border-amber-500/30 text-amber-400 group-hover:border-amber-500/60';
  if (color === 'blue') return 'bg-blue-500/10 border-blue-500/30 text-blue-400 group-hover:border-blue-500/60';
  if (color === 'purple') return 'bg-purple-500/10 border-purple-500/30 text-purple-400 group-hover:border-purple-500/60';
  if (color === 'emerald') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-500/60';
  return 'bg-amber-500/10 border-amber-500/30 text-amber-400 group-hover:border-amber-500/60';
}

export default async function DailyActivitiesHubPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const activities = getGameActivities(gameSlug).filter((a) => a.enabled !== false);
  const guides = getGameGuides(gameSlug);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Top Breadcrumb & Title */}
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
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-2">
                  <span>Hoạt Động & Sự Kiện Hàng Ngày</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Tổng hợp toàn bộ các hoạt động săn Boss, leo tháp, đấu trường và cẩm nang hướng dẫn leo top.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`/${gameSlug}/thong-tin-chung`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all shadow"
            >
              <BookOpen className="w-4 h-4" />
              <span>Tra Cứu Thông Tin</span>
            </Link>
          </div>
        </div>

        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Grid Danh Sách Các Hoạt Động */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act) => {
            const actGuides = guides.filter((g) => g.category === act.slug);
            return (
              <Link
                key={act.slug}
                href={`/${gameSlug}/daily/${act.slug}`}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex flex-col justify-between group transition-all hover:shadow-2xl hover:shadow-amber-500/10"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 overflow-hidden ${getActivityColorClass(
                        act.color
                      )}`}
                    >
                      {renderActivityIcon(act.icon)}
                    </div>
                    {act.badge && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                        {act.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                      {act.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {act.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-500">
                    {actGuides.length > 0 ? `${actGuides.length} bài hướng dẫn` : 'Xem cẩm nang'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Xem Chi Tiết</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
