'use client';

import React, { useState } from 'react';
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
  ZoomIn,
  X,
  Table as TableIcon,
  Link2,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  Route,
} from 'lucide-react';
import {
  GuideArticle,
  GuideBlock,
  GuideTextBlock,
  GuideHeroRosterBlock,
  GuideGalleryBlock,
  GuideResourcesBlock,
  GuideTableBlock,
  GuideTableCellResource,
  GuideHeroSourceBlock,
  GuideResourceCardBlock,
  GuideStepFlowBlock,
  GuideCalculatorBlock,
  GameActivity,
} from '@/types/game';
import { RichTextWithTags } from './RichTextWithTags';
import { LayeredIcon } from './LayeredIcon';
import { CashflowCalculator } from './CashflowCalculator';

interface Props {
  article: GuideArticle;
  gameSlug: string;
  activities?: GameActivity[];
}

export const GuideArticleRenderer: React.FC<Props> = ({ article, gameSlug, activities = [] }) => {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);
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
            <RichTextWithTags text={article.description} gameSlug={gameSlug} activities={activities} />
          </p>
        )}

        {article.relatedActivities && article.relatedActivities.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Hoạt động liên quan:</span>
            </span>
            {article.relatedActivities.map((actSlug) => {
              const act = activities.find((a) => a.slug === actSlug);
              return (
                <Link
                  key={actSlug}
                  href={`/${gameSlug}/daily/${actSlug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-xs group"
                >
                  {act?.icon?.startsWith('/') ? (
                    <img
                      src={act.icon}
                      alt=""
                      className="w-4 h-4 object-cover rounded shrink-0"
                    />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span>{act?.name || actSlug}</span>
                  <ArrowUpRight className="w-3 h-3 text-amber-400/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Ảnh Banner / Thumbnail Đầu Bài Viết (nếu có) */}
        {article.thumbnail && (
          <div className="pt-2">
            <div className="w-full max-h-[460px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center relative group shadow-lg">
              <img
                src={article.thumbnail}
                alt={article.title}
                onClick={() => setLightboxImage({ url: article.thumbnail!, caption: article.title })}
                className="w-full h-auto max-h-[460px] object-contain cursor-zoom-in hover:opacity-95 transition-all"
              />
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-slate-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Bấm để phóng to</span>
              </div>
            </div>
          </div>
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
                  <RichTextWithTags text={b.content} gameSlug={gameSlug} activities={activities} />
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
                      <p className="text-xs text-slate-400 mt-0.5">
                        <RichTextWithTags text={b.description} gameSlug={gameSlug} activities={activities} />
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {b.heroes?.map((hero, hIdx) => (
                    <Link
                      key={`${hero.heroSlug || 'hero'}-${hIdx}`}
                      href={`/${gameSlug}/heroes/${hero.heroSlug}`}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 flex items-start gap-3.5 group transition-all"
                    >
                      <div className="relative shrink-0">
                        <LayeredIcon
                          src={hero.avatar}
                          alt={hero.name}
                          layers={hero.layers}
                          className="w-14 h-14 rounded-2xl border border-slate-700 overflow-hidden group-hover:scale-105 transition-transform"
                          imgClassName="w-full h-full object-cover"
                        >
                          {hero.rarity && (
                            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 text-[9px] font-black rounded-md bg-amber-500 text-slate-950 shadow">
                              {hero.rarity}
                            </span>
                          )}
                        </LayeredIcon>
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
                  className={`grid gap-5 items-start ${
                    b.layout === 'single'
                      ? 'grid-cols-1'
                      : b.layout === 'grid-3'
                      ? 'grid-cols-1 md:grid-cols-3'
                      : 'grid-cols-1 md:grid-cols-2'
                  }`}
                >
                  {b.images?.map((img, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg group flex flex-col"
                    >
                      <div
                        className="relative bg-slate-950/80 p-1 sm:p-2 overflow-hidden flex items-center justify-center cursor-zoom-in group/img"
                        onClick={() => setLightboxImage(img)}
                        title="Bấm để xem ảnh phóng to đầy đủ"
                      >
                        <img
                          src={img.url}
                          alt={img.caption || 'Hình ảnh thực chiến'}
                          className="w-full h-auto max-h-[550px] object-contain rounded-xl transition-transform duration-200 group-hover/img:scale-[1.01]"
                          loading="lazy"
                        />
                        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none shadow">
                          <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                          <span>Phóng to</span>
                        </div>
                      </div>
                      {img.caption && (
                        <div className="p-3 text-xs text-slate-300 font-medium text-center bg-slate-950/90 border-t border-slate-800/80">
                          <RichTextWithTags text={img.caption} gameSlug={gameSlug} activities={activities} />
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
                      <p className="text-xs text-slate-400">
                        <RichTextWithTags text={b.description} gameSlug={gameSlug} activities={activities} />
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {b.items?.map((item, rIdx) => (
                    <Link
                      key={rIdx}
                      href={`/${gameSlug}/resources`}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 flex items-center gap-3 transition-all hover:bg-slate-900 group"
                      title="Xem trong Kho Tài Nguyên Game"
                    >
                      <LayeredIcon
                        src={item.icon}
                        alt={item.name}
                        layers={item.layers}
                        className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 overflow-hidden shrink-0 group-hover:scale-105 transition-transform"
                        imgClassName="w-full h-full object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-white group-hover:text-emerald-300 transition-colors truncate flex items-center justify-between">
                          <span>{item.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {item.note && (
                          <div className="text-[11px] text-emerald-400 font-medium truncate mt-0.5">
                            {item.note}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          if (block.type === 'hero-source') {
            const b = block as GuideHeroSourceBlock;
            return (
              <div key={b.id || idx} className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {b.title || 'Nguồn Tướng Nhận Được'}
                    </h3>
                    {b.description && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        <RichTextWithTags text={b.description} gameSlug={gameSlug} activities={activities} />
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {b.heroes?.map((hero, hIdx) => (
                    <div
                      key={`${hero.heroSlug || 'hero'}-${hIdx}`}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/50 transition-all flex items-start gap-3.5 group"
                    >
                      <Link
                        href={`/${gameSlug}/heroes/${hero.heroSlug}`}
                        className="relative shrink-0 block"
                        title={`Xem chi tiết ${hero.name}`}
                      >
                        <LayeredIcon
                          src={hero.avatar}
                          alt={hero.name}
                          layers={hero.layers}
                          className="w-14 h-14 rounded-2xl border border-slate-700 overflow-hidden group-hover:scale-105 transition-transform"
                          imgClassName="w-full h-full object-cover"
                        >
                          {hero.rarity && (
                            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 text-[9px] font-black rounded-md bg-amber-500 text-slate-950 shadow">
                              {hero.rarity}
                            </span>
                          )}
                        </LayeredIcon>
                      </Link>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <Link
                            href={`/${gameSlug}/heroes/${hero.heroSlug}`}
                            className="font-extrabold text-xs sm:text-sm text-white group-hover:text-purple-300 transition-colors truncate"
                          >
                            {hero.name}
                          </Link>
                          {hero.element && (
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {hero.element}
                            </span>
                          )}
                        </div>

                        {hero.sourceNote && (
                          <div className="text-[11px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl flex items-center gap-1.5 flex-wrap">
                            <span className="text-amber-400 shrink-0">🎁</span>
                            <RichTextWithTags text={hero.sourceNote} gameSlug={gameSlug} activities={activities} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (block.type === 'table') {
            const b = block as GuideTableBlock;
            return (
              <div key={b.id || idx} className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                    <TableIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>{b.title || 'Bảng Biểu Chi Tiết'}</span>
                    </h3>
                    {b.description && (
                      <p className="text-xs text-slate-400 mt-1 whitespace-pre-line leading-relaxed">
                        <RichTextWithTags text={b.description} gameSlug={gameSlug} activities={activities} />
                      </p>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3.5 w-12 text-center text-slate-500 font-mono">#</th>
                        {b.columns?.map((col) => (
                          <th key={col.id} className="py-3 px-4 min-w-[150px]">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {b.rows?.map((row, rIdx) => (
                        <tr key={row.id || rIdx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-500 font-mono font-bold">
                            {rIdx + 1}
                          </td>
                          {b.columns?.map((col) => {
                            const cell = row.cells?.[col.id];
                            return (
                              <td key={col.id} className="py-3 px-4 align-middle">
                                {col.type === 'text' ? (
                                  <span className="font-semibold text-slate-200 whitespace-pre-wrap">
                                    <RichTextWithTags text={cell?.text} gameSlug={gameSlug} activities={activities} />
                                    {!cell?.text && '—'}
                                  </span>
                                ) : (
                                  <div>
                                    {(() => {
                                      const items: GuideTableCellResource[] = [
                                        ...(Array.isArray(cell?.resources) && cell.resources.length > 0
                                          ? cell.resources
                                          : cell?.resource?.name || cell?.resource?.icon
                                          ? [cell.resource]
                                          : []),
                                        ...(Array.isArray(cell?.heroes) && cell.heroes.length > 0
                                          ? cell.heroes.map((h) => ({
                                              name: h.name,
                                              icon: h.avatar,
                                              quantity: h.note,
                                              heroSlug: h.heroSlug,
                                              rarity: h.rarity,
                                              element: h.element,
                                              itemType: 'hero' as const,
                                              layers: h.layers,
                                            }))
                                          : cell?.hero?.name || cell?.hero?.avatar
                                          ? [
                                              {
                                                name: cell.hero.name,
                                                icon: cell.hero.avatar,
                                                quantity: cell.hero.note,
                                                heroSlug: cell.hero.heroSlug,
                                                rarity: cell.hero.rarity,
                                                element: cell.hero.element,
                                                itemType: 'hero' as const,
                                                layers: cell.hero.layers,
                                              },
                                            ]
                                          : []),
                                      ];

                                      if (items.length === 0) {
                                        return <span className="text-slate-600 text-xs italic">—</span>;
                                      }

                                      return (
                                        <div className="flex flex-wrap items-center gap-2 py-1">
                                          {items.map((item, iIdx) => {
                                            const isHero = item.itemType === 'hero' || Boolean(item.heroSlug) || Boolean(item.rarity);
                                            if (isHero) {
                                              const rarityColor =
                                                item.rarity === 'UR'
                                                  ? 'border-red-500/50 bg-red-950/20 text-red-300'
                                                  : item.rarity === 'SSR'
                                                  ? 'border-amber-500/50 bg-amber-950/20 text-amber-300'
                                                  : 'border-slate-700 bg-slate-900 text-slate-300';

                                              return (
                                                <div
                                                  key={iIdx}
                                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-sm transition-all ${rarityColor}`}
                                                >
                                                  {item.icon && (
                                                    <LayeredIcon
                                                      src={item.icon}
                                                      alt={item.name}
                                                      layers={item.layers}
                                                      className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700/80 p-0.5 shrink-0 overflow-hidden cursor-zoom-in hover:scale-105 transition-transform"
                                                      imgClassName="w-full h-full object-contain"
                                                      onClick={() =>
                                                        item.icon &&
                                                        setLightboxImage({
                                                          url: item.icon,
                                                          caption: item.name,
                                                        })
                                                      }
                                                      title="Bấm để xem ảnh tướng"
                                                    />
                                                  )}
                                                  <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                      {item.heroSlug ? (
                                                        <Link
                                                          href={`/${gameSlug}/heroes/${item.heroSlug}`}
                                                          className="font-black text-xs text-white hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-0.5 group/link"
                                                          title={`Xem chi tiết tướng ${item.name}`}
                                                        >
                                                          <span>{item.name || 'Tướng'}</span>
                                                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 text-amber-400 transition-opacity" />
                                                        </Link>
                                                      ) : (
                                                        <span className="font-black text-xs text-white whitespace-nowrap">
                                                          {item.name || 'Tướng'}
                                                        </span>
                                                      )}
                                                      {item.rarity && (
                                                        <span className="text-[9px] font-black px-1 rounded bg-black/40 text-amber-400 font-mono">
                                                          {item.rarity}
                                                        </span>
                                                      )}
                                                    </div>
                                                    {item.quantity && (
                                                      <span className="text-[10px] font-bold text-amber-400 font-mono mt-0.5">
                                                        {item.quantity}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            }

                                            return (
                                              <Link
                                                key={iIdx}
                                                href={`/${gameSlug}/resources`}
                                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-emerald-500/50 hover:bg-slate-850 transition-all group"
                                                title="Xem trong Kho Tài Nguyên Game"
                                              >
                                                {item.icon && (
                                                  <LayeredIcon
                                                    src={item.icon}
                                                    alt={item.name}
                                                    layers={item.layers}
                                                    className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-700/80 p-0.5 shrink-0 overflow-hidden cursor-zoom-in hover:scale-105 transition-transform"
                                                    imgClassName="w-full h-full object-contain"
                                                    onClick={() =>
                                                      item.icon &&
                                                      setLightboxImage({
                                                        url: item.icon,
                                                        caption: item.name,
                                                      })
                                                    }
                                                    title="Bấm để phóng to"
                                                  />
                                                )}
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <span className="font-bold text-xs text-white whitespace-nowrap">
                                                    {item.name || 'Vật phẩm'}
                                                  </span>
                                                  {item.quantity && (
                                                    <span className="text-[10px] font-black font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap shadow-sm">
                                                      {item.quantity}
                                                    </span>
                                                  )}
                                                </div>
                                              </Link>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {(!b.rows || b.rows.length === 0) && (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Bảng hiện chưa có dữ liệu nào.
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (block.type === 'resource-card') {
            const b = block as GuideResourceCardBlock;
            return (
              <div key={b.id || idx} className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>{b.title || 'Chi Tiết Vật Phẩm & Tướng'}</span>
                    </h3>
                    {b.description && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        <RichTextWithTags text={b.description} gameSlug={gameSlug} activities={activities} />
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {b.cards?.map((card, cIdx) => (
                    <div
                      key={card.id || cIdx}
                      className="border border-slate-600 bg-white text-slate-900 rounded-md overflow-hidden shadow-md transition-all hover:shadow-xl"
                    >
                      {/* Header Bar: Nền slate tối căn giữa */}
                      <div className="bg-[#464c53] text-white text-center font-bold text-sm sm:text-base py-1.5 px-3 border-b border-slate-600 tracking-wide select-none flex items-center justify-center gap-2">
                        {card.heroSlug ? (
                          <Link
                            href={`/${gameSlug}/heroes/${card.heroSlug}`}
                            className="hover:text-amber-400 hover:underline transition-colors flex items-center gap-1"
                            title={`Xem chi tiết tướng ${card.name}`}
                          >
                            <span>{card.name}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                          </Link>
                        ) : (
                          <Link
                            href={`/${gameSlug}/resources`}
                            className="hover:text-amber-400 hover:underline transition-colors flex items-center gap-1"
                            title={`Xem trong Kho Tài Nguyên: ${card.name}`}
                          >
                            <span>{card.name}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                          </Link>
                        )}
                        {card.rarity && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black">
                            {card.rarity}
                          </span>
                        )}
                      </div>

                      {/* 3-Column Body */}
                      <div className="flex flex-col sm:flex-row min-h-[90px] divide-y sm:divide-y-0 sm:divide-x divide-slate-400">
                        {/* Cột 1: Icon / Tướng */}
                        <div className="w-full sm:w-24 md:w-28 shrink-0 flex flex-col items-center justify-center p-2.5 bg-slate-50">
                          {card.heroSlug ? (
                            <Link
                              href={`/${gameSlug}/heroes/${card.heroSlug}`}
                              className="relative group block"
                              title={`Xem chi tiết tướng ${card.name}`}
                            >
                              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-white p-0.5 group-hover:border-amber-500 transition-all flex items-center justify-center">
                                <LayeredIcon
                                  src={card.icon}
                                  alt={card.name}
                                  layers={card.layers}
                                  className="w-full h-full rounded-lg overflow-hidden group-hover:scale-105 transition-transform"
                                  imgClassName="w-full h-full object-cover"
                                />
                              </div>
                            </Link>
                          ) : (
                            <Link
                              href={`/${gameSlug}/resources`}
                              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-slate-300 shadow-sm flex items-center justify-center bg-white p-1 hover:border-emerald-500 transition-all group"
                              title={`Xem trong Kho Tài Nguyên: ${card.name}`}
                            >
                              <LayeredIcon
                                src={card.icon}
                                alt={card.name}
                                layers={card.layers}
                                className="w-full h-full overflow-hidden group-hover:scale-105 transition-transform"
                                imgClassName="w-full h-full object-contain drop-shadow-sm"
                              />
                            </Link>
                          )}
                        </div>

                        {/* Cột 2: Công dụng / Mô tả dạng gạch đầu dòng */}
                        <div className="w-full sm:w-64 md:w-72 lg:w-80 shrink-0 p-2 sm:p-3 text-xs sm:text-[13px] leading-relaxed flex items-center bg-white">
                          <ul className="space-y-1 list-disc list-outside pl-4 text-slate-800 font-medium w-full">
                            {card.description && card.description.length > 0 ? (
                              card.description.map((bullet, bIdx) => (
                                <li key={bIdx} className="break-words">
                                  <RichTextWithTags text={bullet} gameSlug={gameSlug} activities={activities} />
                                </li>
                              ))
                            ) : (
                              <li className="text-slate-400 italic">Chưa có mô tả công dụng</li>
                            )}
                          </ul>
                        </div>

                        {/* Cột 3: Cách nhận / Nguồn nhận */}
                        <div className="flex-1 min-w-0 p-2 sm:p-2.5 bg-slate-50 flex flex-col justify-center">
                          <div className="text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 underline decoration-slate-300">
                            Cách nhận:
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {card.sources && card.sources.length > 0 ? (
                              card.sources.map((src, sIdx) => {
                                const isClickable = !!src.sourceId;
                                const content = (
                                  <>
                                    {src.icon && (
                                      <img
                                        src={src.icon}
                                        alt={src.name || src.sourceId}
                                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 drop-shadow-xs group-hover:scale-105 transition-transform"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight group-hover:text-amber-600 transition-colors">
                                      {src.name || src.sourceId}
                                    </span>
                                    {src.note && (
                                      <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-1 py-0.2 rounded shadow-2xs">
                                        {src.note}
                                      </span>
                                    )}
                                    {isClickable && (
                                      <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5 shrink-0" />
                                    )}
                                  </>
                                );

                                if (isClickable) {
                                  return (
                                    <Link
                                      key={sIdx}
                                      href={`/${gameSlug}/daily/${src.sourceId}`}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-300 shadow-xs hover:border-amber-500 hover:shadow-sm transition-all text-slate-800 group"
                                      title={`Xem chi tiết hoạt động: ${src.name || src.sourceId}${src.note ? ` (${src.note})` : ''}`}
                                    >
                                      {content}
                                    </Link>
                                  );
                                }

                                return (
                                  <div
                                    key={sIdx}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-300 shadow-xs text-slate-800"
                                    title={(src.name || src.sourceId) + (src.note ? ` (${src.note})` : '')}
                                  >
                                    {content}
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-xs text-slate-400 italic">Đang cập nhật nguồn nhận...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!b.cards || b.cards.length === 0) && (
                    <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-500">
                      Chưa có thẻ chi tiết nào trong khối này.
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (block.type === 'step-flow') {
            const b = block as GuideStepFlowBlock;
            return (
              <div key={b.id || idx} className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Route className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>{b.title || 'Đường Line Thao Tác (Step by Step)'}</span>
                    </h3>
                    {b.description && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        <RichTextWithTags text={b.description} gameSlug={gameSlug} activities={activities} />
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl overflow-x-auto">
                  <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-2.5 sm:gap-4 py-2 min-w-full md:min-w-max">
                    {b.steps?.map((step, sIdx) => {
                      const isLast = sIdx === (b.steps?.length || 0) - 1;
                      return (
                        <React.Fragment key={step.id || sIdx}>
                          <div className="flex flex-col items-center gap-2 group/step">
                            <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                              Bước {sIdx + 1}
                            </div>

                            <div
                              onClick={() => setLightboxImage({ url: step.image, caption: step.name || `Bước ${sIdx + 1}` })}
                              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-slate-700/80 hover:border-amber-500 shadow-md flex items-center justify-center p-2 cursor-zoom-in transition-all group-hover/step:scale-105 group-hover/step:shadow-amber-500/10"
                              title="Bấm để xem ảnh phóng to"
                            >
                              <img
                                src={step.image}
                                alt={step.name || `Bước ${sIdx + 1}`}
                                className="w-full h-full object-contain drop-shadow"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.opacity = '0.5';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/step:opacity-100 rounded-2xl flex items-center justify-center transition-opacity pointer-events-none">
                                <ZoomIn className="w-5 h-5 text-amber-400" />
                              </div>
                            </div>

                            <div className="text-center max-w-[120px]">
                              <div className="text-xs font-bold text-white group-hover/step:text-amber-400 transition-colors break-words">
                                {step.name || `Bước ${sIdx + 1}`}
                              </div>
                              {step.description && (
                                <div className="text-[10px] text-slate-400 mt-0.5 break-words line-clamp-2">
                                  {step.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {!isLast && (
                            <div className="flex items-center justify-center px-1 text-amber-400/80 shrink-0">
                              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {(!b.steps || b.steps.length === 0) && (
                      <div className="w-full text-center text-xs text-slate-500 py-4">
                        Chưa có bước thao tác nào trong khối này.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (block.type === 'calculator') {
            const b = block as GuideCalculatorBlock;
            return (
              <div key={b.id || idx} className="space-y-4">
                <CashflowCalculator defaultCapital={b.defaultCapital || 72.5} />
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Lightbox Modal Xem Ảnh Đầy Đủ Không Bị Khuất */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setLightboxImage(null)}
              className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-all shadow-lg"
              title="Đóng xem ảnh"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            className="max-w-6xl max-h-[90vh] flex flex-col items-center justify-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption || 'Phóng to ảnh'}
              className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
            {lightboxImage.caption && (
              <p className="text-xs sm:text-sm font-semibold text-slate-200 text-center bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 shadow">
                <RichTextWithTags text={lightboxImage.caption} gameSlug={gameSlug} activities={activities} />
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
