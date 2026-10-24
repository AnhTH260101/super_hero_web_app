import React from 'react';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { GameMeta, GameActivity } from '@/types/game';
import { getGameActivities } from '@/lib/games';
import { HeaderNav } from './HeaderNav';

interface HeaderProps {
  currentGame?: GameMeta | null;
  allGames?: GameMeta[];
  activities?: GameActivity[];
}

export const Header: React.FC<HeaderProps> = ({ currentGame, allGames = [], activities: propActivities }) => {
  const activities =
    propActivities ||
    (currentGame ? getGameActivities(currentGame.slug).filter((a) => a.enabled !== false) : []);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href={currentGame ? `/${currentGame.slug}/thong-tin-chung` : '/'}
            className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent"
          >
            <Gamepad2 className="w-7 h-7 text-red-500" />
            <span>GameWiki Portal</span>
          </Link>

          {currentGame && (
            <Link
              href={`/${currentGame.slug}/thong-tin-chung`}
              className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 hover:opacity-80 transition-opacity"
            >
              <span className="text-xl">{currentGame.logo}</span>
              <span className="text-sm font-semibold text-slate-200">{currentGame.name}</span>
            </Link>
          )}
        </div>

        {/* Navigation Links for current game */}
        {currentGame ? (
          <HeaderNav currentGame={currentGame} activities={activities} />
        ) : null}

        <div className="flex items-center gap-3">

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
