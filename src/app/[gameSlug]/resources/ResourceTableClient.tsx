'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
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

  // Map sources by ID for instant O(1) lookup
  const sourceMap = useMemo(() => {
    const map = new Map<string, ResourceSource>();
    for (const s of sources) {
      map.set(s.id, s);
    }
    return map;
  }, [sources]);

  // Filtered resources based only on search
  const filteredResources = useMemo(() => {
    if (!searchTerm.trim()) return initialResources;
    const term = searchTerm.toLowerCase();
    return initialResources.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.description.some((d) => d.toLowerCase().includes(term))
      );
    });
  }, [initialResources, searchTerm]);

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
        <div className="flex flex-col sm:flex-row min-h-[90px] divide-y sm:divide-y-0 sm:divide-x divide-slate-400">
          {/* Column 1: Icon (Fit size vừa vặn cho 1 item) */}
          <div className="w-full sm:w-20 md:w-24 shrink-0 flex items-center justify-center p-2 bg-slate-50">
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

          {/* Column 2: Description Bullet Points (Fit size gọn gàng theo nội dung ngắn) */}
          <div className="w-full sm:w-64 md:w-72 lg:w-80 shrink-0 p-2 sm:p-3 text-xs sm:text-[13px] leading-relaxed flex items-center bg-white">
            <ul className="space-y-1 list-disc list-outside pl-4 text-slate-800 font-medium w-full">
              {item.description.map((bullet, idx) => (
                <li key={idx} className="break-words">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Cách nhận (Chiếm trọn không gian còn lại để hiển thị thoải mái thẻ sự kiện) */}
          <div className="flex-1 min-w-0 p-2 sm:p-2.5 bg-slate-50 flex flex-col justify-center">
            <div className="text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 underline decoration-slate-300">
              Cách nhận:
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {item.sources.map((srcRef, sIdx) => {
                const srcData = sourceMap.get(srcRef.sourceId);
                const displayName = srcData ? srcData.name : srcRef.sourceId;
                const iconPath = srcData ? srcData.icon : null;

                return (
                  <div
                    key={sIdx}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-300 shadow-xs hover:border-amber-500 hover:shadow-sm transition-all text-slate-800"
                    title={displayName + (srcRef.note ? ` (${srcRef.note})` : '')}
                  >
                    {iconPath && (
                      <img
                        src={iconPath}
                        alt={displayName}
                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 drop-shadow-xs"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                      {displayName}
                    </span>
                    {srcRef.note && (
                      <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-1 py-0.2 rounded shadow-2xs">
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
      {/* Controls: Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tài nguyên, công dụng, đá rèn, phù văn..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Counter bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Hiển thị <span className="font-bold text-amber-400">{filteredResources.length}</span> / {initialResources.length} loại tài nguyên
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-amber-400 hover:underline"
          >
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {/* Main Table List */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-slate-400">
          Không tìm thấy tài nguyên nào phù hợp với từ khóa &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="space-y-4 max-w-5xl mx-auto">
          {filteredResources.map(renderResourceRow)}
        </div>
      )}
    </div>
  );
};
