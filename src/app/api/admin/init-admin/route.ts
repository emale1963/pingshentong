import { NextResponse } from 'next/server';
import { userManager } from '@/storage/database';

/**
 * 初始化默认管理员账号
 */
export async function POST() {
  console.log('[API] Initializing default admin...');

  try {
    const admin = await userManager.initDefaultAdmin();

    if (!admin) {
      throw new Error('Failed to initialize admin');
    }

    return NextResponse.json({
      success: true,
      message: '管理员账号初始化成功',
      data: {
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
      },
    });
  } catch (error) {
    console.error('[API] Init admin error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '初始化管理员账号失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
