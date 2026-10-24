'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Copy, Check, Box, ShoppingCart, Star, ArrowUpRight } from 'lucide-react';
import { GameItem, ItemCategory, ResourceSource } from '@/types/game';

interface Props {
  items: GameItem[];
  categories?: ItemCategory[];
  resourceSources?: ResourceSource[];
  gameSlug: string;
}

function getSourceData(sourceNameOrId: string, resourceSources: ResourceSource[], gameSlug: string) {
  const query = sourceNameOrId.trim().toLowerCase();
  const matched = resourceSources.find(
    (s) =>
      s.id.toLowerCase() === query ||
      s.name.toLowerCase() === query
  );

  const name = matched ? matched.name : sourceNameOrId;
  const icon = matched ? matched.icon : null;
  const id = matched ? matched.id : '';

  // Xác định link nhảy trang
  let href = `/${gameSlug}/daily`;
  if (id === 'giftcode' || query === 'giftcode') {
    href = `/${gameSlug}/giftcodes`;
  } else if (id === 'boss' || id === 'boss-the-gioi' || query.includes('boss')) {
    href = `/${gameSlug}/daily/boss`;
  } else if (id) {
    href = `/${gameSlug}/daily/${id}`;
  }

  return { name, icon, href };
}

export const ItemCatalogClient: React.FC<Props> = ({
  items,
  categories = [],
  resourceSources = [],
  gameSlug,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 48;

  const categoryMap = useMemo(() => {
    const map = new Map<string, { label: string; icon: string }>();
    map.set('all', { label: 'Tất cả danh mục', icon: '📦' });
    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        map.set(c.id, { label: c.name, icon: c.icon || '📦' });
      });
    } else {
      map.set('ticket', { label: 'Vé & Thẻ chiêu mộ', icon: '🎟️' });
      map.set('stamina', { label: 'Thể lực & Sức sống', icon: '⚡' });
      map.set('chest_key', { label: 'Rương & Chìa khóa', icon: '🎁' });
      map.set('upgrade_material', { label: 'Đá & Tinh hoa nâng cấp', icon: '💎' });
      map.set('equip_material', { label: 'Linh kiện & Bản vẽ trang bị', icon: '🛡️' });
      map.set('event', { label: 'Đạo cụ sự kiện', icon: '🎉' });
      map.set('general', { label: 'Vật phẩm tiêu hao khác', icon: '📜' });
    }
    return map;
  }, [categories]);

  // Danh sách các sự kiện / hoạt động có thể lọc (kèm số lượng vật phẩm)
  const availableFilterSources = useMemo(() => {
    const sourceCountMap = new Map<string, number>();

    items.forEach((item) => {
      if (item.sources && item.sources.length > 0) {
        item.sources.forEach((s) => {
          const key = s.trim().toLowerCase();
          sourceCountMap.set(key, (sourceCountMap.get(key) || 0) + 1);
        });
      }
    });

    const list: { id: string; name: string; count: number }[] = [];
    const addedKeys = new Set<string>();

    resourceSources.forEach((rs) => {
      const keyName = rs.name.trim().toLowerCase();
      const keyId = rs.id.trim().toLowerCase();
      const count =
        (sourceCountMap.get(keyName) || 0) +
        (keyId !== keyName ? sourceCountMap.get(keyId) || 0 : 0);

      list.push({
        id: rs.name,
        name: rs.name,
        count,
      });
      addedKeys.add(keyName);
      addedKeys.add(keyId);
    });

    // Thêm các nguồn khác có trong items nhưng chưa có trong resourceSources
    sourceCountMap.forEach((count, key) => {
      if (!addedKeys.has(key)) {
        list.push({
          id: key,
          name: key,
          count,
        });
        addedKeys.add(key);
      }
    });

    return list.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [items, resourceSources]);

  // Đếm số lượng tài nguyên trọng điểm
  const featuredCount = useMemo(() => {
    return items.filter((item) => item.is_show !== 0 && item.is_featured === 1).length;
  }, [items]);

  // Filter & sort items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => item.is_show !== 0);

    if (onlyFeatured) {
      result = result.filter((item) => item.is_featured === 1);
    }

    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (selectedSource !== 'all') {
      const srcQuery = selectedSource.toLowerCase();
      result = result.filter(
        (item) =>
          item.sources &&
          item.sources.some((s) => {
            const sLower = s.toLowerCase();
            return sLower === srcQuery || sLower.includes(srcQuery);
          })
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.story.toLowerCase().includes(term) ||
          (item.sources && item.sources.some((s) => s.toLowerCase().includes(term)))
      );
    }

    // Sắp xếp:
    // 1. Món được ghim trọng điểm (is_featured === 1) luôn lên đầu
    // 2. Món mới thêm bằng tay (id chứa chữ) lên trên các món cũ để thấy ngay trên Trang 1
    return [...result].sort((a, b) => {
      const aF = a.is_featured === 1 ? 1 : 0;
      const bF = b.is_featured === 1 ? 1 : 0;
      if (bF !== aF) return bF - aF;

      const aCustom = !/^\d+$/.test(a.id) ? 1 : 0;
      const bCustom = !/^\d+$/.test(b.id) ? 1 : 0;
      if (bCustom !== aCustom) return bCustom - aCustom;

      return 0;
    });
  }, [items, selectedCategory, selectedSource, searchTerm, onlyFeatured]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handleCopy = (name: string, key: string) => {
    navigator.clipboard.writeText(name);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Search & Category */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Nút lọc nhanh Tài nguyên trọng điểm */}
          <button
            type="button"
            onClick={() => {
              setOnlyFeatured(!onlyFeatured);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              onlyFeatured
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-amber-400'
            }`}
          >
            <Star className={`w-4 h-4 ${onlyFeatured ? 'fill-current' : 'text-amber-400'}`} />
            <span>⭐ Tài Nguyên Trọng Điểm {featuredCount > 0 ? `(${featuredCount})` : ''}</span>
          </button>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên vật phẩm hoặc công dụng (vd: Thẻ Vàng, Thể lực, Vận Mệnh, Rương...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-medium"
            >
              {Array.from(categoryMap.entries()).map(([catKey, { label, icon }]) => (
                <option key={catKey} value={catKey} className="bg-slate-900 text-white">
                  {icon} {label}
                </option>
              ))}
            </select>
          </div>

          {/* Source / Event Filter Dropdown */}
          <div className="relative w-full md:w-60">
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-medium"
            >
              <option value="all">🎯 Tất cả hoạt động / sự kiện ({availableFilterSources.length})</option>
              {availableFilterSources.map((s) => (
                <option key={s.id} value={s.name} className="bg-slate-900 text-white">
                  {s.name} {s.count > 0 ? `(${s.count} món)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Đang hiển thị <strong className="text-amber-400">{filteredItems.length}</strong> vật phẩm
            </span>
            {selectedSource !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                <span>🎯 Nguồn: {selectedSource}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSource('all')}
                  className="hover:text-white ml-0.5"
                  title="Xóa lọc nguồn"
                >
                  ✕
                </button>
              </span>
            )}
            {onlyFeatured && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                ⭐ Chỉ tài nguyên trọng điểm
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <span>
              Trang {currentPage} / {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Item Grid */}
      {paginatedItems.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-semibold text-slate-300">Không tìm thấy vật phẩm nào</p>
          <p className="text-xs text-slate-500 mt-1">Hãy thử tìm với từ khóa hoặc danh mục khác</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedItems.map((item, idx) => {
            const itemKey = `${item.id}-${idx}`;
            const isFeatured = item.is_featured === 1;

            return (
              <div
                key={itemKey}
                className={`group relative rounded-xl overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex flex-col justify-between ${
                  isFeatured
                    ? 'bg-gradient-to-b from-amber-500/10 via-slate-900/95 to-slate-900 border-2 border-amber-500/50 shadow-lg shadow-amber-500/5 hover:border-amber-400'
                    : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Icon + Name */}
                <div>
                  <div className="flex items-start gap-3.5">
                    {/* Layered Icon Box */}
                    <div className="relative w-16 h-16 shrink-0 rounded-xl bg-slate-950 border border-slate-700/80 p-1 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                      {item.icon ? (
                        <img
                          src={item.icon}
                          alt={item.name}
                          className="w-full h-full object-contain drop-shadow"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0.3';
                          }}
                        />
                      ) : (
                        <Box className="w-8 h-8 text-slate-600" />
                      )}

                      {/* Layer Overlay (Corner badge: iconcer_equip, iconcer_gem, public_shade_2...) */}
                      {item.overlay && (
                        <img
                          src={item.overlay}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow"
                          loading="lazy"
                        />
                      )}
                    </div>

                    {/* Name & Category */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-1">
                        <h3
                          className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors leading-snug"
                          title={item.name}
                        >
                          {item.name}
                        </h3>
                        {isFeatured && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>Trọng điểm</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <span>{categoryMap.get(item.category)?.icon || '📦'}</span>
                        <span className="truncate">
                          {categoryMap.get(item.category)?.label || item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Full Description / Story (Hiển thị toàn bộ nội dung, không cắt ngắn) */}
                  <div className="mt-3 text-xs leading-relaxed text-slate-300 font-normal bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                    {item.story ? item.story : <span className="text-slate-500 italic">Chưa có mô tả chi tiết.</span>}
                  </div>

                  {/* Cách kiếm / Nguồn nhận (Hiển thị icon & Bấm để nhảy trang) */}
                  {item.sources && item.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/70">
                      <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3 text-amber-400" />
                          <span>Cách kiếm:</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-normal lowercase">(chạm để xem)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.sources.map((src, sIdx) => {
                          const srcInfo = getSourceData(src, resourceSources, gameSlug);
                          return (
                            <Link
                              key={sIdx}
                              href={srcInfo.href}
                              className="group/src inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-amber-400 text-slate-200 hover:text-amber-300 hover:bg-amber-500/10 text-[11px] font-medium shadow-xs transition-all hover:scale-105 active:scale-95"
                              title={`Bấm để xem hướng dẫn hoạt động ${srcInfo.name}`}
                            >
                              {srcInfo.icon && (
                                <img
                                  src={srcInfo.icon}
                                  alt=""
                                  className="w-4 h-4 object-contain rounded shrink-0 group-hover/src:scale-110 transition-transform"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <span>{srcInfo.name}</span>
                              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover/src:text-amber-400 transition-colors shrink-0" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Copy Name */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleCopy(item.name, itemKey)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors shrink-0 text-[11px] font-medium"
                    title="Sao chép tên vật phẩm"
                  >
                    {copiedKey === itemKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Chép tên</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
          >
            Trang Trước
          </button>
          <span className="text-sm text-slate-400 px-3 font-medium">
            Trang <strong className="text-white">{currentPage}</strong> / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
          >
            Trang Sau
          </button>
        </div>
      )}
    </div>
  );
};
