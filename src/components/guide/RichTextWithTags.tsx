'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, ArrowUpRight, Sparkles, Users, Calendar } from 'lucide-react';
import { GameActivity } from '@/types/game';

interface Props {
  text?: string;
  gameSlug: string;
  activities?: GameActivity[];
  className?: string;
}

export const RichTextWithTags: React.FC<Props> = ({
  text,
  gameSlug,
  activities = [],
  className = '',
}) => {
  if (!text) return null;

  // Regex matching [[tag]] or [text](url)
  const regex = /(?:\[\[([^\]]+)\]\]|\[([^\]]+)\]\(([^)]+)\))/g;

  if (!regex.test(text)) {
    return <span className={className}>{text}</span>;
  }

  // Reset regex index after test
  regex.lastIndex = 0;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>
      );
    }

    const key = `match-${match.index}`;

    if (match[1]) {
      // Syntax: [[...]]
      const inner = match[1].trim();
      const parts = inner.split('|');
      const target = parts[0].trim();
      const customLabel = parts[1]?.trim();

      if (target.startsWith('hero:')) {
        const heroSlug = target.replace(/^hero:/, '').trim();
        const label = customLabel || heroSlug;
        elements.push(
          <Link
            key={key}
            href={`/${gameSlug}/heroes/${heroSlug}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 hover:text-purple-200 font-bold text-xs transition-all shadow-xs align-baseline group"
            title={`Xem chi tiết tướng: ${label}`}
          >
            <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>{label}</span>
            <ArrowUpRight className="w-3 h-3 text-purple-400/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </Link>
        );
      } else if (
        target === 'resource' ||
        target === 'resources' ||
        target.startsWith('resource:') ||
        target.startsWith('resources:')
      ) {
        const label = customLabel || 'Kho Tài Nguyên';
        elements.push(
          <Link
            key={key}
            href={`/${gameSlug}/resources`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-bold text-xs transition-all shadow-xs align-baseline group"
            title="Xem danh mục tài nguyên game"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{label}</span>
            <ArrowUpRight className="w-3 h-3 text-emerald-400/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </Link>
        );
      } else {
        // Activity / Feature Link: [[slug]] or [[slug|Label]]
        const actSlug = target;
        const act = activities.find((a) => a.slug === actSlug);
        const label = customLabel || act?.name || actSlug;

        elements.push(
          <Link
            key={key}
            href={`/${gameSlug}/daily/${actSlug}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 font-bold text-xs transition-all shadow-xs align-baseline group"
            title={`Xem chi tiết hoạt động: ${label}`}
          >
            {act?.icon?.startsWith('/') ? (
              <img
                src={act.icon}
                alt=""
                className="w-3.5 h-3.5 object-cover rounded shrink-0"
              />
            ) : (
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span>{label}</span>
            <ArrowUpRight className="w-3 h-3 text-amber-400/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </Link>
        );
      }
    } else if (match[2] && match[3]) {
      // Syntax: [text](url)
      const label = match[2];
      const url = match[3].trim();

      if (url.startsWith('http')) {
        elements.push(
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 underline font-semibold transition-colors"
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />
          </a>
        );
      } else {
        const finalUrl = url.startsWith('/') ? url : `/${gameSlug}/${url}`;
        elements.push(
          <Link
            key={key}
            href={finalUrl}
            className="inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 underline font-semibold transition-colors"
          >
            <span>{label}</span>
            <ArrowUpRight className="w-3 h-3 inline ml-0.5 opacity-70" />
          </Link>
        );
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    elements.push(
      <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
    );
  }

  return <span className={className}>{elements}</span>;
};
