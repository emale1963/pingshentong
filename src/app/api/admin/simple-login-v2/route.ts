import { NextResponse } from 'next/server';
import { userManager } from '@/storage/database';

export async function POST(request: Request) {
  console.log('[SIMPLE-V2] ===== Login endpoint called =====');
  
  try {
    const body = await request.json();
    const { username, password } = body;
    
    console.log('[SIMPLE-V2] Login attempt:', { username, passwordLength: password?.length });
    
    // 验证用户登录
    const user = await userManager.verifyLogin(username, password);
    
    console.log('[SIMPLE-V2] User verification:', user ? 'SUCCESS' : 'FAILED');
    
    if (!user) {
      console.log('[SIMPLE-V2] User not found or invalid password');
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    
    if (!user.isAdmin) {
      console.log('[SIMPLE-V2] User is not admin');
      return NextResponse.json(
        { error: '无管理员权限' },
        { status: 403 }
      );
    }
    
    console.log('[SIMPLE-V2] User is admin, creating session...');
    
    // 创建session
    const sessionData = {
      userId: user.userId,
      username: user.username,
      isAdmin: user.isAdmin,
      loginAt: new Date().toISOString(),
    };
    
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    
    console.log('[SIMPLE-V2] Session created:', {
      tokenLength: sessionToken.length,
      tokenPreview: sessionToken.substring(0, 50) + '...',
    });
    
    // 创建响应
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
      },
      debug: {
        sessionCreated: true,
        tokenLength: sessionToken.length,
      },
    });
    
    // 设置cookie
    console.log('[SIMPLE-V2] Setting cookie...');
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    
    console.log('[SIMPLE-V2] Cookie set successfully');
    console.log('[SIMPLE-V2] ===== Login complete =====');
    
    return response;
    
  } catch (error) {
    console.error('[SIMPLE-V2] ===== ERROR =====');
    console.error('[SIMPLE-V2] Error:', error);
    console.error('[SIMPLE-V2] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[SIMPLE-V2] Error stack:', error instanceof Error ? error.stack : 'N/A');
    
    return NextResponse.json(
      { 
        error: '登录失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
