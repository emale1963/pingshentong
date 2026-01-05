import { NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { users } from '@/storage/database';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

/**
 * 检查admin用户信息
 */
export async function GET() {
  try {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.username, 'admin'));

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '未找到admin用户',
      });
    }

    // 测试密码验证
    const testPasswords = ['123456', '111111', 'admin'];
    const passwordResults = await Promise.all(
      testPasswords.map(async (pwd) => ({
        password: pwd,
        valid: await bcrypt.compare(pwd, user.passwordHash),
      }))
    );

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        status: user.status,
        role: user.role,
      },
      passwordTests: passwordResults,
    });
  } catch (error) {
    console.error('[API] Check user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '检查用户失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
