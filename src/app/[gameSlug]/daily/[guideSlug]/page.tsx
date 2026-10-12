import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getGuideBySlug, getActivityBySlug, getGameGuides } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { GuideArticleRenderer } from '@/components/guide/GuideArticleRenderer';
import { ArrowLeft, Settings, Plus, Calendar, Swords, Flame, Trophy, Sparkles, Shield } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string; guideSlug: string }>;
}

function renderActivityIcon(iconName?: string) {
  if (iconName === 'Swords') return <Swords className="w-7 h-7" />;
  if (iconName === 'Flame') return <Flame className="w-7 h-7" />;
  if (iconName === 'Trophy') return <Trophy className="w-7 h-7" />;
  if (iconName === 'Sparkles') return <Sparkles className="w-7 h-7" />;
  if (iconName === 'Shield') return <Shield className="w-7 h-7" />;
  if (iconName?.startsWith('/') || iconName?.startsWith('http')) {
    return <img src={iconName} alt="" className="w-7 h-7 object-contain" />;
  }
  return <Calendar className="w-7 h-7" />;
}

export default async function GuideOrActivityPage({ params }: Props) {
  const { gameSlug, guideSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  // Kiểm tra 1: Xem slug có phải là một Activity (vd: leo-thap, dau-truong, pho-ban)
  const activity = getActivityBySlug(gameSlug, guideSlug);
  if (activity) {
    const allGuides = getGameGuides(gameSlug);
    const activityGuides = allGuides.filter(
      (g) => g.category === activity.slug || g.slug === activity.slug
    );

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header currentGame={game} />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
          {/* Header Activity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link
                href={`/${gameSlug}/daily`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 mb-3 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Về Tất Cả Hoạt Động</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  {renderActivityIcon(activity.icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black text-white">{activity.name}</h1>
                    {activity.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                        {activity.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    {activity.shortDesc}
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
                <span>Quản Trị Bài Viết</span>
              </Link>
            </div>
          </div>

          <MonetizationBanner
            gameName={game.name}
            affiliateUrl={game.affiliateLinks?.pcEmulator}
          />

          {/* Render Các Bài Viết Của Hoạt Động Này */}
          {activityGuides.length > 0 ? (
            <div className="space-y-8">
              {activityGuides.map((guide) => (
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
                Chưa có bài viết hướng dẫn nào cho hoạt động <strong>{activity.name}</strong>. Bạn có thể tự tạo bài viết bằng công cụ Block CMS trong trang Quản Trị.
              </p>
              <Link
                href={`/admin/${gameSlug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Bài Viết Cho Hoạt Động Này</span>
              </Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Kiểm tra 2: Xem slug có phải là một bài viết cụ thể
  const article = getGuideBySlug(gameSlug, guideSlug);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Navigation Top */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/${gameSlug}/thong-tin-chung`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Thông Tin Chung</span>
            </Link>
            <span className="text-slate-700">/</span>
            <Link
              href={`/${gameSlug}/daily`}
              className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
            >
              <span>Hoạt Động</span>
            </Link>
          </div>

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
