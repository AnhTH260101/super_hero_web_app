import { notFound } from 'next/navigation';
import {
  getGameMeta,
  getGameHeroes,
  getTierList,
  getGameResources,
  getGameResourceSources,
  getGiftcodes,
  getGameGuides,
  getGameActivities,
} from '@/lib/games';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const gameSlug = 'sieu-anh-hung';
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const heroes = getGameHeroes(gameSlug, { includeAfterlife: true, includeSkins: true });
  const tierData = getTierList(gameSlug);
  const resources = getGameResources(gameSlug);
  const sources = getGameResourceSources(gameSlug);
  const giftcodes = getGiftcodes(gameSlug);
  const guides = getGameGuides(gameSlug);
  const activities = getGameActivities(gameSlug);

  return (
    <AdminDashboard
      initialHeroes={heroes}
      initialTiers={tierData?.tiers || []}
      initialResources={resources}
      initialSources={sources}
      initialGiftcodes={giftcodes}
      initialGuides={guides}
      initialActivities={activities}
      gameSlug={gameSlug}
    />
  );
}

