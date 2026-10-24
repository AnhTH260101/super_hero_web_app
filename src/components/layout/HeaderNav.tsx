'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Swords,
  Flame,
  Trophy,
  Sparkles,
  Shield,
  Crown,
  Target,
  ArrowRight,
} from 'lucide-react';
import { GameMeta, GameActivity } from '@/types/game';

interface HeaderNavProps {
  currentGame: GameMeta;
  activities: GameActivity[];
}

function renderActivityIcon(iconName?: string) {
  if (iconName === 'Swords') return <Swords className="w-4 h-4" />;
  if (iconName === 'Flame') return <Flame className="w-4 h-4" />;
  if (iconName === 'Trophy') return <Trophy className="w-4 h-4" />;
  if (iconName === 'Sparkles') return <Sparkles className="w-4 h-4" />;
  if (iconName === 'Shield') return <Shield className="w-4 h-4" />;
  if (iconName === 'Crown') return <Crown className="w-4 h-4" />;
  if (iconName === 'Target') return <Target className="w-4 h-4" />;
  if (iconName?.startsWith('/') || iconName?.startsWith('http')) {
    return <img src={iconName} alt="" className="w-full h-full object-cover" />;
  }
  return <Swords className="w-4 h-4" />;
}

function getActivityColorClass(color?: string) {
  if (color === 'red') return 'bg-red-500/10 border-red-500/20 text-red-400';
  if (color === 'amber') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
  if (color === 'blue') return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
  if (color === 'purple') return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
  return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ currentGame, activities }) => {
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    if (!pathname) return false;
    if (path.endsWith('/thong-tin-chung')) {
      return pathname === path || pathname === `/${currentGame.slug}`;
    }
    return pathname.startsWith(path);
  };

  const navClass = (path: string) =>
    isLinkActive(path)
      ? 'text-amber-400 font-bold transition-colors'
      : 'text-slate-300 hover:text-amber-400 transition-colors';

  const isDailyActive = pathname?.includes(`/${currentGame.slug}/daily`);

  return (
    <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
      <Link href={`/${currentGame.slug}/thong-tin-chung`} className={navClass(`/${currentGame.slug}/thong-tin-chung`)}>
        Thông Tin Chung
      </Link>
      <Link href={`/${currentGame.slug}/heroes`} className={navClass(`/${currentGame.slug}/heroes`)}>
        Kho Tướng
      </Link>
      <Link href={`/${currentGame.slug}/tier-list`} className={navClass(`/${currentGame.slug}/tier-list`)}>
        Tier List
      </Link>
      <Link href={`/${currentGame.slug}/items`} className={navClass(`/${currentGame.slug}/items`)}>
        Vật Phẩm & Tài Nguyên
      </Link>

      {/* Dropdown Hoạt Động (Daily Activities) */}
      <div className="relative group">
        <button
          type="button"
          className={`hover:text-amber-400 transition-colors flex items-center gap-1 py-2 focus:outline-none ${
            isDailyActive ? 'text-amber-400 font-bold' : 'text-slate-300'
          }`}
        >
          <span>Hoạt Động</span>
          <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-400 group-hover:text-amber-400" />
        </button>

        {/* Dropdown Menu */}
        <div className="absolute left-0 top-full pt-2 w-64 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
          <div className="p-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl space-y-1">
            {activities.map((act) => (
              <Link
                key={act.slug}
                href={`/${currentGame.slug}/daily/${act.slug}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-amber-400 transition-colors group/item"
              >
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform overflow-hidden ${getActivityColorClass(
                    act.color
                  )}`}
                >
                  {renderActivityIcon(act.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="font-bold text-xs text-white group-hover/item:text-amber-400 truncate">
                      {act.name}
                    </div>
                    {act.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-slate-700 shrink-0">
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {act.shortDesc}
                  </div>
                </div>
              </Link>
            ))}

            <div className="pt-1 mt-1 border-t border-slate-800/80">
              <Link
                href={`/${currentGame.slug}/daily`}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-amber-400 hover:bg-slate-800/50 transition-colors"
              >
                <span>Xem Tất Cả Hoạt Động</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Link
        href={`/${currentGame.slug}/giftcodes`}
        className={`hover:text-amber-400 transition-colors flex items-center gap-1.5 ${
          isLinkActive(`/${currentGame.slug}/giftcodes`) ? 'text-amber-400 font-bold' : 'text-red-400'
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        Giftcode Mới
      </Link>
    </nav>
  );
};
