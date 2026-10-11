'use client';

import React, { useState } from 'react';
import { Gift, RefreshCw, CheckCircle2, AlertCircle, Copy, Check, Clock, Sparkles, Trash2 } from 'lucide-react';
import { Giftcode } from '@/types/game';

interface Props {
  initialGiftcodes: Giftcode[];
  gameSlug: string;
}

export const AdminGiftcodeEditor: React.FC<Props> = ({
  initialGiftcodes,
  gameSlug,
}) => {
  const [giftcodes, setGiftcodes] = useState<Giftcode[]>(initialGiftcodes);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Modal custom token / channel if user wants to override
  const [customToken, setCustomToken] = useState('');
  const [customChannelId, setCustomChannelId] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load existing config on mount
  React.useEffect(() => {
    fetch(`/api/admin/giftcodes?gameSlug=${gameSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.discordToken) setCustomToken(data.discordToken);
          if (data.channelId) setCustomChannelId(data.channelId);
        }
      })
      .catch((err) => console.error(err));
  }, [gameSlug]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSaveConfig = async () => {
    if (!customToken.trim() || !customChannelId.trim()) {
      alert('Vui lòng nhập đầy đủ Token và Channel ID!');
      return;
    }
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/admin/giftcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_config',
          gameSlug,
          discordToken: customToken.trim(),
          channelId: customChannelId.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncResult({ text: 'Đã lưu cấu hình Discord thành công trên website!', type: 'success' });
      } else {
        setSyncResult({ text: data.error || 'Lỗi khi lưu cấu hình', type: 'error' });
      }
    } catch (e: any) {
      setSyncResult({ text: e.message, type: 'error' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Xóa chủ động 1 code
  const handleDeleteCode = async (code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn mã Giftcode: ${code}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/giftcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          gameSlug,
          code,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGiftcodes((prev) => prev.filter((item) => item.code.toUpperCase() !== code.toUpperCase()));
        setSyncResult({ text: `Đã xóa mã giftcode ${code}`, type: 'success' });
      } else {
        alert(data.error || 'Lỗi khi xóa mã');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Tự động dọn dẹp các mã hết hạn
  const handleCleanExpired = async () => {
    setIsCleaning(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/admin/giftcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clean_expired',
          gameSlug,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.giftcodes) {
          setGiftcodes(data.giftcodes);
        }
        setSyncResult({ text: data.message, type: 'success' });
      } else {
        setSyncResult({ text: data.error || 'Lỗi khi dọn dẹp mã hết hạn', type: 'error' });
      }
    } catch (e: any) {
      setSyncResult({ text: e.message, type: 'error' });
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSyncDiscord = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/admin/giftcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug,
          discordToken: customToken.trim() || undefined,
          channelId: customChannelId.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSyncResult({ text: data.message, type: 'success' });
        // Tải lại trang hoặc update state nếu có code mới
        if (data.newCodes && data.newCodes.length > 0) {
          setGiftcodes((prev) => [...data.newCodes, ...prev]);
        }
      } else {
        setSyncResult({
          text: data.error || 'Lỗi khi đồng bộ từ Discord',
          type: 'error',
        });
      }
    } catch (err: any) {
      setSyncResult({ text: err.message, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Tự Động Đồng Bộ Giftcode Từ Discord ({giftcodes.length} mã)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Quét tin nhắn trong kênh thông báo Discord của game và tự động cập nhật mã quà mới lên website.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
          >
            ⚙️ {showConfig ? 'Đóng Cấu Hình' : 'Cấu Hình Kênh'}
          </button>

          <button
            onClick={handleCleanExpired}
            disabled={isCleaning}
            className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Tự động kiểm tra và xóa toàn bộ các mã đã quá hạn sử dụng"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isCleaning ? 'animate-spin' : ''}`} />
            <span>{isCleaning ? 'Đang Dọn...' : 'Tự Động Xóa Hết Hạn'}</span>
          </button>

          <button
            onClick={handleSyncDiscord}
            disabled={isSyncing}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang Quét Tin Nhắn...' : 'Quét Giftcode Mới Từ Discord'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Nhập Thông Tin Kênh Discord (hoặc cấu hình cố định trong .env.local)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Discord User Token (Authorization)
              </label>
              <input
                type="password"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                placeholder="Nhập Discord Token của bạn..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Channel ID (Kênh thông báo/giftcode của Server)
              </label>
              <input
                type="text"
                value={customChannelId}
                onChange={(e) => setCustomChannelId(e.target.value)}
                placeholder="VD: 123456789012345678"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-slate-400 text-[11px]">
              💡 Thông tin được lưu an toàn trên máy chủ web, bạn chỉ cần nhập 1 lần duy nhất!
            </span>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow disabled:opacity-50"
            >
              {isSavingConfig ? 'Đang lưu...' : 'Lưu Cấu Hình Này'}
            </button>
          </div>
        </div>
      )}

      {/* Sync Status Alert */}
      {syncResult && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            syncResult.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {syncResult.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{syncResult.text}</span>
        </div>
      )}

      {/* Giftcode List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-44">Mã Giftcode</th>
                <th className="py-3 px-4">Phần Thưởng</th>
                <th className="py-3 px-4 w-32">Hạn Dùng</th>
                <th className="py-3 px-4 w-28 text-center">Trạng Thái</th>
                <th className="py-3 px-4 w-44">Nguồn / Ghi Chú</th>
                <th className="py-3 px-4 w-20 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {giftcodes.map((item, idx) => (
                <tr key={item.code} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-sm">
                    <div className="flex items-center gap-2">
                      <span>{item.code}</span>
                      <button
                        onClick={() => handleCopy(item.code)}
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Sao chép mã"
                      >
                        {copiedCode === item.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    {item.rewards}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.expiration}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {item.status === 'active' ? 'Còn hạn' : 'Hết hạn'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {item.serverNote || 'Không có ghi chú'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteCode(item.code)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors opacity-70 group-hover:opacity-100"
                      title={`Xóa mã ${item.code}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
