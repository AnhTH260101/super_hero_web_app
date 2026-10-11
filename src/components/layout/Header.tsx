import React from 'react';
import Link from 'next/link';
import { Gamepad2, Search, ChevronDown, Swords } from 'lucide-react';
import { GameMeta } from '@/types/game';

interface HeaderProps {
  currentGame?: GameMeta | null;
  allGames?: GameMeta[];
}

export const Header: React.FC<HeaderProps> = ({ currentGame, allGames = [] }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
            <Gamepad2 className="w-7 h-7 text-red-500" />
            <span>GameWiki Portal</span>
          </Link>

          {currentGame && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
              <span className="text-xl">{currentGame.logo}</span>
              <span className="text-sm font-semibold text-slate-200">{currentGame.name}</span>
            </div>
          )}
        </div>

        {/* Navigation Links for current game */}
        {currentGame ? (
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href={`/${currentGame.slug}/heroes`} className="hover:text-amber-400 transition-colors">
              Kho Tướng
            </Link>
            <Link href={`/${currentGame.slug}/tier-list`} className="hover:text-amber-400 transition-colors">
              Bảng Xếp Hạng (Tier List)
            </Link>
            <Link href={`/${currentGame.slug}/resources`} className="hover:text-amber-400 transition-colors">
              Tài Nguyên
            </Link>

            {/* Dropdown Hoạt Động (Daily Activities) */}
            <div className="relative group">
              <button
                type="button"
                className="hover:text-amber-400 transition-colors flex items-center gap-1 py-2 focus:outline-none"
              >
                <span>Hoạt Động</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-400 group-hover:text-amber-400" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full pt-2 w-56 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="p-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl space-y-1">
                  {/* Mục 1: Boss */}
                  <Link
                    href={`/${currentGame.slug}/daily/boss`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-amber-400 transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover/item:scale-110 transition-transform">
                      <Swords className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white group-hover/item:text-amber-400">
                        Boss
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Boss Thế Giới & Khiêu Chiến
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <Link href={`/${currentGame.slug}/giftcodes`} className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-red-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Giftcode Mới
            </Link>
          </nav>
        ) : null}

        <div className="flex items-center gap-3">
          <Link
            href="/admin/sieu-anh-hung"
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700 transition-colors font-medium flex items-center gap-1"
          >
            <span>⚙️ Quản Trị</span>
          </Link>

          {currentGame?.affiliateLinks?.pcEmulator && (
            <a
              href={currentGame.affiliateLinks.pcEmulator}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-red-500 text-white hover:opacity-90 shadow-md transition-all"
            >
              ⚡ Tải Chơi Trên PC
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
