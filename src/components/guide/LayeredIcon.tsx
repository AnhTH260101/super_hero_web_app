'use client';

import React from 'react';

/**
 * Danh sách các layer mẫu có sẵn trong hệ thống
 */
export interface LayerPreset {
  id: string;
  name: string;
  path: string;
  fullPath: string;
  description: string;
}

export const PRESET_LAYERS: LayerPreset[] = [
  {
    id: 'shard',
    name: 'Mảnh ghép / Shard',
    path: 'game_items/public_shade_2.png',
    fullPath: '/images/resources/game_items/public_shade_2.png',
    description: 'Biểu tượng mảnh ghép vàng ở góc dưới',
  },
];

/**
 * Chuẩn hóa đường dẫn layer đảm bảo tải đúng từ web_portal/public
 */
export function normalizeLayerPath(path: string): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  if (trimmed.startsWith('game_items/')) {
    return `/images/resources/${trimmed}`;
  }
  return `/images/resources/game_items/${trimmed}`;
}

export interface LayeredIconProps {
  src?: string;
  alt?: string;
  layers?: string[];
  className?: string;
  imgClassName?: string;
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
  onClick?: () => void;
  title?: string;
  children?: React.ReactNode;
}

/**
 * Component hiển thị icon tài nguyên hoặc tướng với khả năng xếp chồng nhiều layer lên trên
 */
export const LayeredIcon: React.FC<LayeredIconProps> = ({
  src,
  alt = '',
  layers = [],
  className = 'w-full h-full',
  imgClassName = 'w-full h-full object-contain',
  fallbackSrc = '/images/heroes/icon_heroes/default.png',
  fallbackIcon,
  onClick,
  title,
  children,
}) => {
  const [hasError, setHasError] = React.useState(false);

  // Lọc các layer hợp lệ
  const validLayers = (layers || []).filter((l) => typeof l === 'string' && l.trim().length > 0);

  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative inline-flex items-center justify-center shrink-0 ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* 1. Base Image */}
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className={imgClassName}
          onError={() => {
            if (fallbackSrc && src !== fallbackSrc) {
              setHasError(true);
            }
          }}
          loading="lazy"
        />
      ) : hasError && fallbackSrc ? (
        <img src={fallbackSrc} alt={alt} className={imgClassName} loading="lazy" />
      ) : (
        fallbackIcon || null
      )}

      {/* 2. Overlaid Layers (Xếp chồng theo thứ tự mảng) */}
      {validLayers.map((layerPath, idx) => {
        const fullUrl = normalizeLayerPath(layerPath);
        return (
          <img
            key={`${fullUrl}-${idx}`}
            src={fullUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-10"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        );
      })}

      {/* 3. Children (Badges, tag, số lượng...) */}
      {children && <div className="relative z-20 w-full h-full pointer-events-none">{children}</div>}
    </div>
  );
};
