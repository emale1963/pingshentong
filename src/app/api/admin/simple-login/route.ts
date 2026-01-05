import { NextResponse } from 'next/server';
import { userManager } from '@/storage/database';

export async function POST(request: Request) {
  console.log('[SIMPLE] Login endpoint called');
  
  try {
    const body = await request.json();
    const { username, password } = body;
    
    console.log('[SIMPLE] Login attempt:', username);
    
    // 直接使用userManager验证登录
    const user = await userManager.verifyLogin(username, password);
    
    console.log('[SIMPLE] User:', user ? 'found' : 'not found');
    
    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: '无管理员权限' },
        { status: 403 }
      );
    }
    
    // 创建session
    const sessionData = {
      userId: user.userId,
      username: user.username,
      isAdmin: user.isAdmin,
      loginAt: new Date().toISOString(),
    };
    
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    
    // 设置cookie并返回
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
    
    console.log('[SIMPLE] Login successful');
    return response;
    
  } catch (error) {
    console.error('[SIMPLE] Error:', error);
    console.error('[SIMPLE] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: '登录失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
