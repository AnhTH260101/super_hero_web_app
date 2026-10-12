import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // Tự động chuyển hướng về trang admin game chính
  redirect('/admin/sieu-anh-hung');
}
