import React from 'react';
import { MonitorDown, Zap, ExternalLink } from 'lucide-react';

interface MonetizationBannerProps {
  gameName: string;
  affiliateUrl?: string;
}

export const MonetizationBanner: React.FC<MonetizationBannerProps> = ({ gameName, affiliateUrl }) => {
  if (!affiliateUrl) return null;

  return (
    <aside aria-label="Khuyến nghị trải nghiệm" className="w-full my-6 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-4 text-center sm:text-left">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
          <MonitorDown className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Trải nghiệm đỉnh cao</span>
            <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] rounded font-bold">120 FPS</span>
          </div>
          <p className="text-sm font-semibold text-slate-100">
            Chơi mượt mà <span className="text-amber-400">{gameName}</span> trên PC qua giả lập
          </p>
          <p className="text-xs text-slate-400">
            Tối ưu đồ họa, không nóng máy, tự động treo máy cày phó bản an toàn.
          </p>
        </div>
      </div>

      <a
        href={affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 shrink-0 transition-transform active:scale-95"
      >
        <Zap className="w-4 h-4" />
        <span>TẢI BẢN TỐI ƯU PC</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
      </a>
    </aside>
  );
};
