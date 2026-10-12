'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  X,
  Swords,
  Flame,
  Trophy,
  Sparkles,
  Shield,
  Crown,
  Target,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { GameMeta, GameActivity, GuideArticle } from '@/types/game';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';

interface Props {
  game: GameMeta;
  activities: GameActivity[];
  guides: GuideArticle[];
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
    return <img src={iconName} alt="" className="w-4 h-4 object-contain" />;
  }
  return <Swords className="w-4 h-4" />;
}

function getActivityBadgeStyle(color?: string) {
  if (color === 'red') return 'bg-red-500/15 border-red-500/30 text-red-400';
  if (color === 'amber') return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
  if (color === 'blue') return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
  if (color === 'purple') return 'bg-purple-500/15 border-purple-500/30 text-purple-400';
  if (color === 'emerald') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
}

export function GeneralInfoHub({ game, activities, guides }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Map activity by slug for quick lookup
  const activityMap = useMemo(() => {
    const map = new Map<string, GameActivity>();
    activities.forEach((act) => map.set(act.slug, act));
    return map;
  }, [activities]);

  // Filtered and sorted guides
  const filteredGuides = useMemo(() => {
    return guides
      .filter((guide) => {
        // Lọc theo danh mục
        if (selectedCategory !== 'all' && guide.category !== selectedCategory) {
          return false;
        }

        // Lọc theo từ khóa tìm kiếm
        if (!searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase().trim();
        const act = activityMap.get(guide.category);

        // 1. Tìm trong tiêu đề, mô tả, slug, category
        if (
          guide.title?.toLowerCase().includes(term) ||
          guide.description?.toLowerCase().includes(term) ||
          guide.slug?.toLowerCase().includes(term) ||
          guide.category?.toLowerCase().includes(term) ||
          act?.name?.toLowerCase().includes(term)
        ) {
          return true;
        }

        // 2. Tìm trong các block nội dung
        if (guide.blocks && Array.isArray(guide.blocks)) {
          for (const block of guide.blocks) {
            if (block.type === 'text') {
              if (
                block.title?.toLowerCase().includes(term) ||
                block.content?.toLowerCase().includes(term)
              ) {
                return true;
              }
            } else if (block.type === 'hero-roster') {
              if (block.title?.toLowerCase().includes(term)) return true;
              if (
                block.heroes?.some(
                  (h) =>
                    h.name?.toLowerCase().includes(term) ||
                    h.role?.toLowerCase().includes(term) ||
                    h.note?.toLowerCase().includes(term)
                )
              ) {
                return true;
              }
            } else if (block.type === 'resources') {
              if (
                block.title?.toLowerCase().includes(term) ||
                block.items?.some((i) => i.name?.toLowerCase().includes(term))
              ) {
                return true;
              }
            } else if (block.type === 'gallery') {
              if (
                block.title?.toLowerCase().includes(term) ||
                block.images?.some((img) => img.caption?.toLowerCase().includes(term))
              ) {
                return true;
              }
            }
          }
        }

        return false;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
        }
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
      });
  }, [guides, selectedCategory, searchTerm, sortBy, activityMap]);

  // Đếm số lượng bài theo từng hoạt động
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: guides.length };
    activities.forEach((act) => {
      counts[act.slug] = guides.filter((g) => g.category === act.slug).length;
    });
    return counts;
  }, [activities, guides]);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <BookOpen className="w-4 h-4" />
              <span>Cẩm Nang & Tra Cứu Thông Tin</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Thông Tin Chung & Hướng Dẫn Hoạt Động
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Trung tâm tra cứu bài viết, mẹo chơi, đội hình đề cử và bí quyết vượt hoạt động (Săn Boss, Leo Tháp, Đấu Trường...) được đúc kết từ kinh nghiệm thực chiến.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center min-w-[120px]">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">
                {guides.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Bài Viết Hướng Dẫn
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center min-w-[120px]">
              <div className="text-2xl sm:text-3xl font-black text-white">
                {activities.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Chuyên Mục Hoạt Động
              </div>
            </div>
          </div>
        </div>
      </div>

      <MonetizationBanner
        gameName={game.name}
        affiliateUrl={game.affiliateLinks?.pcEmulator}
      />

      {/* Search & Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề, mẹo chơi, tên tướng đề cử, nội dung bài viết..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm text-white placeholder-slate-500 shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center">
              <SlidersHorizontal className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sắp xếp bài viết"
                className="pl-9 pr-8 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:border-amber-500 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="newest">Mới cập nhật</option>
                <option value="oldest">Cũ nhất</option>
                <option value="title">Tên A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <span>Tất Cả</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategory === 'all' ? 'bg-amber-600/40 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {categoryCounts.all || 0}
            </span>
          </button>

          {activities.map((act) => {
            const count = categoryCounts[act.slug] || 0;
            const isSelected = selectedCategory === act.slug;
            return (
              <button
                key={act.slug}
                type="button"
                onClick={() => setSelectedCategory(act.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? `${getActivityBadgeStyle(act.color)} shadow-lg`
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="shrink-0">{renderActivityIcon(act.icon)}</span>
                <span>{act.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-black/30 text-current' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search results summary */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>
          Tìm thấy <span className="font-bold text-amber-400">{filteredGuides.length}</span> bài viết
          {searchTerm && <span> cho từ khóa &quot;{searchTerm}&quot;</span>}
          {selectedCategory !== 'all' && (
            <span> trong mục &quot;{activityMap.get(selectedCategory)?.name || selectedCategory}&quot;</span>
          )}
        </div>
        {(searchTerm || selectedCategory !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="text-amber-400 hover:underline font-semibold"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Guide Cards Grid */}
      {filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => {
            const act = activityMap.get(guide.category);

            // Tìm cover image (1. Thumbnail riêng -> 2. Ảnh đầu trong Gallery -> 3. Banner của Hoạt động -> 4. Biểu tượng gradient)
            let coverImg = guide.thumbnail;
            if (!coverImg && guide.blocks) {
              for (const b of guide.blocks) {
                if (b.type === 'gallery' && b.images && b.images.length > 0) {
                  coverImg = b.images[0].url;
                  break;
                }
              }
            }
            if (!coverImg && act?.banner) {
              coverImg = act.banner;
            }

            // Tìm heroes trong các block hero-roster
            const featuredHeroes: Array<{ heroSlug: string; name: string; avatar?: string }> = [];
            if (guide.blocks) {
              for (const b of guide.blocks) {
                if (b.type === 'hero-roster' && b.heroes) {
                  for (const h of b.heroes) {
                    if (!featuredHeroes.some((ex) => ex.heroSlug === h.heroSlug)) {
                      featuredHeroes.push({ heroSlug: h.heroSlug, name: h.name, avatar: h.avatar });
                    }
                  }
                }
              }
            }

            return (
              <Link
                key={guide.slug}
                href={`/${game.slug}/daily/${guide.slug}`}
                className="group flex flex-col justify-between rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
              >
                <div>
                  {/* Thumbnail / Header Banner */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden border-b border-slate-800/80">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={guide.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-700 group-hover:text-amber-500/60 transition-colors">
                        {renderActivityIcon(act?.icon)}
                        <span className="text-xs font-semibold text-slate-500 mt-2">
                          {act?.name || 'Cẩm Nang Game'}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                    {/* Activity Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${getActivityBadgeStyle(
                          act?.color
                        )}`}
                      >
                        {renderActivityIcon(act?.icon)}
                        <span>{act?.name || guide.category}</span>
                      </span>
                    </div>

                    {/* Schedule Badge */}
                    {guide.schedule && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 border border-slate-800 text-amber-400 backdrop-blur-md">
                          <Clock className="w-3 h-3" />
                          <span>{guide.schedule}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                        {guide.title}
                      </h2>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {guide.description || 'Xem chi tiết hướng dẫn và chiến thuật chinh phục hoạt động.'}
                      </p>
                    </div>

                    {/* Featured Heroes row if available */}
                    {featuredHeroes.length > 0 && (
                      <div className="pt-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <span>Tướng Đề Cử ({featuredHeroes.length}):</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {featuredHeroes.slice(0, 6).map((hero) => (
                            <div
                              key={hero.heroSlug}
                              className="relative group/hero"
                              title={hero.name}
                            >
                              <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shadow">
                                {hero.avatar ? (
                                  <img
                                    src={hero.avatar}
                                    alt={hero.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] font-black text-amber-400">
                                    {hero.name.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {featuredHeroes.length > 6 && (
                            <div className="w-8 h-8 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              +{featuredHeroes.length - 6}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Info & Action */}
                <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {guide.updatedAt
                        ? new Date(guide.updatedAt).toLocaleDateString('vi-VN')
                        : 'Mới cập nhật'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Đọc Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">Không tìm thấy bài viết phù hợp</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Không có bài viết nào khớp với từ khóa &quot;{searchTerm}&quot; trong mục được chọn. Thử tìm với từ khóa khác hoặc xóa bộ lọc.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors"
            >
              Xóa Bộ Lọc Tìm Kiếm
            </button>
            <Link
              href={`/admin/${game.slug}`}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Viết Bài Mới Tại Admin
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
