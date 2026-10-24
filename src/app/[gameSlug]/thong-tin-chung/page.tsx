import { notFound } from 'next/navigation';
import { getGameMeta, getGameActivities, getGameGuides } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { GeneralInfoHub } from '@/components/guide/GeneralInfoHub';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) return { title: 'Không tìm thấy game' };

  return {
    title: `Thông Tin Chung & Tra Cứu Hoạt Động | ${game.name}`,
    description: `Trung tâm tra cứu cẩm nang, bí kíp, đội hình đề cử và bài viết hướng dẫn toàn diện các hoạt động trong game ${game.name}.`,
  };
}

export default async function ThongTinChungPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const activities = getGameActivities(gameSlug).filter((a) => a.enabled !== false);
  const guides = getGameGuides(gameSlug);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <GeneralInfoHub game={game} activities={activities} guides={guides} />
      </main>
    </div>
  );
}
