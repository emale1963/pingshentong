import { NextRequest, NextResponse } from 'next/server';
import { adminLogin, requireAdmin } from '@/lib/authAdmin';
import { userManager } from '@/storage/database';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/login called');

  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('[API] Request body:', { username, passwordLength: password?.length });

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

    console.log('[API] Calling adminLogin...');
    // 尝试登录
    const result = await adminLogin(username, password, ip);

    console.log('[API] adminLogin result:', {
      success: result.success,
      hasUser: !!result.user,
      error: result.error,
    });

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
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/admin/login called');

  try {
    // 首先尝试从header获取token
    const token = request.headers.get('X-Session-Token');
    
    if (token) {
      console.log('[API] Found token in header');
      
      try {
        // 解析token
        const sessionData = JSON.parse(
          Buffer.from(token, 'base64').toString()
        );
        
        console.log('[API] Token parsed:', { userId: sessionData.userId, username: sessionData.username });
        
        // 验证token
        if (sessionData.userId && sessionData.username && sessionData.isAdmin) {
          // 查询用户信息
          const user = await userManager.getUserById(sessionData.userId);
          
          if (user && user.isAdmin && user.status === 'active') {
            return NextResponse.json({
              success: true,
              user: {
                id: user.userId,
                username: user.username,
                email: user.email,
                full_name: user.fullName,
                role: user.role,
                status: user.status,
                is_admin: user.isAdmin,
              },
            });
          }
        }
      } catch (tokenError) {
        console.error('[API] Token parse error:', tokenError);
      }
    }
    
    // 如果token验证失败，使用cookie验证
    console.log('[API] Using cookie authentication');
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
