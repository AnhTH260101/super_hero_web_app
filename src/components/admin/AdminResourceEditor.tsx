'use client';

import React, { useState } from 'react';
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

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

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
      category: 'Rèn Trang Bị',
      icon: '/images/resources/items/da-ren-tho.png',
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

    // Clean empty description lines
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
              Quản Trị Bảng Tài Nguyên ({resources.length} mục)
            </h2>
            <p className="text-xs text-slate-400">
              Chỉnh sửa thông tin, thêm bớt nguồn nhận, linh động cấu hình theo ý muốn
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Table List */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-16 text-center">Icon</th>
                <th className="py-3 px-4 w-48">Tên & Phân Loại</th>
                <th className="py-3 px-4">Công Dụng (Mô tả)</th>
                <th className="py-3 px-4 w-72">Nguồn Nhận ({sources.length} nguồn)</th>
                <th className="py-3 px-4 w-28 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredList.map((item, idx) => {
                const originalIndex = resources.findIndex((r) => r.id === item.id);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                      {originalIndex + 1}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <img
                          src={item.icon}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">
                        {item.name}
                      </div>
                      <div className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-800 text-amber-400 text-[10px] font-medium border border-slate-700">
                        {item.category || 'Chưa phân loại'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] leading-relaxed">
                        {item.description.map((d, dIdx) => (
                          <li key={dIdx}>{d}</li>
                        ))}
                      </ul>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.sources.map((s, sIdx) => {
                          const srcDef = sources.find((x) => x.id === s.sourceId);
                          return (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-200"
                            >
                              <span>{srcDef ? srcDef.name : s.sourceId}</span>
                              {s.note && (
                                <span className="text-red-400 italic text-[9px]">
                                  {s.note}
                                </span>
                              )}
                            </span>
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

      {/* Edit / Create Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isCreating ? 'Thêm Tài Nguyên Mới' : `Chỉnh Sửa: ${editingItem.name}`}
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
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Mã Định Danh (ID Slug)
                </label>
                <input
                  type="text"
                  value={editingItem.id}
                  disabled={!isCreating}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, id: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Tên Tài Nguyên
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
                    placeholder="VD: Đá rèn cao..."
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
                    placeholder="VD: Rèn Trang Bị, Đá Vận Mệnh..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Đường Dẫn Icon
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editingItem.icon}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, icon: e.target.value })
                    }
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none font-mono"
                    placeholder="/images/resources/items/..."
                  />
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <img
                      src={editingItem.icon}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Description Bullet points */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">
                    Công Dụng / Mô Tả (Từng dòng gạch đầu dòng)
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
                        placeholder="Nội dung dòng mô tả..."
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

              {/* Sources Selection */}
              <div>
                <label className="block text-slate-400 font-semibold mb-2">
                  Chọn Nguồn Nhận (Các hoạt động có thể kiếm)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
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
                        className={`p-2 rounded-lg border flex flex-col gap-1 transition-colors ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-slate-900 border-slate-800 opacity-70'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingItem({
                                  ...editingItem,
                                  sources: [
                                    ...editingItem.sources,
                                    { sourceId: src.id },
                                  ],
                                });
                              } else {
                                setEditingItem({
                                  ...editingItem,
                                  sources: editingItem.sources.filter(
                                    (s) => s.sourceId !== src.id
                                  ),
                                });
                              }
                            }}
                            className="rounded border-slate-700 text-amber-500 focus:ring-0"
                          />
                          <img
                            src={src.icon}
                            alt=""
                            className="w-5 h-5 rounded object-cover"
                          />
                          <span className="font-semibold text-white">
                            {src.name}
                          </span>
                        </label>

                        {isSelected && (
                          <input
                            type="text"
                            placeholder="Ghi chú thêm (VD: Mốc 325 lửa...)"
                            value={currentRef?.note || ''}
                            onChange={(e) => {
                              const noteVal = e.target.value;
                              setEditingItem({
                                ...editingItem,
                                sources: editingItem.sources.map((s) =>
                                  s.sourceId === src.id
                                    ? { ...s, note: noteVal || undefined }
                                    : s
                                ),
                              });
                            }}
                            className="mt-1 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] text-amber-300 placeholder-slate-600 outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
              >
                Xong (Lưu Tạm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
