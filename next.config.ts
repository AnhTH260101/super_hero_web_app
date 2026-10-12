import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cấu hình HTTP Security Headers theo tiêu chuẩn OWASP
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Chống tấn công Clickjacking / Iframe lừa đảo
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Chống tấn công khai thác kiểu nội dung MIME
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Ẩn bớt thông tin đường dẫn nhạy cảm khi chuyển trang
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()', // Chặn quyền truy cập phần cứng trái phép
          },
        ],
      },
    ];
  },
};

export default nextConfig;
