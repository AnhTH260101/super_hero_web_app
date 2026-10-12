'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Users,
  Sparkles,
  Save,
  Check,
  X,
  Search,
  Upload,
  ExternalLink,
  ShieldAlert,
  Flame,
  Award,
  Clock,
  Layers,
  FolderOpen,
  Info,
  Calendar,
  Settings,
  Swords,
  Trophy,
  Shield,
  Crown,
  Target,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  Hero,
  ResourceItem,
  GuideArticle,
  GuideBlock,
  GuideTextBlock,
  GuideHeroRosterBlock,
  GuideGalleryBlock,
  GuideResourcesBlock,
  GuideHeroItem,
  GuideResourceItem,
  GuideImageItem,
  GameActivity,
} from '@/types/game';

interface Props {
  initialGuides: GuideArticle[];
  initialActivities?: GameActivity[];
  allHeroes: Hero[];
  allResources: ResourceItem[];
  gameSlug: string;
}

export const AdminGuideEditor: React.FC<Props> = ({
  initialGuides,
  initialActivities = [],
  allHeroes,
  allResources,
  gameSlug,
}) => {
  const [guides, setGuides] = useState<GuideArticle[]>(initialGuides);
  const [activities, setActivities] = useState<GameActivity[]>(initialActivities);
  const [activeSubTab, setActiveSubTab] = useState<'guides' | 'activities'>('guides');

  // Quản lý Activity Form / Modal
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null);
  const [activityForm, setActivityForm] = useState<Partial<GameActivity>>({
    name: '',
    slug: '',
    shortDesc: '',
    icon: 'Swords',
    badge: '',
    color: 'amber',
    enabled: true,
  });

  const [activeGuide, setActiveGuide] = useState<GuideArticle | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State: Hero Picker
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [targetBlockIdForHero, setTargetBlockIdForHero] = useState<string | null>(null);
  const [heroSearchTerm, setHeroSearchTerm] = useState('');

  // Modal State: Resource Picker
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [targetBlockIdForResource, setTargetBlockIdForResource] = useState<string | null>(null);
  const [resourceSearchTerm, setResourceSearchTerm] = useState('');

  // Modal State: Image Gallery Picker & Upload
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [targetBlockIdForImage, setTargetBlockIdForImage] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<{ name: string; url: string; size: number }[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tải danh sách media từ folder tai-nguyen-anh
  const fetchMediaFiles = async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch(`/api/admin/media?gameSlug=${gameSlug}`);
      const data = await res.json();
      if (data.success) {
        setMediaFiles(data.files || []);
      }
    } catch {
      showToast('Lỗi khi tải danh sách ảnh', 'error');
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (isImageModalOpen) {
      fetchMediaFiles();
    }
  }, [isImageModalOpen, gameSlug]);

  // Upload file trực tiếp lên folder tai-nguyen-anh
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gameSlug', gameSlug);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.file) {
        showToast(`Đã tải ảnh lên thành công: ${data.file.name}`, 'success');
        await fetchMediaFiles();

        // Tự động thêm ảnh vừa upload vào block đang mở (nếu có)
        if (targetBlockIdForImage && activeGuide) {
          addImageToBlock(targetBlockIdForImage, data.file.url);
        }
      } else {
        showToast(data.error || 'Upload thất bại', 'error');
      }
    } catch {
      showToast('Lỗi khi upload ảnh', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Lọc danh sách bài viết
  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      const matchSearch =
        searchFilter === '' ||
        g.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        g.slug.toLowerCase().includes(searchFilter.toLowerCase()) ||
        g.description.toLowerCase().includes(searchFilter.toLowerCase());

      const matchCategory = categoryFilter === 'all' || g.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [guides, searchFilter, categoryFilter]);

  // Tạo bài viết mới
  const handleStartCreate = () => {
    const newGuide: GuideArticle = {
      id: `guide-${Date.now()}`,
      slug: `bai-viet-${Date.now().toString().slice(-4)}`,
      title: 'Bài Viết Mới',
      category: 'boss',
      schedule: '',
      description: 'Mô tả tóm tắt nội dung bài viết...',
      thumbnail: '',
      blocks: [
        {
          id: `block-${Date.now()}-1`,
          type: 'text',
          title: 'Tổng Quan & Giới Thiệu',
          content: 'Nhập nội dung hướng dẫn chi tiết tại đây...',
          variant: 'normal',
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    setActiveGuide(newGuide);
    setIsCreatingNew(true);
  };

  // Chọn bài để sửa
  const handleSelectGuide = (guide: GuideArticle) => {
    setActiveGuide(JSON.parse(JSON.stringify(guide)));
    setIsCreatingNew(false);
  };

  // Lưu bài viết
  const handleSaveGuide = async () => {
    if (!activeGuide) return;
    if (!activeGuide.title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài viết', 'error');
      return;
    }
    if (!activeGuide.slug.trim()) {
      showToast('Vui lòng nhập slug bài viết', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameSlug, article: activeGuide }),
      });
      const data = await res.json();

      if (data.success && data.article) {
        setGuides((prev) => {
          const index = prev.findIndex((g) => g.slug === data.article.slug || g.id === data.article.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = data.article;
            return next;
          }
          return [data.article, ...prev];
        });
        setActiveGuide(data.article);
        setIsCreatingNew(false);
        showToast('Đã lưu bài viết thành công!', 'success');
      } else {
        showToast(data.error || 'Lỗi khi lưu bài viết', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ khi lưu bài viết', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Xóa bài viết
  const handleDeleteGuide = async (slug: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/guides?gameSlug=${gameSlug}&slug=${slug}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setGuides((prev) => prev.filter((g) => g.slug !== slug));
        if (activeGuide?.slug === slug) {
          setActiveGuide(null);
        }
        showToast('Đã xóa bài viết thành công!', 'success');
      } else {
        showToast(data.error || 'Lỗi khi xóa bài viết', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ khi xóa bài viết', 'error');
    }
  };

  // --- QUẢN LÝ CẤU HÌNH HOẠT ĐỘNG (ACTIVITIES) ---
  const handleSaveActivitiesList = async (newList: GameActivity[]) => {
    try {
      const res = await fetch('/api/admin/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameSlug, activities: newList }),
      });
      const data = await res.json();
      if (data.success) {
        setActivities(newList);
        showToast('Đã lưu cấu hình hoạt động thành công!', 'success');
      } else {
        showToast(data.error || 'Lỗi khi lưu hoạt động', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ khi lưu hoạt động', 'error');
    }
  };

  const handleOpenAddActivity = () => {
    setEditingActivityIndex(null);
    setActivityForm({
      name: '',
      slug: '',
      shortDesc: '',
      icon: 'Swords',
      badge: 'Mới',
      color: 'amber',
      enabled: true,
      order: activities.length + 1,
    });
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivity = (act: GameActivity, index: number) => {
    setEditingActivityIndex(index);
    setActivityForm({ ...act });
    setIsActivityModalOpen(true);
  };

  const handleSubmitActivityForm = () => {
    if (!activityForm.name?.trim() || !activityForm.slug?.trim()) {
      showToast('Vui lòng nhập tên và slug hoạt động', 'error');
      return;
    }

    const safeSlug = activityForm.slug.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-');
    const updatedItem: GameActivity = {
      id: activityForm.id || `act-${Date.now()}`,
      slug: safeSlug,
      name: activityForm.name.trim(),
      shortDesc: activityForm.shortDesc?.trim() || '',
      icon: activityForm.icon || 'Swords',
      badge: activityForm.badge?.trim() || '',
      color: activityForm.color || 'amber',
      order: activityForm.order ?? (activities.length + 1),
      enabled: activityForm.enabled !== false,
    };

    let nextActivities: GameActivity[];
    if (editingActivityIndex !== null && editingActivityIndex >= 0) {
      nextActivities = [...activities];
      nextActivities[editingActivityIndex] = updatedItem;
    } else {
      nextActivities = [...activities, updatedItem];
    }

    handleSaveActivitiesList(nextActivities);
    setIsActivityModalOpen(false);
  };

  const handleToggleActivity = (index: number) => {
    const nextActivities = [...activities];
    nextActivities[index] = {
      ...nextActivities[index],
      enabled: !nextActivities[index].enabled,
    };
    handleSaveActivitiesList(nextActivities);
  };

  const handleDeleteActivity = (index: number) => {
    const act = activities[index];
    if (!window.confirm(`Bạn có chắc muốn xóa hoạt động "${act.name}"?`)) return;

    const nextActivities = activities.filter((_, i) => i !== index);
    handleSaveActivitiesList(nextActivities);
  };

  const handleMoveActivity = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activities.length) return;

    const nextActivities = [...activities];
    const temp = nextActivities[index];
    nextActivities[index] = nextActivities[targetIdx];
    nextActivities[targetIdx] = temp;

    // Cập nhật lại thứ tự order
    const ordered = nextActivities.map((a, i) => ({ ...a, order: i + 1 }));
    handleSaveActivitiesList(ordered);
  };

  // Quản lý Blocks trong Active Guide
  const handleAddBlock = (type: GuideBlock['type']) => {
    if (!activeGuide) return;
    const blockId = `block-${Date.now()}`;
    let newBlock: GuideBlock;

    if (type === 'text') {
      newBlock = {
        id: blockId,
        type: 'text',
        title: 'Mẹo & Chiến Thuật',
        content: 'Nhập nội dung chi tiết...',
        variant: 'tip',
      };
    } else if (type === 'hero-roster') {
      newBlock = {
        id: blockId,
        type: 'hero-roster',
        title: 'Đội Hình Đề Xuất',
        description: 'Các tướng khuyên dùng để đạt sát thương tối ưu',
        heroes: [],
      };
    } else if (type === 'gallery') {
      newBlock = {
        id: blockId,
        type: 'gallery',
        title: 'Hình Ảnh Thực Chiến',
        layout: 'grid-2',
        images: [],
      };
    } else {
      newBlock = {
        id: blockId,
        type: 'resources',
        title: 'Trang Bị & Phần Thưởng',
        description: 'Các vật phẩm nhận được khi tham gia',
        items: [],
      };
    }

    setActiveGuide({
      ...activeGuide,
      blocks: [...activeGuide.blocks, newBlock],
    });
  };

  const handleRemoveBlock = (blockId: string) => {
    if (!activeGuide) return;
    setActiveGuide({
      ...activeGuide,
      blocks: activeGuide.blocks.filter((b) => b.id !== blockId),
    });
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!activeGuide) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeGuide.blocks.length) return;

    const newBlocks = [...activeGuide.blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;

    setActiveGuide({ ...activeGuide, blocks: newBlocks });
  };

  const handleUpdateBlock = (blockId: string, updatedFields: Partial<GuideBlock>) => {
    if (!activeGuide) return;
    setActiveGuide({
      ...activeGuide,
      blocks: activeGuide.blocks.map((b) => (b.id === blockId ? ({ ...b, ...updatedFields } as GuideBlock) : b)),
    });
  };

  // Thêm tướng vào block
  const handleAddHeroToBlock = (hero: Hero) => {
    if (!activeGuide || !targetBlockIdForHero) return;
    const block = activeGuide.blocks.find((b) => b.id === targetBlockIdForHero) as GuideHeroRosterBlock;
    if (!block || block.type !== 'hero-roster') return;

    // Tránh trùng tướng trong cùng block
    if (block.heroes.some((h) => h.heroSlug === hero.slug)) {
      showToast('Tướng này đã có trong danh sách', 'error');
      return;
    }

    const newHeroItem: GuideHeroItem = {
      heroSlug: hero.slug,
      name: hero.name,
      avatar: hero.avatar,
      element: hero.element,
      rarity: hero.rarity,
      role: hero.role || 'Sát Thương',
      note: 'Nhập ghi chú kỹ năng / cách vận hành...',
    };

    handleUpdateBlock(targetBlockIdForHero, {
      heroes: [...block.heroes, newHeroItem],
    });
    showToast(`Đã thêm tướng ${hero.name}`, 'success');
  };

  // Thêm resource vào block
  const handleAddResourceToBlock = (resItem: ResourceItem) => {
    if (!activeGuide || !targetBlockIdForResource) return;
    const block = activeGuide.blocks.find((b) => b.id === targetBlockIdForResource) as GuideResourcesBlock;
    if (!block || block.type !== 'resources') return;

    const newResItem: GuideResourceItem = {
      id: resItem.id,
      name: resItem.name,
      icon: resItem.icon,
      note: 'Phần thưởng nổi bật',
    };

    handleUpdateBlock(targetBlockIdForResource, {
      items: [...block.items, newResItem],
    });
    showToast(`Đã thêm vật phẩm ${resItem.name}`, 'success');
  };

  // Thêm ảnh vào block
  const addImageToBlock = (blockId: string, url: string) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideGalleryBlock;
    if (!block || block.type !== 'gallery') return;

    const newImageItem: GuideImageItem = {
      url,
      caption: '',
    };

    handleUpdateBlock(blockId, {
      images: [...block.images, newImageItem],
    });
    showToast('Đã chèn ảnh vào bài viết', 'success');
  };

  // Lọc tướng trong Modal
  const modalHeroes = useMemo(() => {
    const term = heroSearchTerm.trim().toLowerCase();
    return allHeroes.filter(
      (h) =>
        term === '' ||
        h.name.toLowerCase().includes(term) ||
        h.slug.toLowerCase().includes(term) ||
        h.element.toLowerCase().includes(term)
    );
  }, [allHeroes, heroSearchTerm]);

  // Lọc resource trong Modal
  const modalResources = useMemo(() => {
    const term = resourceSearchTerm.trim().toLowerCase();
    return allResources.filter(
      (r) => term === '' || r.name.toLowerCase().includes(term) || r.category?.toLowerCase().includes(term)
    );
  }, [allResources, resourceSearchTerm]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/90 border-red-500/50 text-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            <span>Quản Lý Sự Kiện & Hoạt Động Game</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cấu hình danh mục hoạt động trên Navbar/Website và biên tập bài viết bằng các khối Block trực quan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeGuide && (
            <button
              onClick={() => setActiveGuide(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              ← Danh Sách Bài Viết
            </button>
          )}

          {!activeGuide && activeSubTab === 'guides' && (
            <button
              onClick={handleStartCreate}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Bài Viết Mới</span>
            </button>
          )}

          {!activeGuide && activeSubTab === 'activities' && (
            <button
              onClick={handleOpenAddActivity}
              className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Hoạt Động Mới</span>
            </button>
          )}

          {activeGuide && (
            <button
              onClick={handleSaveGuide}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Đang Lưu...' : 'Lưu Bài Viết'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB TABS & DANH SÁCH (KHI KHÔNG SỬA BÀI VIẾT) */}
      {!activeGuide ? (
        <div className="space-y-4">
          {/* Sub Tabs Switcher */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveSubTab('guides')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeSubTab === 'guides'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Bài Viết Hướng Dẫn ({guides.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('activities')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeSubTab === 'activities'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cấu Hình Hoạt Động ({activities.length})</span>
            </button>
          </div>

          {/* VIEW: QUẢN LÝ CẤU HÌNH HOẠT ĐỘNG (ACTIVITIES) */}
          {activeSubTab === 'activities' ? (
            <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Danh Sách Hoạt Động Đang Quản Lý ({activities.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Các hoạt động đang bật sẽ tự động xuất hiện trên Dropdown menu thanh điều hướng và trang Hub.
              </p>
            </div>
            <button
              onClick={handleOpenAddActivity}
              className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Hoạt Động</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((act, index) => (
              <div
                key={act.slug}
                className={`p-5 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between ${
                  act.enabled !== false ? 'border-slate-800 hover:border-blue-500/50' : 'border-slate-800/40 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                        {act.icon === 'Flame' ? (
                          <Flame className="w-6 h-6 text-amber-400" />
                        ) : act.icon === 'Trophy' ? (
                          <Trophy className="w-6 h-6 text-blue-400" />
                        ) : act.icon === 'Sparkles' ? (
                          <Sparkles className="w-6 h-6 text-purple-400" />
                        ) : act.icon === 'Shield' ? (
                          <Shield className="w-6 h-6 text-emerald-400" />
                        ) : act.icon === 'Crown' ? (
                          <Crown className="w-6 h-6 text-yellow-400" />
                        ) : act.icon === 'Target' ? (
                          <Target className="w-6 h-6 text-red-400" />
                        ) : act.icon?.startsWith('/') ? (
                          <img src={act.icon} alt="" className="w-6 h-6 object-contain" />
                        ) : (
                          <Swords className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base text-white">{act.name}</h4>
                          {act.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                              {act.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">/{act.slug}</div>
                      </div>
                    </div>

                    {/* Toggle Switch Enabled */}
                    <button
                      onClick={() => handleToggleActivity(index)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all ${
                        act.enabled !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                      title={act.enabled !== false ? 'Bấm để tạm ẩn' : 'Bấm để hiển thị'}
                    >
                      {act.enabled !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      <span>{act.enabled !== false ? 'Đang Bật' : 'Tạm Ẩn'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {act.shortDesc || 'Chưa có mô tả tóm tắt.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveActivity(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Chuyển lên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveActivity(index, 'down')}
                      disabled={index === activities.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Chuyển xuống"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/${gameSlug}/daily/${act.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Xem trang hoạt động"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleOpenEditActivity(act, index)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(index)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                      title="Xóa hoạt động"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VIEW 1: DANH SÁCH BÀI VIẾT (KHI ĐANG Ở TAB GUIDES) */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm bài viết theo tiêu đề, slug..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Tất cả ({guides.length})
              </button>
              {activities.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setCategoryFilter(cat.slug)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    categoryFilter === cat.slug
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuides.map((guide) => (
              <div
                key={guide.slug}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex flex-col justify-between group transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        guide.category === 'boss'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : guide.category === 'event'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {guide.category.toUpperCase()}
                    </span>
                    {guide.schedule && (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {guide.schedule}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors line-clamp-1">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {guide.description}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    {guide.blocks?.length || 0} khối nội dung • /{guide.slug}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => handleSelectGuide(guide)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={`/${gameSlug}/daily/boss`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
                      title="Xem trang thực tế"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteGuide(guide.slug, guide.title)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : (
    /* VIEW 2: VISUAL BLOCK EDITOR (CHỈNH SỬA / TẠO BÀI VIẾT) */
        <div className="space-y-6">
          {/* Form Thông Tin Chung */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>1. Thông Tin Chung Bài Viết</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Tiêu Đề Bài Viết *</label>
                <input
                  type="text"
                  value={activeGuide.title}
                  onChange={(e) => setActiveGuide({ ...activeGuide, title: e.target.value })}
                  placeholder="VD: Boss Thế Giới (World Boss)"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Đường Dẫn Slug *</label>
                <input
                  type="text"
                  value={activeGuide.slug}
                  onChange={(e) => setActiveGuide({ ...activeGuide, slug: e.target.value })}
                  placeholder="VD: boss-the-gioi"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Chuyên Mục</label>
                <select
                  value={activeGuide.category}
                  onChange={(e) => setActiveGuide({ ...activeGuide, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  {activities.map((act) => (
                    <option key={act.slug} value={act.slug}>
                      {act.name} ({act.slug})
                    </option>
                  ))}
                  <option value="other">Khác / Tự Do</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Lịch Trình / Khung Giờ</label>
                <input
                  type="text"
                  value={activeGuide.schedule || ''}
                  onChange={(e) => setActiveGuide({ ...activeGuide, schedule: e.target.value })}
                  placeholder="VD: 12:00 & 20:00 Hàng Ngày"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Mô Tả Tóm Tắt</label>
              <textarea
                value={activeGuide.description}
                onChange={(e) => setActiveGuide({ ...activeGuide, description: e.target.value })}
                rows={2}
                placeholder="Tóm tắt ngắn gọn nội dung và mục tiêu bài viết..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Danh Sách Khối Nội Dung (Blocks) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>2. Các Khối Bố Cục Nội Dung ({activeGuide.blocks.length} Khối)</span>
              </h3>
              <span className="text-xs text-slate-500">
                Sử dụng các nút mũi tên để đổi vị trí hiển thị
              </span>
            </div>

            {activeGuide.blocks.map((block, index) => (
              <div
                key={block.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg transition-all"
              >
                {/* Block Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                      #{index + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        block.type === 'hero-roster'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : block.type === 'gallery'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : block.type === 'resources'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      {block.type === 'hero-roster'
                        ? 'Đội Hình Tướng'
                        : block.type === 'gallery'
                        ? 'Thư Viện Ảnh'
                        : block.type === 'resources'
                        ? 'Vật Phẩm / Thưởng'
                        : 'Văn Bản / Mẹo'}
                    </span>
                    <input
                      type="text"
                      value={block.title || ''}
                      onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                      placeholder="Tiêu đề khối này..."
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500 w-56 sm:w-80"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveBlock(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Lên trên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveBlock(index, 'down')}
                      disabled={index === activeGuide.blocks.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Xuống dưới"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveBlock(block.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 ml-2"
                      title="Xóa khối này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* BLOCK 1: VĂN BẢN (TEXT) */}
                {block.type === 'text' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="text-xs font-bold text-slate-400">Kiểu khung:</label>
                      <div className="flex items-center gap-2">
                        {[
                          { id: 'normal', label: 'Bình thường' },
                          { id: 'tip', label: '💡 Mẹo Hay' },
                          { id: 'strategy', label: '⚔️ Chiến Lược' },
                          { id: 'warning', label: '⚠️ Chú Ý' },
                        ].map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleUpdateBlock(block.id, { variant: v.id as any })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              block.variant === v.id
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={block.content}
                      onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                      rows={4}
                      placeholder="Nhập nội dung hướng dẫn, các gạch đầu dòng..."
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans resize-y"
                    />
                  </div>
                )}

                {/* BLOCK 2: ĐỘI HÌNH TƯỚNG (HERO ROSTER) */}
                {block.type === 'hero-roster' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={block.description || ''}
                        onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                        placeholder="Mô tả tiêu chí chọn tướng (VD: Dồn dame đơn mục tiêu, buff bạo kích...)"
                        className="w-full sm:w-2/3 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                      />

                      <button
                        onClick={() => {
                          setTargetBlockIdForHero(block.id);
                          setHeroSearchTerm('');
                          setIsHeroModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm Tướng Đề Xuất</span>
                      </button>
                    </div>

                    {/* Danh sách các tướng đã thêm */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {block.heroes.map((hero, hIdx) => (
                        <div
                          key={hero.heroSlug}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3 relative group"
                        >
                          <img
                            src={hero.avatar}
                            alt={hero.name}
                            className="w-12 h-12 rounded-xl border border-slate-700 object-cover shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/heroes/icon_heroes/default.png';
                            }}
                          />
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-white text-xs">{hero.name}</span>
                              <button
                                onClick={() => {
                                  const updated = block.heroes.filter((_, idx) => idx !== hIdx);
                                  handleUpdateBlock(block.id, { heroes: updated });
                                }}
                                className="text-slate-500 hover:text-red-400 p-0.5"
                                title="Xóa tướng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={hero.role || ''}
                              onChange={(e) => {
                                const updated = [...block.heroes];
                                updated[hIdx] = { ...updated[hIdx], role: e.target.value };
                                handleUpdateBlock(block.id, { heroes: updated });
                              }}
                              placeholder="Vai trò: DPS / Buff / Tank..."
                              className="w-full px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-amber-400 font-semibold focus:outline-none"
                            />

                            <textarea
                              value={hero.note || ''}
                              onChange={(e) => {
                                const updated = [...block.heroes];
                                updated[hIdx] = { ...updated[hIdx], note: e.target.value };
                                handleUpdateBlock(block.id, { heroes: updated });
                              }}
                              rows={2}
                              placeholder="Lý do chọn / mẹo chiến đấu..."
                              className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 focus:outline-none resize-none leading-relaxed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {block.heroes.length === 0 && (
                      <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                        Chưa có tướng nào được thêm. Bấm &quot;+ Thêm Tướng Đề Xuất&quot; ở trên để chọn tướng từ kho 325 heroes.
                      </div>
                    )}
                  </div>
                )}

                {/* BLOCK 3: THƯ VIỆN ẢNH (GALLERY) */}
                {block.type === 'gallery' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Chọn Layout */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Kiểu hiển thị:</span>
                        {[
                          { id: 'single', label: '1 Ảnh To' },
                          { id: 'grid-2', label: 'Lưới 2 Ảnh' },
                          { id: 'grid-3', label: 'Lưới 3 Ảnh' },
                        ].map((ly) => (
                          <button
                            key={ly.id}
                            type="button"
                            onClick={() => handleUpdateBlock(block.id, { layout: ly.id as any })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              block.layout === ly.id
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {ly.label}
                          </button>
                        ))}
                      </div>

                      {/* Nút thêm ảnh */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetBlockIdForImage(block.id);
                            setIsImageModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span>Duyệt Thư Viện Ảnh</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTargetBlockIdForImage(block.id);
                            fileInputRef.current?.click();
                          }}
                          disabled={uploadingImage}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{uploadingImage ? 'Đang Tải...' : 'Upload Ảnh Trực Tiếp'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Danh sách ảnh trong block */}
                    <div
                      className={`grid gap-4 ${
                        block.layout === 'single'
                          ? 'grid-cols-1'
                          : block.layout === 'grid-3'
                          ? 'grid-cols-1 sm:grid-cols-3'
                          : 'grid-cols-1 sm:grid-cols-2'
                      }`}
                    >
                      {block.images.map((img, iIdx) => (
                        <div
                          key={iIdx}
                          className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative group"
                        >
                          <div className="bg-slate-900 relative p-2 min-h-44 flex items-center justify-center">
                            <img
                              src={img.url}
                              alt={img.caption || 'Guide illustration'}
                              className="w-full h-auto max-h-64 object-contain rounded-lg"
                            />
                            <button
                              onClick={() => {
                                const updated = block.images.filter((_, idx) => idx !== iIdx);
                                handleUpdateBlock(block.id, { images: updated });
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa ảnh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="p-2.5">
                            <input
                              type="text"
                              value={img.caption || ''}
                              onChange={(e) => {
                                const updated = [...block.images];
                                updated[iIdx] = { ...updated[iIdx], caption: e.target.value };
                                handleUpdateBlock(block.id, { images: updated });
                              }}
                              placeholder="Nhập chú thích ảnh minh họa..."
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {block.images.length === 0 && (
                      <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                        Chưa có ảnh nào. Bạn có thể bấm &quot;Upload Ảnh Trực Tiếp&quot; hoặc &quot;Duyệt Thư Viện Ảnh&quot; từ folder <code>public/games/sieu-anh-hung/tai-nguyen-anh</code>.
                      </div>
                    )}
                  </div>
                )}

                {/* BLOCK 4: VẬT PHẨM & TÀI NGUYÊN (RESOURCES) */}
                {block.type === 'resources' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={block.description || ''}
                        onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                        placeholder="Mô tả danh mục phần thưởng..."
                        className="w-full sm:w-2/3 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                      />

                      <button
                        onClick={() => {
                          setTargetBlockIdForResource(block.id);
                          setResourceSearchTerm('');
                          setIsResourceModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm Vật Phẩm / Thưởng</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {block.items.map((item, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                        >
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1 object-contain shrink-0"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white line-clamp-1">{item.name}</span>
                              <button
                                onClick={() => {
                                  const updated = block.items.filter((_, idx) => idx !== rIdx);
                                  handleUpdateBlock(block.id, { items: updated });
                                }}
                                className="text-slate-500 hover:text-red-400"
                                title="Xóa vật phẩm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={item.note || ''}
                              onChange={(e) => {
                                const updated = [...block.items];
                                updated[rIdx] = { ...updated[rIdx], note: e.target.value };
                                handleUpdateBlock(block.id, { items: updated });
                              }}
                              placeholder="Ghi chú: Top 1-10, Last hit..."
                              className="w-full px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {block.items.length === 0 && (
                      <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                        Chưa có vật phẩm nào. Bấm &quot;+ Thêm Vật Phẩm / Thưởng&quot; để chọn từ danh mục tài nguyên đã cào.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Thanh nút thêm Block mới */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs font-bold text-slate-400 mr-2">Thêm khối mới vào bài viết:</span>
              <button
                type="button"
                onClick={() => handleAddBlock('text')}
                className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Khối Văn Bản / Mẹo</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('hero-roster')}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Users className="w-4 h-4" />
                <span>+ Khối Đội Hình Tướng</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('gallery')}
                className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ImageIcon className="w-4 h-4" />
                <span>+ Khối Thư Viện Ảnh</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('resources')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>+ Khối Trang Bị / Thưởng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadFile}
        className="hidden"
      />

      {/* MODAL 1: CHỌN TƯỚNG TỪ KHO */}
      {isHeroModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Chọn Tướng Đưa Vào Bài Viết</span>
              </h3>
              <button
                onClick={() => setIsHeroModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, hệ nguyên tố..."
                  value={heroSearchTerm}
                  onChange={(e) => setHeroSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-1">
              {modalHeroes.slice(0, 48).map((hero) => (
                <button
                  key={hero.slug}
                  onClick={() => {
                    handleAddHeroToBlock(hero);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-amber-500/50 flex items-center gap-2.5 text-left transition-all group"
                >
                  <img
                    src={hero.avatar}
                    alt={hero.name}
                    className="w-10 h-10 rounded-xl border border-slate-700 object-cover shrink-0 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/heroes/icon_heroes/default.png';
                    }}
                  />
                  <div className="truncate">
                    <div className="font-extrabold text-xs text-white group-hover:text-amber-400 truncate">
                      {hero.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{hero.element}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHeroModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỌN VẬT PHẨM TỪ KHO */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Chọn Vật Phẩm & Phần Thưởng</span>
              </h3>
              <button
                onClick={() => setIsResourceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm vật phẩm..."
                  value={resourceSearchTerm}
                  onChange={(e) => setResourceSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-1">
              {modalResources.map((res) => (
                <button
                  key={res.id}
                  onClick={() => {
                    handleAddResourceToBlock(res);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/50 flex items-center gap-2.5 text-left transition-all group"
                >
                  <img
                    src={res.icon}
                    alt={res.name}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1 object-contain shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="truncate">
                    <div className="font-bold text-xs text-white group-hover:text-emerald-400 truncate">
                      {res.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{res.category || 'Vật phẩm'}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsResourceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DUYỆT THƯ VIỆN ẢNH TỪ FOLDER TAI-NGUYEN-ANH */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-blue-400" />
                  <span>Thư Viện Ảnh (public/games/{gameSlug}/tai-nguyen-anh)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chọn ảnh chụp có sẵn hoặc tải ảnh mới trực tiếp vào folder.
                </p>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Tìm thấy <strong className="text-white">{mediaFiles.length}</strong> hình ảnh
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingImage ? 'Đang Tải...' : 'Tải Ảnh Mới Lên'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {loadingMedia ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-500">
                  Đang tải danh sách ảnh...
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-500">
                  Folder chưa có ảnh nào. Bạn có thể bấm &quot;Tải Ảnh Mới Lên&quot; hoặc copy file ảnh vào thư mục:
                  <div className="font-mono text-amber-400 mt-2">
                    public/games/{gameSlug}/tai-nguyen-anh
                  </div>
                </div>
              ) : (
                mediaFiles.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => {
                      if (targetBlockIdForImage) {
                        addImageToBlock(targetBlockIdForImage, f.url);
                        setIsImageModalOpen(false);
                      }
                    }}
                    className="group rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500 overflow-hidden text-left transition-all flex flex-col"
                  >
                    <div className="aspect-square bg-slate-900 w-full overflow-hidden relative p-1.5 flex items-center justify-center">
                      <img
                        src={f.url}
                        alt={f.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] font-bold text-slate-300 truncate group-hover:text-blue-400">
                        {f.name}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {(f.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: THÊM / CHỈNH SỬA HOẠT ĐỘNG (ACTIVITY MODAL) */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <span>
                  {editingActivityIndex !== null ? 'Chỉnh Sửa Hoạt Động' : 'Thêm Hoạt Động Mới'}
                </span>
              </h3>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Tên Hoạt Động *</label>
                <input
                  type="text"
                  value={activityForm.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug =
                      editingActivityIndex === null
                        ? name
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[đĐ]/g, 'd')
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '')
                        : activityForm.slug;
                    setActivityForm({ ...activityForm, name, slug: autoSlug });
                  }}
                  placeholder="VD: Leo Tháp Thí Luyện"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Slug (Đường Dẫn URL) *</label>
                  <input
                    type="text"
                    value={activityForm.slug || ''}
                    onChange={(e) => setActivityForm({ ...activityForm, slug: e.target.value })}
                    placeholder="VD: leo-thap"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Badge Nhãn (Tùy chọn)</label>
                  <input
                    type="text"
                    value={activityForm.badge || ''}
                    onChange={(e) => setActivityForm({ ...activityForm, badge: e.target.value })}
                    placeholder="VD: Hot, Mỗi Ngày, PvP"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Mô Tả Ngắn Tóm Tắt</label>
                <input
                  type="text"
                  value={activityForm.shortDesc || ''}
                  onChange={(e) => setActivityForm({ ...activityForm, shortDesc: e.target.value })}
                  placeholder="VD: Thí luyện vượt 100 tầng nhận rương thần thoại"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Chọn Icon */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Biểu Tượng Icon</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[
                    { id: 'Swords', label: 'Swords', icon: <Swords className="w-4 h-4 text-red-400" /> },
                    { id: 'Flame', label: 'Flame', icon: <Flame className="w-4 h-4 text-amber-400" /> },
                    { id: 'Trophy', label: 'Trophy', icon: <Trophy className="w-4 h-4 text-blue-400" /> },
                    { id: 'Sparkles', label: 'Sparkles', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
                    { id: 'Shield', label: 'Shield', icon: <Shield className="w-4 h-4 text-emerald-400" /> },
                    { id: 'Crown', label: 'Crown', icon: <Crown className="w-4 h-4 text-yellow-400" /> },
                    { id: 'Target', label: 'Target', icon: <Target className="w-4 h-4 text-rose-400" /> },
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setActivityForm({ ...activityForm, icon: ic.id })}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        activityForm.icon === ic.id
                          ? 'bg-blue-500/20 border-blue-500 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ic.icon}
                      <span className="text-[9px]">{ic.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn Màu Sắc */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Tông Màu Chủ Đạo</label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'red', label: 'Đỏ', bg: 'bg-red-500' },
                    { id: 'amber', label: 'Vàng Cam', bg: 'bg-amber-500' },
                    { id: 'blue', label: 'Xanh Lam', bg: 'bg-blue-500' },
                    { id: 'purple', label: 'Tím', bg: 'bg-purple-500' },
                    { id: 'emerald', label: 'Xanh Lá', bg: 'bg-emerald-500' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActivityForm({ ...activityForm, color: c.id })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        activityForm.color === c.id
                          ? 'border-white text-white bg-slate-800'
                          : 'border-slate-800 text-slate-400 hover:text-white bg-slate-950'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`}></span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox Trạng Thái */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actEnabled"
                  checked={activityForm.enabled !== false}
                  onChange={(e) => setActivityForm({ ...activityForm, enabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0"
                />
                <label htmlFor="actEnabled" className="text-xs font-bold text-slate-300 cursor-pointer">
                  Kích hoạt và hiển thị trên Menu Dropdown / Hub Website
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitActivityForm}
                className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-black shadow-lg"
              >
                {editingActivityIndex !== null ? 'Cập Nhật' : 'Tạo Hoạt Động'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
