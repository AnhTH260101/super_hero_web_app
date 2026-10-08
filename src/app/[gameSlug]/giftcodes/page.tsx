import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameMeta, getGiftcodes } from '@/lib/games';
import { Header } from '@/components/layout/Header';
import { GiftcodeList } from '@/components/game/GiftcodeList';
import { MonetizationBanner } from '@/components/monetization/MonetizationBanner';
import { Gift, ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ gameSlug: string }>;
}

export default async function GiftcodesPage({ params }: Props) {
  const { gameSlug } = await params;
  const game = getGameMeta(gameSlug);
  if (!game) notFound();

  const giftcodes = getGiftcodes(gameSlug);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentGame={game} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <Link
            href={`/${gameSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Hub {game.name}</span>
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Gift className="w-8 h-8 text-emerald-400" />
            <span>Mã Giftcode {game.name} Mới Nhất</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tổng hợp code tân thủ, code tri ân và sự kiện máy chủ mới nhất. Bấm nút để sao chép mã ngay lập tức.
          </p>
        </div>

        <MonetizationBanner
          gameName={game.name}
          affiliateUrl={game.affiliateLinks?.pcEmulator}
        />

        {/* Giftcode List with Copy interaction */}
        <div className="my-8">
          <GiftcodeList giftcodes={giftcodes} />
        </div>

        {/* How to redeem */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="font-bold text-base text-white mb-3">
            📖 Hướng Dẫn Cách Nhập Giftcode Trong Game
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
            <li>Đăng nhập vào game <strong>{game.name}</strong> và hoàn thành màn hướng dẫn tân thủ.</li>
            <li>Tại giao diện sảnh chính, nhấp vào <strong>Ảnh đại diện Avatar</strong> góc trên bên trái màn hình.</li>
            <li>Chọn mục <strong>Cài đặt hệ thống (Settings)</strong> → nhấp vào nút <strong>Đổi Mã Quà / Giftcode</strong>.</li>
            <li>Dán mã vừa sao chép ở trên vào ô nhập và bấm <strong>Xác nhận</strong>.</li>
            <li>Kiểm tra phần thưởng gửi về <strong>Hộp Thư</strong> trong game để nhận quà.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
