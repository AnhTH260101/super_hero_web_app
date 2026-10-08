'use client';

import React from 'react';
import { HeroSkill } from '@/types/game';
import { Zap, ChevronDown } from 'lucide-react';

interface HeroSkillsSectionProps {
  skills: HeroSkill[];
}

function renderFormattedDescription(desc: string) {
  if (!desc) return null;
  const lines = desc.split('\n');
  return lines.map((line, lIdx) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const prefix = line.slice(0, colonIdx + 1);
      const rest = line.slice(colonIdx + 1);
      return (
        <span key={lIdx} className="block">
          <strong className="text-amber-300 font-bold">{prefix}</strong>
          {rest}
        </span>
      );
    }
    return <span key={lIdx} className="block">{line}</span>;
  });
}

export function HeroSkillsSection({ skills }: HeroSkillsSectionProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <details open className="group p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mb-10">
      <summary className="flex items-center justify-between cursor-pointer list-none select-none text-xl font-bold text-white mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Bộ Kỹ Năng Chiến Đấu ({skills.length})</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 group-open:bg-amber-500/20 group-open:text-amber-400 group-open:border-amber-500/40 transition-colors">
          <span className="group-open:hidden">Hiển thị</span>
          <span className="hidden group-open:inline">Thu gọn</span>
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex gap-4"
          >
            {/* Icon kỹ năng */}
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700/80 p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
              {skill.icon ? (
                <img src={skill.icon} alt={skill.name} className="w-full h-full object-contain" />
              ) : (
                <Zap className="w-5 h-5 text-amber-400/60" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base text-slate-100 truncate pr-2">
                  {skill.name}
                </h3>
              </div>

              {/* Mô tả chi tiết kỹ năng (In đậm phần trước dấu :) */}
              <div className="text-xs text-slate-300 leading-relaxed mb-3 space-y-1">
                {renderFormattedDescription(skill.description)}
              </div>

              {/* Thông tin kỹ năng sau khi Chuyển Sinh (CS1, CS2...) */}
              {skill.breakthrough && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-xs shadow-inner">
                  <div className="font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                    <span className="text-purple-400">⚡</span>
                    <span>CS{skill.breakthrough.level}{skill.breakthrough.title ? ` (${skill.breakthrough.title})` : ''}:</span>
                  </div>
                  <div className="text-slate-200 text-xs leading-relaxed space-y-1">
                    {renderFormattedDescription(skill.breakthrough.description)}
                  </div>
                </div>
              )}

              {/* Đột phá tiềm lực từ Huy Hiệu (Huy Hiệu Cấp 1, 2...) - Chỉ hiển thị khi có dữ liệu thật */}
              {skill.badge && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs shadow-inner">
                  <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <span className="text-amber-500">🎖️</span>
                    <span>Huy Hiệu Cấp {skill.badge.level}:</span>
                  </div>
                  <div className="text-slate-200 text-xs leading-relaxed space-y-1">
                    {renderFormattedDescription(skill.badge.description)}
                  </div>
                </div>
              )}

              {/* Thời gian hồi chiêu */}
              {skill.cooldown && (
                <div className="text-[11px] font-semibold text-slate-400 pt-2.5 mt-2.5 border-t border-slate-800/80">
                  Hồi chiêu: {skill.cooldown}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
