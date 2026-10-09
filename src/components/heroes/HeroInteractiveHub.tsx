'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Hero, BreakthroughSimItem, SuperEvoSimItem } from '@/types/game';
import { ChevronLeft, ChevronRight, ChevronDown, Swords } from 'lucide-react';

interface HeroInteractiveHubProps {
  hero: Hero;
  gameSlug: string;
}

export function HeroInteractiveHub({ hero, gameSlug }: HeroInteractiveHubProps) {
  // Cấp chuyển sinh (1 - 7, mặc định 1)
  const [breakLevel, setBreakLevel] = useState<number>(1);
  // Bậc siêu tiến hóa (1 - 8, tương ứng Đỏ, Đỏ +, Đỏ ++, Vàng, Vàng +, Vàng ++...)
  const [superEvoLevel, setSuperEvoLevel] = useState<number>(1);

  const breakData: BreakthroughSimItem[] = hero.breakthroughSimData || [];
  const superEvoData: SuperEvoSimItem[] = hero.superEvoSimData || [];

  const currentBreak = breakData.find((b) => b.level === breakLevel) || breakData[0];
  const currentSuperEvo = superEvoData.find((s) => s.level === superEvoLevel) || superEvoData[0];

  // Khung thẻ bài game gốc theo bậc Siêu Tiến Hóa
  const currentCardFrame = currentSuperEvo?.frame || '/images/card_layers/card_gold.png';
  const currentSTHTierLabel = currentSuperEvo?.tierLabel || `Cấp ${superEvoLevel}`;

  // Số lượng sao hoặc mặt trăng theo cấp Chuyển Sinh
  const starsCount = currentBreak?.starsCount ?? (breakLevel <= 5 ? breakLevel : 0);
  const moonsCount = currentBreak?.moonsCount ?? (breakLevel === 6 ? 1 : breakLevel >= 7 ? 2 : 0);

  return (
    <div className="space-y-8 mb-10">
      {/* 1. Hero Header Card (Bên trái: Thông tin tổng quan; Bên phải: Thẻ bài nhân vật đắp layer game gốc) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 relative z-10">
          {/* Cột thông tin nhân vật */}
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 border-2 border-amber-500/40 overflow-hidden flex items-center justify-center shadow-xl shrink-0">
                {hero.avatar && hero.avatar.startsWith('/') ? (
                  <img src={hero.avatar} alt={hero.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🦸</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  {hero.isSkinForm && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-pink-500/20 text-pink-400 border border-pink-500/40">
                      Trang Phục / Skin
                    </span>
                  )}
                  {hero.isAfterlifeForm && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-400 border border-purple-500/40">
                      Dạng Chuyển Thế
                    </span>
                  )}
                  {(hero.isAfterlifeForm || hero.isSkinForm) && hero.baseHero && (
                    <Link
                      href={`/${gameSlug}/heroes/${hero.baseHero.slug}`}
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 transition-all flex items-center gap-1 shadow-sm group"
                      title={`Xem tướng mặc định: ${hero.baseHero.name}`}
                    >
                      <span className="text-amber-400 font-black group-hover:-translate-x-0.5 transition-transform">↩</span>
                      <span className="text-slate-300 font-normal">Gốc:</span>
                      <span className="font-extrabold text-amber-400">{hero.baseHero.name}</span>
                    </Link>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
                    Tier {hero.tier}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">
                  {hero.name}
                </h1>

                {/* Hiệu ứng trong kĩ năng */}
                {hero.effects && hero.effects.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                    <span className="text-xs font-bold text-amber-400 mr-1">Hiệu ứng:</span>
                    {hero.effects.map((eff, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700/80 shadow-sm"
                      >
                        {eff}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Đối với nhân vật chuyển thế / trang phục: Tổng nguyên liệu */}
            {(hero.isAfterlifeForm || hero.isSkinForm) && (hero.afterlifeMaterials || hero.afterlifeRequirementsText) && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/40 shadow-xl text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-amber-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>💎</span> Tổng nguyên liệu chuyển thế
                  </span>
                  {hero.baseHero && (
                    <Link
                      href={`/${gameSlug}/heroes/${hero.baseHero.slug}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-amber-300 transition-colors shrink-0 group"
                    >
                      <span>Về tướng mặc định ({hero.baseHero.name})</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>

                {hero.afterlifeMaterials && hero.afterlifeMaterials.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2.5">
                    {hero.afterlifeMaterials.map((mat, idx) => {
                      const isBaseHeroMat = mat.type === 'hero' && hero.baseHero;
                      const matNode = (
                        <div
                          title={isBaseHeroMat ? `Phôi tướng gốc: ${mat.name} x${mat.amount} (Bấm để xem tướng mặc định)` : `${mat.name} x${mat.amount}`}
                          className={`group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950/90 border transition-all shadow-md overflow-hidden hover:scale-105 ${
                            mat.type === 'hero'
                              ? 'border-amber-500/60 hover:border-amber-400'
                              : 'border-purple-500/40 hover:border-purple-300'
                          }`}
                        >
                          {mat.type === 'hero' && (
                            <div className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-black bg-amber-500 text-slate-950 z-10 leading-none shadow">
                              Tướng
                            </div>
                          )}

                          <img
                            src={mat.icon}
                            alt={mat.name}
                            className={`w-full h-full object-contain p-1.5 transition-transform group-hover:scale-110 ${
                              mat.type === 'hero' ? 'rounded-xl' : ''
                            }`}
                          />

                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-[10px] sm:text-[11px] font-black text-amber-300 leading-none shadow">
                            x{mat.amount}
                          </span>
                        </div>
                      );

                      return hero.baseHero && mat.type === 'hero' ? (
                        <Link key={idx} href={`/${gameSlug}/heroes/${hero.baseHero.slug}`}>
                          {matNode}
                        </Link>
                      ) : (
                        <div key={idx}>{matNode}</div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-purple-200 font-semibold">
                    {hero.afterlifeRequirementsText}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Thẻ nhân vật dạng dọc - w, h cứng, bo góc, viền line cam */}
          <div className="shrink-0 w-[280px] h-[390px] rounded-3xl border-2 border-orange-500 bg-slate-950/60 p-3 flex items-center justify-center overflow-hidden shadow-2xl shadow-orange-500/10">
            <img
              src={hero.fullArt || hero.avatar}
              alt={`${hero.name} toàn thân`}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* 2. Hệ Thống Trang Phục / Skin Đặc Biệt (Mặc định thu gọn / ẩn) */}
      {hero.skins && hero.skins.length > 0 && (
        <details className="group p-6 rounded-3xl bg-gradient-to-r from-pink-950/20 via-slate-900 to-slate-900 border border-pink-500/30 shadow-xl transition-all">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none">
            <div className="flex items-center gap-2">
              <span className="text-xl">👗</span>
              <h2 className="text-xl font-black text-white">
                Trang Phục / Skin Đặc Biệt ({hero.skins.length})
              </h2>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                Tăng mạnh hiệu ứng kỹ năng
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 group-open:bg-pink-500/20 group-open:text-pink-400 group-open:border-pink-500/40 transition-colors">
              <span className="group-open:hidden">Hiển thị</span>
              <span className="hidden group-open:inline">Thu gọn</span>
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </div>
          </summary>

          <div className="mt-5 space-y-4 pt-4 border-t border-slate-800">
            {hero.skins.map((skin, sIdx) => (
              <div
                key={sIdx}
                className="p-5 rounded-2xl bg-slate-950/70 border border-pink-500/30 flex flex-col md:flex-row gap-5 items-start"
              >
                {/* Ảnh Skin */}
                <div className="shrink-0 flex sm:flex-col items-center gap-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-pink-500/60 p-1 overflow-hidden shadow-lg shadow-pink-500/10">
                    <img
                      src={skin.fullArt || skin.avatar}
                      alt={skin.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {skin.slug && skin.slug !== hero.slug && (
                    <Link
                      href={`/${gameSlug}/heroes/${skin.slug}`}
                      className="px-2.5 py-1 rounded-xl bg-pink-950/80 hover:bg-pink-900 border border-pink-500/40 text-[11px] font-bold text-pink-200 hover:text-white transition-all text-center"
                    >
                      Xem dạng Skin
                    </Link>
                  )}
                </div>

                {/* Thông tin Skin & Chi phí */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>{skin.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40">
                        Skin Giới Hạn
                      </span>
                    </h3>

                    {/* Chi phí mở khóa */}
                    {skin.costAmount && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-xs font-bold text-amber-300">
                        {skin.costIcon && (
                          <img src={skin.costIcon} alt={skin.costItem || 'Xu'} className="w-5 h-5 object-contain" />
                        )}
                        <span>Mở khóa: {skin.costAmount} {skin.costItem || 'Xu Skin'}</span>
                      </div>
                    )}
                  </div>

                  {skin.overview && (
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      {skin.overview}
                    </p>
                  )}

                  {skin.refreshCostAmount && (
                    <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5">
                      <span className="text-pink-400">🔄</span>
                      <span>Chi phí tẩy thuộc tính: <strong>{skin.refreshCostAmount} {skin.refreshCostItem || 'Xu Skin'}</strong>/lần</span>
                    </div>
                  )}

                  {/* Danh sách hiệu ứng kỹ năng được cường hóa */}
                  {skin.skillEnhancements && skin.skillEnhancements.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-xl bg-pink-950/30 border border-pink-500/20">
                      <div className="text-xs font-black text-pink-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span>✨</span>
                        <span>Cường Hóa Kỹ Năng Khi Sở Hữu:</span>
                      </div>
                      <div className="space-y-2">
                        {skin.skillEnhancements.map((enh, eIdx) => (
                          <div key={eIdx} className="text-xs leading-relaxed">
                            <span className="font-bold text-amber-300">{enh.skillName}: </span>
                            <span className="text-slate-200">{enh.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* 3. Tính năng Chuyển Sinh Mô Phỏng (Collapsible Toggle, Mặc định mở) */}
      {breakData.length > 0 && currentBreak && (
        <details open className="group p-6 rounded-3xl bg-slate-900 border border-purple-500/40 shadow-xl">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none mb-5">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 text-xl">⚡</span>
              <h2 className="text-xl font-black text-white">Chuyển Sinh</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/50 text-purple-300 hidden sm:flex items-center gap-1.5">
                <span>CS{breakLevel}: {currentBreak.tierName}</span>
                <span className="text-amber-400">
                  {starsCount > 0 ? `(${starsCount} ⭐)` : moonsCount > 0 ? `(${moonsCount} 🌙)` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 group-open:bg-purple-500/20 group-open:text-purple-400 group-open:border-purple-500/40 transition-colors">
                <span className="group-open:hidden">Hiển thị</span>
                <span className="hidden group-open:inline">Thu gọn</span>
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </div>
            </div>
          </summary>

          {/* Cụm điều khiển: Nút [-] | Trung tâm là Nguyên Liệu | Nút [+] */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 shadow-inner">
            {/* Nút trừ cấp chuyển sinh */}
            <button
              onClick={() => setBreakLevel((prev) => Math.max(1, prev - 1))}
              disabled={breakLevel <= 1}
              aria-label="Giảm cấp chuyển sinh"
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center font-black text-xl transition-all shrink-0 shadow-lg ${
                breakLevel <= 1
                  ? 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-purple-950/70 border-purple-500/60 text-purple-300 hover:bg-purple-900 hover:border-purple-400 hover:scale-105 active:scale-95'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Trung tâm: Nguyên liệu cần để chuyển sinh ở cấp đó */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
              <span className="text-xs font-extrabold text-purple-300/80 uppercase tracking-wider mb-2">
                Nguyên liệu CS{breakLevel} ({currentBreak.title})
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {currentBreak.materials.map((mat, idx) => (
                  <div
                    key={idx}
                    title={`${mat.name} x${mat.amount}`}
                    className={`group relative flex items-center justify-center w-13 h-13 sm:w-15 sm:h-15 rounded-xl bg-slate-900 border transition-all shadow-md overflow-hidden hover:scale-105 ${
                      mat.type === 'hero'
                        ? 'border-amber-500/70 hover:border-amber-400'
                        : 'border-purple-500/50 hover:border-purple-300'
                    }`}
                  >
                    {mat.type === 'hero' && (
                      <div className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-black bg-amber-500 text-slate-950 z-10 leading-none shadow">
                        Tướng
                      </div>
                    )}
                    <img
                      src={mat.icon}
                      alt={mat.name}
                      className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-110"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-[10px] sm:text-[11px] font-black text-amber-300 leading-none shadow">
                      x{mat.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút cộng cấp chuyển sinh */}
            <button
              onClick={() => setBreakLevel((prev) => Math.min(breakData.length, prev + 1))}
              disabled={breakLevel >= breakData.length}
              aria-label="Tăng cấp chuyển sinh"
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center font-black text-xl transition-all shrink-0 shadow-lg ${
                breakLevel >= breakData.length
                  ? 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-purple-950/70 border-purple-500/60 text-purple-300 hover:bg-purple-900 hover:border-purple-400 hover:scale-105 active:scale-95'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* 1 text thông tin cấp độ chuyển sinh + icon kĩ năng được cường hóa */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-slate-950 border border-purple-500/30 flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900 border border-purple-500/60 p-1 shrink-0 overflow-hidden shadow flex items-center justify-center">
              <img
                src={currentBreak.skillIcon}
                alt={currentBreak.skillName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40">
                  CS{breakLevel}
                </span>
                <span className="text-sm sm:text-base font-black text-white truncate">
                  {currentBreak.skillName}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-purple-300 font-bold">Cường hóa: </strong>
                {currentBreak.skillDesc}
              </p>
            </div>
          </div>
        </details>
      )}

      {/* 3. Tính năng Siêu Tiến Hóa Mô Phỏng (Collapsible Toggle, Mặc định mở) */}
      {superEvoData.length > 0 && currentSuperEvo && (
        <details open className="group p-6 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-xl">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none mb-5">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-xl">🔥</span>
              <h2 className="text-xl font-black text-white">Siêu Tiến Hóa</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 hidden sm:block">
                Bậc: {currentSTHTierLabel} ({superEvoLevel}/{superEvoData.length})
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 group-open:bg-amber-500/20 group-open:text-amber-400 group-open:border-amber-500/40 transition-colors">
                <span className="group-open:hidden">Hiển thị</span>
                <span className="hidden group-open:inline">Thu gọn</span>
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </div>
            </div>
          </summary>

          {/* Cụm điều khiển: Nút [-] | Trung tâm là 4 thẻ tướng hiến tế | Nút [+] */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 shadow-inner">
            {/* Nút trừ cấp siêu tiến hóa */}
            <button
              onClick={() => setSuperEvoLevel((prev) => Math.max(1, prev - 1))}
              disabled={superEvoLevel <= 1}
              aria-label="Giảm cấp siêu tiến hóa"
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center font-black text-xl transition-all shrink-0 shadow-lg ${
                superEvoLevel <= 1
                  ? 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900 hover:border-amber-400 hover:scale-105 active:scale-95'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Trung tâm: 4 thẻ tướng nguyên liệu cần thiết */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
              <span className="text-xs font-extrabold text-amber-300/80 uppercase tracking-wider mb-2">
                Tướng hiến tế bậc {currentSTHTierLabel}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {currentSuperEvo.materials.map((mat, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center group w-12 sm:w-14"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900 border-2 border-amber-500/60 p-0.5 overflow-hidden shadow transition-transform group-hover:scale-105">
                      <img
                        src={mat.icon}
                        alt={mat.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <span className="text-[10px] text-slate-300 group-hover:text-amber-400 font-bold text-center truncate w-full mt-1">
                      {mat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút cộng cấp siêu tiến hóa */}
            <button
              onClick={() => setSuperEvoLevel((prev) => Math.min(superEvoData.length, prev + 1))}
              disabled={superEvoLevel >= superEvoData.length}
              aria-label="Tăng cấp siêu tiến hóa"
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center font-black text-xl transition-all shrink-0 shadow-lg ${
                superEvoLevel >= superEvoData.length
                  ? 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900 hover:border-amber-400 hover:scale-105 active:scale-95'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* 1 text thông tin cấp độ siêu tiến hóa + icon kĩ năng mở khóa (nếu có) */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 flex items-start gap-4">
            {currentSuperEvo.unlockedSkillIcon ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900 border border-amber-500/60 p-1 shrink-0 overflow-hidden shadow flex items-center justify-center">
                <img
                  src={currentSuperEvo.unlockedSkillIcon || undefined}
                  alt={currentSuperEvo.unlockedSkill || 'Kỹ năng'}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900 border border-amber-500/40 shrink-0 flex items-center justify-center text-amber-400 shadow">
                <Swords className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                  {currentSTHTierLabel}
                </span>
                <span className="text-sm sm:text-base font-black text-white truncate">
                  {currentSuperEvo.unlockedSkill
                    ? `Mở khóa: ${currentSuperEvo.unlockedSkill}`
                    : `Gia tăng thuộc tính bậc ${currentSTHTierLabel}`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-amber-300 font-bold">Thuộc tính tăng: </strong>
                {currentSuperEvo.statBonus}
              </p>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
