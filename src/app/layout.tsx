import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameWiki Portal - Cổng Tra Cứu Thông Tin Game Thủ Đa Nền Tảng",
  description: "Kho tàng dữ liệu tướng, bảng xếp hạng Tier List, cách build trang bị và giftcode mới nhất.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
