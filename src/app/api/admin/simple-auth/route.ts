import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24小时

// 硬编码的管理员账号（简化版，不使用数据库）
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '1111';

export async function POST(request: NextRequest) {
  console.log('[SimpleAuth] POST called');

  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('[SimpleAuth] Attempting login:', { username, passwordLength: password?.length });

    // 直接验证用户名和密码
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      console.log('[SimpleAuth] Login successful');

      // 创建简单的session数据
      const sessionData = {
        username: ADMIN_USERNAME,
        isAdmin: true,
        loginAt: new Date().toISOString(),
      };

      const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

      // 设置Cookie
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: false, // 开发环境必须设置为false
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });

      console.log('[SimpleAuth] Cookie set successfully');

      return NextResponse.json({
        success: true,
        user: {
          username: ADMIN_USERNAME,
          isAdmin: true,
        },
      });
    } else {
      console.log('[SimpleAuth] Login failed: invalid credentials');
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[SimpleAuth] Error:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('[SimpleAuth] GET called');

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionToken) {
      console.log('[SimpleAuth] No session found');
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    try {
      const sessionData = JSON.parse(
        Buffer.from(sessionToken.value, 'base64').toString()
      );

      console.log('[SimpleAuth] Session found:', { username: sessionData.username, isAdmin: sessionData.isAdmin });

      if (sessionData.username === ADMIN_USERNAME && sessionData.isAdmin) {
        return NextResponse.json({
          success: true,
          user: {
            username: sessionData.username,
            isAdmin: sessionData.isAdmin,
          },
        });
      } else {
        console.log('[SimpleAuth] Invalid session');
        return NextResponse.json(
          { success: false, error: '会话无效' },
          { status: 401 }
        );
      }
    } catch (parseError) {
      console.error('[SimpleAuth] Parse error:', parseError);
      return NextResponse.json(
        { success: false, error: '会话无效' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[SimpleAuth] Error:', error);
    return NextResponse.json(
      { success: false, error: '检查登录状态失败' },
      { status: 500 }
    );
  }
}
