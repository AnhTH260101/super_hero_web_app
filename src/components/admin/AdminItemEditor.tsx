'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Check,
  CheckSquare,
  Square,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Box,
  ShoppingCart,
  FolderPlus,
  Settings,
  Layers,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
} from 'lucide-react';
import { GameItem, ItemCategory, ResourceSource } from '@/types/game';

interface AdminItemEditorProps {
  initialItems: Record<string, GameItem>;
  initialCategories?: ItemCategory[];
  availableSources?: ResourceSource[];
  onItemsUpdate?: (items: Record<string, GameItem>) => void;
  onCategoriesUpdate?: (categories: ItemCategory[]) => void;
  gameSlug: string;
  adminToken?: string;
}

const DEFAULT_CATEGORIES: ItemCategory[] = [
  { id: 'ticket', name: 'Vé & Thẻ chiêu mộ', icon: '🎟️' },
  { id: 'stamina', name: 'Thể lực & Sức sống', icon: '⚡' },
  { id: 'chest_key', name: 'Rương & Chìa khóa', icon: '🎁' },
  { id: 'upgrade_material', name: 'Đá & Tinh hoa nâng cấp', icon: '💎' },
  { id: 'equip_material', name: 'Linh kiện & Bản vẽ trang bị', icon: '🛡️' },
  { id: 'event', name: 'Đạo cụ sự kiện', icon: '🎉' },
  { id: 'general', name: 'Vật phẩm tiêu hao khác', icon: '📜' },
];

const OVERLAY_OPTIONS = [
  { value: '', label: 'Không lớp phủ (Gốc)' },
  { value: '/games/sieu-anh-hung/items/overlays/iconcer_equip.png', label: 'Huy hiệu Trang bị (iconcer_equip)' },
  { value: '/games/sieu-anh-hung/items/overlays/iconcer_gem.png', label: 'Huy hiệu Ngọc (iconcer_gem)' },
  { value: '/games/sieu-anh-hung/items/overlays/iconcer_card.png', label: 'Huy hiệu Thẻ bài (iconcer_card)' },
  { value: '/games/sieu-anh-hung/items/overlays/iconcer_break.png', label: 'Huy hiệu Đột phá (iconcer_break)' },
  { value: '/games/sieu-anh-hung/items/overlays/iconcer_food.png', label: 'Huy hiệu Thức ăn (iconcer_food)' },
  { value: '/games/sieu-anh-hung/items/overlays/public_shade_2.png', label: 'Lớp bóng Mảnh (public_shade_2)' },
];

function slugifyCategory(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export const AdminItemEditor: React.FC<AdminItemEditorProps> = ({
  initialItems,
  initialCategories = DEFAULT_CATEGORIES,
  availableSources = [],
  onItemsUpdate,
  onCategoriesUpdate,
  gameSlug,
  adminToken,
}) => {
  const [items, setItems] = useState<Record<string, GameItem>>(initialItems);
  const [categories, setCategories] = useState<ItemCategory[]>(
    initialCategories.length > 0 ? initialCategories : DEFAULT_CATEGORIES
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'visible' | 'hidden' | 'featured'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 40;

  // Tự động nạp các vật phẩm mới tạo từ LocalStorage nếu chưa có trên server
  useEffect(() => {
    try {
      const draftRaw = localStorage.getItem(`admin_items_draft_${gameSlug}`);
      if (draftRaw) {
        const draftItems: Record<string, GameItem> = JSON.parse(draftRaw);
        const draftKeys = Object.keys(draftItems);
        const missingKeys = draftKeys.filter((k) => !items[k] && !/^\d+$/.test(k));
        if (missingKeys.length > 0) {
          const toAdd: Record<string, GameItem> = {};
          missingKeys.forEach((k) => {
            toAdd[k] = draftItems[k];
            fetch('/api/admin/items', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({ gameSlug, item: draftItems[k] }),
            }).catch(() => {});
          });
          const merged = { ...items, ...toAdd };
          setItems(merged);
          onItemsUpdate?.(merged);
        }
      }
    } catch (e) {
      console.warn('Draft recovery check error:', e);
    }
  }, []);

  // Modal Sửa Chi Tiết / Thêm Mới 1 Item
  const [editingItem, setEditingItem] = useState<GameItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  // Modal Chọn Icon từ Kho (Icon Picker)
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerList, setIconPickerList] = useState<
    { name: string; url: string; folder: string; folderLabel: string }[]
  >([]);
  const [iconPickerCategories, setIconPickerCategories] = useState<
    { id: string; label: string; count: number }[]
  >([]);
  const [iconPickerFolder, setIconPickerFolder] = useState('all');
  const [iconPickerSearch, setIconPickerSearch] = useState('');
  const [isLoadingIcons, setIsLoadingIcons] = useState(false);
  const [iconPickerPage, setIconPickerPage] = useState(1);
  const [iconPickerTotal, setIconPickerTotal] = useState(0);

  // Lọc tìm kiếm sự kiện trong modal item
  const [sourceFilterQuery, setSourceFilterQuery] = useState('');

  // Modal Quản Lý Danh Mục (Category Manager)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');

  // Auto-Save Status (Tuân thủ auto-save-rule)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'local_draft'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isReloading, setIsReloading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Headers xác thực
  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
      headers['x-admin-token'] = adminToken;
    }
    return headers;
  };

  // Trigger Auto-Save (Lưu LocalStorage + Debounce Server Save)
  const triggerAutoSave = (
    updatedItems: Record<string, GameItem>,
    updatedCategories: ItemCategory[]
  ) => {
    setSaveStatus('saving');
    onItemsUpdate?.(updatedItems);
    onCategoriesUpdate?.(updatedCategories);
    try {
      localStorage.setItem(`admin_items_draft_${gameSlug}`, JSON.stringify(updatedItems));
      localStorage.setItem(`admin_categories_draft_${gameSlug}`, JSON.stringify(updatedCategories));
    } catch (e) {
      console.warn('LocalStorage draft error:', e);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/items', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            gameSlug,
            items: updatedItems,
            categories: updatedCategories,
          }),
        });
        if (res.ok) {
          setSaveStatus('saved');
          setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
        } else {
          setSaveStatus('local_draft');
        }
      } catch (err) {
        console.error('Server auto-save error:', err);
        setSaveStatus('local_draft');
      }
    }, 800);
  };

  // Nạp dữ liệu nóng (Tuân thủ asset-reload-rule)
  const handleReloadData = async () => {
    setIsReloading(true);
    try {
      const res = await fetch(`/api/admin/items?gameSlug=${gameSlug}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        }
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReloading(false);
    }
  };

  // Thêm danh mục mới
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;

    let id = slugifyCategory(name);
    if (!id) id = `cat_${Date.now()}`;

    // Đảm bảo không trùng ID
    if (categories.some((c) => c.id === id)) {
      id = `${id}_${Date.now().toString().slice(-4)}`;
    }

    const newCategory: ItemCategory = {
      id,
      name,
      icon: newCatIcon.trim() || '📦',
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    setNewCatName('');
    setNewCatIcon('📦');
    triggerAutoSave(items, updatedCategories);
  };

  // Xóa danh mục (các item thuộc danh mục đó sẽ chuyển sang 'general')
  const handleDeleteCategory = (catId: string) => {
    if (categories.length <= 1) {
      alert('Phải giữ lại ít nhất một danh mục!');
      return;
    }

    const updatedCategories = categories.filter((c) => c.id !== catId);
    const updatedItems = { ...items };
    let reassignedCount = 0;

    Object.keys(updatedItems).forEach((id) => {
      if (updatedItems[id].category === catId) {
        updatedItems[id] = { ...updatedItems[id], category: 'general' };
        reassignedCount++;
      }
    });

    setCategories(updatedCategories);
    setItems(updatedItems);
    if (filterCategory === catId) setFilterCategory('all');
    triggerAutoSave(updatedItems, updatedCategories);
  };

  // Bắt đầu thêm vật phẩm mới bằng tay
  const handleStartCreateItem = () => {
    const newId = `item_${Date.now().toString().slice(-6)}`;
    setEditingItem({
      id: newId,
      all_ids: [newId],
      name: '',
      story: '',
      category: categories[0]?.id || 'general',
      icon: '',
      icon_raw: '',
      overlay: '',
      shade_raw: '',
      is_use: 1,
      is_show: 1,
      is_featured: 0,
      stack: 9999,
      sources: [],
    });
    setIsCreatingNew(true);
  };

  // Bắt đầu sửa vật phẩm hiện có
  const handleStartEditItem = (item: GameItem) => {
    setEditingItem({ ...item });
    setIsCreatingNew(false);
  };

  // Lưu vật phẩm từ Modal (Thêm mới hoặc Cập nhật - Lưu trực tiếp và tức thì)
  const handleSaveItemModal = async (updatedItem: GameItem) => {
    if (!updatedItem.name.trim()) {
      alert('Vui lòng nhập tên vật phẩm!');
      return;
    }
    const finalId = updatedItem.id?.trim() || `item_${Date.now().toString().slice(-6)}`;
    const finalItem: GameItem = {
      ...updatedItem,
      id: finalId,
      all_ids: updatedItem.all_ids?.length ? updatedItem.all_ids : [finalId],
      is_show: updatedItem.is_show !== undefined ? updatedItem.is_show : 1,
    };
    const updated = { ...items, [finalId]: finalItem };
    setItems(updated);
    onItemsUpdate?.(updated);
    setEditingItem(null);
    setCurrentPage(1); // Luôn về trang 1 để thấy ngay vật phẩm vừa thêm

    // Lưu vào LocalStorage
    try {
      localStorage.setItem(`admin_items_draft_${gameSlug}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage draft error:', e);
    }

    // Gửi trực tiếp lên server (Gửi 1 item nhẹ, nhanh, chắc chắn 100%)
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          gameSlug,
          item: finalItem,
          categories,
        }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      } else {
        throw new Error('Lỗi phản hồi từ server');
      }
    } catch (err) {
      console.error('Lỗi lưu vật phẩm:', err);
      // Fallback lưu toàn bộ
      triggerAutoSave(updated, categories);
    }
  };

  // Xóa vật phẩm khỏi hệ thống (Xóa trực tiếp tức thì)
  const handleDeleteItem = async (id: string) => {
    const itemName = items[id]?.name || id;
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn vật phẩm "${itemName}" khỏi hệ thống?`)) return;
    const updated = { ...items };
    delete updated[id];
    setItems(updated);
    onItemsUpdate?.(updated);
    if (editingItem?.id === id) setEditingItem(null);

    setSaveStatus('saving');
    try {
      localStorage.setItem(`admin_items_draft_${gameSlug}`, JSON.stringify(updated));
    } catch (e) {}

    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          gameSlug,
          deleteId: id,
          categories,
        }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      } else {
        throw new Error('Server delete error');
      }
    } catch (err) {
      triggerAutoSave(updated, categories);
    }
  };

  // Upload file ảnh trực tiếp lên server
  const handleUploadIconFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    setIsUploadingIcon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gameSlug', gameSlug);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.file?.url) {
        setEditingItem((prev) => (prev ? { ...prev, icon: data.file.url } : null));
      } else {
        alert(data.error || 'Lỗi khi tải ảnh lên');
      }
    } catch (err: any) {
      alert('Lỗi upload ảnh: ' + err.message);
    } finally {
      setIsUploadingIcon(false);
      e.target.value = '';
    }
  };

  // Lấy danh sách icon từ kho (Icon Picker)
  const fetchIconPicker = async (
    folder = iconPickerFolder,
    search = iconPickerSearch,
    page = iconPickerPage,
    refresh = false
  ) => {
    setIsLoadingIcons(true);
    try {
      const params = new URLSearchParams({
        gameSlug,
        folder,
        search,
        page: page.toString(),
        limit: '60',
      });
      if (refresh) params.append('refresh', 'true');
      const res = await fetch(`/api/admin/resource-icons?${params.toString()}`);
      const data = await res.json();
      if (data.icons) {
        setIconPickerList(data.icons);
        setIconPickerCategories(data.categories || []);
        setIconPickerTotal(data.total || 0);
        setIconPickerPage(data.page || 1);
      }
    } catch (err) {
      console.error('Lỗi khi tải kho icon:', err);
    } finally {
      setIsLoadingIcons(false);
    }
  };

  useEffect(() => {
    if (showIconPicker) {
      fetchIconPicker(iconPickerFolder, iconPickerSearch, 1, false);
    }
  }, [showIconPicker]);

  // Đổi danh mục hàng loạt (Batch Category Assign - Không ghi đè toàn bộ file)
  const handleBatchChangeCategory = async (newCat: string) => {
    if (selectedIds.length === 0 || !newCat) return;
    const patchItems: Record<string, Partial<GameItem>> = {};
    const updated = { ...items };
    selectedIds.forEach((id) => {
      if (updated[id]) {
        updated[id] = { ...updated[id], category: newCat };
        patchItems[id] = { category: newCat };
      }
    });
    setItems(updated);
    onItemsUpdate?.(updated);
    setSelectedIds([]);
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ gameSlug, patchItems }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (e) {
      setSaveStatus('local_draft');
    }
  };

  // Ẩn / Hiện hàng loạt (Batch Visibility - Không ghi đè toàn bộ file)
  const handleBatchToggleVisibility = async (makeVisible: boolean) => {
    if (selectedIds.length === 0) return;
    const patchItems: Record<string, Partial<GameItem>> = {};
    const updated = { ...items };
    selectedIds.forEach((id) => {
      if (updated[id]) {
        const val = makeVisible ? 1 : 0;
        updated[id] = { ...updated[id], is_show: val };
        patchItems[id] = { is_show: val };
      }
    });
    setItems(updated);
    onItemsUpdate?.(updated);
    setSelectedIds([]);
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ gameSlug, patchItems }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (e) {
      setSaveStatus('local_draft');
    }
  };

  // Ghim / Bỏ ghim trọng điểm tức thì (Atomic single item save)
  const handleToggleFeatured = async (item: GameItem) => {
    const updatedItem: GameItem = {
      ...item,
      is_featured: item.is_featured === 1 ? 0 : 1,
    };
    const updated = { ...items, [item.id]: updatedItem };
    setItems(updated);
    onItemsUpdate?.(updated);
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ gameSlug, item: updatedItem }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('local_draft');
    }
  };

  // Ẩn / Hiện tức thì 1 item (Atomic single item save)
  const handleToggleVisibility = async (item: GameItem) => {
    const isHidden = item.is_show === 0;
    const updatedItem: GameItem = {
      ...item,
      is_show: isHidden ? 1 : 0,
    };
    const updated = { ...items, [item.id]: updatedItem };
    setItems(updated);
    onItemsUpdate?.(updated);
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ gameSlug, item: updatedItem }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('local_draft');
    }
  };

  // Thống kê số lượng vật phẩm trong từng danh mục
  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(items).forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Filter items
  const filteredList = useMemo(() => {
    let list = Object.values(items);

    if (filterCategory !== 'all') {
      list = list.filter((i) => i.category === filterCategory);
    }

    if (filterVisibility === 'visible') {
      list = list.filter((i) => i.is_show !== 0);
    } else if (filterVisibility === 'hidden') {
      list = list.filter((i) => i.is_show === 0);
    } else if (filterVisibility === 'featured') {
      list = list.filter((i) => i.is_featured === 1);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          i.story.toLowerCase().includes(term) ||
          (i.sources && i.sources.some((s) => s.toLowerCase().includes(term)))
      );
    }

    // Sắp xếp:
    // 1. Món được ghim trọng điểm (is_featured === 1) lên đầu
    // 2. Món mới thêm bằng tay (id chứa chữ / không phải số cũ) lên trên cùng để thấy ngay trên Trang 1
    return [...list].sort((a, b) => {
      const aF = a.is_featured === 1 ? 1 : 0;
      const bF = b.is_featured === 1 ? 1 : 0;
      if (bF !== aF) return bF - aF;

      const aCustom = !/^\d+$/.test(a.id) ? 1 : 0;
      const bCustom = !/^\d+$/.test(b.id) ? 1 : 0;
      if (bCustom !== aCustom) return bCustom - aCustom;

      return 0;
    });
  }, [items, filterCategory, filterVisibility, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Checkbox Select All trên trang hiện tại
  const isAllCurrentSelected =
    paginatedList.length > 0 &&
    paginatedList.every((i) => selectedIds.includes(i.id));

  const toggleSelectAllCurrent = () => {
    if (isAllCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedList.some((p) => p.id === id)));
    } else {
      const idsToAdd = paginatedList.map((p) => p.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar: Status, Manage Categories & Reload */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-400" />
            <span>Biên Tập & Quản Lý Vật Phẩm & Tài Nguyên</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý và thêm mới phân loại theo ý bạn, gán danh mục hàng loạt và biên tập nội dung vật phẩm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Nút Thêm Mới Vật Phẩm Bằng Tay */}
          <button
            onClick={handleStartCreateItem}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-slate-950 text-xs font-bold shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Vật Phẩm Mới</span>
          </button>

          {/* Nút Quản Lý Phân Loại Mới */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 transition-all shadow-sm"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Tùy Chỉnh Phân Loại ({categories.length})</span>
          </button>

          {/* Auto-Save Indicator (auto-save-rule) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            {saveStatus === 'saving' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-400 font-medium">Đang lưu tự động...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-medium">
                  Đã tự động lưu {lastSavedTime ? `(${lastSavedTime})` : ''}
                </span>
              </>
            )}
            {saveStatus === 'local_draft' && (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-blue-400 font-medium">Lưu nháp máy</span>
              </>
            )}
          </div>

          {/* Nút Tải lại asset nóng (asset-reload-rule) */}
          <button
            onClick={handleReloadData}
            disabled={isReloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all hover:text-amber-400 disabled:opacity-50"
            title="Đồng bộ nóng dữ liệu mà không cần F5 trang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Tải lại dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Dynamic Category Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên hoặc mô tả vật phẩm..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Dynamic Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-medium"
            >
              <option value="all">📦 Tất cả danh mục ({Object.keys(items).length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon || '📦'} {c.name} ({categoryItemCounts[c.id] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Visibility Filter */}
          <div>
            <select
              value={filterVisibility}
              onChange={(e) => {
                setFilterVisibility(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="all">👁️ Tất cả (Hiện + Ẩn)</option>
              <option value="featured">⭐ Chỉ Tài Nguyên Trọng Điểm</option>
              <option value="visible">✅ Đang hiển thị trên Web</option>
              <option value="hidden">🚫 Đã ẩn khỏi Web</option>
            </select>
          </div>
        </div>

        {/* Batch Action Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">
                Đã chọn {selectedIds.length} vật phẩm:
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Bỏ chọn
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Category */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-300">Gán danh mục:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleBatchChangeCategory(e.target.value);
                  }}
                  defaultValue=""
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="" disabled>
                    -- Chọn danh mục gán --
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon || '📦'} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Visibility */}
              <button
                onClick={() => handleBatchToggleVisibility(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold border border-red-500/30 transition-all"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ẩn khỏi web</span>
              </button>
              <button
                onClick={() => handleBatchToggleVisibility(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Hiện lại web</span>
              </button>
            </div>
          </div>
        )}

        {/* Selection & Pagination Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAllCurrent}
              className="flex items-center gap-1.5 font-medium hover:text-white transition-colors"
            >
              {isAllCurrentSelected ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>Chọn tất cả {paginatedList.length} mục trang này</span>
            </button>
          </div>

          <div>
            Đang hiển thị <strong>{filteredList.length}</strong> vật phẩm (Trang {currentPage} /{' '}
            {totalPages})
          </div>
        </div>
      </div>

      {/* Item Table List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800">
        {paginatedList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Box className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Không có vật phẩm nào phù hợp</p>
          </div>
        ) : (
          paginatedList.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isHidden = item.is_show === 0;
            const currentCat = categories.find((c) => c.id === item.category);

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  isSelected ? 'bg-amber-500/5' : isHidden ? 'bg-slate-950/40 opacity-60' : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Left: Checkbox + Icon + Info */}
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleSelectOne(item.id)}
                    className="mt-1 sm:mt-0 text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Icon with Layer */}
                  <div className="relative w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    {item.icon ? (
                      <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <Box className="w-6 h-6 text-slate-600" />
                    )}
                    {item.overlay && (
                      <img
                        src={item.overlay}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      />
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                      {item.is_featured === 1 && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Trọng điểm</span>
                        </span>
                      )}
                      {isHidden && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                          Đã ẩn
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.story || <span className="italic text-slate-600">Chưa có mô tả</span>}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium flex items-center gap-1">
                        <span>{currentCat?.icon || '📦'}</span>
                        <span>{currentCat?.name || item.category}</span>
                      </span>

                      {item.sources && item.sources.length > 0 && (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <ShoppingCart className="w-3 h-3" />
                          <span>{item.sources.join(', ')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Quick Toggle Featured */}
                  <button
                    onClick={() => handleToggleFeatured(item)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      item.is_featured === 1
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-amber-400'
                    }`}
                    title={item.is_featured === 1 ? 'Bỏ ghim trọng điểm' : 'Ghim làm tài nguyên trọng điểm (xếp lên đầu)'}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.is_featured === 1 ? 'fill-current text-amber-400' : ''}`} />
                  </button>

                  {/* Toggle Hide/Show */}
                  <button
                    onClick={() => handleToggleVisibility(item)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      isHidden
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border-slate-700'
                    }`}
                    title={isHidden ? 'Hiển thị lại trên web' : 'Ẩn khỏi web'}
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleStartEditItem(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-all"
          >
            Trang Trước
          </button>
          <span className="text-xs text-slate-400 px-3 font-medium">
            Trang <strong className="text-white">{currentPage}</strong> / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-all"
          >
            Trang Sau
          </button>
        </div>
      )}

      {/* MODAL QUẢN LÝ PHÂN LOẠI (CATEGORY MANAGER) */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>Tùy Chỉnh & Thêm Mới Phân Loại</span>
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Form Thêm Phân Loại Mới */}
            <form onSubmit={handleAddCategory} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                + Thêm phân loại mới
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="Emoji"
                  title="Biểu tượng Emoji (ví dụ: 🔮, ⚔️, 📿)"
                  className="w-14 text-center px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-base focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nhập tên phân loại mới (vd: Pháp Bảo, Tướng Hồn...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all shrink-0"
                >
                  Thêm
                </button>
              </div>
            </form>

            {/* Danh Sách Các Phân Loại Hiện Có */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">
                Danh sách phân loại hiện tại ({categories.length}):
              </h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                {categories.map((c) => {
                  const count = categoryItemCounts[c.id] || 0;
                  return (
                    <div key={c.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-base">{c.icon || '📦'}</span>
                        <span className="font-bold text-white truncate">{c.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({c.id})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-amber-400 font-semibold">
                          {count} món
                        </span>

                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Xóa phân loại này (vật phẩm sẽ chuyển sang Tiêu hao khác)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 italic">
              * Mọi thay đổi phân loại sẽ được tự động lưu lên server và cập nhật tức thì trên trang tra cứu.
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA / THÊM MỚI CHI TIẾT 1 VẬT PHẨM */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>{isCreatingNew ? 'Thêm Vật Phẩm Mới Bằng Tay' : 'Chỉnh Sửa Chi Tiết Vật Phẩm'}</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* ID Vật Phẩm (nếu là thêm mới) */}
              {isCreatingNew && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    ID Vật Phẩm (Mã hệ thống):
                  </label>
                  <input
                    type="text"
                    value={editingItem.id}
                    onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value })}
                    placeholder="VD: custom_101 hoặc để mặc định"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Tên */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tên Vật Phẩm * :</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Nhập tên vật phẩm chính xác..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* HÌNH ẢNH / ICON VẬT PHẨM (ĐỔI HÌNH ẢNH HOẶC TẢI ẢNH MỚI) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Hình Ảnh / Icon Vật Phẩm:
                </label>
                <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  {/* Preview Box with Overlay */}
                  <div className="relative w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                    {editingItem.icon ? (
                      <img
                        src={editingItem.icon}
                        alt={editingItem.name || 'preview'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Box className="w-8 h-8 text-slate-600" />
                    )}
                    {editingItem.overlay && (
                      <img
                        src={editingItem.overlay}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      />
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Upload Button */}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow">
                        {isUploadingIcon ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingIcon ? 'Đang tải lên...' : 'Tải ảnh từ máy'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingIcon}
                          onChange={handleUploadIconFile}
                        />
                      </label>

                      {/* Pick from Library Button */}
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all hover:text-amber-400"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Duyệt kho icon game</span>
                      </button>

                      {editingItem.icon && (
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, icon: '' })}
                          className="text-[11px] text-slate-400 hover:text-red-400 underline"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>

                    {/* Direct URL Input */}
                    <div>
                      <input
                        type="text"
                        value={editingItem.icon || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                        placeholder="Đường dẫn ảnh: /games/... hoặc link https://..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh Mục (Dynamic Categories) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Phân Loại:</label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    + Thêm phân loại mới
                  </button>
                </div>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon || '📦'} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lớp phủ góc (Overlay/Shade) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Huy Hiệu / Layer Góc (Overlay):
                </label>
                <select
                  value={editingItem.overlay || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, overlay: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {OVERLAY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mô tả / Story */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mô Tả & Công Dụng Chi Tiết:
                </label>
                <textarea
                  rows={3}
                  value={editingItem.story}
                  onChange={(e) => setEditingItem({ ...editingItem, story: e.target.value })}
                  placeholder="Nhập nội dung mô tả, công dụng của vật phẩm..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 leading-relaxed font-normal"
                />
              </div>

              {/* Nguồn kiếm (Sources) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nguồn Kiếm & Cách Nhận (phân cách bằng dấu phẩy):
                </label>
                <input
                  type="text"
                  value={(editingItem.sources || []).join(', ')}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      sources: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Ví dụ: Bàn Cờ Lửa, Đoạt Bảo, Cửa Hàng, Kho Báu Mê Cung..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />

                {/* Chọn nhanh từ danh sách nguồn hoạt động có sẵn (kèm icon) */}
                {availableSources.length > 0 ? (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Kho nguồn hoạt động có sẵn ({availableSources.length}):
                      </span>
                      <input
                        type="text"
                        value={sourceFilterQuery}
                        onChange={(e) => setSourceFilterQuery(e.target.value)}
                        placeholder="🔍 Tìm nhanh sự kiện..."
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] focus:outline-none focus:border-amber-500 w-44"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      {availableSources
                        .filter(
                          (s) =>
                            !sourceFilterQuery ||
                            s.name.toLowerCase().includes(sourceFilterQuery.toLowerCase())
                        )
                        .map((s) => {
                        const isSelected = (editingItem.sources || []).some(
                          (cur) =>
                            cur.toLowerCase() === s.name.toLowerCase() ||
                            cur.toLowerCase() === s.id.toLowerCase()
                        );
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              const current = editingItem.sources || [];
                              if (isSelected) {
                                setEditingItem({
                                  ...editingItem,
                                  sources: current.filter(
                                    (cur) =>
                                      cur.toLowerCase() !== s.name.toLowerCase() &&
                                      cur.toLowerCase() !== s.id.toLowerCase()
                                  ),
                                });
                              } else {
                                setEditingItem({
                                  ...editingItem,
                                  sources: [...current, s.name],
                                });
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-xs'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {s.icon && (
                              <img
                                src={s.icon}
                                alt=""
                                className="w-3.5 h-3.5 object-contain rounded shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span>{s.name}</span>
                            {isSelected && <span className="text-amber-400 text-xs font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Gợi ý nguồn kiếm dạng text nếu không có sources */
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Bấm thêm nhanh:</span>
                    {[
                      'Bàn Cờ Lửa',
                      'Đoạt Bảo',
                      'Kho Báu Mê Cung',
                      'Cửa Hàng',
                      'Thần Xạ Vũ Trụ',
                      'Minh Nguyệt',
                      'Nhái Bá',
                      'Phó Bản',
                      'Nhiệm Vụ Ngày',
                      'Đấu Trường',
                    ].map((sName) => (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => {
                          const current = editingItem.sources || [];
                          if (!current.includes(sName)) {
                            setEditingItem({
                              ...editingItem,
                              sources: [...current, sName],
                            });
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-[10px] font-medium border border-slate-700 transition-colors"
                      >
                        + {sName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ghim Tài Nguyên Trọng Điểm */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <input
                  type="checkbox"
                  id="featuredCheckbox"
                  checked={editingItem.is_featured === 1}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, is_featured: e.target.checked ? 1 : 0 })
                  }
                  className="rounded border-amber-500 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="featuredCheckbox" className="text-amber-300 font-bold text-xs cursor-pointer flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                  <span>Đánh dấu là Tài Nguyên Trọng Điểm (Ưu tiên xếp lên đầu trang tra cứu)</span>
                </label>
              </div>

              {/* Ẩn/Hiện */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showCheckbox"
                  checked={editingItem.is_show !== 0}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, is_show: e.target.checked ? 1 : 0 })
                  }
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="showCheckbox" className="text-slate-300 font-medium cursor-pointer">
                  Hiển thị vật phẩm này trên trang công khai (Web Portal)
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              {!isCreatingNew ? (
                <button
                  type="button"
                  onClick={() => handleDeleteItem(editingItem.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Vật Phẩm</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleSaveItemModal(editingItem)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-slate-950 font-bold text-xs shadow-lg transition-all"
                >
                  {isCreatingNew ? 'Thêm Vào Kho' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DUYỆT KHO ICON & HÌNH ẢNH GAME */}
      {showIconPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Kho Icon & Hình Ảnh Game</h3>
                <span className="text-xs text-slate-400 font-mono">({iconPickerTotal} ảnh)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchIconPicker(iconPickerFolder, iconPickerSearch, 1, true)}
                  disabled={isLoadingIcons}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-xs font-semibold border border-slate-700 transition-all"
                  title="Tải lại kho ảnh nóng (asset-reload-rule)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIcons ? 'animate-spin text-amber-400' : ''}`} />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
                <button
                  onClick={() => setShowIconPicker(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-slate-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={iconPickerSearch}
                  onChange={(e) => {
                    setIconPickerSearch(e.target.value);
                    fetchIconPicker(iconPickerFolder, e.target.value, 1, false);
                  }}
                  placeholder="Tìm theo tên file icon..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <select
                  value={iconPickerFolder}
                  onChange={(e) => {
                    setIconPickerFolder(e.target.value);
                    fetchIconPicker(e.target.value, iconPickerSearch, 1, false);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
                >
                  <option value="all">📂 Tất cả thư mục ({iconPickerTotal})</option>
                  {iconPickerCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Icon Grid */}
            <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
              {isLoadingIcons ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
                  <span className="text-xs">Đang tải danh sách icon...</span>
                </div>
              ) : iconPickerList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-2">
                  <Box className="w-8 h-8 opacity-40" />
                  <span className="text-xs">Không tìm thấy icon nào</span>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {iconPickerList.map((ic) => (
                    <button
                      key={ic.url}
                      onClick={() => {
                        if (editingItem) {
                          setEditingItem({ ...editingItem, icon: ic.url });
                        }
                        setShowIconPicker(false);
                      }}
                      className="group relative flex flex-col items-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/60 transition-all text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                      title={`${ic.name} (${ic.folderLabel})`}
                    >
                      <div className="w-12 h-12 flex items-center justify-center p-1 rounded-lg bg-slate-900 group-hover:scale-105 transition-transform overflow-hidden">
                        <img src={ic.url} alt={ic.name} className="w-full h-full object-contain" loading="lazy" />
                      </div>
                      <span className="text-[10px] text-slate-400 group-hover:text-amber-400 truncate w-full mt-1.5 font-mono">
                        {ic.name.replace(/\.[^/.]+$/, '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0 text-xs text-slate-400">
              <div>
                Trang <strong className="text-white">{iconPickerPage}</strong> / {Math.ceil(iconPickerTotal / 60) || 1}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={iconPickerPage <= 1 || isLoadingIcons}
                  onClick={() => fetchIconPicker(iconPickerFolder, iconPickerSearch, iconPickerPage - 1, false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
                >
                  Trang Trước
                </button>
                <button
                  disabled={iconPickerPage >= Math.ceil(iconPickerTotal / 60) || isLoadingIcons}
                  onClick={() => fetchIconPicker(iconPickerFolder, iconPickerSearch, iconPickerPage + 1, false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
                >
                  Trang Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
