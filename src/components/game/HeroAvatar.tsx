import React from 'react';
import Image from 'next/image';

interface HeroAvatarProps {
  src?: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const HeroAvatar: React.FC<HeroAvatarProps> = ({
  src,
  alt,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-14 h-14 text-3xl',
    xl: 'w-24 h-24 sm:w-28 sm:h-28 text-5xl',
  };

  const isImageFile = src && (src.startsWith('/') || src.startsWith('http')) && !src.includes('default_hero.png');

  return (
    <div
      className={`rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner ${sizeClasses[size]} ${className}`}
    >
      {isImageFile ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <span role="img" aria-label={alt}>
          🦸
        </span>
      )}
    </div>
  );
};
