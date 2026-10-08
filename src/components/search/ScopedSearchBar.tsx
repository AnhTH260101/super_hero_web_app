'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Shield, Swords, Gift } from 'lucide-react';
import Link from 'next/link';
import { Hero, GameMeta } from '@/types/game';

interface ScopedSearchBarProps {
  gameMeta: GameMeta;
  heroes: Hero[];
}

export const ScopedSearchBar: React.FC<ScopedSearchBarProps> = ({ gameMeta, heroes }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredHeroes = query.trim() === ''
    ? []
    : heroes.filter(h =>
        h.name.toLowerCase().includes(query.toLowerCase()) ||
        h.role.toLowerCase().includes(query.toLowerCase()) ||
        h.element.toLowerCase().includes(query.toLowerCase()) ||
        h.title.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={`Tìm kiếm tướng, kỹ năng, đội hình trong ${gameMeta.name}...`}
          className="w-full pl-12 pr-28 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-xl transition-all"
        />
        <div className="absolute right-3 px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-[11px] font-semibold text-slate-400 select-none">
          {gameMeta.name.split(' ')[0]}
        </div>
      </div>

      {/* Instant Search Results Dropdown */}
      {isFocused && query.trim() !== '' && (
        <div
          className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
          onMouseDown={(e) => e.preventDefault()} // Ngăn mất focus khi click chuột
        >
          <div className="p-2 border-b border-slate-800 text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>KẾT QUẢ TƯỚNG ({filteredHeroes.length})</span>
            <span className="text-[11px] text-amber-500">Tra cứu nhanh</span>
          </div>

          {filteredHeroes.length > 0 ? (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
              {filteredHeroes.map((hero) => (
                <Link
                  key={hero.slug}
                  href={`/${gameMeta.slug}/heroes/${hero.slug}`}
                  onClick={() => setIsFocused(false)}
                  className="flex items-center gap-3.5 p-3 hover:bg-slate-800/80 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {hero.avatar && hero.avatar.startsWith('/') ? (
                      <img src={hero.avatar} alt={hero.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <span className="text-xl">🦸</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm group-hover:text-amber-400 transition-colors">
                        {hero.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {hero.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {hero.element} • {hero.role} — {hero.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-red-400">
                      Tier {hero.tier}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-slate-400">
              Không tìm thấy tướng hoặc bài viết phù hợp với từ khóa &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
