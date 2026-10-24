'use client';

import React, { useState } from 'react';
import {
  Calculator,
  Coins,
  Flame,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Props {
  defaultCapital?: number;
}

export const CashflowCalculator: React.FC<Props> = ({ defaultCapital = 72.5 }) => {
  const [capital, setCapital] = useState<number>(defaultCapital);

  const lsSpend = 16.0;
  const bclSpend = Math.max(0, capital - lsSpend);
  const refundBcl = bclSpend * 0.4;
  const jackpotMaze = 5.0;
  const spendBefore22h = lsSpend + bclSpend;
  const totalSpend = lsSpend + bclSpend + refundBcl + jackpotMaze;
  const isTargetAchieved = totalSpend >= 100.0;
  const diff = Math.abs(totalSpend - 100.0);

  // Ngọc Rồng Milestones
  const reaches60k = spendBefore22h >= 60.0;
  const neededFor80k = Math.max(0, 80.0 - spendBefore22h);
  const canReach80k = refundBcl >= neededFor80k;

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white">
                Công Cụ Tính Toán Dòng Tiền Tuần Hoàn
              </h3>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Live Simulator
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mô phỏng chính xác số vốn chuẩn bị ban đầu để cán mốc 100 vạn Xu tích tiêu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCapital(72.5)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            title="Đặt lại mức vốn chuẩn 72.5 vạn Xu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Mức Chuẩn 72.5v</span>
          </button>
          <a
            href="/tools/toi-uu-100-van-xu/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mở Tool Độc Lập</span>
          </a>
        </div>
      </div>

      {/* Input Slider & Quick Presets */}
      <div className="space-y-4 relative z-10">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="capital-input" className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Số Xu Vốn Chuẩn Bị Ban Đầu (Đơn vị: Vạn Xu):</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="capital-input"
                type="number"
                step="0.5"
                min="50"
                max="100"
                value={capital}
                onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-950 border border-amber-500/40 rounded-xl px-2.5 py-1 text-center text-amber-400 font-extrabold text-base focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs font-bold text-slate-400">vạn Xu</span>
            </div>
          </div>

          <input
            type="range"
            min="60"
            max="85"
            step="0.5"
            value={capital}
            onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Mức vốn tham khảo:</span>
          {[
            { label: '70.0 vạn (Cực kiệt)', val: 70.0 },
            { label: '72.5 vạn (Chuẩn toán học)', val: 72.5, recommended: true },
            { label: '75.0 vạn (Dư dả)', val: 75.0 },
            { label: '80.0 vạn (Thoải mái)', val: 80.0 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => setCapital(preset.val)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                capital === preset.val
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : preset.recommended
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Step Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">1. Vòng quay Loạn Thế</span>
          <span className="text-lg font-black text-rose-400 block">{lsSpend.toFixed(1)} vạn</span>
          <span className="text-[10px] text-slate-500 block">Lấy trọn 200 mảnh Pain/Cid (không hoàn)</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">2. Tiêu Bàn Cờ Lửa</span>
          <span className="text-lg font-black text-amber-400 block">{bclSpend.toFixed(1)} vạn</span>
          <span className="text-[10px] text-slate-500 block">Tiêu trước 22:00 để nhận hoàn 40%</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">3. Xu Hoàn BCL (40%)</span>
          <span className="text-lg font-black text-sky-400 block">{refundBcl.toFixed(1)} vạn</span>
          <span className="text-[10px] text-slate-500 block">Hệ thống hoàn về hòm thư sau 22h</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">4. Jackpot Mê Cung</span>
          <span className="text-lg font-black text-emerald-400 block">+{jackpotMaze.toFixed(1)} vạn</span>
          <span className="text-[10px] text-slate-500 block">Quay nổ hũ từ 171 Ngọc Rồng tích được</span>
        </div>
      </div>

      {/* Result Status Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 transition-all ${
          isTargetAchieved
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
        }`}
      >
        <div className="space-y-1">
          <span className="text-xs text-slate-400 font-medium">Tổng tích lũy chi tiêu cả ngày đạt được:</span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-black ${
                isTargetAchieved ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalSpend.toFixed(1)} vạn Xu
            </span>
            <span className="text-xs text-slate-400">
              ({(totalSpend * 10000).toLocaleString('vi-VN')} Xu)
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {isTargetAchieved ? (
              <span>
                🎉 Đã hoàn thành mốc 100 vạn Xu! Dư{' '}
                <strong className="text-emerald-300 font-bold">{diff.toFixed(1)} vạn Xu</strong> để phòng ngừa biến động.
              </span>
            ) : (
              <span>
                ⚠️ Chưa đủ cán mốc 100 vạn Xu! Bạn cần bổ sung thêm ít nhất{' '}
                <strong className="text-rose-300 font-bold">{diff.toFixed(1)} vạn Xu</strong> vốn ban đầu.
              </span>
            )}
          </p>
        </div>

        <div className="shrink-0">
          {isTargetAchieved ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs sm:text-sm shadow-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>ĐẠT MỤC TIÊU 100 VẠN XU</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs sm:text-sm shadow-md">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>THIẾU {diff.toFixed(1)} VẠN XU</span>
            </div>
          )}
        </div>
      </div>

      {/* Dragon Ball Condition Validation */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 relative z-10">
        <div className="flex items-center gap-2 font-bold text-slate-200">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Kiểm Tra Điều Kiện 171 Ngọc Rồng Để Nổ Hũ Kho Báu Mê Cung:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
          <div className="flex items-center gap-2">
            <span className={reaches60k ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {reaches60k ? '✔' : '✖'}
            </span>
            <span>
              Tích tiêu trước 22h: <strong>{spendBefore22h.toFixed(1)}v</strong> (
              {reaches60k ? 'Đạt mốc 60v: Có ~156 viên' : 'Chưa đạt mốc 60v'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={canReach80k ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {canReach80k ? '✔' : '✖'}
            </span>
            <span>
              Tiêu Xu hoàn sau 22h: <strong>{refundBcl.toFixed(1)}v</strong> (
              {canReach80k
                ? `Đủ cán mốc 80v -> Có >324 viên (thừa 171 viên!)`
                : `Thiếu ${(neededFor80k - refundBcl).toFixed(1)}v để cán mốc 80v`}
              )
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
