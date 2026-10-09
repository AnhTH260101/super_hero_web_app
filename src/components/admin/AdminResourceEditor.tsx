'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Save,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { ResourceItem, ResourceSource, ResourceItemSourceRef } from '@/types/game';

interface Props {
  initialResources: ResourceItem[];
  initialSources: ResourceSource[];
  gameSlug: string;
}

export const AdminResourceEditor: React.FC<Props> = ({
  initialResources,
  initialSources,
  gameSlug,
}) => {
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [sources, setSources] = useState<ResourceSource[]>(initialSources);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');

  // Edit / Add state
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Asset Picker Modal State
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerFilter, setPickerFilter] = useState('');
  const [availableIcons, setAvailableIcons] = useState<{ name: string; url: string }[]>([]);
  const [isLoadingIcons, setIsLoadingIcons] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Load icons for picker
  useEffect(() => {
    if (isAssetPickerOpen) {
      fetchIcons(pickerSearch, pickerFilter);
    }
  }, [isAssetPickerOpen, pickerSearch, pickerFilter]);

  const fetchIcons = async (query: string, filterKeyword: string) => {
    setIsLoadingIcons(true);
    try {
      const activeQuery = filterKeyword || query;
      const res = await fetch(`/api/admin/resource-icons?search=${encodeURIComponent(activeQuery)}&limit=150`);
      const data = await res.json();
      if (data.icons) {
        setAvailableIcons(data.icons);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingIcons(false);
    }
  };

  // Filtered resources
  const filteredList = resources.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat =
      selectedCategory === 'Tất cả' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const categories = [
    'Tất cả',
    ...Array.from(
      new Set(resources.map((r) => r.category).filter(Boolean))
    ) as string[],
  ];

  // Map sources
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // Handle Save to API
  const handleSaveToDisk = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug,
          resources,
          sources,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage({ text: 'Đã lưu toàn bộ dữ liệu tài nguyên lên máy chủ!', type: 'success' });
      } else {
        setSaveMessage({ text: data.error || 'Có lỗi xảy ra khi lưu', type: 'error' });
      }
    } catch (err: any) {
      setSaveMessage({ text: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Item
  const handleOpenEdit = (item: ResourceItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setIsCreating(false);
  };

  // Open Create Item
  const handleOpenCreate = () => {
    setEditingItem({
      id: `tai-nguyen-${Date.now()}`,
      name: '',
      category: 'Khác',
      icon: '/images/resources/game_items/icon_point3.png',
      description: [''],
      sources: [],
    });
    setIsCreating(true);
  };

  // Save Modal
  const handleSaveModal = () => {
    if (!editingItem || !editingItem.name.trim()) {
      alert('Vui lòng nhập tên tài nguyên');
      return;
    }

    const cleanItem = {
      ...editingItem,
      description: editingItem.description.filter((d) => d.trim() !== ''),
    };

    if (isCreating) {
      setResources((prev) => [cleanItem, ...prev]);
    } else {
      setResources((prev) =>
        prev.map((r) => (r.id === cleanItem.id ? cleanItem : r))
      );
    }

    setEditingItem(null);
    setIsCreating(false);
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài nguyên này không?')) {
      setResources((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Reorder Item
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= resources.length) return;

    const newArr = [...resources];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setResources(newArr);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Công Cụ Quản Trị Tài Nguyên Game ({resources.length} mục)
            </h2>
            <p className="text-xs text-slate-400">
              Bóc tách sẵn asset game Cocos2d-x, tự do thêm/sửa/xếp thứ tự và chọn nguồn nhận
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-700 hover:border-amber-500/40"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Thêm Tài Nguyên Mới</span>
          </button>

          <button
            onClick={handleSaveToDisk}
            disabled={isSaving}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold ${
            saveMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên vật phẩm hoặc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Table / Grid in Admin */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-16 text-center">Icon Asset</th>
                <th className="py-3 px-4 w-44">Tên Tài Nguyên</th>
                <th className="py-3 px-4 w-28">Phân Loại</th>
                <th className="py-3 px-4">Công Dụng</th>
                <th className="py-3 px-4 w-52">Cách Nhận (Icon Hoạt Động)</th>
                <th className="py-3 px-4 w-24 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.map((item, idx) => {
                const originalIndex = resources.findIndex((r) => r.id === item.id);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center text-slate-500 font-mono">
                      {originalIndex + 1}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="w-12 h-12 mx-auto rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1">
                        <img
                          src={item.icon}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0.3';
                          }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.id}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium text-[11px] border border-slate-700">
                        {item.category || 'Khác'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <ul className="list-disc list-outside pl-4 space-y-0.5">
                        {item.description.map((d, dIdx) => (
                          <li key={dIdx} className="line-clamp-2">
                            {d}
                          </li>
                        ))}
                      </ul>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.sources.map((srcRef, sIdx) => {
                          const src = sourceMap.get(srcRef.sourceId);
                          if (!src) return null;
                          return (
                            <div
                              key={sIdx}
                              className="relative"
                              title={src.name + (srcRef.note ? ` (${srcRef.note})` : '')}
                            >
                              <img
                                src={src.icon}
                                alt={src.name}
                                className="w-8 h-8 rounded border border-slate-700 bg-slate-950 object-contain p-0.5"
                              />
                              {srcRef.note && (
                                <span className="absolute -bottom-1 -right-1 text-[8px] bg-red-600 text-white font-bold px-1 rounded-full shadow">
                                  {srcRef.note}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleMove(originalIndex, 'up')}
                          disabled={originalIndex === 0}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30"
                          title="Lên trên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(originalIndex, 'down')}
                          disabled={originalIndex === resources.length - 1}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30"
                          title="Xuống dưới"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-300"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 hover:bg-slate-800 rounded text-red-400 hover:text-red-300"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Resource Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>{isCreating ? 'Thêm Thẻ Tài Nguyên Mới' : `Chỉnh Sửa: ${editingItem.name}`}</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Tên Tài Nguyên (Hiển thị thanh xám)
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-amber-500 outline-none"
                    placeholder="VD: Đá rèn cao, Túi thể lực 50..."
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Phân Loại (Category)
                  </label>
                  <input
                    type="text"
                    value={editingItem.category || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
                    placeholder="VD: Rèn Trang Bị, Đá Vận Mệnh, Điểm Hóa S..."
                  />
                </div>
              </div>

              {/* Column 1 Asset Picker */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Icon Vật Phẩm (Cột 1)
                </label>
                <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 p-1">
                    <img
                      src={editingItem.icon}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={editingItem.icon}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, icon: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-amber-500 outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAssetPickerOpen(true)}
                        className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg font-bold flex items-center gap-1.5 transition-colors border border-amber-500/30"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Mở Kho Asset Game (4000+ Icon PNG)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Bullet points */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">
                    Công Dụng (Cột 2 - Bullet Points)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem({
                        ...editingItem,
                        description: [...editingItem.description, ''],
                      })
                    }
                    className="text-amber-400 hover:text-amber-300 font-bold"
                  >
                    + Thêm dòng
                  </button>
                </div>
                <div className="space-y-2">
                  {editingItem.description.map((desc, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-2">
                      <span className="text-slate-500">•</span>
                      <input
                        type="text"
                        value={desc}
                        onChange={(e) => {
                          const newDescs = [...editingItem.description];
                          newDescs[dIdx] = e.target.value;
                          setEditingItem({ ...editingItem, description: newDescs });
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-amber-500"
                        placeholder="VD: Dùng để rèn trang bị, loại đá hiệu quả nhất..."
                      />
                      {editingItem.description.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newDescs = editingItem.description.filter(
                              (_, i) => i !== dIdx
                            );
                            setEditingItem({
                              ...editingItem,
                              description: newDescs,
                            });
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Activity Asset Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-400 font-semibold">
                    Cách Nhận (Cột 3 - Click vào các icon hoạt động bên dưới để chọn/bỏ chọn)
                  </label>
                  <span className="text-slate-500 text-[11px]">
                    Đã chọn {editingItem.sources.length} nguồn
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800">
                  {sources.map((src) => {
                    const isSelected = editingItem.sources.some(
                      (s) => s.sourceId === src.id
                    );
                    const currentRef = editingItem.sources.find(
                      (s) => s.sourceId === src.id
                    );

                    return (
                      <div
                        key={src.id}
                        onClick={() => {
                          if (isSelected) {
                            setEditingItem({
                              ...editingItem,
                              sources: editingItem.sources.filter((s) => s.sourceId !== src.id),
                            });
                          } else {
                            setEditingItem({
                              ...editingItem,
                              sources: [...editingItem.sources, { sourceId: src.id }],
                            });
                          }
                        }}
                        className={`relative cursor-pointer p-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all select-none ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 shadow-md shadow-amber-500/10 scale-102 ring-1 ring-amber-500'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <img
                          src={src.icon}
                          alt={src.name}
                          className="w-10 h-10 object-contain drop-shadow"
                        />
                        <span className="text-[10px] text-center font-bold text-slate-300 truncate w-full">
                          {src.name}
                        </span>

                        {isSelected && (
                          <input
                            type="text"
                            placeholder="Ghi chú (vd: x10)..."
                            value={currentRef?.note || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const newSources = editingItem.sources.map((s) =>
                                s.sourceId === src.id ? { ...s, note: e.target.value } : s
                              );
                              setEditingItem({ ...editingItem, sources: newSources });
                            }}
                            className="w-full text-[9px] px-1 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-amber-300 outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold transition-colors shadow-lg shadow-amber-500/20"
              >
                {isCreating ? 'Thêm Vào Bảng' : 'Cập Nhật Thẻ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Asset Picker Modal */}
      {isAssetPickerOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                  <span>Kho Icon Vật Phẩm Trích Xuất Từ Game (4000+ Icons)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Nhấp vào một icon để áp dụng trực tiếp cho vật phẩm này
                </p>
              </div>
              <button
                onClick={() => setIsAssetPickerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter buttons & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Gõ từ khóa tìm icon: stone, box, card, point, dragon, fate, qianghua..."
                  value={pickerSearch}
                  onChange={(e) => {
                    setPickerSearch(e.target.value);
                    setPickerFilter('');
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { label: 'Tất cả', q: '' },
                  { label: 'Đá Cường Hóa / Rèn', q: 'qianghuashi' },
                  { label: 'Đá Vận Mệnh (Fate)', q: 'fate_stone' },
                  { label: 'Đá In / Năng Lượng', q: 'mingyun' },
                  { label: 'Rương / Hộp', q: 'box' },
                  { label: 'Thẻ / Phiếu', q: 'card' },
                  { label: 'Thuốc Thể Lực', q: 'point' },
                  { label: 'Móng Gắp / Ngọc', q: 'zhuazi' },
                ].map((f) => (
                  <button
                    key={f.label}
                    onClick={() => {
                      setPickerFilter(f.q);
                      setPickerSearch('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      pickerFilter === f.q && !pickerSearch
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of icons */}
            <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[460px] p-2 bg-slate-950 rounded-xl border border-slate-800">
              {isLoadingIcons ? (
                <div className="flex items-center justify-center h-48 text-slate-400">
                  Đang tải icon từ máy chủ...
                </div>
              ) : availableIcons.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-500">
                  Không tìm thấy icon nào khớp với từ khóa.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                  {availableIcons.map((ic) => (
                    <button
                      key={ic.name}
                      onClick={() => {
                        if (editingItem) {
                          setEditingItem({ ...editingItem, icon: ic.url });
                        }
                        setIsAssetPickerOpen(false);
                      }}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 hover:bg-slate-800 flex flex-col items-center gap-1.5 transition-all group"
                    >
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img
                          src={ic.url}
                          alt={ic.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                        {ic.name.replace('.png', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
