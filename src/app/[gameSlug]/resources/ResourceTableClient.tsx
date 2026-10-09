'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, Filter, Layers, LayoutGrid, List } from 'lucide-react';
import { ResourceItem, ResourceSource } from '@/types/game';

interface Props {
  initialResources: ResourceItem[];
  sources: ResourceSource[];
  gameSlug: string;
}

export const ResourceTableClient: React.FC<Props> = ({
  initialResources,
  sources,
  gameSlug,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [viewMode, setViewMode] = useState<'double' | 'single'>('double');

  // Map sources by ID for instant O(1) lookup
  const sourceMap = useMemo(() => {
    const map = new Map<string, ResourceSource>();
    for (const s of sources) {
      map.set(s.id, s);
    }
    return map;
  }, [sources]);

  // List of unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of initialResources) {
      if (r.category) set.add(r.category);
    }
    return ['Tất cả', ...Array.from(set)];
  }, [initialResources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return initialResources.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.some((d) =>
          d.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchCategory =
        selectedCategory === 'Tất cả' || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [initialResources, searchTerm, selectedCategory]);

  // Render a single resource table card (matching the user's reference photo)
  const renderResourceRow = (item: ResourceItem) => {
    return (
      <div
        key={item.id}
        className="border border-slate-600 bg-white text-slate-900 rounded-md overflow-hidden shadow-md transition-all hover:shadow-xl"
      >
        {/* Header Bar: Dark Slate with Centered Title */}
        <div className="bg-[#464c53] text-white text-center font-bold text-sm sm:text-base py-1.5 px-3 border-b border-slate-600 tracking-wide select-none">
          {item.name}
        </div>

        {/* 3-Column Table Row Body */}
        <div className="grid grid-cols-12 min-h-[90px] divide-x divide-slate-400">
          {/* Column 1: Icon (2 cols on small, 2 cols on medium) */}
          <div className="col-span-3 sm:col-span-2 flex items-center justify-center p-2 bg-slate-50">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-slate-300 shadow-sm flex items-center justify-center bg-white p-1">
              <img
                src={item.icon}
                alt={item.name}
                className="w-full h-full object-contain drop-shadow-sm"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.opacity = '0.4';
                }}
              />
            </div>
          </div>

          {/* Column 2: Description Bullet Points (5 cols) */}
          <div className="col-span-5 sm:col-span-5 p-2 sm:p-3 text-xs sm:text-[13px] leading-relaxed flex items-center bg-white">
            <ul className="space-y-1 list-disc list-outside pl-4 text-slate-800 font-medium">
              {item.description.map((bullet, idx) => (
                <li key={idx} className="break-words">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Cách nhận (Chỉ hiển thị Icon hoạt động - vì icon đã có chữ sẵn) */}
          <div className="col-span-4 sm:col-span-5 p-2 sm:p-2.5 bg-slate-50 flex flex-col justify-center">
            <div className="text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 underline decoration-slate-300">
              Cách nhận:
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {item.sources.map((srcRef, sIdx) => {
                const srcData = sourceMap.get(srcRef.sourceId);
                const displayName = srcData ? srcData.name : srcRef.sourceId;
                const iconPath = srcData ? srcData.icon : null;
                if (!iconPath) return null;

                return (
                  <div
                    key={sIdx}
                    className="relative group transition-transform hover:scale-105 active:scale-95"
                    title={displayName + (srcRef.note ? ` (${srcRef.note})` : '')}
                  >
                    <img
                      src={iconPath}
                      alt={displayName}
                      className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm rounded border border-slate-200 bg-white p-0.5"
                      loading="lazy"
                    />
                    {srcRef.note && (
                      <span className="absolute -bottom-1 -right-1 text-[9px] bg-red-600 text-white font-bold px-1 rounded-full shadow">
                        {srcRef.note}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls: Search, Filter & Layout toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tài nguyên, đá rèn, phù văn..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div className="hidden lg:flex items-center gap-1 border border-slate-800 rounded-xl p-1 bg-slate-950 shrink-0">
          <button
            onClick={() => setViewMode('double')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              viewMode === 'double'
                ? 'bg-slate-800 text-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dạng 2 cột (như ảnh mẫu)"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>2 Cột</span>
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              viewMode === 'single'
                ? 'bg-slate-800 text-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dạng 1 cột toàn màn hình"
          >
            <List className="w-4 h-4" />
            <span>1 Cột</span>
          </button>
        </div>
      </div>

      {/* Counter bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Hiển thị <span className="font-bold text-amber-400">{filteredResources.length}</span> / {initialResources.length} loại tài nguyên
        </div>
        {selectedCategory !== 'Tất cả' && (
          <button
            onClick={() => setSelectedCategory('Tất cả')}
            className="text-amber-400 hover:underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Main Table Grid matching Reference Image */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-slate-400">
          Không tìm thấy tài nguyên nào phù hợp với từ khóa &quot;{searchTerm}&quot;.
        </div>
      ) : viewMode === 'double' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Left Column */}
          <div className="space-y-4">
            {filteredResources
              .filter((_, idx) => idx % 2 === 0)
              .map(renderResourceRow)}
          </div>
          {/* Right Column */}
          <div className="space-y-4">
            {filteredResources
              .filter((_, idx) => idx % 2 === 1)
              .map(renderResourceRow)}
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-5xl mx-auto">
          {filteredResources.map(renderResourceRow)}
        </div>
      )}
    </div>
  );
};
