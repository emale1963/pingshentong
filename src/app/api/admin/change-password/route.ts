import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, changeAdminPassword } from '@/lib/authAdmin';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/change-password called');

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // 验证请求参数
    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: '请填写所有字段' },
        { status: 400 }
      );
    }

    // 验证新密码一致性
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: '两次输入的新密码不一致' },
        { status: 400 }
      );
    }

    // 获取客户端IP
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // 修改密码
    const result = await changeAdminPassword(admin.id, oldPassword, newPassword, ip);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('[API] Change password error:', error);
    return NextResponse.json(
      { error: '修改密码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
