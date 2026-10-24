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
  RotateCw,
  Table as TableIcon,
  Link2,
  Tag,
  ArrowUpRight,
  Eye,
  Route,
  ChevronRight,
} from 'lucide-react';
import { RichTextWithTags } from '../guide/RichTextWithTags';
import { LayeredIcon, PRESET_LAYERS, normalizeLayerPath } from '../guide/LayeredIcon';
import {
  Hero,
  ResourceItem,
  GuideArticle,
  GuideBlock,
  GuideTextBlock,
  GuideHeroRosterBlock,
  GuideGalleryBlock,
  GuideResourcesBlock,
  GuideTableBlock,
  GuideTableColumn,
  GuideTableRow,
  GuideTableCell,
  GuideTableCellResource,
  GuideTableCellHero,
  GuideHeroItem,
  GuideResourceItem,
  GuideImageItem,
  GameActivity,
  GuideHeroSourceBlock,
  GuideHeroSourceItem,
  ResourceSource,
  GuideResourceCardBlock,
  GuideResourceCardItem,
  GuideResourceCardSourceRef,
  GuideStepFlowBlock,
  GuideStepFlowItem,
} from '@/types/game';

interface Props {
  initialGuides: GuideArticle[];
  initialActivities?: GameActivity[];
  allHeroes: Hero[];
  allResources: ResourceItem[];
  initialSources?: ResourceSource[];
  gameSlug: string;
}

export const AdminGuideEditor: React.FC<Props> = ({
  initialGuides,
  initialActivities = [],
  allHeroes,
  allResources,
  initialSources = [],
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

  // --- AUTO-SAVE SYSTEM (TỰ ĐỘNG LƯU BÀI VIẾT LIÊN TỤC) ---
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle');
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeGuideRef = useRef<GuideArticle | null>(activeGuide);
  const previousSlugRef = useRef<string | null>(null);
  const isRestoringDraftRef = useRef<boolean>(false);
  const DRAFT_KEY = useMemo(() => `admin_guide_draft_${gameSlug}`, [gameSlug]);

  // Modal State: Hero Picker
  const [heroesList, setHeroesList] = useState<Hero[]>(allHeroes);
  const [loadingHeroes, setLoadingHeroes] = useState(false);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [targetBlockIdForHero, setTargetBlockIdForHero] = useState<string | null>(null);
  const [heroSearchTerm, setHeroSearchTerm] = useState('');
  const [heroCategoryFilter, setHeroCategoryFilter] = useState<'all' | 'tier-sp' | 'SSR' | 'UR' | 'afterlife' | 'base'>('all');

  // Universal Tag Picker Modal (Hỗ trợ chèn link cho MỌI khối văn bản & trường nhập liệu)
  const [tagPickerModal, setTagPickerModal] = useState<{
    isOpen: boolean;
    title?: string;
    onSelect: (tagText: string) => void;
  } | null>(null);
  const [tagModalSearch, setTagModalSearch] = useState('');
  const [tagModalTab, setTagModalTab] = useState<'activities' | 'heroes' | 'resources'>('activities');

  const openTagPicker = (
    onSelect: (tagText: string) => void,
    title = 'Chèn liên kết nội dung',
    initialTab: 'activities' | 'heroes' | 'resources' = 'activities'
  ) => {
    setTagModalSearch('');
    setTagModalTab(initialTab);
    setTagPickerModal({ isOpen: true, title, onSelect });
  };

  const appendTag = (currentText: string | undefined, tag: string) => {
    const cur = currentText || '';
    const spacer = cur && !cur.endsWith(' ') && !cur.endsWith('\n') ? ' ' : '';
    return cur + spacer + tag + ' ';
  };

  const TagInsertButton: React.FC<{
    onInsert: (tag: string) => void;
    title?: string;
    size?: 'sm' | 'xs';
    showLabel?: boolean;
    className?: string;
  }> = ({ onInsert, title, size = 'sm', showLabel = true, className = '' }) => (
    <button
      type="button"
      onClick={() => openTagPicker(onInsert, title)}
      className={`inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition-all font-semibold shrink-0 ${
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      } ${className}`}
      title="Chèn liên kết (Hoạt động / Tướng / Tài nguyên)"
    >
      <Link2 className={size === 'xs' ? 'w-3 h-3 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />
      {showLabel && <span>Chèn Link</span>}
    </button>
  );

  // Modal State: Resource Picker
  const [resourcesList, setResourcesList] = useState<ResourceItem[]>(allResources);
  const [loadingResources, setLoadingResources] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [targetBlockIdForResource, setTargetBlockIdForResource] = useState<string | null>(null);
  const [targetTableCellForResource, setTargetTableCellForResource] = useState<{
    blockId: string;
    rowId: string;
    columnId: string;
    itemIndex?: number;
  } | null>(null);
  const [targetTableCellForHero, setTargetTableCellForHero] = useState<{
    blockId: string;
    rowId: string;
    columnId: string;
    itemIndex?: number;
  } | null>(null);
  const [resourceSearchTerm, setResourceSearchTerm] = useState('');
  const [resourceModalTab, setResourceModalTab] = useState<'game-assets' | 'heroes' | 'configured-resources'>('game-assets');
  const [assetPickerFolder, setAssetPickerFolder] = useState('all');
  const [assetPickerPage, setAssetPickerPage] = useState(1);
  const [assetPickerTotal, setAssetPickerTotal] = useState(0);
  const [assetPickerIcons, setAssetPickerIcons] = useState<{
    name: string;
    url: string;
    folder: string;
    folderLabel: string;
  }[]>([]);
  const [assetCategoriesList, setAssetCategoriesList] = useState<{
    id: string;
    label: string;
    count: number;
  }[]>([]);
  const [isLoadingAssetIcons, setIsLoadingAssetIcons] = useState(false);

  // Modal State: Image Gallery Picker & Upload
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [targetBlockIdForImage, setTargetBlockIdForImage] = useState<string | null>(null);
  const [mediaPickerMode, setMediaPickerMode] = useState<'block' | 'guide-thumbnail' | 'activity-banner' | 'resource-upload'>('block');
  const [mediaFiles, setMediaFiles] = useState<{ name: string; url: string; size: number }[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State: Thẻ Chi Tiết 3 Cột (Vật phẩm & Tướng) + Nguồn Nhận
  const [sourcesList, setSourcesList] = useState<ResourceSource[]>(initialSources);
  const [loadingSources, setLoadingSources] = useState(false);
  const [isSyncingSources, setIsSyncingSources] = useState(false);
  const [targetCardModalForResource, setTargetCardModalForResource] = useState(false);
  const [targetCardModalForHero, setTargetCardModalForHero] = useState(false);
  const [editingCardModal, setEditingCardModal] = useState<{
    blockId: string;
    cardIndex: number | null; // null là thêm mới
    data: GuideResourceCardItem;
  } | null>(null);
  const [cardHeroSearch, setCardHeroSearch] = useState('');
  const [cardHeroCategoryFilter, setCardHeroCategoryFilter] = useState<'all' | 'tier-sp' | 'SSR' | 'UR' | 'afterlife' | 'base'>('all');
  const [isCardHeroPickerOpen, setIsCardHeroPickerOpen] = useState(false);

  // State cho bộ chọn Icon Hoạt Động (images/resources/sources)
  const [sourceImagesList, setSourceImagesList] = useState<string[]>([]);
  const [loadingSourceImages, setLoadingSourceImages] = useState(false);
  const [sourceIconSearch, setSourceIconSearch] = useState('');
  const [activityIconTab, setActivityIconTab] = useState<'source-images' | 'vector'>('source-images');
  const [uploadingSourceIcon, setUploadingSourceIcon] = useState(false);
  const sourceIconFileInputRef = useRef<HTMLInputElement>(null);

  // Layer Management State
  const [autoAttachShardLayer, setAutoAttachShardLayer] = useState(false);
  const [layerModal, setLayerModal] = useState<{
    isOpen: boolean;
    title: string;
    baseIcon: string;
    layers: string[];
    onSave: (newLayers: string[]) => void;
  } | null>(null);

  // Step Flow Picker State
  const [targetBlockIdForStepFlow, setTargetBlockIdForStepFlow] = useState<string | null>(null);
  const [isStepFlowPickerOpen, setIsStepFlowPickerOpen] = useState(false);
  const [stepFlowSearchTerm, setStepFlowSearchTerm] = useState('');

  const filteredSourceImages = useMemo(() => {
    if (!sourceIconSearch.trim()) return sourceImagesList;
    const q = sourceIconSearch.toLowerCase().trim();
    return sourceImagesList.filter((img) => img.toLowerCase().includes(q));
  }, [sourceImagesList, sourceIconSearch]);

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

  // Tải lại danh sách vật phẩm mới nhất từ hệ thống (Zero Hard-Reload)
  const handleReloadResources = async () => {
    setLoadingResources(true);
    try {
      const res = await fetch(`/api/admin/resources?gameSlug=${gameSlug}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.resources)) {
        setResourcesList(data.resources);
        showToast(`Đã tải lại: ${data.resources.length} vật phẩm mới nhất!`, 'success');
      } else {
        showToast(data.error || 'Lỗi khi tải lại danh sách vật phẩm', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ khi tải lại vật phẩm', 'error');
    } finally {
      setLoadingResources(false);
    }
  };

  // Tải lại kho tướng mới nhất từ hệ thống (Zero Hard-Reload)
  const handleReloadHeroes = async () => {
    setLoadingHeroes(true);
    try {
      const res = await fetch(`/api/admin/heroes?gameSlug=${gameSlug}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.heroes)) {
        setHeroesList(data.heroes);
        showToast(`Đã tải lại: ${data.heroes.length} tướng mới nhất!`, 'success');
      } else {
        showToast(data.error || 'Lỗi khi tải lại kho tướng', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ khi tải lại kho tướng', 'error');
    } finally {
      setLoadingHeroes(false);
    }
  };

  // Tải danh sách nguồn nhận sự kiện (Cột 3) và ảnh từ images/resources/sources
  const fetchSourcesData = async () => {
    setLoadingSources(true);
    try {
      const res = await fetch(`/api/admin/resource-sources?gameSlug=${gameSlug}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.sources)) {
          setSourcesList(data.sources);
        }
        if (Array.isArray(data.availableSourceImages)) {
          setSourceImagesList(data.availableSourceImages);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingSources(false);
    }
  };

  // Tải lại toàn bộ icon từ images/resources/sources (Quy chuẩn Asset Live-Reload Rule)
  const handleReloadSourceImages = async (showToastFeedback = false) => {
    setLoadingSourceImages(true);
    try {
      const res = await fetch(`/api/admin/resource-sources?gameSlug=${gameSlug}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.availableSourceImages)) {
        setSourceImagesList(data.availableSourceImages);
        if (Array.isArray(data.sources)) {
          setSourcesList(data.sources);
        }
        if (showToastFeedback) {
          showToast(`Đã tải lại: ${data.availableSourceImages.length} icon từ images/resources/sources!`, 'success');
        }
      } else {
        if (showToastFeedback) {
          showToast(data.error || 'Lỗi khi tải lại danh sách icon', 'error');
        }
      }
    } catch {
      if (showToastFeedback) {
        showToast('Lỗi máy chủ khi tải lại icon nguồn', 'error');
      }
    } finally {
      setLoadingSourceImages(false);
    }
  };

  // Tải lên ảnh mới trực tiếp vào images/resources/sources
  const handleUploadSourceIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSourceIcon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gameSlug', gameSlug);

      const res = await fetch('/api/admin/resource-sources', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        showToast(`Đã tải ảnh ${data.fileName} vào images/resources/sources!`, 'success');
        await handleReloadSourceImages(false);
        setActivityForm((prev) => ({ ...prev, icon: data.url }));
      } else {
        showToast(data.error || 'Lỗi khi tải lên icon', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ khi tải lên icon', 'error');
    } finally {
      setUploadingSourceIcon(false);
      if (sourceIconFileInputRef.current) {
        sourceIconFileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (sourcesList.length === 0 || sourceImagesList.length === 0) {
      fetchSourcesData();
    }
  }, [gameSlug]);

  // Đồng bộ nhanh icon sự kiện từ thư mục public/images/resources/sources
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
        setSourcesList(data.sources);
        showToast(data.message || 'Đã đồng bộ ảnh sự kiện mới!', 'success');
      } else {
        showToast(data.error || 'Đồng bộ thất bại', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSyncingSources(false);
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

        // Tự động gán ảnh vừa upload theo chế độ chọn
        if (mediaPickerMode === 'block' && targetBlockIdForImage && activeGuide) {
          addImageToBlock(targetBlockIdForImage, data.file.url);
        } else if (mediaPickerMode === 'guide-thumbnail' && activeGuide) {
          setActiveGuide({ ...activeGuide, thumbnail: data.file.url });
          setIsImageModalOpen(false);
          showToast('Đã đặt ảnh đại diện bài viết thành công!', 'success');
        } else if (mediaPickerMode === 'activity-banner') {
          setActivityForm((prev) => ({ ...prev, banner: data.file.url }));
          setIsImageModalOpen(false);
          showToast('Đã đặt banner hoạt động thành công!', 'success');
        } else if (mediaPickerMode === 'resource-upload' && (targetBlockIdForResource || targetTableCellForResource) && activeGuide) {
          const cleanName = data.file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[_\-]/g, ' ')
            .replace(/\b\w/g, (l: string) => l.toUpperCase());
          handleAddResourceToBlock({
            id: `item-${Date.now()}`,
            name: cleanName,
            icon: data.file.url,
            note: 'Tài nguyên mới tải lên',
          });
          setIsResourceModalOpen(false);
          showToast(`Đã thêm vật phẩm vừa tải lên: ${cleanName}`, 'success');
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

  // Tải danh sách icon asset từ kho game (toàn bộ các folder)
  const fetchAssetIcons = async (query: string, folderId: string, page = 1, refresh = false) => {
    setIsLoadingAssetIcons(true);
    try {
      const params = new URLSearchParams({
        gameSlug,
        search: query,
        folder: folderId || 'all',
        page: page.toString(),
        limit: '120',
      });
      if (refresh) {
        params.set('refresh', 'true');
      }
      const res = await fetch(`/api/admin/resource-icons?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.icons) {
        setAssetPickerIcons(data.icons);
        setAssetPickerTotal(data.total || 0);
      }
      if (data.categories) {
        setAssetCategoriesList(data.categories);
      }
      if (refresh) {
        showToast('Đã làm mới toàn bộ kho asset icon game!', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi tải kho icon game', 'error');
    } finally {
      setIsLoadingAssetIcons(false);
    }
  };

  useEffect(() => {
    if (isResourceModalOpen && resourceModalTab === 'game-assets') {
      const timer = setTimeout(() => {
        fetchAssetIcons(resourceSearchTerm, assetPickerFolder, assetPickerPage);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isResourceModalOpen, resourceModalTab, resourceSearchTerm, assetPickerFolder, assetPickerPage, gameSlug]);

  const handleAddAssetIconToBlock = (iconItem: { name: string; url: string; folderLabel: string }) => {
    const cleanName = iconItem.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_\-]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const itemObj: GuideResourceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      icon: iconItem.url,
      note: iconItem.folderLabel || 'Phần thưởng',
      layers: autoAttachShardLayer ? ['game_items/public_shade_2.png'] : undefined,
    };

    handleAddResourceToBlock(itemObj);
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

  // --- HỆ THỐNG TỰ ĐỘNG LƯU BÀI VIẾT (AUTO-SAVE) ---
  // Khôi phục bản nháp dở dang từ LocalStorage khi khởi tạo
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(DRAFT_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed?.guide && !activeGuide) {
          isRestoringDraftRef.current = true;
          setActiveGuide(parsed.guide);
          setIsCreatingNew(Boolean(parsed.isCreatingNew));
          previousSlugRef.current = parsed.guide.slug;
          setAutoSaveStatus('saved');
          if (parsed.savedAt) {
            setLastAutoSavedTime(new Date(parsed.savedAt));
          }
          showToast('Đã tự động khôi phục nội dung bài viết đang soạn thảo!', 'success');
          setTimeout(() => {
            isRestoringDraftRef.current = false;
          }, 600);
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc draft:', e);
    }
  }, [DRAFT_KEY]);

  // Luôn cập nhật ref của activeGuide
  useEffect(() => {
    activeGuideRef.current = activeGuide;
  }, [activeGuide]);

  // Hàm thực hiện lưu bài viết lên server (Dùng cho cả Auto-Save và Lưu thủ công)
  const performServerSave = async (guideToSave: GuideArticle, isAuto = false): Promise<boolean> => {
    if (!guideToSave) return false;
    if (!isAuto) setSaving(true);
    setAutoSaveStatus('saving');

    try {
      const res = await fetch('/api/admin/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug,
          article: guideToSave,
          previousSlug: previousSlugRef.current || undefined,
        }),
      });
      const data = await res.json();

      if (data.success && data.article) {
        const savedTime = new Date();
        setAutoSaveStatus('saved');
        setLastAutoSavedTime(savedTime);
        previousSlugRef.current = data.article.slug;

        // Lưu bản mới nhất vào localStorage
        try {
          localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
              guide: data.article,
              isCreatingNew: false,
              savedAt: savedTime.getTime(),
            })
          );
        } catch {}

        // Cập nhật danh sách bài viết hiển thị
        setGuides((prev) => {
          const index = prev.findIndex((g) => g.slug === data.article.slug || g.id === data.article.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = data.article;
            return next;
          }
          return [data.article, ...prev];
        });

        if (!isAuto) {
          showToast('Đã lưu bài viết thành công!', 'success');
          setIsCreatingNew(false);
        }
        return true;
      } else {
        setAutoSaveStatus('error');
        if (!isAuto) {
          showToast(data.error || 'Lỗi khi lưu bài viết', 'error');
        }
        return false;
      }
    } catch (e) {
      console.error('Lỗi khi lưu bài viết:', e);
      setAutoSaveStatus('error');
      if (!isAuto) {
        showToast('Lỗi máy chủ khi lưu bài viết', 'error');
      }
      return false;
    } finally {
      if (!isAuto) setSaving(false);
    }
  };

  // Continuous Auto-Save: Lưu tức thì vào LocalStorage và Debounce 1.2s gửi Server
  useEffect(() => {
    if (!activeGuide) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      return;
    }

    if (isRestoringDraftRef.current) {
      return;
    }

    // 1. Lưu tức thì vào LocalStorage (Bảo vệ 100% dữ liệu trước F5, reload, crash)
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          guide: activeGuide,
          isCreatingNew,
          savedAt: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Lỗi lưu localStorage:', e);
    }

    // 2. Đánh dấu trạng thái đang chỉnh sửa
    setAutoSaveStatus('unsaved');

    // 3. Debounce 1.2s tự động đẩy lên Server
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performServerSave(activeGuide, true);
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [activeGuide, isCreatingNew, DRAFT_KEY]);

  // Bảo vệ khi người dùng đóng tab / F5 trình duyệt
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeGuideRef.current) {
        try {
          localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
              guide: activeGuideRef.current,
              isCreatingNew,
              savedAt: Date.now(),
            })
          );
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCreatingNew, DRAFT_KEY]);

  // Tạo bài viết mới (Flush bài cũ nếu có, khởi tạo và lưu ngay)
  const handleStartCreate = async () => {
    if (activeGuide && autoSaveStatus === 'unsaved') {
      await performServerSave(activeGuide, true);
    }
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
    previousSlugRef.current = newGuide.slug;
    setActiveGuide(newGuide);
    setIsCreatingNew(true);
    // Tự động lưu khởi tạo ngay lập tức
    await performServerSave(newGuide, true);
  };

  // Chọn bài để sửa (Flush bài cũ nếu có)
  const handleSelectGuide = async (guide: GuideArticle) => {
    if (activeGuide && autoSaveStatus === 'unsaved') {
      await performServerSave(activeGuide, true);
    }
    const cloned = JSON.parse(JSON.stringify(guide));
    previousSlugRef.current = cloned.slug;
    setActiveGuide(cloned);
    setIsCreatingNew(false);
    setAutoSaveStatus('saved');
    setLastAutoSavedTime(new Date(cloned.updatedAt || Date.now()));
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          guide: cloned,
          isCreatingNew: false,
          savedAt: Date.now(),
        })
      );
    } catch {}
  };

  // Quay lại danh sách bài viết (Tự động flush lưu trước khi thoát)
  const handleBackToList = async () => {
    if (activeGuide) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      await performServerSave(activeGuide, true);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
    }
    setActiveGuide(null);
    setAutoSaveStatus('idle');
  };

  // Lưu bài viết thủ công (nút phụ trợ ép lưu ngay)
  const handleSaveGuide = async () => {
    if (!activeGuide) return;
    await performServerSave(activeGuide, false);
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
          try {
            localStorage.removeItem(DRAFT_KEY);
          } catch {}
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
      icon: '/images/resources/sources/hoat-dong.png',
      badge: 'Mới',
      color: 'amber',
      banner: '',
      enabled: true,
      order: activities.length + 1,
    });
    setActivityIconTab('source-images');
    setSourceIconSearch('');
    setIsActivityModalOpen(true);
    if (sourceImagesList.length === 0) {
      handleReloadSourceImages(false);
    }
  };

  const handleOpenEditActivity = (act: GameActivity, index: number) => {
    setEditingActivityIndex(index);
    setActivityForm({ ...act, banner: act.banner || '' });
    if (act.icon?.startsWith('/') || act.icon?.startsWith('http')) {
      setActivityIconTab('source-images');
    } else {
      setActivityIconTab('vector');
    }
    setSourceIconSearch('');
    setIsActivityModalOpen(true);
    if (sourceImagesList.length === 0) {
      handleReloadSourceImages(false);
    }
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
      banner: activityForm.banner?.trim() || '',
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

  // Trích xuất tự động ảnh thumbnail từ block Gallery
  const handleExtractThumbnailFromGallery = () => {
    if (!activeGuide) return;
    for (const b of activeGuide.blocks) {
      if (b.type === 'gallery' && b.images && b.images.length > 0) {
        setActiveGuide({ ...activeGuide, thumbnail: b.images[0].url });
        showToast('Đã lấy ảnh đầu tiên trong Album Gallery làm ảnh đại diện!', 'success');
        return;
      }
    }
    showToast('Chưa có khối ảnh Gallery nào có ảnh trong bài viết để lấy', 'error');
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
    } else if (type === 'hero-source') {
      newBlock = {
        id: blockId,
        type: 'hero-source',
        title: 'Nguồn Tướng Nhận Được',
        description: 'Danh sách các tướng có thể thu thập hoặc đổi thưởng từ hoạt động này',
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
    } else if (type === 'table') {
      newBlock = {
        id: blockId,
        type: 'table',
        title: 'Bảng Phần Thưởng & Mốc Nạp',
        description: 'Chi tiết các mốc tham gia và phần thưởng tương ứng',
        columns: [
          { id: 'col-1', label: 'Mốc Nạp', type: 'text' },
          { id: 'col-2', label: 'Vật Phẩm Thưởng', type: 'resource' },
        ],
        rows: [
          {
            id: `row-${Date.now()}-1`,
            cells: {
              'col-1': { text: 'Mốc 1: 50.000 VNĐ' },
              'col-2': {
                resources: [
                  {
                    name: 'Ngọc Lục Bảo',
                    icon: '/games/sieu-anh-hung/tai-nguyen-anh/soft_glow_gem.png',
                    quantity: 'x20',
                  },
                  {
                    name: 'Kim Cương',
                    icon: '/games/sieu-anh-hung/tai-nguyen-anh/cuong_hoa_thach.png',
                    quantity: 'x500',
                  },
                ],
              },
            },
          },
        ],
      };
    } else if (type === 'resource-card') {
      newBlock = {
        id: blockId,
        type: 'resource-card',
        title: 'Chi Tiết Vật Phẩm & Tướng Nhận Được',
        description: 'Công dụng chi tiết và danh sách các sự kiện / cách nhận',
        cards: [],
      };
    } else if (type === 'step-flow') {
      newBlock = {
        id: blockId,
        type: 'step-flow',
        title: 'Cách Ghép Đá Vận Mệnh',
        description: 'Quy trình thao tác từng bước để đến tính năng',
        steps: [],
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

  // --- QUẢN LÝ THẺ TRONG KHỐI THẺ CHI TIẾT 3 CỘT (RESOURCE-CARD) ---
  const handleOpenAddCard = (blockId: string) => {
    setEditingCardModal({
      blockId,
      cardIndex: null,
      data: {
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemType: 'item',
        name: '',
        icon: '',
        heroSlug: '',
        rarity: '',
        description: [''],
        sources: [],
      },
    });
    setCardHeroSearch('');
    setIsCardHeroPickerOpen(false);
  };

  const handleOpenEditCard = (blockId: string, cardIndex: number, card: GuideResourceCardItem) => {
    setEditingCardModal({
      blockId,
      cardIndex,
      data: {
        ...card,
        description: card.description && card.description.length > 0 ? [...card.description] : [''],
        sources: card.sources ? [...card.sources] : [],
      },
    });
    setCardHeroSearch('');
    setIsCardHeroPickerOpen(false);
  };

  const handleSaveCardModal = () => {
    if (!editingCardModal || !activeGuide) return;
    const { blockId, cardIndex, data } = editingCardModal;
    if (!data.name.trim()) {
      showToast('Vui lòng nhập tên thẻ (Tên vật phẩm hoặc tướng)', 'error');
      return;
    }
    if (!data.icon.trim()) {
      showToast('Vui lòng chọn hoặc nhập Icon / Avatar cho thẻ', 'error');
      return;
    }

    const cleanCard: GuideResourceCardItem = {
      ...data,
      name: data.name.trim(),
      description: data.description.filter((d) => d.trim() !== ''),
    };
    if (cleanCard.description.length === 0) {
      cleanCard.description = ['Chưa có mô tả công dụng'];
    }

    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideResourceCardBlock;
    if (!block || block.type !== 'resource-card') return;

    let nextCards: GuideResourceCardItem[];
    if (cardIndex === null) {
      nextCards = [...(block.cards || []), cleanCard];
      showToast(`Đã thêm thẻ ${cleanCard.name}`, 'success');
    } else {
      nextCards = [...block.cards];
      nextCards[cardIndex] = cleanCard;
      showToast(`Đã cập nhật thẻ ${cleanCard.name}`, 'success');
    }

    handleUpdateBlock(blockId, { cards: nextCards });
    setEditingCardModal(null);
  };

  const handleDeleteCard = (blockId: string, cardIndex: number) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideResourceCardBlock;
    if (!block || block.type !== 'resource-card') return;

    const nextCards = block.cards.filter((_, idx) => idx !== cardIndex);
    handleUpdateBlock(blockId, { cards: nextCards });
    showToast('Đã xóa thẻ khỏi khối', 'success');
  };

  const handleMoveCard = (blockId: string, cardIndex: number, direction: 'up' | 'down') => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideResourceCardBlock;
    if (!block || block.type !== 'resource-card') return;

    const nextCards = [...block.cards];
    const targetIdx = direction === 'up' ? cardIndex - 1 : cardIndex + 1;
    if (targetIdx < 0 || targetIdx >= nextCards.length) return;

    const temp = nextCards[cardIndex];
    nextCards[cardIndex] = nextCards[targetIdx];
    nextCards[targetIdx] = temp;

    handleUpdateBlock(blockId, { cards: nextCards });
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

  // Helper: Lấy danh sách tướng trong ô của bảng
  const getCellHeroes = (cell?: GuideTableCell): GuideTableCellHero[] => {
    if (!cell) return [];
    if (Array.isArray(cell.heroes) && cell.heroes.length > 0) return cell.heroes;
    if (cell.hero && (cell.hero.name || cell.hero.avatar)) return [cell.hero];
    return [];
  };

  // Thêm hoặc gỡ tướng khỏi block (Toggle hoặc gán cho thẻ)
  const handleAddHeroToBlock = (hero: Hero) => {
    // Nếu đang chọn tướng cho một ô trong Bảng Biểu (Table)
    const targetCellForHero = targetTableCellForHero || targetTableCellForResource;
    if (targetCellForHero) {
      const { blockId, rowId, columnId, itemIndex } = targetCellForHero;
      const block = activeGuide?.blocks.find((b) => b.id === blockId) as GuideTableBlock;
      if (block && block.type === 'table') {
        const nextRows = block.rows.map((row) => {
          if (row.id !== rowId) return row;
          const currentCell = row.cells[columnId] || {};
          const currentList = getCellResources(currentCell);

          let nextList: GuideTableCellResource[];
          if (itemIndex !== undefined && itemIndex >= 0 && itemIndex < currentList.length) {
            nextList = [...currentList];
            nextList[itemIndex] = {
              ...nextList[itemIndex],
              name: hero.name,
              icon: hero.avatar,
              heroSlug: hero.slug,
              rarity: hero.rarity,
              element: hero.element,
              itemType: 'hero',
              layers: autoAttachShardLayer ? ['game_items/public_shade_2.png'] : nextList[itemIndex].layers,
            };
          } else {
            nextList = [
              ...currentList,
              {
                name: hero.name,
                icon: hero.avatar,
                quantity: '',
                heroSlug: hero.slug,
                rarity: hero.rarity,
                element: hero.element,
                itemType: 'hero',
                layers: autoAttachShardLayer ? ['game_items/public_shade_2.png'] : undefined,
              },
            ];
          }

          return {
            ...row,
            cells: {
              ...row.cells,
              [columnId]: {
                ...currentCell,
                resources: nextList,
                resource: nextList[0] || undefined,
              },
            },
          };
        });
        handleUpdateBlock(blockId, { rows: nextRows });
        showToast(`Đã thêm tướng ${hero.name} vào ô`, 'success');
        setIsHeroModalOpen(false);
        setIsResourceModalOpen(false);
        setTargetTableCellForHero(null);
        setTargetTableCellForResource(null);
        return;
      }
    }

    // Nếu đang chọn tướng cho thẻ chi tiết 3 cột (editingCardModal)
    if (targetCardModalForHero && editingCardModal) {
      setEditingCardModal({
        ...editingCardModal,
        data: {
          ...editingCardModal.data,
          name: hero.name,
          icon: hero.avatar,
          heroSlug: hero.slug,
          rarity: hero.rarity || 'SSR',
          itemType: 'hero',
          layers: autoAttachShardLayer ? ['game_items/public_shade_2.png'] : editingCardModal.data.layers,
        },
      });
      setIsHeroModalOpen(false);
      setTargetCardModalForHero(false);
      showToast(`Đã chọn tướng ${hero.name}`, 'success');
      return;
    }

    if (!activeGuide || !targetBlockIdForHero) return;
    const block = activeGuide.blocks.find((b) => b.id === targetBlockIdForHero);
    if (!block) return;

    if (block.type === 'hero-roster') {
      const rosterBlock = block as GuideHeroRosterBlock;
      // Nếu đã có -> gỡ bỏ
      if (rosterBlock.heroes.some((h) => h.heroSlug === hero.slug)) {
        const updated = rosterBlock.heroes.filter((h) => h.heroSlug !== hero.slug);
        handleUpdateBlock(targetBlockIdForHero, { heroes: updated });
        showToast(`Đã gỡ tướng ${hero.name}`, 'success');
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
        layers: autoAttachShardLayer ? ['game_items/public_shade_2.png'] : undefined,
      };

      handleUpdateBlock(targetBlockIdForHero, {
        heroes: [...rosterBlock.heroes, newHeroItem],
      });
      showToast(`Đã thêm tướng ${hero.name}`, 'success');
    } else if (block.type === 'hero-source') {
      const sourceBlock = block as GuideHeroSourceBlock;
      // Nếu đã có -> gỡ bỏ
      if (sourceBlock.heroes.some((h) => h.heroSlug === hero.slug)) {
        const updated = sourceBlock.heroes.filter((h) => h.heroSlug !== hero.slug);
        handleUpdateBlock(targetBlockIdForHero, { heroes: updated });
        showToast(`Đã gỡ tướng ${hero.name}`, 'success');
        return;
      }

      const newSourceHeroItem: GuideHeroSourceItem = {
        heroSlug: hero.slug,
        name: hero.name,
        avatar: hero.avatar,
        element: hero.element,
        rarity: hero.rarity,
        role: hero.role || 'Sát Thương',
        sourceNote: 'Đổi xu hoạt động / Mở rương sự kiện...',
        layers: autoAttachShardLayer ? ['game_items/public_shade_2.png'] : undefined,
      };

      handleUpdateBlock(targetBlockIdForHero, {
        heroes: [...sourceBlock.heroes, newSourceHeroItem],
      });
      showToast(`Đã thêm nguồn tướng ${hero.name}`, 'success');
    }
  };

  // Helper: Lấy danh sách tài nguyên & tướng trong ô của bảng (Gộp chung)
  const getCellResources = (cell?: GuideTableCell): GuideTableCellResource[] => {
    if (!cell) return [];
    const list: GuideTableCellResource[] = [];
    if (Array.isArray(cell.resources) && cell.resources.length > 0) {
      list.push(...cell.resources);
    } else if (cell.resource && (cell.resource.name || cell.resource.icon)) {
      list.push(cell.resource);
    }
    // Gộp dữ liệu tướng từ các bài viết cũ vào chung danh sách
    if (Array.isArray(cell.heroes) && cell.heroes.length > 0) {
      list.push(
        ...cell.heroes.map((h) => ({
          name: h.name,
          icon: h.avatar,
          quantity: h.note,
          heroSlug: h.heroSlug,
          rarity: h.rarity,
          element: h.element,
          itemType: 'hero' as const,
          layers: h.layers,
        }))
      );
    } else if (cell.hero && (cell.hero.name || cell.hero.avatar)) {
      list.push({
        name: cell.hero.name,
        icon: cell.hero.avatar,
        quantity: cell.hero.note,
        heroSlug: cell.hero.heroSlug,
        rarity: cell.hero.rarity,
        element: cell.hero.element,
        itemType: 'hero' as const,
        layers: cell.hero.layers,
      });
    }
    return list;
  };

  // Thêm resource vào block (hoặc cập nhật ô trong Table hoặc Thẻ Chi Tiết)
  const handleAddResourceToBlock = (resItem: { id: string; name: string; icon: string; note?: string; layers?: string[] }) => {
    // Nếu đang chọn icon cho thẻ chi tiết 3 cột (editingCardModal)
    if (targetCardModalForResource && editingCardModal) {
      setEditingCardModal({
        ...editingCardModal,
        data: {
          ...editingCardModal.data,
          name: editingCardModal.data.name || resItem.name,
          icon: resItem.icon,
          layers: resItem.layers ?? (autoAttachShardLayer ? ['game_items/public_shade_2.png'] : editingCardModal.data.layers),
        },
      });
      setIsResourceModalOpen(false);
      setTargetCardModalForResource(false);
      showToast(`Đã chọn icon ${resItem.name}`, 'success');
      return;
    }

    if (!activeGuide) return;

    // Nếu đang chọn tài nguyên cho một ô trong Bảng Biểu (Table)
    if (targetTableCellForResource) {
      const { blockId, rowId, columnId, itemIndex } = targetTableCellForResource;
      const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
      if (block && block.type === 'table') {
        const nextRows = block.rows.map((row) => {
          if (row.id !== rowId) return row;
          const currentCell = row.cells[columnId] || {};
          const currentList = getCellResources(currentCell);

          let nextList: GuideTableCellResource[];
          if (itemIndex !== undefined && itemIndex >= 0 && itemIndex < currentList.length) {
            nextList = [...currentList];
            nextList[itemIndex] = {
              ...nextList[itemIndex],
              name: resItem.name,
              icon: resItem.icon,
              layers: resItem.layers ?? (autoAttachShardLayer ? ['game_items/public_shade_2.png'] : nextList[itemIndex].layers),
            };
          } else {
            nextList = [
              ...currentList,
              {
                name: resItem.name,
                icon: resItem.icon,
                quantity: '',
                layers: resItem.layers ?? (autoAttachShardLayer ? ['game_items/public_shade_2.png'] : undefined),
              },
            ];
          }

          return {
            ...row,
            cells: {
              ...row.cells,
              [columnId]: {
                ...currentCell,
                resources: nextList,
                resource: nextList[0] || undefined,
              },
            },
          };
        });
        handleUpdateBlock(blockId, { rows: nextRows });
        showToast(`Đã thêm vật phẩm ${resItem.name} vào ô`, 'success');
        setIsResourceModalOpen(false);
        setTargetTableCellForResource(null);
        return;
      }
    }

    if (!targetBlockIdForResource) return;
    const block = activeGuide.blocks.find((b) => b.id === targetBlockIdForResource) as GuideResourcesBlock;
    if (!block || block.type !== 'resources') return;

    const newResItem: GuideResourceItem = {
      id: resItem.id,
      name: resItem.name,
      icon: resItem.icon,
      note: resItem.note || 'Phần thưởng nổi bật',
      layers: resItem.layers ?? (autoAttachShardLayer ? ['game_items/public_shade_2.png'] : undefined),
    };

    handleUpdateBlock(targetBlockIdForResource, {
      items: [...block.items, newResItem],
    });
    showToast(`Đã thêm vật phẩm ${resItem.name}`, 'success');
  };

  // --- QUẢN LÝ KHỐI BẢNG BIỂU (TABLE BLOCK) ---
  const handleAddTableColumn = (blockId: string, type: 'text' | 'resource' | 'hero') => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const colId = `col-${Date.now()}`;
    const label =
      type === 'text'
        ? `Cột ${block.columns.length + 1}`
        : `Phần Thưởng ${block.columns.length + 1}`;
    const newCol: GuideTableColumn = {
      id: colId,
      label,
      type: type === 'hero' ? 'resource' : type,
    };

    handleUpdateBlock(blockId, {
      columns: [...block.columns, newCol],
    });
    showToast(`Đã thêm cột ${newCol.label}`, 'success');
  };

  const handleUpdateTableColumn = (blockId: string, colId: string, fields: Partial<GuideTableColumn>) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const nextCols = block.columns.map((c) => (c.id === colId ? { ...c, ...fields } : c));
    handleUpdateBlock(blockId, { columns: nextCols });
  };

  const handleRemoveTableColumn = (blockId: string, colId: string) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;
    if (block.columns.length <= 1) {
      showToast('Bảng cần có ít nhất 1 cột', 'error');
      return;
    }

    const nextCols = block.columns.filter((c) => c.id !== colId);
    const nextRows = block.rows.map((r) => {
      const nextCells = { ...r.cells };
      delete nextCells[colId];
      return { ...r, cells: nextCells };
    });

    handleUpdateBlock(blockId, { columns: nextCols, rows: nextRows });
    showToast('Đã xóa cột', 'success');
  };

  const handleAddTableRow = (blockId: string) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const newRow: GuideTableRow = {
      id: `row-${Date.now()}`,
      cells: {},
    };

    handleUpdateBlock(blockId, {
      rows: [...block.rows, newRow],
    });
  };

  const handleRemoveTableRow = (blockId: string, rowId: string) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    handleUpdateBlock(blockId, {
      rows: block.rows.filter((r) => r.id !== rowId),
    });
  };

  const handleMoveTableRow = (blockId: string, rowIndex: number, direction: 'up' | 'down') => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const targetIdx = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    if (targetIdx < 0 || targetIdx >= block.rows.length) return;

    const nextRows = [...block.rows];
    const temp = nextRows[rowIndex];
    nextRows[rowIndex] = nextRows[targetIdx];
    nextRows[targetIdx] = temp;

    handleUpdateBlock(blockId, { rows: nextRows });
  };

  const handleUpdateTableCellText = (blockId: string, rowId: string, colId: string, text: string) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const nextRows = block.rows.map((r) => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        cells: {
          ...r.cells,
          [colId]: {
            ...r.cells[colId],
            text,
          },
        },
      };
    });

    handleUpdateBlock(blockId, { rows: nextRows });
  };

  const handleUpdateTableCellResourceItem = (
    blockId: string,
    rowId: string,
    colId: string,
    itemIdx: number,
    fields: Partial<GuideTableCellResource>
  ) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const nextRows = block.rows.map((r) => {
      if (r.id !== rowId) return r;
      const currentCell = r.cells[colId] || {};
      const currentList = getCellResources(currentCell);
      if (itemIdx < 0 || itemIdx >= currentList.length) return r;

      const nextList = [...currentList];
      nextList[itemIdx] = {
        ...nextList[itemIdx],
        ...fields,
      };

      return {
        ...r,
        cells: {
          ...r.cells,
          [colId]: {
            ...currentCell,
            resources: nextList,
            resource: nextList[0] || undefined,
          },
        },
      };
    });

    handleUpdateBlock(blockId, { rows: nextRows });
  };

  const handleRemoveTableCellResourceItem = (
    blockId: string,
    rowId: string,
    colId: string,
    itemIdx: number
  ) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const nextRows = block.rows.map((r) => {
      if (r.id !== rowId) return r;
      const currentCell = r.cells[colId] || {};
      const currentList = getCellResources(currentCell);
      const nextList = currentList.filter((_, idx) => idx !== itemIdx);

      return {
        ...r,
        cells: {
          ...r.cells,
          [colId]: {
            ...currentCell,
            resources: nextList,
            resource: nextList[0] || undefined,
          },
        },
      };
    });

    handleUpdateBlock(blockId, { rows: nextRows });
  };

  const handleClearTableCellResource = (blockId: string, rowId: string, colId: string) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const nextRows = block.rows.map((r) => {
      if (r.id !== rowId) return r;
      const nextCells = { ...r.cells };
      if (nextCells[colId]) {
        delete nextCells[colId].resource;
        delete nextCells[colId].resources;
      }
      return { ...r, cells: nextCells };
    });

    handleUpdateBlock(blockId, { rows: nextRows });
  };

  const handleUpdateTableCellHeroItem = (
    blockId: string,
    rowId: string,
    colId: string,
    itemIdx: number,
    fields: Partial<GuideTableCellHero>
  ) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const nextRows = block.rows.map((r) => {
      if (r.id !== rowId) return r;
      const currentCell = r.cells[colId] || {};
      const currentList = getCellHeroes(currentCell);
      if (itemIdx < 0 || itemIdx >= currentList.length) return r;

      const nextList = [...currentList];
      nextList[itemIdx] = {
        ...nextList[itemIdx],
        ...fields,
      };

      return {
        ...r,
        cells: {
          ...r.cells,
          [colId]: {
            ...currentCell,
            heroes: nextList,
            hero: nextList[0] || undefined,
          },
        },
      };
    });

    handleUpdateBlock(blockId, { rows: nextRows });
  };

  const handleRemoveTableCellHeroItem = (
    blockId: string,
    rowId: string,
    colId: string,
    itemIdx: number
  ) => {
    if (!activeGuide) return;
    const block = activeGuide.blocks.find((b) => b.id === blockId) as GuideTableBlock;
    if (!block || block.type !== 'table') return;

    const nextRows = block.rows.map((r) => {
      if (r.id !== rowId) return r;
      const currentCell = r.cells[colId] || {};
      const currentList = getCellHeroes(currentCell);
      const nextList = currentList.filter((_, idx) => idx !== itemIdx);

      return {
        ...r,
        cells: {
          ...r.cells,
          [colId]: {
            ...currentCell,
            heroes: nextList,
            hero: nextList[0] || undefined,
          },
        },
      };
    });

    handleUpdateBlock(blockId, { rows: nextRows });
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

  // Lọc tướng trong Modal (Dùng heroesList để live-reload)
  const modalHeroes = useMemo(() => {
    const term = heroSearchTerm.trim().toLowerCase();
    return heroesList.filter((h) => {
      const matchSearch =
        term === '' ||
        h.name.toLowerCase().includes(term) ||
        h.slug.toLowerCase().includes(term) ||
        (h.id && h.id.includes(term)) ||
        (h.element && h.element.toLowerCase().includes(term)) ||
        (h.role && h.role.toLowerCase().includes(term));

      if (!matchSearch) return false;

      if (heroCategoryFilter === 'tier-sp') return h.tier === 'S+';
      if (heroCategoryFilter === 'SSR') return h.rarity === 'SSR';
      if (heroCategoryFilter === 'UR') return h.rarity === 'UR';
      if (heroCategoryFilter === 'afterlife') return Boolean(h.isAfterlifeForm);
      if (heroCategoryFilter === 'base') return !h.isAfterlifeForm && !h.isSkinForm;

      return true;
    });
  }, [heroesList, heroSearchTerm, heroCategoryFilter]);

  // Danh sách slug các tướng đã có trong block hiện tại
  const currentBlockAddedSlugs = useMemo(() => {
    if (targetCardModalForHero && editingCardModal) {
      return new Set(editingCardModal.data.heroSlug ? [editingCardModal.data.heroSlug] : []);
    }
    if (!activeGuide || !targetBlockIdForHero) return new Set<string>();
    const block = activeGuide.blocks.find((b) => b.id === targetBlockIdForHero);
    if (!block) return new Set<string>();
    if (block.type === 'hero-roster' || block.type === 'hero-source') {
      return new Set(block.heroes.map((h) => h.heroSlug));
    }
    return new Set<string>();
  }, [activeGuide, targetBlockIdForHero, targetCardModalForHero, editingCardModal]);

  // Bộ lọc toàn bộ tướng cho khối Thẻ Chi Tiết (3 Cột) - Không bị slice giới hạn
  const cardFilteredHeroes = useMemo(() => {
    const term = cardHeroSearch.trim().toLowerCase();
    return heroesList.filter((h) => {
      const matchSearch =
        term === '' ||
        h.name.toLowerCase().includes(term) ||
        h.slug.toLowerCase().includes(term) ||
        (h.id && h.id.includes(term)) ||
        (h.element && h.element.toLowerCase().includes(term)) ||
        (h.role && h.role.toLowerCase().includes(term)) ||
        (h.rarity && h.rarity.toLowerCase().includes(term));

      if (!matchSearch) return false;

      if (cardHeroCategoryFilter === 'tier-sp') return h.tier === 'S+';
      if (cardHeroCategoryFilter === 'SSR') return h.rarity === 'SSR';
      if (cardHeroCategoryFilter === 'UR') return h.rarity === 'UR';
      if (cardHeroCategoryFilter === 'afterlife') return Boolean(h.isAfterlifeForm);
      if (cardHeroCategoryFilter === 'base') return !h.isAfterlifeForm && !h.isSkinForm;

      return true;
    });
  }, [heroesList, cardHeroSearch, cardHeroCategoryFilter]);

  // Lọc resource trong Modal (Dùng resourcesList để live-reload)
  const modalResources = useMemo(() => {
    const term = resourceSearchTerm.trim().toLowerCase();
    return resourcesList.filter(
      (r) => term === '' || r.name.toLowerCase().includes(term) || r.category?.toLowerCase().includes(term)
    );
  }, [resourcesList, resourceSearchTerm]);

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
              onClick={handleBackToList}
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
            <div className="flex items-center gap-2">
              {/* Badge Trạng Thái Tự Động Lưu */}
              {autoSaveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Đang tự động lưu...</span>
                </div>
              )}
              {autoSaveStatus === 'saved' && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Đã tự động lưu {lastAutoSavedTime ? `${lastAutoSavedTime.getHours().toString().padStart(2, '0')}:${lastAutoSavedTime.getMinutes().toString().padStart(2, '0')}:${lastAutoSavedTime.getSeconds().toString().padStart(2, '0')}` : ''}
                  </span>
                </div>
              )}
              {autoSaveStatus === 'unsaved' && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span>Đang chỉnh sửa (tự lưu sau 1s)</span>
                </div>
              )}
              {autoSaveStatus === 'error' && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lỗi máy chủ (Đã lưu nháp an toàn trên máy)</span>
                </div>
              )}

              {/* Nút lưu thủ công phụ trợ (ép lưu ngay) */}
              <button
                onClick={handleSaveGuide}
                disabled={saving || autoSaveStatus === 'saving'}
                title="Bấm để ép lưu ngay lập tức (Hệ thống đã tự động lưu liên tục)"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Lưu Ngay</span>
              </button>
            </div>
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
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 overflow-hidden shrink-0">
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
                          <img src={act.icon} alt="" className="w-full h-full object-cover" />
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400">Mô Tả Tóm Tắt</label>
                <TagInsertButton
                  onInsert={(tag) =>
                    setActiveGuide({
                      ...activeGuide,
                      description: appendTag(activeGuide.description, tag),
                    })
                  }
                  title="Chèn liên kết vào Mô Tả Tóm Tắt"
                />
              </div>
              <textarea
                value={activeGuide.description}
                onChange={(e) => setActiveGuide({ ...activeGuide, description: e.target.value })}
                rows={2}
                placeholder="Tóm tắt ngắn gọn nội dung và mục tiêu bài viết... (Hỗ trợ tag [[slug]], [[hero:slug]], [[resources]])"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            {/* Hoạt Động & Tính Năng Liên Quan (Tags bài viết) */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-amber-400" />
                  <span>Hoạt Động & Tính Năng Liên Quan (Tags Bài Viết)</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  Chọn các hoạt động liên quan để hiển thị nút nhảy trang nhanh đầu bài viết
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activities.map((act) => {
                  const isSelected = activeGuide.relatedActivities?.includes(act.slug);
                  return (
                    <button
                      key={act.slug}
                      type="button"
                      onClick={() => {
                        const current = activeGuide.relatedActivities || [];
                        const updated = isSelected
                          ? current.filter((s) => s !== act.slug)
                          : [...current, act.slug];
                        setActiveGuide({ ...activeGuide, relatedActivities: updated });
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all border ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{act.name}</span>
                      <span className="text-[10px] opacity-60 font-mono">({act.slug})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ảnh Đại Diện / Banner (Thumbnail) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Ảnh Đại Diện / Banner Bài Viết (Thumbnail)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hiển thị trên thẻ bài viết mục Thông Tin Chung, Hub Hoạt Động và đầu bài viết.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerMode('guide-thumbnail');
                      setIsImageModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Chọn Từ Thư Viện Ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExtractThumbnailFromGallery}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Tự động lấy ảnh đầu tiên trong khối Gallery của bài"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lấy Từ Gallery</span>
                  </button>

                  {activeGuide.thumbnail && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveGuide({ ...activeGuide, thumbnail: '' });
                        showToast('Đã xóa ảnh bìa riêng (sẽ dùng banner mặc định của hoạt động)', 'success');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Ảnh / Dùng Mặc Định</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Khung Ảnh */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div className="w-full sm:w-64 h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 relative group">
                  {activeGuide.thumbnail ? (
                    <>
                      <img
                        src={activeGuide.thumbnail}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setMediaPickerMode('guide-thumbnail');
                            setIsImageModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-500 text-slate-950 text-[11px] font-bold"
                        >
                          Đổi Ảnh
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-3 text-slate-500">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <div className="text-[11px] font-medium">Chưa có ảnh bìa riêng</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Sẽ tự động lấy từ Gallery hoặc banner biểu tượng của hoạt động
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Đường dẫn URL / Path của ảnh</label>
                    <input
                      type="text"
                      value={activeGuide.thumbnail || ''}
                      onChange={(e) => setActiveGuide({ ...activeGuide, thumbnail: e.target.value })}
                      placeholder="VD: /games/sieu-anh-hung/tai-nguyen-anh/boss_banner.jpg hoặc https://..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    💡 <strong>Cơ chế tự động thông minh:</strong> Nếu bạn để trống, hệ thống sẽ tự động ưu tiên lấy ảnh đầu tiên trong Album Gallery. Nếu bài không có album, hệ thống sẽ sử dụng banner biểu tượng chủ đề của chuyên mục hoạt động ({activeGuide.category}).
                  </p>
                </div>
              </div>
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
                          : block.type === 'hero-source'
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          : block.type === 'gallery'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : block.type === 'resources'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : block.type === 'table'
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          : block.type === 'resource-card'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : block.type === 'step-flow'
                          ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {block.type === 'hero-roster'
                        ? 'Đội Hình Tướng'
                        : block.type === 'hero-source'
                        ? 'Nguồn Tướng'
                        : block.type === 'gallery'
                        ? 'Thư Viện Ảnh'
                        : block.type === 'resources'
                        ? 'Vật Phẩm / Thưởng'
                        : block.type === 'table'
                        ? 'Bảng Biểu (Table)'
                        : block.type === 'resource-card'
                        ? 'Thẻ Chi Tiết (3 Cột)'
                        : block.type === 'step-flow'
                        ? 'Đường Line (Step Flow)'
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

                    {/* Quick Link Insert Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-amber-400" /> Chèn liên kết:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          openTagPicker(
                            (tag) => handleUpdateBlock(block.id, { content: appendTag(block.content, tag) }),
                            'Chèn Link Hoạt Động Vào Khối Văn Bản',
                            'activities'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white"
                      >
                        <Tag className="w-3 h-3 text-amber-400" />
                        <span>Hoạt Động / Bài Viết</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openTagPicker(
                            (tag) => handleUpdateBlock(block.id, { content: appendTag(block.content, tag) }),
                            'Chèn Link Tướng Vào Khối Văn Bản',
                            'heroes'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white"
                      >
                        <Users className="w-3 h-3 text-sky-400" />
                        <span>Tướng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateBlock(block.id, {
                            content: appendTag(block.content, '[[resources|Kho Tài Nguyên]]'),
                          });
                          showToast('Đã chèn thẻ liên kết Kho Tài Nguyên', 'success');
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <span>💎 Kho Tài Nguyên</span>
                      </button>
                    </div>

                    <textarea
                      value={block.content}
                      onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                      rows={4}
                      placeholder="Nhập nội dung hướng dẫn. Hỗ trợ tag: [[slug-hoat-dong|Tên]], [[hero:slug-tuong|Tên]], [[resources|Kho Tài Nguyên]]..."
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans resize-y"
                    />

                    {/* Syntax Hint & Live Preview */}
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-slate-400">💡 Cú pháp:</span>
                        <span>Hoạt động: <code className="text-amber-400/90 bg-slate-950 px-1 py-0.5 rounded">[[slug|Tên]]</code></span>
                        <span>• Tướng: <code className="text-sky-400 bg-slate-950 px-1 py-0.5 rounded">[[hero:slug|Tên]]</code></span>
                        <span>• Tài nguyên: <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">[[resources|Tên]]</code></span>
                        <span>• Web: <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded">[Tên](url)</code></span>
                      </div>

                      {Boolean(block.content && (block.content.includes('[[') || block.content.includes(']('))) && (
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-amber-400" /> Xem trước liên kết:
                          </div>
                          <div className="text-slate-300 leading-relaxed">
                            <RichTextWithTags text={block.content} gameSlug={gameSlug} activities={activities} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* BLOCK 2: ĐỘI HÌNH TƯỚNG (HERO ROSTER) */}
                {block.type === 'hero-roster' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={block.description || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                          placeholder="Mô tả tiêu chí chọn tướng (VD: Dồn dame đơn mục tiêu, buff bạo kích...)"
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                        <TagInsertButton
                          onInsert={(tag) =>
                            handleUpdateBlock(block.id, {
                              description: appendTag(block.description, tag),
                            })
                          }
                          title="Chèn liên kết vào Mô Tả Đội Hình Tướng"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setTargetBlockIdForHero(block.id);
                          setHeroSearchTerm('');
                          setResourceModalTab('heroes');
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
                          key={`${hero.heroSlug || 'hero'}-${hIdx}`}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3 relative group"
                        >
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <LayeredIcon
                              src={hero.avatar}
                              alt={hero.name}
                              layers={hero.layers}
                              className="w-12 h-12 rounded-xl border border-slate-700 object-cover"
                              fallbackSrc="/images/heroes/icon_heroes/default.png"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const hasShard = hero.layers?.includes('game_items/public_shade_2.png');
                                  const nextLayers = hasShard
                                    ? (hero.layers || []).filter((l) => l !== 'game_items/public_shade_2.png')
                                    : [...(hero.layers || []), 'game_items/public_shade_2.png'];
                                  const updated = [...block.heroes];
                                  updated[hIdx] = { ...updated[hIdx], layers: nextLayers.length > 0 ? nextLayers : undefined };
                                  handleUpdateBlock(block.id, { heroes: updated });
                                }}
                                className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                                  hero.layers?.includes('game_items/public_shade_2.png')
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                                title="Bật/tắt layer Mảnh (game_items/public_shade_2.png)"
                              >
                                {hero.layers?.includes('game_items/public_shade_2.png') ? '★ Mảnh' : 'Mảnh?'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLayerModal({
                                    isOpen: true,
                                    title: `Quản Lý Layer - Tướng ${hero.name}`,
                                    baseIcon: hero.avatar,
                                    layers: hero.layers || [],
                                    onSave: (newLayers) => {
                                      const updated = [...block.heroes];
                                      updated[hIdx] = { ...updated[hIdx], layers: newLayers.length > 0 ? newLayers : undefined };
                                      handleUpdateBlock(block.id, { heroes: updated });
                                    },
                                  });
                                }}
                                className="p-0.5 rounded text-slate-500 hover:text-amber-400 bg-slate-900 border border-slate-800"
                                title="Quản lý chi tiết các layer chồng"
                              >
                                <Layers className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-white text-xs truncate">{hero.name}</span>
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

                            <div className="relative">
                              <textarea
                                value={hero.note || ''}
                                onChange={(e) => {
                                  const updated = [...block.heroes];
                                  updated[hIdx] = { ...updated[hIdx], note: e.target.value };
                                  handleUpdateBlock(block.id, { heroes: updated });
                                }}
                                rows={2}
                                placeholder="Lý do chọn / mẹo chiến đấu..."
                                className="w-full px-2 py-1 pr-6 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 focus:outline-none resize-none leading-relaxed"
                              />
                              <TagInsertButton
                                onInsert={(tag) => {
                                  const updated = [...block.heroes];
                                  updated[hIdx] = { ...updated[hIdx], note: appendTag(updated[hIdx].note, tag) };
                                  handleUpdateBlock(block.id, { heroes: updated });
                                }}
                                size="xs"
                                showLabel={false}
                                className="absolute top-1 right-1"
                                title="Chèn liên kết vào ghi chú tướng"
                              />
                            </div>
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
                            setMediaPickerMode('block');
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
                            setMediaPickerMode('block');
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
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={img.caption || ''}
                                onChange={(e) => {
                                  const updated = [...block.images];
                                  updated[iIdx] = { ...updated[iIdx], caption: e.target.value };
                                  handleUpdateBlock(block.id, { images: updated });
                                }}
                                placeholder="Nhập chú thích ảnh minh họa..."
                                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                              />
                              <TagInsertButton
                                onInsert={(tag) => {
                                  const updated = [...block.images];
                                  updated[iIdx] = { ...updated[iIdx], caption: appendTag(updated[iIdx].caption, tag) };
                                  handleUpdateBlock(block.id, { images: updated });
                                }}
                                size="xs"
                                showLabel={false}
                                title="Chèn liên kết vào chú thích ảnh"
                              />
                            </div>
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
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={block.description || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                          placeholder="Mô tả danh mục phần thưởng..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                        <TagInsertButton
                          onInsert={(tag) =>
                            handleUpdateBlock(block.id, {
                              description: appendTag(block.description, tag),
                            })
                          }
                          title="Chèn liên kết vào Mô Tả Phần Thưởng"
                        />
                      </div>

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
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <LayeredIcon
                              src={item.icon}
                              alt={item.name}
                              layers={item.layers}
                              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1 object-contain"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const hasShard = item.layers?.includes('game_items/public_shade_2.png');
                                  const nextLayers = hasShard
                                    ? (item.layers || []).filter((l) => l !== 'game_items/public_shade_2.png')
                                    : [...(item.layers || []), 'game_items/public_shade_2.png'];
                                  const updated = [...block.items];
                                  updated[rIdx] = { ...updated[rIdx], layers: nextLayers.length > 0 ? nextLayers : undefined };
                                  handleUpdateBlock(block.id, { items: updated });
                                }}
                                className={`text-[8px] px-1 py-0.2 rounded border transition-all ${
                                  item.layers?.includes('game_items/public_shade_2.png')
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                                title="Bật/tắt layer Mảnh (game_items/public_shade_2.png)"
                              >
                                {item.layers?.includes('game_items/public_shade_2.png') ? '★ Mảnh' : 'Mảnh?'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLayerModal({
                                    isOpen: true,
                                    title: `Quản Lý Layer - ${item.name}`,
                                    baseIcon: item.icon,
                                    layers: item.layers || [],
                                    onSave: (newLayers) => {
                                      const updated = [...block.items];
                                      updated[rIdx] = { ...updated[rIdx], layers: newLayers.length > 0 ? newLayers : undefined };
                                      handleUpdateBlock(block.id, { items: updated });
                                    },
                                  });
                                }}
                                className="p-0.5 rounded text-slate-500 hover:text-emerald-400 bg-slate-900 border border-slate-800"
                                title="Quản lý chi tiết các layer chồng"
                              >
                                <Layers className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...block.items];
                                  updated[rIdx] = { ...updated[rIdx], name: e.target.value };
                                  handleUpdateBlock(block.id, { items: updated });
                                }}
                                placeholder="Tên vật phẩm..."
                                className="font-bold text-xs text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none w-full"
                              />
                              <button
                                onClick={() => {
                                  const updated = block.items.filter((_, idx) => idx !== rIdx);
                                  handleUpdateBlock(block.id, { items: updated });
                                }}
                                className="text-slate-500 hover:text-red-400 p-0.5 shrink-0"
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

                {/* KHỐI: NGUỒN TƯỚNG (HERO-SOURCE) */}
                {block.type === 'hero-source' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={block.description || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                          placeholder="Mô tả nguồn tướng: Cách nhận, mốc điểm, sự kiện mở bán..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                        />
                        <TagInsertButton
                          onInsert={(tag) =>
                            handleUpdateBlock(block.id, {
                              description: appendTag(block.description, tag),
                            })
                          }
                          title="Chèn liên kết vào Mô Tả Nguồn Tướng"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetBlockIdForHero(block.id);
                          setHeroSearchTerm('');
                          setResourceModalTab('heroes');
                          setIsHeroModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm Nguồn Tướng</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {block.heroes.map((hero, hIdx) => (
                        <div
                          key={`${hero.heroSlug || 'hero'}-${hIdx}`}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3 relative group hover:border-purple-500/40 transition-all"
                        >
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <LayeredIcon
                              src={hero.avatar}
                              alt={hero.name}
                              layers={hero.layers}
                              className="w-12 h-12 rounded-xl border border-slate-700 object-cover"
                              fallbackSrc="/images/heroes/icon_heroes/default.png"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const hasShard = hero.layers?.includes('game_items/public_shade_2.png');
                                  const nextLayers = hasShard
                                    ? (hero.layers || []).filter((l) => l !== 'game_items/public_shade_2.png')
                                    : [...(hero.layers || []), 'game_items/public_shade_2.png'];
                                  const updated = [...block.heroes];
                                  updated[hIdx] = { ...updated[hIdx], layers: nextLayers.length > 0 ? nextLayers : undefined };
                                  handleUpdateBlock(block.id, { heroes: updated });
                                }}
                                className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                                  hero.layers?.includes('game_items/public_shade_2.png')
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                                title="Bật/tắt layer Mảnh (game_items/public_shade_2.png)"
                              >
                                {hero.layers?.includes('game_items/public_shade_2.png') ? '★ Mảnh' : 'Mảnh?'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLayerModal({
                                    isOpen: true,
                                    title: `Quản Lý Layer - Nguồn Tướng ${hero.name}`,
                                    baseIcon: hero.avatar,
                                    layers: hero.layers || [],
                                    onSave: (newLayers) => {
                                      const updated = [...block.heroes];
                                      updated[hIdx] = { ...updated[hIdx], layers: newLayers.length > 0 ? newLayers : undefined };
                                      handleUpdateBlock(block.id, { heroes: updated });
                                    },
                                  });
                                }}
                                className="p-0.5 rounded text-slate-500 hover:text-purple-400 bg-slate-900 border border-slate-800"
                                title="Quản lý chi tiết các layer chồng"
                              >
                                <Layers className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-white text-xs truncate">
                                {hero.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = block.heroes.filter((_, idx) => idx !== hIdx);
                                  handleUpdateBlock(block.id, { heroes: updated });
                                }}
                                className="text-slate-500 hover:text-red-400 p-0.5 shrink-0"
                                title="Xóa tướng khỏi nguồn nhận"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              {hero.rarity && (
                                <span className="text-amber-400 font-mono font-bold">
                                  {hero.rarity}
                                </span>
                              )}
                              {hero.element && <span>• {hero.element}</span>}
                              {hero.role && <span>• {hero.role}</span>}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={hero.sourceNote || ''}
                                onChange={(e) => {
                                  const updated = [...block.heroes];
                                  updated[hIdx] = { ...updated[hIdx], sourceNote: e.target.value };
                                  handleUpdateBlock(block.id, { heroes: updated });
                                }}
                                placeholder="Nguồn nhận: Đổi 5000 Xu, Mở Rương, Top 1-3..."
                                className="flex-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-amber-300 font-semibold focus:outline-none focus:border-purple-500"
                              />
                              <TagInsertButton
                                onInsert={(tag) => {
                                  const updated = [...block.heroes];
                                  updated[hIdx] = { ...updated[hIdx], sourceNote: appendTag(updated[hIdx].sourceNote, tag) };
                                  handleUpdateBlock(block.id, { heroes: updated });
                                }}
                                size="xs"
                                showLabel={false}
                                title="Chèn liên kết vào nguồn nhận tướng"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {block.heroes.length === 0 && (
                      <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                        Chưa có tướng nào được thêm. Bấm &quot;+ Thêm Nguồn Tướng&quot; ở trên để chọn tướng từ kho và điền cách nhận.
                      </div>
                    )}
                  </div>
                )}

                {/* KHỐI 5: BẢNG BIỂU (TABLE) */}
                {block.type === 'table' && (
                  <div className="space-y-4">
                    {/* Mô tả bảng */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-400">Mô tả hoặc ghi chú phụ của bảng (tùy chọn):</label>
                        <TagInsertButton
                          onInsert={(tag) =>
                            handleUpdateBlock(block.id, {
                              description: appendTag(block.description, tag),
                            })
                          }
                          title="Chèn liên kết vào Mô Tả Bảng Biểu"
                        />
                      </div>
                      <input
                        type="text"
                        value={block.description || ''}
                        onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                        placeholder="VD: Chi tiết các mốc điều kiện và phần thưởng tương ứng..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Quản lý các Cột */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <TableIcon className="w-4 h-4 text-teal-400" />
                          <span className="text-xs font-bold text-slate-200">
                            Cấu Hình Các Cột ({block.columns.length} Cột):
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Cột Text cho chữ/mốc nạp, Cột Phần Thưởng cho chọn Icon + Tên + Số lượng / Tướng)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddTableColumn(block.id, 'text')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 border border-slate-700"
                          >
                            <Plus className="w-3 h-3 text-teal-400" />
                            <span>+ Cột Text</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddTableColumn(block.id, 'resource')}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-teal-500/20 to-amber-500/20 hover:from-teal-500/30 hover:to-amber-500/30 text-teal-300 text-[11px] font-bold flex items-center gap-1.5 border border-teal-500/40 shadow-sm"
                            title="Thêm cột chứa cả Vật phẩm và Tướng"
                          >
                            <Sparkles className="w-3 h-3 text-teal-400" />
                            <Users className="w-3 h-3 text-amber-400" />
                            <span>+ Cột Phần Thưởng (Vật Phẩm / Tướng)</span>
                          </button>
                        </div>
                      </div>

                      {/* Danh sách cấu hình từng cột */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {block.columns.map((col, cIdx) => (
                          <div
                            key={col.id}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 space-y-2 relative"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                Cột #{cIdx + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <select
                                  value={col.type === 'hero' ? 'resource' : col.type}
                                  onChange={(e) =>
                                    handleUpdateTableColumn(block.id, col.id, {
                                      type: e.target.value as 'text' | 'resource',
                                    })
                                  }
                                  className="bg-slate-950 text-[10px] text-teal-300 font-bold px-2 py-0.5 rounded border border-slate-800 focus:outline-none"
                                >
                                  <option value="text">Văn bản (Text)</option>
                                  <option value="resource">Phần Thưởng (Vật Phẩm & Tướng)</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTableColumn(block.id, col.id)}
                                  className="text-slate-500 hover:text-red-400 p-0.5"
                                  title="Xóa cột này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={col.label}
                              onChange={(e) =>
                                handleUpdateTableColumn(block.id, col.id, { label: e.target.value })
                              }
                              placeholder="Tiêu đề cột..."
                              className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bảng Dữ Liệu Các Dòng (Rows Editor) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          Dữ Liệu Bảng ({block.rows.length} Dòng):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddTableRow(block.id)}
                          className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Thêm Dòng Mới</span>
                        </button>
                      </div>

                      {/* Khung Table cuộn ngang */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold">
                              <th className="py-2.5 px-3 w-12 text-center">#</th>
                              {block.columns.map((col) => (
                                <th key={col.id} className="py-2.5 px-3 min-w-[200px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-white font-extrabold">{col.label}</span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                        col.type === 'text'
                                          ? 'bg-slate-800 text-slate-400'
                                          : 'bg-gradient-to-r from-teal-500/20 to-amber-500/20 text-teal-300 border border-teal-500/30'
                                      }`}
                                    >
                                      {col.type === 'text' ? 'Text' : 'Vật Phẩm / Tướng'}
                                    </span>
                                  </div>
                                </th>
                              ))}
                              <th className="py-2.5 px-3 w-20 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {block.rows.map((row, rIdx) => (
                              <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="py-2.5 px-3 text-center text-slate-500 font-mono font-bold">
                                  {rIdx + 1}
                                </td>
                                {block.columns.map((col) => {
                                  const cell = row.cells[col.id] || {};
                                  return (
                                    <td key={col.id} className="py-2.5 px-3 align-middle">
                                      {col.type === 'text' ? (
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="text"
                                            value={cell.text || ''}
                                            onChange={(e) =>
                                              handleUpdateTableCellText(
                                                block.id,
                                                row.id,
                                                col.id,
                                                e.target.value
                                              )
                                            }
                                            placeholder="Nhập nội dung..."
                                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                                          />
                                          <TagInsertButton
                                            onInsert={(tag) =>
                                              handleUpdateTableCellText(
                                                block.id,
                                                row.id,
                                                col.id,
                                                appendTag(cell.text, tag)
                                              )
                                            }
                                            size="xs"
                                            showLabel={false}
                                            title="Chèn liên kết vào ô bảng"
                                          />
                                        </div>
                                      ) : (
                                        <div className="space-y-2 py-1">
                                          {(() => {
                                            const cellItems = getCellResources(cell);
                                            return (
                                              <>
                                                {cellItems.map((item, itemIdx) => {
                                                  const isHero = item.itemType === 'hero' || Boolean(item.heroSlug) || Boolean(item.rarity);
                                                  return (
                                                    <div
                                                      key={itemIdx}
                                                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 group hover:border-slate-700 transition-colors"
                                                    >
                                                      <div className="flex flex-col items-center gap-1 shrink-0">
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setTargetTableCellForResource({
                                                              blockId: block.id,
                                                              rowId: row.id,
                                                              columnId: col.id,
                                                              itemIndex: itemIdx,
                                                            });
                                                            setTargetTableCellForHero(null);
                                                            setTargetBlockIdForResource(null);
                                                            setTargetBlockIdForHero(null);
                                                            setResourceModalTab(isHero ? 'heroes' : 'game-assets');
                                                            setIsResourceModalOpen(true);
                                                          }}
                                                          className={`w-9 h-9 rounded-lg bg-slate-950 border p-0.5 transition-all shrink-0 flex items-center justify-center group/ico relative overflow-hidden ${
                                                            isHero ? 'border-amber-500/40 hover:border-amber-400' : 'border-slate-700/80 hover:border-teal-400'
                                                          }`}
                                                          title="Click để đổi icon / tướng"
                                                        >
                                                          {item.icon ? (
                                                            <LayeredIcon
                                                              src={item.icon}
                                                              alt={item.name || 'icon'}
                                                              layers={item.layers}
                                                              className="w-full h-full object-contain"
                                                              fallbackSrc="/images/heroes/icon_heroes/default.png"
                                                            />
                                                          ) : isHero ? (
                                                            <Users className="w-4 h-4 text-amber-400" />
                                                          ) : (
                                                            <Sparkles className="w-4 h-4 text-slate-500" />
                                                          )}
                                                          <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover/ico:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Edit2 className="w-3 h-3 text-white" />
                                                          </div>
                                                        </button>
                                                        <div className="flex items-center gap-0.5">
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              const hasShard = item.layers?.includes('game_items/public_shade_2.png');
                                                              const nextLayers = hasShard
                                                                ? (item.layers || []).filter((l) => l !== 'game_items/public_shade_2.png')
                                                                : [...(item.layers || []), 'game_items/public_shade_2.png'];
                                                              handleUpdateTableCellResourceItem(block.id, row.id, col.id, itemIdx, {
                                                                layers: nextLayers.length > 0 ? nextLayers : undefined,
                                                              });
                                                            }}
                                                            className={`text-[8px] px-1 rounded border transition-all ${
                                                              item.layers?.includes('game_items/public_shade_2.png')
                                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                                                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                                                            }`}
                                                            title="Bật/tắt layer Mảnh"
                                                          >
                                                            M
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setLayerModal({
                                                                isOpen: true,
                                                                title: `Quản Lý Layer - ${item.name || 'Ô bảng'}`,
                                                                baseIcon: item.icon || '',
                                                                layers: item.layers || [],
                                                                onSave: (newLayers) => {
                                                                  handleUpdateTableCellResourceItem(block.id, row.id, col.id, itemIdx, {
                                                                    layers: newLayers.length > 0 ? newLayers : undefined,
                                                                  });
                                                                },
                                                              });
                                                            }}
                                                            className="p-0.5 rounded text-slate-500 hover:text-teal-400 bg-slate-950 border border-slate-800"
                                                            title="Quản lý chi tiết các layer chồng"
                                                          >
                                                            <Layers className="w-2.5 h-2.5" />
                                                          </button>
                                                        </div>
                                                      </div>

                                                      <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                          <input
                                                            type="text"
                                                            value={item.name || ''}
                                                            onChange={(e) =>
                                                              handleUpdateTableCellResourceItem(
                                                                block.id,
                                                                row.id,
                                                                col.id,
                                                                itemIdx,
                                                                { name: e.target.value }
                                                              )
                                                            }
                                                            placeholder={isHero ? "Tên tướng..." : "Tên vật phẩm..."}
                                                            className="flex-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-bold text-white focus:outline-none"
                                                          />
                                                          {item.rarity && (
                                                            <span className="text-[9px] font-black px-1 rounded bg-black/40 text-amber-400 font-mono shrink-0">
                                                              {item.rarity}
                                                            </span>
                                                          )}
                                                          {item.itemType === 'hero' && (
                                                            <span className="text-[8px] font-bold px-1 rounded bg-purple-500/20 text-purple-300 font-mono shrink-0">
                                                              Tướng
                                                            </span>
                                                          )}
                                                        </div>
                                                        <input
                                                          type="text"
                                                          value={item.quantity || ''}
                                                          onChange={(e) =>
                                                            handleUpdateTableCellResourceItem(
                                                              block.id,
                                                              row.id,
                                                              col.id,
                                                              itemIdx,
                                                              { quantity: e.target.value }
                                                            )
                                                          }
                                                          placeholder="Số lượng / Ghi chú (VD: x1, Mảnh x50, CS2 Đỏ+...)"
                                                          className="w-full px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-amber-300 focus:outline-none"
                                                        />
                                                      </div>

                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          handleRemoveTableCellResourceItem(
                                                            block.id,
                                                            row.id,
                                                            col.id,
                                                            itemIdx
                                                          )
                                                        }
                                                        className="text-slate-500 hover:text-red-400 p-1 shrink-0"
                                                        title="Xóa mục này"
                                                      >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                    </div>
                                                  );
                                                })}

                                                {/* Nút thêm vật phẩm / tướng vào ô này */}
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setTargetTableCellForResource({
                                                      blockId: block.id,
                                                      rowId: row.id,
                                                      columnId: col.id,
                                                    });
                                                    setTargetTableCellForHero(null);
                                                    setTargetBlockIdForResource(null);
                                                    setTargetBlockIdForHero(null);
                                                    setResourceModalTab('game-assets');
                                                    setIsResourceModalOpen(true);
                                                  }}
                                                  className={`w-full py-1.5 px-2.5 rounded-xl border border-dashed border-slate-800 hover:border-teal-500/60 bg-slate-900/50 hover:bg-slate-900 text-[11px] text-slate-400 hover:text-teal-300 font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                    cellItems.length > 0 ? 'mt-1.5' : 'py-2.5'
                                                  }`}
                                                >
                                                  <Plus className="w-3.5 h-3.5 text-teal-400" />
                                                  <span>
                                                    {cellItems.length > 0
                                                      ? '+ Thêm Vật Phẩm / Tướng'
                                                      : '+ Chọn Vật Phẩm / Tướng'}
                                                  </span>
                                                </button>
                                              </>
                                            );
                                          })()}
                                        </div>
                                                                            )}
                                    </td>
                                  );
                                })}
                                <td className="py-2.5 px-3 text-center align-middle">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveTableRow(block.id, rIdx, 'up')}
                                      disabled={rIdx === 0}
                                      className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                                      title="Dòng lên"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveTableRow(block.id, rIdx, 'down')}
                                      disabled={rIdx === block.rows.length - 1}
                                      className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                                      title="Dòng xuống"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTableRow(block.id, row.id)}
                                      className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                      title="Xóa dòng"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {block.rows.length === 0 && (
                          <div className="p-8 text-center text-xs text-slate-500">
                            Bảng hiện chưa có dòng nào. Bấm &quot;+ Thêm Dòng Mới&quot; để tạo dòng dữ liệu.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* KHỐI 7: THẺ CHI TIẾT 3 CỘT (TÀI NGUYÊN & TƯỚNG) */}
                {block.type === 'resource-card' && (
                  <div className="space-y-4">
                    {/* Mô tả phụ của khối */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={block.description || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                          placeholder="Mô tả danh sách (VD: Chi tiết công dụng vật phẩm & cách nhận từ hoạt động)..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                        <TagInsertButton
                          onInsert={(tag) =>
                            handleUpdateBlock(block.id, {
                              description: appendTag(block.description, tag),
                            })
                          }
                          title="Chèn liên kết vào Mô Tả Thẻ Chi Tiết"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddCard(block.id)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-md transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Thêm Thẻ Chi Tiết Mới</span>
                      </button>
                    </div>

                    {/* Danh sách các thẻ hiện có trong khối */}
                    <div className="space-y-3">
                      {block.cards?.map((card, cIdx) => (
                        <div
                          key={card.id || cIdx}
                          className="border border-slate-700 bg-slate-950/80 rounded-xl overflow-hidden shadow-lg group hover:border-amber-500/50 transition-all"
                        >
                          {/* Thanh Header Thẻ (Giống Bách Khoa Tài Nguyên) */}
                          <div className="bg-[#464c53] text-white py-1.5 px-3 border-b border-slate-600 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 text-amber-300">
                                #{cIdx + 1}
                              </span>
                              <span className="font-bold text-xs sm:text-sm tracking-wide">
                                {card.name || 'Thẻ chưa đặt tên'}
                              </span>
                              {card.itemType === 'hero' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/80 text-white font-extrabold uppercase">
                                  Tướng {card.rarity ? `(${card.rarity})` : ''}
                                </span>
                              )}
                              {card.itemType === 'item' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/80 text-slate-950 font-extrabold uppercase">
                                  Vật Phẩm
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveCard(block.id, cIdx, 'up')}
                                disabled={cIdx === 0}
                                className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                                title="Di chuyển lên"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCard(block.id, cIdx, 'down')}
                                disabled={cIdx === (block.cards?.length || 0) - 1}
                                className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                                title="Di chuyển xuống"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditCard(block.id, cIdx, card)}
                                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-bold flex items-center gap-1 transition-colors border border-amber-500/30"
                                title="Chỉnh sửa thẻ"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCard(block.id, cIdx)}
                                className="p-1 text-red-400 hover:text-red-300 ml-1"
                                title="Xóa thẻ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 3 Cột Nội Dung Preview */}
                          <div className="flex flex-col sm:flex-row min-h-[80px] divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-slate-900/40 text-xs">
                            {/* Cột 1: Icon / Tướng */}
                            <div className="w-full sm:w-24 shrink-0 flex items-center justify-center p-2.5 bg-slate-950/50">
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center p-0.5">
                                <LayeredIcon
                                  src={card.icon}
                                  alt={card.name}
                                  layers={card.layers}
                                  className="w-full h-full object-contain"
                                  fallbackSrc="/images/heroes/icon_heroes/default.png"
                                />
                                {card.rarity && card.itemType === 'hero' && (
                                  <span className="absolute -top-1 -right-1 text-[8px] font-black px-1 rounded bg-amber-500 text-slate-950 shadow z-20">
                                    {card.rarity}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Cột 2: Công Dụng Bullet Points */}
                            <div className="w-full sm:w-72 shrink-0 p-2.5 flex items-center bg-slate-950/30">
                              <ul className="space-y-1 list-disc list-outside pl-4 text-slate-300 font-medium w-full text-[11px]">
                                {card.description && card.description.length > 0 ? (
                                  card.description.map((bullet, bIdx) => (
                                    <li key={bIdx} className="break-words">
                                      {bullet}
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-slate-500 italic">Chưa có dòng mô tả công dụng</li>
                                )}
                              </ul>
                            </div>

                            {/* Cột 3: Cách Nhận (Icon Hoạt Động) */}
                            <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-center bg-slate-950/20">
                              <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                                Cách nhận ({card.sources?.length || 0} nguồn):
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {card.sources && card.sources.length > 0 ? (
                                  card.sources.map((src, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] text-slate-200"
                                    >
                                      {src.icon && (
                                        <img
                                          src={src.icon}
                                          alt={src.name || src.sourceId}
                                          className="w-4 h-4 object-contain shrink-0"
                                          onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <span className="font-semibold">{src.name || src.sourceId}</span>
                                      {src.note && (
                                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                                          {src.note}
                                        </span>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-500 italic">
                                    Chưa chọn nguồn nhận nào
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!block.cards || block.cards.length === 0) && (
                        <div className="p-8 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                          Chưa có thẻ chi tiết nào trong khối. Nhấp &quot;+ Thêm Thẻ Chi Tiết Mới&quot; ở trên để bắt đầu tạo thẻ.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP-FLOW BLOCK: ĐƯỜNG LINE THAO TÁC STEP BY STEP */}
                {block.type === 'step-flow' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                      <div className="flex-1 min-w-0">
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          Mô tả / Hướng dẫn phụ (tùy chọn):
                        </label>
                        <input
                          type="text"
                          value={block.description || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                          placeholder="Nhập mô tả quy trình thực hiện..."
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetBlockIdForStepFlow(block.id);
                            setStepFlowSearchTerm('');
                            setIsStepFlowPickerOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Thêm Bước (Chọn Ảnh Source)</span>
                        </button>
                      </div>
                    </div>

                    {/* Step Cards List */}
                    <div className="space-y-3">
                      {block.steps?.map((step, sIdx) => (
                        <div
                          key={step.id || sIdx}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-3.5 group hover:border-amber-500/50 transition-all"
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                              #{sIdx + 1}
                            </span>
                            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shrink-0">
                              <img
                                src={step.image}
                                alt={step.name || `Bước ${sIdx + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Tên bước:</label>
                              <input
                                type="text"
                                value={step.name || ''}
                                onChange={(e) => {
                                  const updatedSteps = [...block.steps];
                                  updatedSteps[sIdx] = { ...updatedSteps[sIdx], name: e.target.value };
                                  handleUpdateBlock(block.id, { steps: updatedSteps });
                                }}
                                placeholder="Tên thao tác..."
                                className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Ghi chú thao tác:</label>
                              <input
                                type="text"
                                value={step.description || ''}
                                onChange={(e) => {
                                  const updatedSteps = [...block.steps];
                                  updatedSteps[sIdx] = { ...updatedSteps[sIdx], description: e.target.value };
                                  handleUpdateBlock(block.id, { steps: updatedSteps });
                                }}
                                placeholder="Ghi chú thêm (không bắt buộc)..."
                                className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              disabled={sIdx === 0}
                              onClick={() => {
                                if (sIdx === 0) return;
                                const updatedSteps = [...block.steps];
                                const temp = updatedSteps[sIdx - 1];
                                updatedSteps[sIdx - 1] = updatedSteps[sIdx];
                                updatedSteps[sIdx] = temp;
                                handleUpdateBlock(block.id, { steps: updatedSteps });
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                              title="Di chuyển lên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={sIdx === block.steps.length - 1}
                              onClick={() => {
                                if (sIdx === block.steps.length - 1) return;
                                const updatedSteps = [...block.steps];
                                const temp = updatedSteps[sIdx + 1];
                                updatedSteps[sIdx + 1] = updatedSteps[sIdx];
                                updatedSteps[sIdx] = temp;
                                handleUpdateBlock(block.id, { steps: updatedSteps });
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                              title="Di chuyển xuống"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedSteps = block.steps.filter((_, i) => i !== sIdx);
                                handleUpdateBlock(block.id, { steps: updatedSteps });
                                showToast('Đã xóa bước thao tác', 'success');
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all ml-1"
                              title="Xóa bước này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {(!block.steps || block.steps.length === 0) && (
                        <div className="p-8 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                          Chưa có bước nào trong quy trình. Nhấp &quot;+ Thêm Bước (Chọn Ảnh Source)&quot; ở trên để bắt đầu tạo sơ đồ flow.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thanh nút thêm Block mới */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 flex flex-wrap items-center justify-center gap-3">
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

              <button
                type="button"
                onClick={() => handleAddBlock('hero-source')}
                className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Crown className="w-4 h-4" />
                <span>+ Khối Nguồn Tướng</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('table')}
                className="px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <TableIcon className="w-4 h-4" />
                <span>+ Khối Bảng Biểu (Table)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('resource-card')}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Layers className="w-4 h-4" />
                <span>+ Khối Thẻ Chi Tiết (3 Cột)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('step-flow')}
                className="px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Route className="w-4 h-4" />
                <span>+ Khối Step Flow (Line Thao Tác)</span>
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

      {/* UNIFIED MODAL: CHỌN ĐỐI TƯỢNG GAME (VẬT PHẨM, ASSET & TƯỚNG) */}
      {(isResourceModalOpen || isHeroModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>
                    {targetTableCellForResource || targetTableCellForHero
                      ? 'Chọn Đối Tượng Game (Vật Phẩm / Tướng) Cho Ô Bảng Biểu'
                      : targetCardModalForResource || targetCardModalForHero
                      ? 'Chọn Đối Tượng Game Cho Thẻ Chi Tiết'
                      : targetBlockIdForHero
                      ? 'Kho Tướng & Vật Phẩm Đề Xuất'
                      : 'Kho Tài Nguyên, Vật Phẩm & Tướng Game'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Linh hoạt chọn từ kho asset game (2000+ icons), kho thẻ tướng hoặc danh mục vật phẩm đã cấu hình.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsResourceModalOpen(false);
                  setIsHeroModalOpen(false);
                  setTargetTableCellForResource(null);
                  setTargetTableCellForHero(null);
                  setTargetCardModalForResource(false);
                  setTargetCardModalForHero(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher & Global Layer Options */}
            <div className="flex flex-wrap items-center gap-2 pt-3 pb-2 border-b border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setResourceModalTab('game-assets');
                  setResourceSearchTerm('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  resourceModalTab === 'game-assets'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kho Toàn Bộ Icon & Asset ({assetPickerTotal})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResourceModalTab('heroes');
                  setHeroSearchTerm('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  resourceModalTab === 'heroes'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Kho Thẻ Tướng ({heroesList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResourceModalTab('configured-resources');
                  setResourceSearchTerm('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  resourceModalTab === 'configured-resources'
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Vật Phẩm Đã Cấu Hình ({resourcesList.length})</span>
              </button>

              <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors text-xs text-slate-300 ml-auto shrink-0">
                <input
                  type="checkbox"
                  checked={autoAttachShardLayer}
                  onChange={(e) => setAutoAttachShardLayer(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-slate-900 border-slate-700"
                />
                <span className="font-semibold flex items-center gap-1.5">
                  <span>🧩 Kèm Layer Mảnh</span>
                  <span className="text-[10px] text-amber-400 font-mono">public_shade_2</span>
                </span>
              </label>
            </div>

            {/* TAB 1: KHO TOÀN BỘ ASSET GAME */}
            {resourceModalTab === 'game-assets' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-3">
                {/* Search & Actions Toolbar */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên icon, từ khóa..."
                      value={resourceSearchTerm}
                      onChange={(e) => {
                        setResourceSearchTerm(e.target.value);
                        setAssetPickerPage(1);
                      }}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Lọc theo thư mục asset */}
                  <select
                    value={assetPickerFolder}
                    onChange={(e) => {
                      setAssetPickerFolder(e.target.value);
                      setAssetPickerPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold shrink-0 max-w-[200px]"
                  >
                    <option value="all">Tất cả thư mục ({assetPickerTotal})</option>
                    {assetCategoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} ({cat.count})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => fetchAssetIcons(resourceSearchTerm, assetPickerFolder, assetPickerPage, true)}
                    disabled={isLoadingAssetIcons}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                    title="Quét và làm mới lại toàn bộ kho ảnh/icon từ thư mục hệ thống"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoadingAssetIcons ? 'animate-spin' : ''}`} />
                    <span>{isLoadingAssetIcons ? 'Đang Tải...' : 'Quét Lại Asset Mới'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerMode('resource-upload');
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shrink-0 hover:bg-emerald-400"
                    title="Tải ảnh icon mới từ máy lên"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải Ảnh Lên</span>
                  </button>
                </div>

                {/* Grid hiển thị icons */}
                <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[440px] p-2 bg-slate-950 rounded-2xl border border-slate-800">
                  {isLoadingAssetIcons ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                      <RotateCw className="w-6 h-6 animate-spin text-emerald-400" />
                      <span className="text-xs">Đang tải kho asset icon game...</span>
                    </div>
                  ) : assetPickerIcons.length === 0 ? (
                    <div className="py-20 text-center text-xs text-slate-500">
                      Không tìm thấy icon nào trong thư mục này. Thử tìm từ khóa khác hoặc bấm &quot;Làm Mới&quot;.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {assetPickerIcons.map((ic, iIdx) => (
                        <button
                          key={`${ic.url}-${iIdx}`}
                          type="button"
                          onClick={() => handleAddAssetIconToBlock(ic)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/60 flex flex-col items-center gap-1.5 text-center transition-all group"
                          title={`${ic.name} (${ic.folderLabel})`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800/80 p-1 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                            <LayeredIcon
                              src={ic.url}
                              alt={ic.name}
                              layers={autoAttachShardLayer ? ['game_items/public_shade_2.png'] : undefined}
                              className="w-full h-full object-contain"
                              fallbackSrc="/images/heroes/icon_heroes/default.png"
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-300 truncate w-full">
                            {ic.name.replace(/\.[^/.]+$/, '')}
                          </span>
                          <span className="text-[8px] px-1.5 py-0.2 bg-slate-800 text-emerald-400 rounded border border-slate-700/60 truncate max-w-full">
                            {ic.folderLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {assetPickerTotal > 120 && (
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-xs text-slate-400 shrink-0">
                    <span>
                      Hiển thị {assetPickerIcons.length} / {assetPickerTotal} icon (Trang {assetPickerPage} / {Math.ceil(assetPickerTotal / 120)})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={assetPickerPage <= 1 || isLoadingAssetIcons}
                        onClick={() => setAssetPickerPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold transition-all text-xs"
                      >
                        ← Trang trước
                      </button>
                      <button
                        type="button"
                        disabled={assetPickerPage >= Math.ceil(assetPickerTotal / 120) || isLoadingAssetIcons}
                        onClick={() => setAssetPickerPage((p) => p + 1)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold transition-all text-xs"
                      >
                        Trang sau →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: KHO TƯỚNG GAME */}
            {resourceModalTab === 'heroes' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-3">
                {/* Search & Actions Toolbar */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên tướng, slug, hệ nguyên tố, vai trò..."
                      value={heroSearchTerm}
                      onChange={(e) => setHeroSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleReloadHeroes}
                    disabled={loadingHeroes}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                    title="Tải lại kho tướng mới nhất từ hệ thống"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loadingHeroes ? 'animate-spin' : ''}`} />
                    <span>{loadingHeroes ? 'Đang Tải...' : 'Tải Lại Kho Tướng'}</span>
                  </button>
                </div>

                {/* Tabs lọc theo phân loại tướng */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: 'all', label: `Tất Cả (${heroesList.length})` },
                    { id: 'tier-sp', label: `Tier S+ (${heroesList.filter((h) => h.tier === 'S+').length})` },
                    { id: 'afterlife', label: `Chuyển Thế (${heroesList.filter((h) => h.isAfterlifeForm).length})` },
                    { id: 'base', label: `Mặc Định (${heroesList.filter((h) => !h.isAfterlifeForm && !h.isSkinForm).length})` },
                    { id: 'SSR', label: `SSR (${heroesList.filter((h) => h.rarity === 'SSR').length})` },
                    { id: 'UR', label: `UR (${heroesList.filter((h) => h.rarity === 'UR').length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setHeroCategoryFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        heroCategoryFilter === tab.id
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-400 ml-auto">
                    Hiển thị: <strong className="text-amber-400">{modalHeroes.length}</strong> / {heroesList.length} tướng
                  </span>
                </div>

                {/* Grid hiển thị TOÀN BỘ tướng */}
                <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[440px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                  {modalHeroes.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-xs text-slate-500">
                      Không tìm thấy tướng nào phù hợp với bộ lọc & từ khóa.
                    </div>
                  ) : (
                    modalHeroes.map((hero) => {
                      const isAdded = currentBlockAddedSlugs.has(hero.slug);
                      return (
                        <button
                          key={hero.slug}
                          type="button"
                          onClick={() => handleAddHeroToBlock(hero)}
                          className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 group ${
                            isAdded
                              ? 'bg-amber-500/15 border-amber-500/80 shadow-md ring-1 ring-amber-500/50'
                              : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl border border-slate-700 object-cover shrink-0 overflow-hidden relative">
                            <LayeredIcon
                              src={hero.avatar}
                              alt={hero.name}
                              layers={autoAttachShardLayer ? ['game_items/public_shade_2.png'] : undefined}
                              className="w-full h-full object-cover"
                              fallbackSrc="/images/heroes/icon_heroes/default.png"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-xs truncate text-white group-hover:text-amber-400">
                              {hero.name}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                              <span className="truncate">{hero.element}</span>
                              {isAdded ? (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px] shrink-0">
                                  ✓ Đã thêm
                                </span>
                              ) : (
                                <span className="text-amber-500/70 text-[9px] font-mono shrink-0">
                                  {hero.rarity}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: VẬT PHẨM ĐÃ CẤU HÌNH (resources.json) */}
            {resourceModalTab === 'configured-resources' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm vật phẩm đã cấu hình..."
                      value={resourceSearchTerm}
                      onChange={(e) => setResourceSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleReloadResources}
                    disabled={loadingResources}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                    title="Tải lại danh sách vật phẩm mới nhất từ resources.json"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loadingResources ? 'animate-spin' : ''}`} />
                    <span>{loadingResources ? 'Đang Tải...' : 'Tải Lại DS Cấu Hình'}</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[440px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                  {modalResources.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => handleAddResourceToBlock(res)}
                      className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/50 flex items-center gap-2.5 text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 p-1 shrink-0 overflow-hidden">
                        <LayeredIcon
                          src={res.icon}
                          alt={res.name}
                          layers={autoAttachShardLayer ? ['game_items/public_shade_2.png'] : undefined}
                          className="w-full h-full object-contain"
                          fallbackSrc="/images/heroes/icon_heroes/default.png"
                        />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-white group-hover:text-emerald-400 truncate">
                          {res.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{res.category || 'Vật phẩm'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setIsResourceModalOpen(false);
                  setIsHeroModalOpen(false);
                  setTargetTableCellForResource(null);
                  setTargetTableCellForHero(null);
                  setTargetCardModalForResource(false);
                  setTargetCardModalForHero(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
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
                  <span>
                    {mediaPickerMode === 'guide-thumbnail'
                      ? 'Chọn Ảnh Đại Diện / Banner Bài Viết'
                      : mediaPickerMode === 'activity-banner'
                      ? 'Chọn Ảnh Banner Hoạt Động'
                      : `Thư Viện Ảnh (public/games/${gameSlug}/tai-nguyen-anh)`}
                  </span>
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchMediaFiles}
                  disabled={loadingMedia}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Quét lại folder ảnh trên ổ đĩa"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loadingMedia ? 'animate-spin' : ''}`} />
                  <span>{loadingMedia ? 'Đang Quét...' : 'Tải Lại Thư Viện'}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingImage ? 'Đang Tải...' : 'Tải Ảnh Mới Lên'}</span>
                </button>
              </div>
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
                      if (mediaPickerMode === 'block' && targetBlockIdForImage) {
                        addImageToBlock(targetBlockIdForImage, f.url);
                        setIsImageModalOpen(false);
                      } else if (mediaPickerMode === 'guide-thumbnail' && activeGuide) {
                        setActiveGuide({ ...activeGuide, thumbnail: f.url });
                        showToast('Đã đặt ảnh đại diện bài viết thành công!', 'success');
                        setIsImageModalOpen(false);
                      } else if (mediaPickerMode === 'activity-banner') {
                        setActivityForm((prev) => ({ ...prev, banner: f.url }));
                        showToast('Đã đặt banner hoạt động thành công!', 'success');
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
          <input
            type="file"
            ref={sourceIconFileInputRef}
            onChange={handleUploadSourceIcon}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
          />
          <div className="w-full max-w-xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <span>
                  {editingActivityIndex !== null ? 'Chỉnh Sửa Hoạt Động' : 'Thêm Hoạt Động Mới'}
                </span>
              </h3>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 py-2 custom-scrollbar">
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

              {/* Chọn Icon Hoạt Động (images/resources/sources + Vector) */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Biểu Tượng Hoạt Động (Icon)
                  </label>
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActivityIconTab('source-images')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        activityIconTab === 'source-images'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Icon Game (sources/)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivityIconTab('vector')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        activityIconTab === 'vector'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Icon Vector
                    </button>
                  </div>
                </div>

                {/* Tab 1: Icon từ images/resources/sources */}
                {activityIconTab === 'source-images' && (
                  <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={sourceIconSearch}
                          onChange={(e) => setSourceIconSearch(e.target.value)}
                          placeholder="Tìm icon (ví dụ: xuat-chinh, thap, bau...)"
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {/* Nút Tải Lại Icon tuân thủ asset-reload-rule */}
                      <button
                        type="button"
                        onClick={() => handleReloadSourceImages(true)}
                        disabled={loadingSourceImages}
                        title="Tải lại danh sách icon nóng từ images/resources/sources"
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${loadingSourceImages ? 'animate-spin text-blue-400' : ''}`} />
                        <span>Tải Lại Icon</span>
                      </button>
                      {/* Nút Tải Lên ảnh mới */}
                      <button
                        type="button"
                        onClick={() => sourceIconFileInputRef.current?.click()}
                        disabled={uploadingSourceIcon}
                        title="Tải ảnh mới trực tiếp vào images/resources/sources"
                        className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingSourceIcon ? 'Đang tải...' : 'Tải Lên'}</span>
                      </button>
                    </div>

                    {/* Preview Icon đang chọn */}
                    {activityForm.icon && (activityForm.icon.startsWith('/') || activityForm.icon.startsWith('http') || activityForm.icon.includes('.')) && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[11px] text-slate-400 shrink-0">Đang chọn:</span>
                          <img
                            src={activityForm.icon.startsWith('/') ? activityForm.icon : `/images/resources/sources/${activityForm.icon}`}
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="font-mono text-[11px] truncate">{activityForm.icon.split('/').pop()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActivityForm({ ...activityForm, icon: '' })}
                          className="text-[10px] text-red-400 hover:text-red-300 hover:underline shrink-0 ml-2"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    )}

                    {/* Grid danh sách ảnh */}
                    <div className="max-h-44 overflow-y-auto pr-1 grid grid-cols-4 sm:grid-cols-6 gap-2 custom-scrollbar">
                      {filteredSourceImages.map((img) => {
                        const fullPath = `/images/resources/sources/${img}`;
                        const isSelected = activityForm.icon === fullPath || activityForm.icon === img;
                        const cleanLabel = img.replace(/\.[^/.]+$/, '');
                        return (
                          <button
                            key={img}
                            type="button"
                            onClick={() => setActivityForm({ ...activityForm, icon: fullPath })}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all group relative ${
                              isSelected
                                ? 'bg-blue-600/30 border-blue-500 ring-2 ring-blue-500/50 shadow-md'
                                : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850 text-slate-300'
                            }`}
                            title={img}
                          >
                            <div className="w-8 h-8 flex items-center justify-center">
                              <img
                                src={fullPath}
                                alt={cleanLabel}
                                className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
                                loading="lazy"
                              />
                            </div>
                            <span className="text-[9px] text-slate-400 group-hover:text-slate-200 truncate w-full text-center font-mono">
                              {cleanLabel}
                            </span>
                          </button>
                        );
                      })}
                      {filteredSourceImages.length === 0 && (
                        <div className="col-span-full py-6 text-center text-xs text-slate-500">
                          {loadingSourceImages
                            ? 'Đang tải danh sách icon...'
                            : 'Không tìm thấy icon nào phù hợp. Bạn có thể nhấn "Tải Lên" để thêm ảnh mới!'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Icon Vector (Lucide) */}
                {activityIconTab === 'vector' && (
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
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
                            ? 'bg-blue-500/20 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {ic.icon}
                        <span className="text-[9px]">{ic.id}</span>
                      </button>
                    ))}
                  </div>
                )}
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

              {/* Ảnh Banner Hoạt Động (Tùy chọn) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400">Ảnh Banner Hoạt Động (Tùy chọn)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerMode('activity-banner');
                      setIsImageModalOpen(true);
                    }}
                    className="text-xs text-blue-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Chọn từ Thư Viện</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-20 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                    {activityForm.banner ? (
                      <img src={activityForm.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-slate-600 text-center px-1">Chưa có banner</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={activityForm.banner || ''}
                    onChange={(e) => setActivityForm({ ...activityForm, banner: e.target.value })}
                    placeholder="URL banner (VD: /games/... hoặc https://...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  {activityForm.banner && (
                    <button
                      type="button"
                      onClick={() => setActivityForm({ ...activityForm, banner: '' })}
                      className="p-2 text-red-400 hover:text-white"
                      title="Xóa banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
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

      {/* MODAL: CHỈNH SỬA / THÊM THẺ CHI TIẾT 3 CỘT (VẬT PHẨM & TƯỚNG) */}
      {editingCardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingCardModal.cardIndex !== null
                      ? `Chỉnh Sửa Thẻ: ${editingCardModal.data.name || 'Chi Tiết'}`
                      : 'Thêm Thẻ Chi Tiết Mới (3 Cột)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cột 1: Vật phẩm hoặc Tướng | Cột 2: Công dụng | Cột 3: Nguồn nhận
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCardModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Form */}
            <div className="space-y-4 text-xs">
              {/* Tên Thẻ (Hiển thị Header thanh xám) */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  Tên Thẻ (Hiển thị căn giữa trên thanh xám) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingCardModal.data.name}
                  onChange={(e) =>
                    setEditingCardModal({
                      ...editingCardModal,
                      data: { ...editingCardModal.data, name: e.target.value },
                    })
                  }
                  placeholder="VD: Đá Rèn Cao Cấp, Thể Lực 100, Goku Siêu Xayda..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-amber-500 outline-none"
                />
              </div>

              {/* CỘT 1: CHỌN ĐỐI TƯỢNG (VẬT PHẨM HOẶC TƯỚNG) */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400">Cột 1:</span>
                    <span className="font-semibold text-white">Chọn Loại Đối Tượng (Icon Vật Phẩm hoặc Tướng):</span>
                  </div>

                  {/* Switch Tabs Loại: Vật Phẩm vs Tướng */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingCardModal({
                          ...editingCardModal,
                          data: { ...editingCardModal.data, itemType: 'item', heroSlug: undefined, rarity: undefined },
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        editingCardModal.data.itemType !== 'hero'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📦 Vật Phẩm / Asset
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCardModal({
                          ...editingCardModal,
                          data: { ...editingCardModal.data, itemType: 'hero' },
                        });
                        setIsCardHeroPickerOpen(true);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        editingCardModal.data.itemType === 'hero'
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🦸 Tướng ({heroesList.length})
                    </button>
                  </div>
                </div>

                {/* Giao diện khi chọn Vật Phẩm */}
                {editingCardModal.data.itemType !== 'hero' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 p-1 relative overflow-hidden">
                      {editingCardModal.data.icon ? (
                        <LayeredIcon
                          src={editingCardModal.data.icon}
                          alt="Preview"
                          layers={editingCardModal.data.layers}
                          className="w-full h-full object-contain"
                          fallbackSrc="/images/heroes/icon_heroes/default.png"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-500">Chưa có icon</span>
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="text"
                        value={editingCardModal.data.icon}
                        onChange={(e) =>
                          setEditingCardModal({
                            ...editingCardModal,
                            data: { ...editingCardModal.data, icon: e.target.value },
                          })
                        }
                        placeholder="URL icon vật phẩm (VD: /images/resources/...)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-amber-500 outline-none"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCardModalForResource(true);
                            setTargetBlockIdForResource(null);
                            setTargetTableCellForResource(null);
                            setIsResourceModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-bold flex items-center gap-1.5 transition-colors border border-amber-500/30 text-xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Mở Kho Asset Phân Loại (2000+ Icons)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const hasShard = editingCardModal.data.layers?.includes('game_items/public_shade_2.png');
                            const nextLayers = hasShard
                              ? (editingCardModal.data.layers || []).filter((l) => l !== 'game_items/public_shade_2.png')
                              : [...(editingCardModal.data.layers || []), 'game_items/public_shade_2.png'];
                            setEditingCardModal({
                              ...editingCardModal,
                              data: {
                                ...editingCardModal.data,
                                layers: nextLayers.length > 0 ? nextLayers : undefined,
                              },
                            });
                          }}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-xs border transition-colors flex items-center gap-1.5 ${
                            editingCardModal.data.layers?.includes('game_items/public_shade_2.png')
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{editingCardModal.data.layers?.includes('game_items/public_shade_2.png') ? '★ Kèm Mảnh' : '+ Layer Mảnh'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setLayerModal({
                              isOpen: true,
                              title: `Quản Lý Layer - ${editingCardModal.data.name || 'Thẻ chi tiết'}`,
                              baseIcon: editingCardModal.data.icon,
                              layers: editingCardModal.data.layers || [],
                              onSave: (newLayers) => {
                                setEditingCardModal({
                                  ...editingCardModal,
                                  data: {
                                    ...editingCardModal.data,
                                    layers: newLayers.length > 0 ? newLayers : undefined,
                                  },
                                });
                              },
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>Quản Lý Layer ({editingCardModal.data.layers?.length || 0})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Giao diện khi chọn Tướng */
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-purple-500/50 flex items-center justify-center shrink-0 p-0.5 overflow-hidden">
                        {editingCardModal.data.icon ? (
                          <LayeredIcon
                            src={editingCardModal.data.icon}
                            alt="Preview Hero"
                            layers={editingCardModal.data.layers}
                            className="w-full h-full object-cover rounded-xl"
                            fallbackSrc="/images/heroes/icon_heroes/default.png"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-500">Chưa chọn tướng</span>
                        )}
                        {editingCardModal.data.rarity && (
                          <span className="absolute top-0.5 right-0.5 px-1 py-0.2 text-[8px] font-black rounded bg-amber-500 text-slate-950 z-20">
                            {editingCardModal.data.rarity}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-white font-bold text-xs">
                            {editingCardModal.data.heroSlug
                              ? `Tướng đã chọn: ${editingCardModal.data.name}`
                              : 'Chưa chọn tướng nào từ kho'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsCardHeroPickerOpen(!isCardHeroPickerOpen)}
                              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl font-bold flex items-center gap-1.5 transition-colors border border-purple-500/30 text-xs"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>{isCardHeroPickerOpen ? 'Đóng kho nhanh' : 'Chọn Nhanh Tại Đây'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetCardModalForHero(true);
                                setHeroSearchTerm('');
                                setHeroCategoryFilter('all');
                                setResourceModalTab('heroes');
                                setIsHeroModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs shadow-md"
                              title="Mở toàn màn hình kho 325 tướng"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Mở Kho Tướng Đầy Đủ ({heroesList.length})</span>
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editingCardModal.data.icon}
                          onChange={(e) =>
                            setEditingCardModal({
                              ...editingCardModal,
                              data: { ...editingCardModal.data, icon: e.target.value },
                            })
                          }
                          placeholder="Đường dẫn avatar tướng..."
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Sub-picker danh sách tướng ĐẦY ĐỦ (325 tướng, có bộ lọc & reload) */}
                    {isCardHeroPickerOpen && (
                      <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              value={cardHeroSearch}
                              onChange={(e) => setCardHeroSearch(e.target.value)}
                              placeholder="Tìm kiếm theo tên tướng, slug, hệ, vai trò..."
                              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-purple-500 outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleReloadHeroes}
                            disabled={loadingHeroes}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                            title="Tải lại kho tướng mới nhất từ hệ thống"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${loadingHeroes ? 'animate-spin' : ''}`} />
                            <span>{loadingHeroes ? 'Đang Tải...' : 'Tải Lại Asset'}</span>
                          </button>
                        </div>

                        {/* Tabs phân loại độ hiếm & hình thái */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {[
                            { id: 'all', label: `Tất Cả (${heroesList.length})` },
                            { id: 'tier-sp', label: `Tier S+ (${heroesList.filter((h) => h.tier === 'S+').length})` },
                            { id: 'afterlife', label: `Chuyển Thế (${heroesList.filter((h) => h.isAfterlifeForm).length})` },
                            { id: 'base', label: `Mặc Định (${heroesList.filter((h) => !h.isAfterlifeForm && !h.isSkinForm).length})` },
                            { id: 'SSR', label: `SSR (${heroesList.filter((h) => h.rarity === 'SSR').length})` },
                            { id: 'UR', label: `UR (${heroesList.filter((h) => h.rarity === 'UR').length})` },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setCardHeroCategoryFilter(tab.id as any)}
                              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-all ${
                                cardHeroCategoryFilter === tab.id
                                  ? 'bg-purple-500 text-white shadow-sm'
                                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                          <span className="text-[11px] text-slate-400 ml-auto">
                            Hiển thị: <strong className="text-purple-400">{cardFilteredHeroes.length}</strong> / {heroesList.length} tướng
                          </span>
                        </div>

                        {/* Grid toàn bộ tướng không bị giới hạn slice */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                          {cardFilteredHeroes.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-xs text-slate-500">
                              Không tìm thấy tướng nào phù hợp với bộ lọc & từ khóa.
                            </div>
                          ) : (
                            cardFilteredHeroes.map((hero) => {
                              const isSelected = editingCardModal.data.heroSlug === hero.slug;
                              return (
                                <button
                                  key={hero.slug}
                                  type="button"
                                  onClick={() => {
                                    setEditingCardModal({
                                      ...editingCardModal,
                                      data: {
                                        ...editingCardModal.data,
                                        name: hero.name,
                                        icon: hero.avatar,
                                        heroSlug: hero.slug,
                                        rarity: hero.rarity || 'SSR',
                                        itemType: 'hero',
                                      },
                                    });
                                    setIsCardHeroPickerOpen(false);
                                  }}
                                  className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                                    isSelected
                                      ? 'bg-purple-500/25 border-purple-500 ring-2 ring-purple-500/50'
                                      : 'bg-slate-950 border-slate-800 hover:border-purple-500/40'
                                  }`}
                                >
                                  <div className="relative">
                                    <img
                                      src={hero.avatar}
                                      alt={hero.name}
                                      className="w-11 h-11 rounded-lg object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/heroes/icon_heroes/default.png';
                                      }}
                                    />
                                    {hero.rarity && (
                                      <span className="absolute -top-1 -right-1 px-1 py-0.2 text-[8px] font-black rounded bg-amber-500 text-slate-950">
                                        {hero.rarity}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-white truncate w-full text-center">
                                    {hero.name}
                                  </span>
                                  {hero.element && (
                                    <span className="text-[9px] text-slate-400 truncate">
                                      {hero.element}
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CỘT 2: CÔNG DỤNG (BULLET POINTS) */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400">Cột 2:</span>
                    <span className="font-semibold text-white">Công Dụng (Mô tả chi tiết dạng gạch đầu dòng):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCardModal({
                        ...editingCardModal,
                        data: {
                          ...editingCardModal.data,
                          description: [...editingCardModal.data.description, ''],
                        },
                      })
                    }
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm dòng</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editingCardModal.data.description.map((desc, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold">•</span>
                      <input
                        type="text"
                        value={desc}
                        onChange={(e) => {
                          const newDescs = [...editingCardModal.data.description];
                          newDescs[dIdx] = e.target.value;
                          setEditingCardModal({
                            ...editingCardModal,
                            data: { ...editingCardModal.data, description: newDescs },
                          });
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs"
                        placeholder="VD: Dùng để nâng cấp trang bị, tăng vĩnh viễn 10% lực chiến..."
                      />
                      <TagInsertButton
                        onInsert={(tag) => {
                          const newDescs = [...editingCardModal.data.description];
                          newDescs[dIdx] = appendTag(newDescs[dIdx], tag);
                          setEditingCardModal({
                            ...editingCardModal,
                            data: { ...editingCardModal.data, description: newDescs },
                          });
                        }}
                        size="xs"
                        showLabel={false}
                        title="Chèn liên kết vào dòng công dụng"
                      />
                      {editingCardModal.data.description.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newDescs = editingCardModal.data.description.filter((_, i) => i !== dIdx);
                            setEditingCardModal({
                              ...editingCardModal,
                              data: { ...editingCardModal.data, description: newDescs },
                            });
                          }}
                          className="text-red-400 hover:text-red-300 p-1.5"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CỘT 3: CÁCH NHẬN (NGUỒN NHẬN / SỰ KIỆN) */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400">Cột 3:</span>
                    <span className="font-semibold text-white">Cách Nhận (Chọn các icon sự kiện & ghi chú điều kiện):</span>
                    <span className="text-slate-500 text-[11px]">
                      • Đã chọn {editingCardModal.data.sources.length} nguồn
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isSyncingSources}
                    onClick={handleSyncSourcesFromFolder}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-700 transition-all flex items-center gap-1 self-start sm:self-auto"
                    title="Tự động quét các icon sự kiện mới trong public/images/resources/sources/"
                  >
                    <span>🔄 {isSyncingSources ? 'Đang quét...' : 'Quét ảnh mới (sources/)'}</span>
                  </button>
                </div>

                {/* Grid chọn nguồn nhận */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-52 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800">
                  {sourcesList.map((src) => {
                    const isSelected = editingCardModal.data.sources.some((s) => s.sourceId === src.id);
                    return (
                      <div
                        key={src.id}
                        onClick={() => {
                          let nextSources: GuideResourceCardSourceRef[];
                          if (isSelected) {
                            nextSources = editingCardModal.data.sources.filter((s) => s.sourceId !== src.id);
                          } else {
                            nextSources = [
                              ...editingCardModal.data.sources,
                              { sourceId: src.id, name: src.name, icon: src.icon, note: '' },
                            ];
                          }
                          setEditingCardModal({
                            ...editingCardModal,
                            data: { ...editingCardModal.data, sources: nextSources },
                          });
                        }}
                        className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-2 select-none ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 p-0.5 shrink-0 flex items-center justify-center">
                          <img
                            src={src.icon}
                            alt={src.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold truncate flex-1">{src.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Danh sách các nguồn đã chọn để nhập ghi chú điều kiện */}
                {editingCardModal.data.sources.length > 0 && (
                  <div className="pt-2 space-y-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      Ghi chú điều kiện / số lượng cho các nguồn đã chọn:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {editingCardModal.data.sources.map((sRef, sIdx) => {
                        const srcMeta = sourcesList.find((s) => s.id === sRef.sourceId);
                        const displayName = sRef.name || srcMeta?.name || sRef.sourceId;
                        return (
                          <div
                            key={sRef.sourceId || sIdx}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2"
                          >
                            <span className="text-xs font-bold text-white truncate w-32 shrink-0">
                              {displayName}
                            </span>
                            <input
                              type="text"
                              value={sRef.note || ''}
                              onChange={(e) => {
                                const updated = [...editingCardModal.data.sources];
                                updated[sIdx] = { ...updated[sIdx], note: e.target.value };
                                setEditingCardModal({
                                  ...editingCardModal,
                                  data: { ...editingCardModal.data, sources: updated },
                                });
                              }}
                              placeholder="Ghi chú: x50, Top 1-10, Mốc 5000đ..."
                              className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-amber-300 font-semibold focus:border-amber-500 outline-none"
                            />
                            <TagInsertButton
                              onInsert={(tag) => {
                                const updated = [...editingCardModal.data.sources];
                                updated[sIdx] = { ...updated[sIdx], note: appendTag(updated[sIdx].note, tag) };
                                setEditingCardModal({
                                  ...editingCardModal,
                                  data: { ...editingCardModal.data, sources: updated },
                                });
                              }}
                              size="xs"
                              showLabel={false}
                              title="Chèn liên kết vào nguồn nhận"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = editingCardModal.data.sources.filter((_, i) => i !== sIdx);
                                setEditingCardModal({
                                  ...editingCardModal,
                                  data: { ...editingCardModal.data, sources: updated },
                                });
                              }}
                              className="text-slate-500 hover:text-red-400 p-1 shrink-0"
                              title="Gỡ nguồn này"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingCardModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveCardModal}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingCardModal.cardIndex !== null ? 'Cập Nhật Thẻ' : 'Thêm Thẻ Vào Khối'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL TAG PICKER MODAL (CHÈN LIÊN KẾT CHO MỌI KHỐI) */}
      {tagPickerModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {tagPickerModal.title || 'Chèn Liên Kết Vào Nội Dung'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bấm vào mục muốn liên kết để tự động chèn thẻ điều hướng vào ô đang nhập
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTagPickerModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab điều hướng */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setTagModalTab('activities')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tagModalTab === 'activities'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Hoạt Động ({activities.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTagModalTab('heroes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tagModalTab === 'heroes'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tướng ({heroesList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTagModalTab('resources')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tagModalTab === 'resources'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>💎 Kho Tài Nguyên</span>
              </button>
            </div>

            {/* Ô tìm kiếm */}
            {tagModalTab !== 'resources' && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={tagModalSearch}
                  onChange={(e) => setTagModalSearch(e.target.value)}
                  placeholder={
                    tagModalTab === 'activities'
                      ? 'Tìm theo tên hoặc slug hoạt động...'
                      : 'Tìm theo tên hoặc slug tướng...'
                  }
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Nội dung danh sách theo Tab */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px] max-h-[380px]">
              {tagModalTab === 'activities' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activities
                    .filter(
                      (a) =>
                        !tagModalSearch ||
                        a.name.toLowerCase().includes(tagModalSearch.toLowerCase()) ||
                        a.slug.toLowerCase().includes(tagModalSearch.toLowerCase())
                    )
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          tagPickerModal.onSelect(`[[${a.slug}|${a.name}]]`);
                          setTagPickerModal(null);
                          showToast(`Đã chèn link hoạt động: ${a.name}`, 'success');
                        }}
                        className="p-2.5 rounded-xl bg-slate-950 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-left transition-all flex items-center gap-2.5 group"
                      >
                        {a.icon?.startsWith('/') ? (
                          <img
                            src={a.icon}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                            {a.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            /{a.slug}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {tagModalTab === 'heroes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {heroesList
                    .filter(
                      (h) =>
                        !tagModalSearch ||
                        h.name.toLowerCase().includes(tagModalSearch.toLowerCase()) ||
                        h.slug.toLowerCase().includes(tagModalSearch.toLowerCase())
                    )
                    .slice(0, 50)
                    .map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          tagPickerModal.onSelect(`[[hero:${h.slug}|${h.name}]]`);
                          setTagPickerModal(null);
                          showToast(`Đã chèn link tướng: ${h.name}`, 'success');
                        }}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-left transition-all flex items-center gap-2 group"
                      >
                        <img
                          src={h.avatar}
                          alt={h.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/heroes/icon_heroes/default.png';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                              {h.name}
                            </span>
                            {h.rarity && (
                              <span className="text-[9px] font-mono font-bold text-amber-400 bg-black/40 px-1 rounded">
                                {h.rarity}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {h.slug}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {tagModalTab === 'resources' && (
                <div className="space-y-4 p-2">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">
                      Kho Tài Nguyên Hệ Thống:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        tagPickerModal.onSelect('[[resources|Kho Tài Nguyên]]');
                        setTagPickerModal(null);
                        showToast('Đã chèn liên kết Kho Tài Nguyên', 'success');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <span>💎 Chèn thẻ liên kết &quot;Kho Tài Nguyên&quot;</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">
                      Cú pháp tag mẫu để gõ tay nhanh:
                    </span>
                    <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 font-mono">
                      <li><code>[[slug-hoat-dong|Tên hiển thị]]</code>: Link tới hoạt động/hướng dẫn</li>
                      <li><code>[[hero:slug-tuong|Tên tướng]]</code>: Link tới trang chi tiết tướng</li>
                      <li><code>[[resources|Tên hiển thị]]</code>: Link tới kho tài nguyên</li>
                      <li><code>[Tiêu đề](https://...)</code>: Link trang ngoài bất kỳ</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUẢN LÝ LAYER CHỒNG HÌNH ẢNH (LAYER MANAGER) */}
      {layerModal && layerModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{layerModal.title}</h3>
                  <p className="text-xs text-slate-400">Chồng nhiều layer ảnh lên icon / avatar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLayerModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1 relative shrink-0">
                <LayeredIcon
                  src={layerModal.baseIcon}
                  layers={layerModal.layers}
                  className="w-full h-full object-contain"
                  fallbackSrc="/images/heroes/icon_heroes/default.png"
                />
              </div>
              <div className="flex-1 text-xs space-y-1">
                <div className="font-bold text-white">Ảnh Xem Trước (Live Preview)</div>
                <div className="text-slate-400">
                  Số layer đang kích hoạt: <span className="font-mono text-amber-400 font-bold">{layerModal.layers.length}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Các layer sẽ được hiển thị đồng bộ ở cả trang quản trị và bài viết công khai.
                </div>
              </div>
            </div>

            {/* Presets Nhanh */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300">Preset Layer Thông Dụng:</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_LAYERS.map((preset) => {
                  const isActive = layerModal.layers.includes(preset.path);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const next = isActive
                          ? layerModal.layers.filter((l) => l !== preset.path)
                          : [...layerModal.layers, preset.path];
                        setLayerModal({ ...layerModal, layers: next });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>{preset.name}</span>
                      <span className="text-[10px] opacity-70">({preset.path})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Danh Sách Layer Hiện Tại */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300">Danh Sách Layer Đang Chồng (Thứ tự từ dưới lên trên):</span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                {layerModal.layers.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500 italic">
                    Chưa có layer nào được chồng. Chọn preset bên trên hoặc click Thêm Mảnh.
                  </div>
                ) : (
                  layerModal.layers.map((layerPath, lIdx) => (
                    <div
                      key={lIdx}
                      className="flex items-center justify-between gap-2 p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={normalizeLayerPath(layerPath)}
                          alt=""
                          className="w-6 h-6 object-contain bg-slate-950 rounded p-0.5 border border-slate-700 shrink-0"
                        />
                        <span className="font-mono text-[11px] text-slate-300 truncate">{layerPath}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={lIdx === 0}
                          onClick={() => {
                            const next = [...layerModal.layers];
                            const temp = next[lIdx];
                            next[lIdx] = next[lIdx - 1];
                            next[lIdx - 1] = temp;
                            setLayerModal({ ...layerModal, layers: next });
                          }}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Lên trên"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={lIdx === layerModal.layers.length - 1}
                          onClick={() => {
                            const next = [...layerModal.layers];
                            const temp = next[lIdx];
                            next[lIdx] = next[lIdx + 1];
                            next[lIdx + 1] = temp;
                            setLayerModal({ ...layerModal, layers: next });
                          }}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Xuống dưới"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = layerModal.layers.filter((_, idx) => idx !== lIdx);
                            setLayerModal({ ...layerModal, layers: next });
                          }}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Xóa layer này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLayerModal({ ...layerModal, layers: [] })}
                disabled={layerModal.layers.length === 0}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
              >
                Xóa tất cả layer
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLayerModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    layerModal.onSave(layerModal.layers);
                    setLayerModal(null);
                    showToast('Đã lưu cấu hình layer thành công!', 'success');
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
                >
                  Áp Dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* STEP FLOW PICKER MODAL: CHỌN ẢNH TỪ KHO SOURCE IMAGES */}
      {isStepFlowPickerOpen && targetBlockIdForStepFlow && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Route className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Chọn Ảnh Thao Tác (Kho Source Images)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kho ảnh thư mục: <code className="text-amber-400 font-mono">public/images/resources/sources</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStepFlowPickerOpen(false);
                  setTargetBlockIdForStepFlow(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Reload Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={stepFlowSearchTerm}
                  onChange={(e) => setStepFlowSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo tên file ảnh source (ví dụ: ghep-da, anh-hung, van-menh)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleReloadSourceImages(true)}
                disabled={loadingSourceImages}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
                title="Làm mới lại kho ảnh từ thư mục"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loadingSourceImages ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm Mới</span>
              </button>
            </div>

            {/* Grid of Source Images */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sourceImagesList
                  .filter((img) =>
                    !stepFlowSearchTerm.trim() ||
                    img.toLowerCase().includes(stepFlowSearchTerm.toLowerCase().trim())
                  )
                  .map((imgFile) => {
                    const cleanName = imgFile
                      .replace(/\.[^/.]+$/, '')
                      .replace(/[_\-]/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase());
                    const imgUrl = `/images/resources/sources/${imgFile}`;

                    return (
                      <button
                        key={imgFile}
                        type="button"
                        onClick={() => {
                          if (!activeGuide || !targetBlockIdForStepFlow) return;
                          const block = activeGuide.blocks.find(
                            (b) => b.id === targetBlockIdForStepFlow
                          ) as GuideStepFlowBlock | undefined;

                          if (block) {
                            const newStep: GuideStepFlowItem = {
                              id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                              sourceId: imgFile.replace(/\.[^/.]+$/, ''),
                              image: imgUrl,
                              name: cleanName,
                              description: '',
                            };
                            const updatedSteps = [...(block.steps || []), newStep];
                            handleUpdateBlock(targetBlockIdForStepFlow, { steps: updatedSteps });
                            showToast(`Đã thêm bước: ${cleanName}`, 'success');
                          }
                          setIsStepFlowPickerOpen(false);
                          setTargetBlockIdForStepFlow(null);
                        }}
                        className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500 hover:bg-slate-850 flex flex-col items-center gap-2 group transition-all text-center"
                      >
                        <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                          <img
                            src={imgUrl}
                            alt={cleanName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.opacity = '0.4';
                            }}
                          />
                        </div>
                        <div className="w-full">
                          <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                            {cleanName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {imgFile}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {sourceImagesList.filter((img) =>
                !stepFlowSearchTerm.trim() ||
                img.toLowerCase().includes(stepFlowSearchTerm.toLowerCase().trim())
              ).length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  Không tìm thấy ảnh source nào khớp với từ khóa tìm kiếm.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsStepFlowPickerOpen(false);
                  setTargetBlockIdForStepFlow(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
