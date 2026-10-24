'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Trash2,
  Shield,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
  Key,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Archive,
  Trophy,
  Sparkles,
  Gift,
  FileText,
  Box,
} from 'lucide-react';
import { Hero, TierGroup, ResourceItem, ResourceSource, Giftcode, GuideArticle, GameActivity, GameItem, ItemCategory } from '@/types/game';
import { AdminTierListEditor } from './AdminTierListEditor';
import { AdminGiftcodeEditor } from './AdminGiftcodeEditor';
import { AdminGuideEditor } from './AdminGuideEditor';
import { AdminItemEditor } from './AdminItemEditor';

interface AdminDashboardProps {
  initialHeroes: Hero[];
  initialTiers?: TierGroup[];
  initialResources?: ResourceItem[];
  initialSources?: ResourceSource[];
  initialGiftcodes?: Giftcode[];
  initialGuides?: GuideArticle[];
  initialActivities?: GameActivity[];
  initialItems?: Record<string, GameItem>;
  initialCategories?: ItemCategory[];
  gameSlug: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialHeroes,
  initialTiers = [],
  initialResources = [],
  initialSources = [],
  initialGiftcodes = [],
  initialGuides = [],
  initialActivities = [],
  initialItems = {},
  initialCategories = [],
  gameSlug,
}) => {
  const [adminToken, setAdminToken] = useState('admin123');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<'active' | 'tier-list' | 'items' | 'giftcodes' | 'guides' | 'trash'>('active');

  const [heroes, setHeroes] = useState<Hero[]>(initialHeroes);
  const [trashHeroes, setTrashHeroes] = useState<Hero[]>([]);
  const [items, setItems] = useState<Record<string, GameItem>>(initialItems);
  const [categories, setCategories] = useState<ItemCategory[]>(initialCategories);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Tải danh sách thùng rác khi chuyển tab
  const fetchTrash = async () => {
    try {
      const res = await fetch(`/api/admin/heroes?gameSlug=${gameSlug}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrashHeroes(data.deletedHeroes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrash();
    }
  }, [isAuthenticated, currentTab]);

  const displayList = currentTab === 'active' ? heroes : trashHeroes;

  // Lọc tướng
  const filteredHeroes = useMemo(() => {
    return displayList.filter(
      (h) =>
        searchTerm.trim() === '' ||
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.element.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [displayList, searchTerm]);

  const handleSelectAll = () => {
    if (selectedSlugs.length === filteredHeroes.length) {
      setSelectedSlugs([]);
    } else {
      setSelectedSlugs(filteredHeroes.map((h) => h.slug));
    }
  };

  const toggleSelectOne = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // 1. XÓA (Di chuyển vào Bảng Tạm Thùng Rác)
  const handleDeleteSelected = async () => {
    if (selectedSlugs.length === 0) return;
    const confirmDelete = window.confirm(
      `Đưa ${selectedSlugs.length} tướng đã chọn vào Bảng Tạm (Thùng Rác)? (Có thể khôi phục lại bất kỳ lúc nào)`
    );
    if (!confirmDelete) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/heroes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'delete',
          gameSlug,
          heroSlugs: selectedSlugs,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const removed = heroes.filter((h) => selectedSlugs.includes(h.slug));
        setHeroes((prev) => prev.filter((h) => !selectedSlugs.includes(h.slug)));
        setTrashHeroes((prev) => [...prev, ...removed]);
        setSelectedSlugs([]);
        setStatusMessage({ text: data.message, type: 'success' });
      } else {
        setStatusMessage({ text: data.error || 'Xóa thất bại', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 2. KHÔI PHỤC TỪ THÙNG RÁC
  const handleRestoreSelected = async (slugs?: string[]) => {
    const targetSlugs = slugs || selectedSlugs;
    if (targetSlugs.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/heroes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'restore',
          gameSlug,
          heroSlugs: targetSlugs,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const restored = trashHeroes.filter((h) => targetSlugs.includes(h.slug));
        setTrashHeroes((prev) => prev.filter((h) => !targetSlugs.includes(h.slug)));
        setHeroes((prev) => [...prev, ...restrestored(restored)]);
        setSelectedSlugs([]);
        setStatusMessage({ text: data.message, type: 'success' });
      } else {
        setStatusMessage({ text: data.error, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const restrestored = (restored: Hero[]) => restored;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-4">
            <Key className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Quản Trị Viên (Admin)</h1>
          <p className="text-xs text-slate-400 mb-6">
            Nhập mã bảo vệ để quản lý và phân loại tướng.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (adminToken.trim() === 'admin123') {
                setIsAuthenticated(true);
              } else {
                alert('Mã truy cập không đúng! (Mặc định: admin123)');
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              placeholder="Nhập mã Admin (Mặc định: admin123)"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm transition-all"
            >
              Mở Khóa Quản Trị
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500">
            <Link href="/" className="hover:text-amber-400">
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-400 font-semibold">{gameSlug}</span>
            </div>
            <h1 className="text-2xl font-black text-white">Quản Lý & Dọn Dẹp Danh Sách Tướng</h1>
            <p className="text-xs text-slate-400">
              Dữ liệu bạn xóa sẽ được lưu an toàn tại <strong>Bảng Tạm Thùng Rác</strong> và không bao giờ bị gen đè lại.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${gameSlug}/heroes`}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Xem trang Người Dùng</span>
            </Link>
            <button
              onClick={async () => {
                await fetch('/api/admin/auth', { method: 'DELETE' });
                window.location.href = '/admin/login';
              }}
              className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-xs font-semibold text-red-300"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
          <button
            onClick={() => {
              setCurrentTab('active');
              setSelectedSlugs([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentTab === 'active'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Tướng Đang Hiển Thị ({heroes.length})</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('tier-list');
              setSelectedSlugs([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentTab === 'tier-list'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Bảng Xếp Hạng Meta (Tier List)</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('items');
              setSelectedSlugs([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentTab === 'items'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Vật Phẩm & Tài Nguyên ({Object.keys(items).length})</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('giftcodes');
              setSelectedSlugs([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentTab === 'giftcodes'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Giftcode Discord ({initialGiftcodes.length})</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('guides');
              setSelectedSlugs([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentTab === 'guides'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Sự Kiện & Bài Viết ({initialGuides.length})</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('trash');
              setSelectedSlugs([]);
              fetchTrash();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentTab === 'trash'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Bảng Tạm / Thùng Rác ({trashHeroes.length})</span>
          </button>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-red-950/60 border-red-800 text-red-300'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Content depending on currentTab */}
        {currentTab === 'tier-list' ? (
          <AdminTierListEditor
            initialTiers={initialTiers}
            allHeroes={heroes}
            gameSlug={gameSlug}
            adminToken={adminToken}
          />
        ) : currentTab === 'items' ? (
          <AdminItemEditor
            initialItems={items}
            initialCategories={categories}
            onItemsUpdate={setItems}
            onCategoriesUpdate={setCategories}
            availableSources={initialSources}
            gameSlug={gameSlug}
            adminToken={adminToken}
          />
        ) : currentTab === 'giftcodes' ? (
          <AdminGiftcodeEditor
            initialGiftcodes={initialGiftcodes}
            gameSlug={gameSlug}
          />
        ) : currentTab === 'guides' ? (
          <AdminGuideEditor
            initialGuides={initialGuides}
            initialActivities={initialActivities}
            allHeroes={heroes}
            allResources={initialResources}
            initialSources={initialSources}
            gameSlug={gameSlug}
          />
        ) : (
          <>
            {/* Toolbar & Filter */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tướng theo tên, slug, hệ..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={handleSelectAll}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
              >
                {selectedSlugs.length === filteredHeroes.length && filteredHeroes.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Chọn tất cả ({filteredHeroes.length})</span>
              </button>

              {currentTab === 'active' ? (
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedSlugs.length === 0 || loading}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    selectedSlugs.length > 0
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ĐƯA VÀO BẢNG TẠM ({selectedSlugs.length})</span>
                </button>
              ) : (
                <button
                  onClick={() => handleRestoreSelected()}
                  disabled={selectedSlugs.length === 0 || loading}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    selectedSlugs.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>KHÔI PHỤC ĐÃ CHỌN ({selectedSlugs.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table List */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <span className="sr-only">Chọn</span>
                  </th>
                  <th className="p-4">Ảnh & Tướng</th>
                  <th className="p-4">Phẩm Chất</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Hệ</th>
                  <th className="p-4">Vai Trò</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHeroes.map((hero) => {
                  const isSelected = selectedSlugs.includes(hero.slug);
                  return (
                    <tr
                      key={hero.slug}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleSelectOne(hero.slug)}
                          className="text-slate-400 hover:text-amber-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                            {hero.avatar && hero.avatar.startsWith('/') ? (
                              <img src={hero.avatar} alt={hero.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="flex items-center justify-center h-full text-lg">🦸</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{hero.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono border border-slate-700" title="Mã CID gốc trong Game Engine">
                                #{hero.id}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">{hero.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            hero.rarity === 'UR'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {hero.rarity}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-slate-200">Tier {hero.tier}</span>
                      </td>
                      <td className="p-4 text-slate-400">{hero.element}</td>
                      <td className="p-4 text-slate-400">{hero.role}</td>
                      <td className="p-4 text-right">
                        {currentTab === 'active' ? (
                          <button
                            onClick={async () => {
                              setSelectedSlugs([hero.slug]);
                              await handleDeleteSelected();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-400 text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestoreSelected([hero.slug])}
                            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Khôi phục</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}
      </div>
    </div>
  );
};
