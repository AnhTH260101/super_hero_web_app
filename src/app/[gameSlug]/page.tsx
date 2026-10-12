import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export default async function GameHubPage({ params }: Props) {
  const { gameSlug } = await params;
  // Trang khởi đầu (Init page) mặc định của tựa game là Trang Thông Tin Chung
  redirect(`/${gameSlug}/thong-tin-chung`);
}
