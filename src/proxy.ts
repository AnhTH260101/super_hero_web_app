import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Bộ nhớ đệm Rate Limiter đơn giản theo IP trong runtime (sliding window 60s)
const ipRequestHistory = new Map<string, { count: number; resetAt: number }>();

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
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. KIỂM TRA BẢO MẬT KHU VỰC QUẢN TRỊ ADMIN (/admin/* HOẶC /api/admin/*)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminRoute) {
    // Bỏ qua trang đăng nhập và API xác thực để người dùng truy cập
    if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
      return NextResponse.next();
    }

    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'SieuAnhHung@2026!Secure';
    const validSessionToken = Buffer.from(`${validUsername}:${validPassword}`).toString('base64');

    const sessionCookie = request.cookies.get('admin_session')?.value;
    const authHeader = request.headers.get('authorization');
    const customToken = request.headers.get('x-admin-token');

    let isAuthenticated = false;

    // A. Kiểm tra Session Cookie (Chuẩn web an toàn)
    if (sessionCookie && sessionCookie === validSessionToken) {
      isAuthenticated = true;
    }

    // B. Kiểm tra Header Custom Token (Dành cho script hoặc automation)
    if (customToken && customToken === validPassword) {
      isAuthenticated = true;
    }

    // C. Kiểm tra Bearer Token
    if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === validPassword) {
      isAuthenticated = true;
    }

    // D. Kiểm tra HTTP Basic Auth
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

    // Nếu CHƯA XÁC THỰC:
    if (!isAuthenticated) {
      // Đối với API Admin: Trả về JSON lỗi 401 (KHÔNG có header WWW-Authenticate để không bị loop popup)
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Yêu cầu quyền quản trị viên xác thực.',
          },
          { status: 401 }
        );
      }

      // Đối với trang web /admin: Chuyển hướng êm ái sang trang /admin/login
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. CHỐNG SPAM & CÀO DỮ LIỆU TỰ ĐỘNG (RATE LIMITING CHO TOÀN BỘ API PUBLIC)
  if (pathname.startsWith('/api/')) {
    cleanupExpiredRateLimits();

    const rateLimitMax = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60', 10);
    const now = Date.now();
    const windowMs = 60 * 1000;

    const currentRecord = ipRequestHistory.get(ip);

    if (!currentRecord || now > currentRecord.resetAt) {
      ipRequestHistory.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      currentRecord.count += 1;
      if (currentRecord.count > rateLimitMax) {
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

// Cấu hình matcher
export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};

export const middleware = proxy;
