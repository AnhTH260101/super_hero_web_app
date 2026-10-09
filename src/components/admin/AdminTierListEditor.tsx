'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Edit2,
  X,
  Search,
  ExternalLink,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Hero, TierGroup, TierListItem } from '@/types/game';
import { TIER_PRESET_COLORS, getTierColor } from '@/lib/tierColors';

interface AdminTierListEditorProps {
  initialTiers: TierGroup[];
  allHeroes: Hero[];
  gameSlug: string;
  adminToken: string;
}

export const AdminTierListEditor: React.FC<AdminTierListEditorProps> = ({
  initialTiers,
  allHeroes,
  gameSlug,
  adminToken,
}) => {
  const [tiers, setTiers] = useState<TierGroup[]>(initialTiers || []);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal thêm/sửa Tier
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierNameInput, setTierNameInput] = useState('');
  const [tierColorInput, setTierColorInput] = useState('red');
  const [tierDescInput, setTierDescInput] = useState('');

  // Modal chọn tướng vào Tier
  const [heroPickerOpen, setHeroPickerOpen] = useState(false);
  const [targetTierId, setTargetTierId] = useState<string | null>(null);
  const [heroSearchTerm, setHeroSearchTerm] = useState('');

  // Hiện thông báo tự tắt sau 3s
  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. TẠO & SỬA TIER
  const openCreateTierModal = () => {
    setEditingTierId(null);
    setTierNameInput(`T${tiers.length}`);
    setTierColorInput(TIER_PRESET_COLORS[tiers.length % TIER_PRESET_COLORS.length].id);
    setTierDescInput('');
    setTierModalOpen(true);
  };

  const openEditTierModal = (tier: TierGroup) => {
    setEditingTierId(tier.id);
    setTierNameInput(tier.name);
    setTierColorInput(tier.color);
    setTierDescInput(tier.description || '');
    setTierModalOpen(true);
  };

  const handleSaveTierModal = () => {
    const trimmedName = tierNameInput.trim();
    if (!trimmedName) {
      alert('Vui lòng nhập tên cho Tier!');
      return;
    }

    if (editingTierId) {
      // Sửa tier hiện có
      setTiers((prev) =>
        prev.map((t) =>
          t.id === editingTierId
            ? {
                ...t,
                name: trimmedName,
                color: tierColorInput,
                description: tierDescInput.trim(),
              }
            : t
        )
      );
      showToast(`Đã cập nhật tier ${trimmedName}`, 'success');
    } else {
      // Tạo tier mới
      const newId = `tier_${Date.now()}`;
      const newTier: TierGroup = {
        id: newId,
        name: trimmedName,
        color: tierColorInput,
        description: tierDescInput.trim(),
        heroes: [],
      };
      setTiers((prev) => [...prev, newTier]);
      showToast(`Đã tạo tier mới ${trimmedName}`, 'success');
    }

    setTierModalOpen(false);
  };

  // Xóa Tier
  const handleDeleteTier = (tierId: string, tierName: string) => {
    const confirmDel = window.confirm(`Bạn có chắc chắn muốn xóa Tier "${tierName}" cùng toàn bộ tướng trong tier này?`);
    if (!confirmDel) return;

    setTiers((prev) => prev.filter((t) => t.id !== tierId));
    showToast(`Đã xóa tier ${tierName}`, 'success');
  };

  // Di chuyển thứ tự Tier
  const handleMoveTier = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tiers.length) return;

    const newTiers = [...tiers];
    const temp = newTiers[index];
    newTiers[index] = newTiers[targetIndex];
    newTiers[targetIndex] = temp;
    setTiers(newTiers);
  };

  // 2. CHỌN TƯỚNG VÀO TIER
  const openHeroPicker = (tierId: string) => {
    setTargetTierId(tierId);
    setHeroSearchTerm('');
    setHeroPickerOpen(true);
  };

  // Lọc tướng trong Modal chọn tướng
  const availableHeroes = useMemo(() => {
    const term = heroSearchTerm.trim().toLowerCase();
    return allHeroes.filter(
      (h) =>
        term === '' ||
        h.name.toLowerCase().includes(term) ||
        h.slug.toLowerCase().includes(term) ||
        h.id.includes(term) ||
        h.element.toLowerCase().includes(term)
    );
  }, [allHeroes, heroSearchTerm]);

  // Kiểm tra tướng đã có trong tier mục tiêu hay chưa
  const isHeroInTargetTier = (heroSlug: string) => {
    if (!targetTierId) return false;
    const tier = tiers.find((t) => t.id === targetTierId);
    return Boolean(tier?.heroes.some((h) => h.heroSlug === heroSlug));
  };

  // Tìm xem tướng đang ở tier nào
  const getHeroCurrentTierName = (heroSlug: string) => {
    for (const t of tiers) {
      if (t.heroes.some((h) => h.heroSlug === heroSlug)) {
        return t.name;
      }
    }
    return null;
  };

  const handleToggleHeroInTier = (hero: Hero) => {
    if (!targetTierId) return;

    const alreadyIn = isHeroInTargetTier(hero.slug);

    if (alreadyIn) {
      // Xóa khỏi tier
      setTiers((prev) =>
        prev.map((t) =>
          t.id === targetTierId
            ? { ...t, heroes: t.heroes.filter((h) => h.heroSlug !== hero.slug) }
            : t
        )
      );
    } else {
      // Thêm vào tier
      const newHeroItem: TierListItem = {
        heroSlug: hero.slug,
        name: hero.name,
        avatar: hero.avatar,
        element: hero.element,
        rarity: hero.rarity,
        role: hero.role,
        description: '', // Mặc định để trống như yêu cầu
      };

      setTiers((prev) =>
        prev.map((t) =>
          t.id === targetTierId
            ? { ...t, heroes: [...t.heroes, newHeroItem] }
            : t
        )
      );
    }
  };

  // Xóa 1 tướng khỏi tier trực tiếp
  const handleRemoveHeroFromTier = (tierId: string, heroSlug: string) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? { ...t, heroes: t.heroes.filter((h) => h.heroSlug !== heroSlug) }
          : t
      )
    );
  };

  // Chuyển nhanh 1 tướng sang tier khác
  const handleMoveHeroToTier = (fromTierId: string, toTierId: string, heroSlug: string) => {
    if (fromTierId === toTierId) return;
    const fromTier = tiers.find((t) => t.id === fromTierId);
    const heroItem = fromTier?.heroes.find((h) => h.heroSlug === heroSlug);
    if (!heroItem) return;

    setTiers((prev) =>
      prev.map((t) => {
        if (t.id === fromTierId) {
          return { ...t, heroes: t.heroes.filter((h) => h.heroSlug !== heroSlug) };
        }
        if (t.id === toTierId) {
          return { ...t, heroes: [...t.heroes, heroItem] };
        }
        return t;
      })
    );
  };

  // 3. NHẬP / CẬP NHẬT DESCRIPTION CHO TƯỚNG (Có thể để trống)
  const handleUpdateHeroDescription = (tierId: string, heroSlug: string, newDesc: string) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        return {
          ...t,
          heroes: t.heroes.map((h) =>
            h.heroSlug === heroSlug
              ? { ...h, description: newDesc, note: newDesc }
              : h
          ),
        };
      })
    );
  };

  // 4. LƯU TOÀN BỘ BẢNG VÀO DATABASE / FILE JSON
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tier-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          gameSlug,
          tiers,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Đã lưu thành công Bảng Xếp Hạng Meta (Tier List)!', 'success');
      } else {
        showToast(data.error || 'Lỗi khi lưu bảng xếp hạng!', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Lỗi kết nối khi gửi yêu cầu lưu!', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950 border-rose-500/50 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-sm font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Action Header Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Quản Lý Bảng Xếp Hạng Meta (Tier List)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Thiết lập linh hoạt các Tier (T0, T1, T2, T3...), chọn màu sắc, xếp tướng và bổ sung ghi chú meta.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${gameSlug}/tier-list`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Xem Public Tier List</span>
          </Link>

          <button
            onClick={openCreateTierModal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-2 border border-amber-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Tier Mới</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Đang Lưu...' : '💾 Lưu Bảng Xếp Hạng'}</span>
          </button>
        </div>
      </div>

      {/* Danh Sách Các Tier */}
      {tiers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="text-4xl">🏆</div>
          <h3 className="font-extrabold text-white text-base">Chưa có Tier nào được tạo</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Bấm nút &quot;+ Tạo Tier Mới&quot; ở trên để bắt đầu thêm các bậc T0, T1, T2, T3 cho bảng xếp hạng.
          </p>
          <button
            onClick={openCreateTierModal}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Tier Đầu Tiên (T0)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {tiers.map((tier, index) => {
            const colorOption = getTierColor(tier.color);

            return (
              <div
                key={tier.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden transition-all"
              >
                {/* Header Của Tier */}
                <div className="p-4 sm:p-5 bg-slate-950/70 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Badge Tên Tier */}
                    <div
                      className={`px-4 py-2 rounded-2xl font-black text-lg sm:text-xl border shadow-md flex items-center justify-center shrink-0 ${colorOption.badgeClass}`}
                    >
                      {tier.name}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-base">Tier {tier.name}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                          {tier.heroes.length} tướng
                        </span>
                      </div>
                      {tier.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{tier.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Nhóm nút thao tác trên Tier */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleMoveTier(index, 'up')}
                      disabled={index === 0}
                      title="Di chuyển lên"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveTier(index, 'down')}
                      disabled={index === tiers.length - 1}
                      title="Di chuyển xuống"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openEditTierModal(tier)}
                      title="Sửa tên / đổi màu tier"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openHeroPicker(tier.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Thêm Tướng</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTier(tier.id, tier.name)}
                      title="Xóa Tier"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Danh Sách Tướng Trong Tier */}
                <div className="p-4 sm:p-6">
                  {tier.heroes.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                      <p className="text-xs text-slate-500 italic">
                        Chưa có tướng nào trong Tier {tier.name}.
                      </p>
                      <button
                        onClick={() => openHeroPicker(tier.id)}
                        className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
                      >
                        Bấm vào đây để chọn tướng
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tier.heroes.map((hero) => (
                        <div
                          key={hero.heroSlug}
                          className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 space-y-3 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                {hero.avatar && hero.avatar.startsWith('/') ? (
                                  <img
                                    src={hero.avatar}
                                    alt={hero.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl">🦸</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-bold text-xs text-white truncate">{hero.name}</h4>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-400">
                                    {hero.rarity}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {hero.element} • {hero.role}
                                </p>
                              </div>
                            </div>

                            {/* Nút thao tác nhanh với tướng */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Chuyển tier dropdown */}
                              <select
                                value={tier.id}
                                onChange={(e) =>
                                  handleMoveHeroToTier(tier.id, e.target.value, hero.heroSlug)
                                }
                                title="Chuyển sang tier khác"
                                className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold rounded-lg px-1.5 py-1 focus:outline-none"
                              >
                                {tiers.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    Tier {t.name}
                                  </option>
                                ))}
                              </select>

                              {/* Xóa tướng khỏi tier */}
                              <button
                                onClick={() => handleRemoveHeroFromTier(tier.id, hero.heroSlug)}
                                title="Gỡ khỏi tier"
                                className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* 3. Ô Nhập Description cho tướng (Có thể để trống) */}
                          <div>
                            <input
                              type="text"
                              value={hero.description || ''}
                              onChange={(e) =>
                                handleUpdateHeroDescription(tier.id, hero.heroSlug, e.target.value)
                              }
                              placeholder="Nhập ghi chú meta (có thể để trống)..."
                              className="w-full px-2.5 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-amber-500/50 transition-colors"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: TẠO / SỬA TIER */}
      {tierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base">
                {editingTierId ? 'Chỉnh Sửa Tier' : 'Tạo Tier Mới'}
              </h3>
              <button
                onClick={() => setTierModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Tên Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Tên Tier:
                </label>
                <input
                  type="text"
                  value={tierNameInput}
                  onChange={(e) => setTierNameInput(e.target.value)}
                  placeholder="VD: T0, T1, T2, T3..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Chọn Màu Sắc */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                  Chọn Màu Sắc:
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {TIER_PRESET_COLORS.map((col) => {
                    const isSelected = tierColorInput === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setTierColorInput(col.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'border-white bg-slate-800 shadow-md ring-2 ring-amber-400'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-lg shadow-inner shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">
                          {col.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mô tả ngắn của Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Mô Tả Tier (Không bắt buộc):
                </label>
                <input
                  type="text"
                  value={tierDescInput}
                  onChange={(e) => setTierDescInput(e.target.value)}
                  placeholder="VD: Cực phẩm tối thượng, thống trị meta..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTierModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveTierModal}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md"
              >
                {editingTierId ? 'Cập Nhật' : 'Tạo Tier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỌN TƯỚNG VÀO TIER */}
      {heroPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-black text-white text-base">
                  Chọn Tướng Vào Tier {tiers.find((t) => t.id === targetTierId)?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhấp vào thẻ tướng để thêm hoặc gỡ khỏi tier hiện tại.
                </p>
              </div>
              <button
                onClick={() => setHeroPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="my-4 relative shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={heroSearchTerm}
                onChange={(e) => setHeroSearchTerm(e.target.value)}
                placeholder="Tìm nhanh theo tên tướng (Songoku, Luffy, Sasuke...)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            {/* Grid Tướng Cuộn Được */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[50vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableHeroes.map((hero) => {
                  const inCurrentTier = isHeroInTargetTier(hero.slug);
                  const otherTierName = getHeroCurrentTierName(hero.slug);

                  return (
                    <button
                      key={hero.slug}
                      type="button"
                      onClick={() => handleToggleHeroInTier(hero)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        inCurrentTier
                          ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {hero.avatar && hero.avatar.startsWith('/') ? (
                            <img src={hero.avatar} alt={hero.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🦸</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-white truncate">{hero.name}</h4>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {hero.element}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                        <span className="font-mono text-amber-400 font-bold">{hero.rarity}</span>
                        {inCurrentTier ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Đã chọn
                          </span>
                        ) : otherTierName ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px]">
                            Ở {otherTierName}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">+ Thêm</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                Đang có{' '}
                <strong className="text-amber-400">
                  {tiers.find((t) => t.id === targetTierId)?.heroes.length || 0}
                </strong>{' '}
                tướng trong Tier này
              </span>
              <button
                type="button"
                onClick={() => setHeroPickerOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
