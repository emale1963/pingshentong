import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin_session';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);

    const response = NextResponse.json({
      hasCookie: !!sessionToken,
      cookieValue: sessionToken ? sessionToken.value : null,
      allCookies: cookieStore.getAll().map(c => ({
        name: c.name,
        value: c.value.substring(0, 50) + '...',
      })),
    });

    // 设置一个测试cookie
    response.cookies.set('test_cookie', 'test_value', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
