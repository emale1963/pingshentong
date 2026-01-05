import { NextResponse } from 'next/server';
import { userManager } from '@/storage/database';

export async function POST(request: Request) {
  console.log('[TOKEN] Login endpoint called');
  
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // 验证用户登录
    const user = await userManager.verifyLogin(username, password);
    
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
    
    // 返回session token，由客户端存储
    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
      },
      token: sessionToken,
    });
    
  } catch (error) {
    console.error('[TOKEN] Error:', error);
    return NextResponse.json(
      { 
        error: '登录失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
