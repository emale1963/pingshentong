import { NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { users } from '@/storage/database';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

/**
 * 重置管理员密码为 123456
 */
export async function POST() {
  try {
    console.log('[API] Resetting admin password to 123456');

    const passwordHash = await bcrypt.hash('123456', 10);

    const db = await getDb();
    const [user] = await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.username, 'admin'))
      .returning();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '未找到管理员账号' },
        { status: 404 }
      );
    }

    console.log('[API] Password reset successfully:', {
      username: user.username,
      userId: user.userId,
    });

    return NextResponse.json({
      success: true,
      message: '密码已重置为 123456',
      data: {
        username: user.username,
        password: '123456',
      },
    });
  } catch (error) {
    console.error('[API] Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '重置密码失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
