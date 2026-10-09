export interface TierColorOption {
  id: string;
  name: string;
  hex: string;
  badgeClass: string;
  borderClass: string;
  bgSubtleClass: string;
  textClass: string;
}

export const TIER_PRESET_COLORS: TierColorOption[] = [
  {
    id: 'red',
    name: 'Đỏ (T0 / Cực Phẩm)',
    hex: '#ef4444',
    badgeClass: 'bg-red-500 text-white border-red-400',
    borderClass: 'border-red-500/40',
    bgSubtleClass: 'bg-red-500/10',
    textClass: 'text-red-400',
  },
  {
    id: 'amber',
    name: 'Cam Vàng (T1 / Xuất Sắc)',
    hex: '#f59e0b',
    badgeClass: 'bg-amber-500 text-slate-950 border-amber-400',
    borderClass: 'border-amber-500/40',
    bgSubtleClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
  },
  {
    id: 'purple',
    name: 'Tím (T2 / Rất Tốt)',
    hex: '#a855f7',
    badgeClass: 'bg-purple-600 text-white border-purple-400',
    borderClass: 'border-purple-500/40',
    bgSubtleClass: 'bg-purple-500/10',
    textClass: 'text-purple-400',
  },
  {
    id: 'blue',
    name: 'Xanh Dương (T3 / Khá Tốt)',
    hex: '#3b82f6',
    badgeClass: 'bg-blue-600 text-white border-blue-400',
    borderClass: 'border-blue-500/40',
    bgSubtleClass: 'bg-blue-500/10',
    textClass: 'text-blue-400',
  },
  {
    id: 'emerald',
    name: 'Xanh Lục',
    hex: '#10b981',
    badgeClass: 'bg-emerald-600 text-white border-emerald-400',
    borderClass: 'border-emerald-500/40',
    bgSubtleClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
  },
  {
    id: 'pink',
    name: 'Hồng',
    hex: '#ec4899',
    badgeClass: 'bg-pink-600 text-white border-pink-400',
    borderClass: 'border-pink-500/40',
    bgSubtleClass: 'bg-pink-500/10',
    textClass: 'text-pink-400',
  },
  {
    id: 'cyan',
    name: 'Xanh Lơ',
    hex: '#06b6d4',
    badgeClass: 'bg-cyan-600 text-slate-950 border-cyan-400',
    borderClass: 'border-cyan-500/40',
    bgSubtleClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
  },
  {
    id: 'slate',
    name: 'Xám Ghi',
    hex: '#64748b',
    badgeClass: 'bg-slate-700 text-white border-slate-500',
    borderClass: 'border-slate-700',
    bgSubtleClass: 'bg-slate-800/60',
    textClass: 'text-slate-300',
  },
];

export function getTierColor(colorIdOrHex: string): TierColorOption {
  if (!colorIdOrHex) return TIER_PRESET_COLORS[0];
  const found = TIER_PRESET_COLORS.find(
    (c) => c.id === colorIdOrHex.toLowerCase() || c.hex.toLowerCase() === colorIdOrHex.toLowerCase()
  );
  if (found) return found;

  return {
    id: colorIdOrHex,
    name: colorIdOrHex,
    hex: colorIdOrHex.startsWith('#') ? colorIdOrHex : '#64748b',
    badgeClass: 'bg-slate-700 text-white border-slate-500',
    borderClass: 'border-slate-700',
    bgSubtleClass: 'bg-slate-800/60',
    textClass: 'text-slate-300',
  };
}
