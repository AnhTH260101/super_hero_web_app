'use client';

import React, { useState } from 'react';
import { Copy, Check, Gift, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Giftcode } from '@/types/game';

interface GiftcodeListProps {
  giftcodes: Giftcode[];
}

export const GiftcodeList: React.FC<GiftcodeListProps> = ({ giftcodes }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const activeCodes = giftcodes.filter(c => c.status === 'active');
  const expiredCodes = giftcodes.filter(c => c.status === 'expired');

  return (
    <div className="space-y-8">
      {/* Active Codes */}
      <section>
        <h2 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Giftcode Đang Hoạt Động ({activeCodes.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCodes.map((item) => {
            const isCopied = copiedCode === item.code;
            return (
              <div
                key={item.code}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xl font-black text-amber-400 tracking-wider">
                      {item.code}
                    </span>
                    <button
                      onClick={() => handleCopy(item.code)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>ĐÃ CHÉP</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>CHÉP MÃ</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 font-medium mb-2">
                    <span className="text-slate-400">Phần thưởng:</span> {item.rewards}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Hạn: {item.expiration}</span>
                  {item.serverNote && <span className="text-slate-500 italic">{item.serverNote}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Expired Codes */}
      {expiredCodes.length > 0 && (
        <section className="pt-4">
          <h2 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Mã Đã Hết Hạn ({expiredCodes.length})</span>
          </h2>
          <div className="space-y-2 opacity-60">
            {expiredCodes.map((item) => (
              <div key={item.code} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono line-through text-slate-400 font-bold">{item.code}</span>
                <span className="text-slate-500">{item.rewards}</span>
                <span className="text-red-400 text-[11px]">Hết hạn</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
