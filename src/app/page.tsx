import { redirect } from 'next/navigation';

export default function HomePage() {
  // Trang khởi đầu (Init page) toàn portal là Trang Thông Tin Chung của game chính
  redirect('/sieu-anh-hung/thong-tin-chung');
}
