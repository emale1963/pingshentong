import { NextRequest, NextResponse } from 'next/server';
import { adminLogin, requireAdmin } from '@/lib/authAdmin';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/login called');

  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证请求参数
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 获取客户端IP
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // 尝试登录
    const result = await adminLogin(username, password, ip);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error('[API] Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/admin/login called');

  try {
    // 检查是否已登录
    const admin = await requireAdmin();

    if (admin) {
      return NextResponse.json({
        success: true,
        user: admin,
      });
    } else {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[API] Check login error:', error);
    return NextResponse.json(
      { error: '检查登录状态失败' },
      { status: 500 }
    );
  }
}
