import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getGameMeta, getGuideBySlug, getGameActivities } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { GuideArticleRenderer } from '@/components/guide/GuideArticleRenderer';
import { ArrowLeft, Sparkles, Flame, Coins, ShieldCheck } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) return { title: 'Không tìm thấy game' };

  return {
    title: `Cẩm Nang Tối Ưu Dòng Tiền Cán Mốc 100 Vạn Xu | ${game.name}`,
    description: `Chiến thuật chi tiêu dòng tiền khép kín: Cán mốc 100 vạn Xu với số vốn ban đầu thấp nhất chỉ ~72.5 vạn Xu, ôm trọn 200 mảnh Pain/Cid, hưởng 40% hoàn Bàn Cờ Lửa và nổ Jackpot 5 vạn Xu Kho Báu Mê Cung trong ${game.name}.`,
  };
}

export default async function ToiUu100VanXuPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const activities = getGameActivities(gameSlug);
  const article = getGuideBySlug(gameSlug, 'cam-nang-toi-uu-100-van-xu');
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      {/* Top Banner Highlight */}
      <div className="bg-gradient-to-r from-amber-950/40 via-rose-950/30 to-slate-950 border-b border-amber-500/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/${gameSlug}/daily`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Về Mục Hoạt Động & Sự Kiện</span>
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                VIP STRATEGY & TOOL
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-2.5">
              <Flame className="w-8 h-8 text-rose-500 shrink-0" />
              <span>Tối Ưu Hóa Dòng Tiền: Cán Mốc 100 Vạn Xu</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Giải pháp toán học thực chiến: Gom 200 mảnh Pain/Cid, tận dụng 40% hoàn Xu Bàn Cờ Lửa và nổ Jackpot 5 vạn Xu Kho Báu Mê Cung chỉ với <strong className="text-amber-400 font-bold">~72.5 vạn Xu gốc</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="/tools/toi-uu-100-van-xu/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-500/20"
            >
              <Coins className="w-4 h-4" />
              <span>Mở Bản Độc Lập (Full Screen)</span>
            </a>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        <GuideArticleRenderer
          article={article}
          gameSlug={gameSlug}
          activities={activities}
        />
      </main>
    </div>
  );
}
