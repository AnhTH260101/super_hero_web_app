import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Bộ nhớ đệm Rate Limiter đơn giản theo IP trong runtime (Bộ nhớ sliding window 60s)
const ipRequestHistory = new Map<string, { count: number; resetAt: number }>();

// Tự động dọn dẹp các IP đã hết hạn rate limit sau mỗi 5 phút để tránh rò rỉ bộ nhớ
let lastCleanup = Date.now();
const cleanupExpiredRateLimits = () => {
  const now = Date.now();
  if (now - lastCleanup > 5 * 60 * 1000) {
    lastCleanup = now;
    for (const [ip, data] of ipRequestHistory.entries()) {
      if (now > data.resetAt) {
        ipRequestHistory.delete(ip);
      }
    }
  }
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy IP của người truy cập
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. KIỂM TRA BẢO MẬT KHU VỰC QUẢN TRỊ ADMIN (/admin/* HOẶC /api/admin/*)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminRoute) {
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'SieuAnhHung@2026!Secure';

    const authHeader = request.headers.get('authorization');
    const customToken = request.headers.get('x-admin-token');

    let isAuthenticated = false;

    // Kiểm tra Header Custom Token (Dành cho script hoặc automation)
    if (customToken && customToken === validPassword) {
      isAuthenticated = true;
    }

    // Kiểm tra Bearer Token
    if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === validPassword) {
      isAuthenticated = true;
    }

    // Kiểm tra HTTP Basic Auth
    if (authHeader?.startsWith('Basic ')) {
      try {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = atob(base64Credentials);
        const [username, password] = credentials.split(':');

        if (username === validUsername && password === validPassword) {
          isAuthenticated = true;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    // Nếu chưa xác thực -> Chặn ngay lập tức với mã 401
    if (!isAuthenticated) {
      // Đối với API: Trả về JSON lỗi 401
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Truy cập bị từ chối: Yêu cầu quyền quản trị viên xác thực.',
          },
          {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="Web Portal Admin", charset="UTF-8"',
            },
          }
        );
      }

      // Đối với trang giao diện Web /admin: Bật popup đăng nhập trình duyệt
      return new NextResponse('Khu vực quản trị yêu cầu đăng nhập tài khoản và mật khẩu.', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Khu Vuc Quan Tri Web Portal", charset="UTF-8"',
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
  }

  // 2. CHỐNG SPAM & CÀO DỮ LIỆU TỰ ĐỘNG (RATE LIMITING CHO TOÀN BỘ API PUBLIC)
  if (pathname.startsWith('/api/')) {
    cleanupExpiredRateLimits();

    const rateLimitMax = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60', 10);
    const now = Date.now();
    const windowMs = 60 * 1000; // Cửa sổ tính thời gian: 1 phút

    const currentRecord = ipRequestHistory.get(ip);

    if (!currentRecord || now > currentRecord.resetAt) {
      // Bắt đầu chu kỳ mới
      ipRequestHistory.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      currentRecord.count += 1;
      if (currentRecord.count > rateLimitMax) {
        // Vượt quá ngưỡng cho phép -> Chặn 429
        const retryAfterSeconds = Math.ceil((currentRecord.resetAt - now) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: 'Bạn đang gửi quá nhiều yêu cầu cùng lúc. Vui lòng thử lại sau giây lát.',
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfterSeconds.toString(),
            },
          }
        );
      }
    }
  }

  return NextResponse.next();
}

// Cấu hình matcher: Chỉ chạy proxy middleware trên các route cần bảo vệ
export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};

export const middleware = proxy;
