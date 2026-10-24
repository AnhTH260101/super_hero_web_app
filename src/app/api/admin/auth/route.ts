import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SieuAnhHung@2026!Secure';
const SESSION_TOKEN = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const response = NextResponse.json({
        success: true,
        message: 'Đăng nhập thành công',
      });

      // Lưu cookie phiên làm việc trong 7 ngày
      response.cookies.set({
        name: 'admin_session',
        value: SESSION_TOKEN,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 ngày
      });

      return response;
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Tài khoản hoặc mật khẩu không chính xác.',
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Lỗi xử lý yêu cầu đăng nhập.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất thành công',
  });

  response.cookies.delete('admin_session');
  return response;
}
