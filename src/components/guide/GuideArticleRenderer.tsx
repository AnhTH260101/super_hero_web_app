'use client';

import React from 'react';
import Link from 'next/link';
import {
  Flame,
  Clock,
  Sparkles,
  Users,
  Image as ImageIcon,
  Award,
  AlertTriangle,
  Lightbulb,
  Swords,
  ChevronRight,
} from 'lucide-react';
import {
  GuideArticle,
  GuideBlock,
  GuideTextBlock,
  GuideHeroRosterBlock,
  GuideGalleryBlock,
  GuideResourcesBlock,
} from '@/types/game';

interface Props {
  article: GuideArticle;
  gameSlug: string;
}

export const GuideArticleRenderer: React.FC<Props> = ({ article, gameSlug }) => {
  return (
    <article className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-8 shadow-2xl">
      {/* Header bài viết */}
      <div className="space-y-4 pb-6 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                article.category === 'boss'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : article.category === 'event'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}
            >
              {article.category === 'boss' ? 'SĂN BOSS' : article.category.toUpperCase()}
            </span>

            {article.schedule && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-amber-400 border border-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {article.schedule}
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Cập nhật: {new Date(article.updatedAt).toLocaleDateString('vi-VN')}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          {article.title}
        </h2>

        {article.description && (
          <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-4xl">
            {article.description}
          </p>
        )}
      </div>

      {/* Danh sách các khối Blocks */}
      <div className="space-y-8">
        {article.blocks?.map((block, idx) => {
          if (block.type === 'text') {
            const b = block as GuideTextBlock;
            return (
              <div
                key={b.id || idx}
                className={`p-5 rounded-2xl border space-y-3 ${
                  b.variant === 'strategy'
                    ? 'bg-gradient-to-r from-red-950/40 to-slate-950 border-red-500/30 text-slate-200'
                    : b.variant === 'tip'
                    ? 'bg-gradient-to-r from-amber-950/40 to-slate-950 border-amber-500/30 text-slate-200'
                    : b.variant === 'warning'
                    ? 'bg-gradient-to-r from-rose-950/40 to-slate-950 border-rose-500/30 text-rose-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                {b.title && (
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    {b.variant === 'strategy' ? (
                      <Swords className="w-4 h-4 text-red-400" />
                    ) : b.variant === 'tip' ? (
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                    ) : b.variant === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Flame className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{b.title}</span>
                  </h4>
                )}

                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {b.content}
                </div>
              </div>
            );
          }

          if (block.type === 'hero-roster') {
            const b = block as GuideHeroRosterBlock;
            return (
              <div key={b.id || idx} className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {b.title || 'Đội Hình Đề Xuất'}
                    </h3>
                    {b.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{b.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {b.heroes?.map((hero) => (
                    <Link
                      key={hero.heroSlug}
                      href={`/${gameSlug}/heroes/${hero.heroSlug}`}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 flex items-start gap-3.5 group transition-all"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={hero.avatar}
                          alt={hero.name}
                          className="w-14 h-14 rounded-2xl border border-slate-700 object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/heroes/icon_heroes/default.png';
                          }}
                        />
                        {hero.rarity && (
                          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 text-[9px] font-black rounded-md bg-amber-500 text-slate-950 shadow">
                            {hero.rarity}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-amber-400 transition-colors truncate">
                            {hero.name}
                          </h4>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>

                        {hero.role && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {hero.role}
                          </span>
                        )}

                        {hero.note && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {hero.note}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          if (block.type === 'gallery') {
            const b = block as GuideGalleryBlock;
            return (
              <div key={b.id || idx} className="space-y-4">
                {b.title && (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-400" />
                    <h3 className="text-base sm:text-lg font-black text-white">{b.title}</h3>
                  </div>
                )}

                <div
                  className={`grid gap-4 ${
                    b.layout === 'single'
                      ? 'grid-cols-1'
                      : b.layout === 'grid-3'
                      ? 'grid-cols-1 sm:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {b.images?.map((img, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg group"
                    >
                      <div className="relative aspect-video bg-slate-900 overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.caption || 'Hình ảnh thực chiến'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {img.caption && (
                        <div className="p-3 text-xs text-slate-300 font-medium text-center bg-slate-950/80">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (block.type === 'resources') {
            const b = block as GuideResourcesBlock;
            return (
              <div key={b.id || idx} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {b.title || 'Phần Thưởng Nổi Bật'}
                    </h3>
                    {b.description && (
                      <p className="text-xs text-slate-400">{b.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {b.items?.map((item, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-3"
                    >
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 object-contain shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-white truncate">
                          {item.name}
                        </div>
                        {item.note && (
                          <div className="text-[11px] text-emerald-400 font-medium truncate mt-0.5">
                            {item.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </article>
  );
};
