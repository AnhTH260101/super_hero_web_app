import { notFound } from 'next/navigation';
import { getGameMeta, getGameHeroes } from '@/lib/games';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const gameSlug = 'sieu-anh-hung';
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const heroes = getGameHeroes(gameSlug);

  return <AdminDashboard initialHeroes={heroes} gameSlug={gameSlug} />;
}
