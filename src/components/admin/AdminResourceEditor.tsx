'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
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
  RefreshCw,
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
  const [pickerFolder, setPickerFolder] = useState('all');
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerTotal, setPickerTotal] = useState(0);
  const [availableIcons, setAvailableIcons] = useState<{
    name: string;
    url: string;
    folder: string;
    folderLabel: string;
  }[]>([]);
  const [categoriesList, setCategoriesList] = useState<{
    id: string;
    label: string;
    count: number;
  }[]>([]);
  const [isLoadingIcons, setIsLoadingIcons] = useState(false);

  // Sources Manager State (Cột 3)
  const [isSourcesManagerOpen, setIsSourcesManagerOpen] = useState(false);
  const [availableSourceImages, setAvailableSourceImages] = useState<string[]>([]);
  const [editingSource, setEditingSource] = useState<ResourceSource | null>(null);
  const [isCreatingSource, setIsCreatingSource] = useState(false);
  const [isSyncingSources, setIsSyncingSources] = useState(false);

  // Saving / Auto-save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  // Auto-save debounced whenever resources or sources changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
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
          setSaveStatus('saved');
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          setLastSavedTime(timeStr);
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [resources, sources, gameSlug]);

  // Fetch Sources & Available Images
  const fetchSourcesData = async () => {
    try {
      const res = await fetch(`/api/admin/resource-sources?gameSlug=${gameSlug}`);
      const data = await res.json();
      if (data.success) {
        if (data.sources) setSources(data.sources);
        if (data.availableSourceImages) setAvailableSourceImages(data.availableSourceImages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync sources directly from folder
  const handleSyncSourcesFromFolder = async () => {
    setIsSyncingSources(true);
    try {
      const res = await fetch('/api/admin/resource-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', gameSlug }),
      });
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
        alert(data.message || 'Đã đồng bộ các ảnh mới trong thư mục sources!');
      } else {
        alert(data.error || 'Đồng bộ thất bại');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSyncingSources(false);
    }
  };

  // Save/Update Single Source
  const handleSaveSourceModal = async () => {
    if (!editingSource || !editingSource.name.trim() || !editingSource.icon) {
      alert('Vui lòng nhập tên và chọn icon cho sự kiện');
      return;
    }
    const cleanSource = {
      ...editingSource,
      id: editingSource.id || editingSource.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    };
    let updatedSources: ResourceSource[];
    if (isCreatingSource) {
      updatedSources = [...sources, cleanSource];
    } else {
      updatedSources = sources.map((s) => (s.id === cleanSource.id ? cleanSource : s));
    }
    setSources(updatedSources);
    setEditingSource(null);
    setIsCreatingSource(false);

    try {
      await fetch('/api/admin/resource-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', gameSlug, sources: updatedSources }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Source
  const handleDeleteSource = async (sourceId: string) => {
    if (confirm('Bạn có chắc muốn xóa nguồn nhận này không?')) {
      const updated = sources.filter((s) => s.id !== sourceId);
      setSources(updated);
      try {
        await fetch('/api/admin/resource-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', gameSlug, sources: updated }),
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Load icons for picker
  const fetchIcons = async (query: string, folderId: string, page = 1, refresh = false) => {
    setIsLoadingIcons(true);
    try {
      const params = new URLSearchParams({
        search: query,
        folder: folderId || 'all',
        page: page.toString(),
        limit: '120',
      });
      if (refresh) {
        params.set('refresh', 'true');
      }
      const res = await fetch(`/api/admin/resource-icons?${params.toString()}`);
      const data = await res.json();
      if (data.icons) {
        setAvailableIcons(data.icons);
        setPickerTotal(data.total || 0);
      }
      if (data.categories) {
        setCategoriesList(data.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingIcons(false);
    }
  };

  const handleRescanIcons = async () => {
    await fetchIcons(pickerSearch, pickerFolder, pickerPage, true);
    alert('Đã quét lại toàn bộ file ảnh asset từ các thư mục public/images!');
  };

  useEffect(() => {
    if (isAssetPickerOpen) {
      fetchIcons(pickerSearch, pickerFolder, pickerPage);
    }
  }, [isAssetPickerOpen, pickerSearch, pickerFolder, pickerPage]);

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
      icon: '/images/icon_chuyen_sinh/i_b_0_0.png',
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Auto-save Indicator */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold">
            {saveStatus === 'saving' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-amber-400">Đang tự động lưu...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">
                  Tự động lưu {lastSavedTime ? `lúc ${lastSavedTime}` : 'thành công'}
                </span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">Lỗi tự động lưu! Đang thử lại...</span>
              </>
            )}
          </div>

          <button
            onClick={() => handleRescanIcons()}
            disabled={isLoadingIcons}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-700 hover:border-amber-500/40 disabled:opacity-50"
            title="Quét lại toàn bộ các file ảnh mới thêm vào thư mục public/images"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoadingIcons ? 'animate-spin' : ''}`} />
            <span>{isLoadingIcons ? 'Đang Quét...' : 'Quét Lại Asset Ảnh'}</span>
          </button>

          <button
            onClick={() => {
              setIsSourcesManagerOpen(true);
              fetchSourcesData();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-700 hover:border-amber-500/40"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Sự Kiện Cột 3 ({sources.length})</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Nguyên Mới</span>
          </button>
        </div>
      </div>

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
                          const displayName = src ? src.name : srcRef.sourceId;
                          const iconUrl = src ? src.icon : null;
                          return (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 hover:border-amber-500 transition-colors"
                              title={displayName + (srcRef.note ? ` (${srcRef.note})` : '')}
                            >
                              {iconUrl && (
                                <img
                                  src={iconUrl}
                                  alt={displayName}
                                  className="w-4 h-4 object-contain"
                                />
                              )}
                              <span className="font-semibold">{displayName}</span>
                              {srcRef.note && (
                                <span className="text-[9px] bg-red-600 text-white font-bold px-1 rounded-full">
                                  {srcRef.note}
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
                        <span>Mở Kho Asset Phân Loại (2000+ Icons)</span>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-400 font-semibold">
                      Cách Nhận (Cột 3)
                    </label>
                    <span className="text-slate-500 text-[11px]">
                      • Đã chọn {editingItem.sources.length} nguồn
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSourcesManagerOpen(true);
                        fetchSourcesData();
                      }}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[11px] font-bold border border-amber-500/30 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Quản lý / Thêm sự kiện</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSyncingSources}
                      onClick={handleSyncSourcesFromFolder}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-700 transition-all flex items-center gap-1"
                      title="Tự động quét các ảnh mới trong public/images/resources/sources/"
                    >
                      <span>🔄 {isSyncingSources ? 'Đang quét...' : 'Quét ảnh mới (sources/)'}</span>
                    </button>
                  </div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-5 space-y-4 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                  <span>Kho Icon Tài Nguyên Phân Loại Theo Game</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Chọn thư mục bên dưới và click vào icon để áp dụng cho tài nguyên này
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRescanIcons()}
                  disabled={isLoadingIcons}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 hover:border-amber-500/40 disabled:opacity-50"
                  title="Quét lại toàn bộ các file ảnh trong public/images"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoadingIcons ? 'animate-spin' : ''}`} />
                  <span>{isLoadingIcons ? 'Đang quét...' : 'Quét Lại Asset'}</span>
                </button>
                <button
                  onClick={() => setIsAssetPickerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter buttons & Search */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Gõ từ khóa tìm tên file icon..."
                  value={pickerSearch}
                  onChange={(e) => {
                    setPickerSearch(e.target.value);
                    setPickerPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Folder Category Pills */}
              <div className="flex flex-wrap gap-1.5 text-xs max-h-24 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setPickerFolder('all');
                    setPickerPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    pickerFolder === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Tất cả</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    pickerFolder === 'all' ? 'bg-slate-950/20 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {categoriesList.reduce((acc, c) => acc + c.count, 0)}
                  </span>
                </button>

                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setPickerFolder(cat.id);
                      setPickerPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      pickerFolder === cat.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      pickerFolder === cat.id ? 'bg-slate-950/20 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of icons */}
            <div className="flex-1 overflow-y-auto min-h-[320px] max-h-[460px] p-2 bg-slate-950 rounded-xl border border-slate-800">
              {isLoadingIcons ? (
                <div className="flex items-center justify-center h-48 text-slate-400">
                  Đang tải danh sách icon...
                </div>
              ) : availableIcons.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-500">
                  Không tìm thấy icon nào trong thư mục này khớp với tìm kiếm.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                  {availableIcons.map((ic) => (
                    <button
                      key={ic.url}
                      type="button"
                      onClick={() => {
                        if (editingItem) {
                          setEditingItem({ ...editingItem, icon: ic.url });
                        }
                        setIsAssetPickerOpen(false);
                      }}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 hover:bg-slate-800 flex flex-col items-center gap-1.5 transition-all group relative"
                    >
                      <div className="w-12 h-12 flex items-center justify-center p-1 bg-slate-950/40 rounded-lg">
                        <img
                          src={ic.url}
                          alt={ic.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-300 truncate w-full text-center">
                        {ic.name.replace(/\.[^/.]+$/, '')}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.2 bg-slate-800 text-amber-400/90 rounded border border-slate-700/60 truncate max-w-full">
                        {ic.folderLabel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {pickerTotal > 120 && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                <span>
                  Hiển thị {availableIcons.length} / {pickerTotal} icon (Trang {pickerPage} / {Math.ceil(pickerTotal / 120)})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pickerPage <= 1 || isLoadingIcons}
                    onClick={() => setPickerPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold transition-all"
                  >
                    ← Trang trước
                  </button>
                  <button
                    type="button"
                    disabled={pickerPage >= Math.ceil(pickerTotal / 120) || isLoadingIcons}
                    onClick={() => setPickerPage((p) => p + 1)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold transition-all"
                  >
                    Trang sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sources (Cột 3) Management Modal */}
      {isSourcesManagerOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-5 space-y-4 shadow-2xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Quản Lý Nguồn Nhận & Sự Kiện (Cột 3)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tự do thêm mới sự kiện, đổi icon hoặc tự động đồng bộ ảnh từ thư mục public/images/resources/sources
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSourcesManagerOpen(false);
                  setEditingSource(null);
                  setIsCreatingSource(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSyncingSources}
                  onClick={handleSyncSourcesFromFolder}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  <span>🔄 {isSyncingSources ? 'Đang đồng bộ...' : 'Tự Động Quét Ảnh Mới (sources/)'}</span>
                </button>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  (Quét các file ảnh mới thêm vào thư mục sources/)
                </span>
              </div>

              {!editingSource && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingSource(true);
                    setEditingSource({
                      id: `source-${Date.now()}`,
                      name: '',
                      icon: availableSourceImages.length > 0 ? `/images/resources/sources/${availableSourceImages[0]}` : '',
                    });
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 hover:border-amber-500/40"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Thêm Sự Kiện Mới</span>
                </button>
              )}
            </div>

            {/* Inline Form Edit/Add Source */}
            {editingSource && (
              <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-amber-400">
                    {isCreatingSource ? '✨ Thêm Nguồn Nhận Mới' : `✏️ Chỉnh Sửa: ${editingSource.name}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSource(null);
                      setIsCreatingSource(false);
                    }}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    Hủy bỏ
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Tên Hoạt Động / Sự Kiện
                    </label>
                    <input
                      type="text"
                      value={editingSource.name}
                      onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
                      placeholder="VD: Đập Trứng Vàng, Vòng Quay 777..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Mã Định Danh (ID)
                    </label>
                    <input
                      type="text"
                      value={editingSource.id}
                      onChange={(e) => setEditingSource({ ...editingSource, id: e.target.value })}
                      placeholder="VD: dap-trung-vang"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Chọn Icon từ thư mục sources/ */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5 text-xs">
                    Chọn Icon Trong Thư Mục `public/images/resources/sources/` (hoặc nhập link)
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    {editingSource.icon && (
                      <div className="w-9 h-9 p-0.5 bg-slate-900 rounded-lg border border-slate-700 shrink-0 flex items-center justify-center">
                        <img src={editingSource.icon} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <input
                      type="text"
                      value={editingSource.icon}
                      onChange={(e) => setEditingSource({ ...editingSource, icon: e.target.value })}
                      placeholder="/images/resources/sources/ten-file.png"
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs outline-none focus:border-amber-500"
                    />
                  </div>

                  {availableSourceImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                      {availableSourceImages.map((imgName) => {
                        const iconUrl = `/images/resources/sources/${imgName}`;
                        const isSelected = editingSource.icon === iconUrl;
                        const matchedName = sources.find((s) => s.icon.endsWith(imgName))?.name || imgName.replace('.png', '').replace(/-/g, ' ');
                        return (
                          <div
                            key={imgName}
                            onClick={() => setEditingSource({ ...editingSource, icon: iconUrl })}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500 shadow-md scale-102'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'
                            }`}
                            title={matchedName}
                          >
                            <div className="w-12 h-12 flex items-center justify-center p-1 bg-slate-950/60 rounded-lg">
                              <img src={iconUrl} alt={imgName} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center mt-1.5" title={matchedName}>
                              {matchedName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSource(null);
                      setIsCreatingSource(false);
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSourceModal}
                    className="px-4 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-extrabold hover:bg-amber-400 shadow"
                  >
                    Lưu Sự Kiện
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách các sources hiện có */}
            <div className="flex-1 overflow-y-auto min-h-[280px] max-h-[460px] p-2 bg-slate-950 rounded-xl border border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {sources.map((src) => (
                  <div
                    key={src.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0">
                        <img src={src.icon} alt={src.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate" title={src.name}>
                          {src.name}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 truncate" title={src.id}>
                          {src.id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSource(src);
                          setIsCreatingSource(false);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSource(src.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
