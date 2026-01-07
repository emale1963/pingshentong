import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin_session';

export async function POST(request: NextRequest) {
  console.log('[SimpleAuth] Logout called');

  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    console.log('[SimpleAuth] Logout successful');

    return NextResponse.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('[SimpleAuth] Logout error:', error);
    return NextResponse.json(
      { error: '登出失败，请稍后重试' },
      { status: 500 }
    );
  }
}
