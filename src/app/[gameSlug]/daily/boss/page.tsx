import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { Swords, ArrowLeft, Clock, ShieldAlert, Award, Flame, Users, Sparkles } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export default async function DailyBossPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Breadcrumb & Title */}
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
                Hướng dẫn thời gian xuất hiện, cơ chế khiêu chiến và đội hình tối ưu sát thương khi săn Boss.
              </p>
            </div>
          </div>
        </div>

        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Boss Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Boss Thế Giới */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-xl hover:border-red-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Boss Thế Giới (World Boss)</h3>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    Toàn Server Tham Gia
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-amber-400 border border-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 12:00 & 20:00
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Hoạt động quy mô toàn server diễn ra vào các khung giờ cố định trưa và tối. Toàn bộ người chơi tập trung gây sát thương lớn nhất có thể trước khi Boss bị tiêu diệt.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Phần Thưởng Nổi Bật:
              </h4>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Rương Trang Bị Thần Thoại / Hoàng Kim</li>
                <li>Mảnh Tướng SSR / Đá Chuyển Sinh quý hiếm</li>
                <li>Thưởng Top sát thương (Hạng 1-10) & Thưởng Kết Liễu (Last Hit)</li>
              </ul>
            </div>
          </div>

          {/* Card 2: Boss Bang Hội */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-xl hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Boss Bang Hội (Guild Boss)</h3>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Nội Bộ Liên Minh
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Mỗi Ngày (2-3 Lượt)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Thành viên trong Bang cùng nhau tích lũy sát thương để hạ gục Boss bang qua từng cấp độ. Khi boss bị hạ, toàn bộ thành viên đều nhận quà qua thư.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Phần Thưởng Nổi Bật:
              </h4>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Điểm Cống Hiến Bang để nâng cấp Kỹ Năng Viện</li>
                <li>Xu Bang Hội mua mảnh tướng và nguyên liệu trong Tiệm Bang</li>
                <li>Rương mở cấp độ Boss Bang</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Meta Tips Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-500/20 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Mẹo Build Đội Hình Săn Boss Tối Đa Sát Thương</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">1. Tướng DPS Đơn Thể (Single Target):</strong>
              Ưu tiên tướng có kỹ năng dồn sát thương mục tiêu đơn và sát thương theo % máu hoặc bỏ qua giáp.
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">2. Buff Sát Thương & Tốc Độ:</strong>
              Đưa các tướng hỗ trợ có khả năng tăng Công, bạo kích hoặc giảm phòng ngự của Boss vào đội hình.
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">3. Kháng & Hồi Phục Bền Bỉ:</strong>
              Boss có lượng sát thương tăng dần theo hiệp. Đảm bảo tướng sống sót qua đủ các lượt thi triển chiêu nộ.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
