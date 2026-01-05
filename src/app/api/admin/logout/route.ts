import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, adminLogout } from '@/lib/authAdmin';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/logout called');

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    // 获取客户端IP
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // 执行登出
    await adminLogout(admin.id, ip);

    return NextResponse.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('[API] Logout error:', error);
    return NextResponse.json(
      { error: '登出失败，请稍后重试' },
      { status: 500 }
    );
  }
}
