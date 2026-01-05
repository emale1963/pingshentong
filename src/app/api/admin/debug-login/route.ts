import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { users } from '@/storage/database';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  console.log('[DEBUG] Login endpoint called');
  
  try {
    const body = await request.json();
    console.log('[DEBUG] Request body:', body);
    
    const { username, password } = body;
    
    // 步骤1: 查询用户
    console.log('[DEBUG] Step 1: Querying user...');
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user) {
      console.log('[DEBUG] User not found');
      return NextResponse.json({ step: 'query', success: false, error: '用户不存在' });
    }
    
    console.log('[DEBUG] User found:', user.username);
    
    // 步骤2: 验证密码
    console.log('[DEBUG] Step 2: Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    console.log('[DEBUG] Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return NextResponse.json({ step: 'password', success: false, error: '密码错误' });
    }
    
    // 步骤3: 检查状态
    console.log('[DEBUG] Step 3: Checking status...');
    if (user.status !== 'active') {
      return NextResponse.json({ step: 'status', success: false, error: '用户未激活' });
    }
    
    // 步骤4: 检查管理员权限
    console.log('[DEBUG] Step 4: Checking admin status...');
    if (!user.isAdmin) {
      return NextResponse.json({ step: 'admin', success: false, error: '无管理员权限' });
    }
    
    // 步骤5: 更新登录信息
    console.log('[DEBUG] Step 5: Updating last login...');
    try {
      await db
        .update(users)
        .set({
          lastLoginAt: new Date().toISOString(),
          lastLoginIp: 'unknown',
        })
        .where(eq(users.userId, user.userId));
      console.log('[DEBUG] Last login updated');
    } catch (error) {
      console.error('[DEBUG] Error updating last login:', error);
    }
    
    // 步骤6: 创建session
    console.log('[DEBUG] Step 6: Creating session...');
    const sessionData = {
      userId: user.userId,
      username: user.username,
      isAdmin: user.isAdmin,
      loginAt: new Date().toISOString(),
    };
    
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    console.log('[DEBUG] Session token created');
    
    // 步骤7: 设置cookie
    console.log('[DEBUG] Step 7: Setting cookie...');
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
      },
    });
    
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    
    console.log('[DEBUG] Cookie set, returning response');
    return response;
    
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
