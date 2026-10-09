import { notFound } from 'next/navigation';
import { getGameMeta, getGameHeroes, getTierList } from '@/lib/games';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const gameSlug = 'sieu-anh-hung';
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const heroes = getGameHeroes(gameSlug, { includeAfterlife: true, includeSkins: true });
  const tierData = getTierList(gameSlug);

  return (
    <AdminDashboard
      initialHeroes={heroes}
      initialTiers={tierData?.tiers || []}
      gameSlug={gameSlug}
    />
  );
}

