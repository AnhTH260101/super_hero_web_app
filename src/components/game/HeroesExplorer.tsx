'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Sparkles, Shield, Zap } from 'lucide-react';
import { Hero } from '@/types/game';

interface HeroesExplorerProps {
  heroes: Hero[];
  gameSlug: string;
}

export const HeroesExplorer: React.FC<HeroesExplorerProps> = ({ heroes, gameSlug }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [heroTypeFilter, setHeroTypeFilter] = useState<'ALL' | 'DEFAULT' | 'AFTERLIFE'>('ALL');

  // Lọc tướng theo từ khóa và phân tách
  const { defaultHeroes, afterlifeHeroes } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch = (h: Hero) =>
      term === '' ||
      h.name.toLowerCase().includes(term) ||
      h.id.includes(term) ||
      h.skills.some((s) => s.name.toLowerCase().includes(term));

    const defaults = heroes.filter((h) => !h.isAfterlifeForm && matchesSearch(h));
    const afterlifes = heroes.filter((h) => h.isAfterlifeForm && matchesSearch(h));

    return { defaultHeroes: defaults, afterlifeHeroes: afterlifes };
  }, [heroes, searchTerm]);

  const totalFiltered =
    heroTypeFilter === 'ALL'
      ? defaultHeroes.length + afterlifeHeroes.length
      : heroTypeFilter === 'DEFAULT'
      ? defaultHeroes.length
      : afterlifeHeroes.length;

  const renderHeroCard = (hero: Hero) => (
    <Link
      key={`${hero.id}-${hero.slug}`}
      href={`/${gameSlug}/heroes/${hero.slug}`}
      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 group transition-all flex flex-col justify-between hover:shadow-2xl hover:shadow-amber-500/10"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
            {hero.avatar && hero.avatar.startsWith('/') ? (
              <img
                src={hero.avatar}
                alt={hero.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <span className="text-3xl">🦸</span>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            {hero.isAfterlifeForm ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Chuyển Thế
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700">
                #{hero.id}
              </span>
            )}
          </div>
        </div>

        <h3 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors mb-2">
          {hero.name}
        </h3>

        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
          {hero.overview || 'Nhân vật sở hữu bộ kỹ năng thức tỉnh đặc biệt trong thế giới Siêu Anh Hùng.'}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-800/80 text-xs font-bold text-amber-400 flex items-center justify-between group-hover:text-amber-300">
        <span>Thông tin chi tiết</span>
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      {/* Bộ Lọc & Tìm Kiếm Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Gõ tên tướng (Songoku, Luffy, Frieren...) để tìm nhanh..."
            className="w-full pl-12 pr-10 py-3.5 bg-slate-950/80 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-inner transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Duy nhất Bộ Lọc: Mặc Định & Chuyển Thế */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Phân loại:
            </span>
            <div className="inline-flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                onClick={() => setHeroTypeFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  heroTypeFilter === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất Cả ({defaultHeroes.length + afterlifeHeroes.length})
              </button>
              <button
                onClick={() => setHeroTypeFilter('DEFAULT')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  heroTypeFilter === 'DEFAULT'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tướng Mặc Định ({defaultHeroes.length})
              </button>
              <button
                onClick={() => setHeroTypeFilter('AFTERLIFE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  heroTypeFilter === 'AFTERLIFE'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tướng Chuyển Thế ({afterlifeHeroes.length})
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Hiển thị <strong className="text-amber-400">{totalFiltered}</strong> kết quả
            {searchTerm && ` cho "${searchTerm}"`}
          </div>
        </div>
      </div>

      {/* Main Content Layouts */}
      {totalFiltered === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
          <div className="text-4xl mb-3">🔍</div>
          <h4 className="font-bold text-slate-200 text-base mb-1">
            Không tìm thấy tướng phù hợp
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Thử kiểm tra lại từ khóa tìm kiếm hoặc đổi sang tab phân loại khác.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setHeroTypeFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
          >
            Hiển thị lại toàn bộ tướng
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Layout 1: Tướng Mặc Định / Cốt Lõi */}
          {(heroTypeFilter === 'ALL' || heroTypeFilter === 'DEFAULT') && defaultHeroes.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Tướng Mặc Định (Cốt Lõi)</h2>
                  <p className="text-xs text-slate-400">
                    Danh sách các thẻ tướng ban đầu sẵn sàng chiêu mộ ({defaultHeroes.length} nhân vật)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {defaultHeroes.map(renderHeroCard)}
              </div>
            </div>
          )}

          {/* Layout 2: Tướng Chuyển Thế (Afterlife) */}
          {(heroTypeFilter === 'ALL' || heroTypeFilter === 'AFTERLIFE') && afterlifeHeroes.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Cảnh Giới Chuyển Thế</h2>
                  <p className="text-xs text-purple-300/80">
                    Các dạng thức tỉnh và đột phá cảnh giới sau chuyển thế ({afterlifeHeroes.length} nhân vật)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {afterlifeHeroes.map(renderHeroCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
