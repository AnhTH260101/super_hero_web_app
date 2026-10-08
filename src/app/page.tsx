import Link from 'next/link';
import { getAllGames } from '@/lib/games';
import { Gamepad2, ArrowRight, Sparkles, BookOpen, Gift, Trophy } from 'lucide-react';

export default function HomePage() {
  const games = getAllGames();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-red-500" />
            <span className="font-extrabold text-xl bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent">
              GameWiki Portal
            </span>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Cổng Thông Tin Game Thủ Đa Nền Tảng
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nền tảng Tra Cứu Game Chuyên Sâu</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Tất Cả Thông Tin Bạn Cần Để <span className="bg-gradient-to-r from-amber-400 via-red-500 to-purple-500 bg-clip-text text-transparent">Leo Top Meta</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Khám phá thư viện tướng chi tiết, bảng xếp hạng sức mạnh (Tier List), mẹo vượt ải và kho giftcode cập nhật theo giờ.
          </p>
        </div>

        {/* Featured Games Section */}
        <div>
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
            <span>Danh Sách Tựa Game Đang Hỗ Trợ</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">{games.length} Game</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div
                key={game.slug}
                className="group relative rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-amber-500/10"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {game.logo}
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      {game.genre}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors mb-2">
                    {game.name}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-6">
                    {game.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                    <Link
                      href={`/${game.slug}/heroes`}
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Kho Tướng</span>
                    </Link>
                    <Link
                      href={`/${game.slug}/tier-list`}
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                    >
                      <Trophy className="w-4 h-4 text-red-400" />
                      <span>Tier List</span>
                    </Link>
                    <Link
                      href={`/${game.slug}/giftcodes`}
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                    >
                      <Gift className="w-4 h-4 text-emerald-400" />
                      <span>Giftcode</span>
                    </Link>
                  </div>
                </div>

                <Link
                  href={`/${game.slug}`}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
                >
                  <span>Truy Cập Cổng Game</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          © 2026 GameWiki Portal. Nền tảng chia sẻ dữ liệu và cẩm nang game thủ độc lập.
        </div>
      </footer>
    </div>
  );
}
