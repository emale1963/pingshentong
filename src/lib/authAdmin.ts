/**
 * 管理员认证和授权
 */

import { cookies } from 'next/headers';
import { userManager } from '@/storage/database';
import { eq } from 'drizzle-orm';
import { getDb } from 'coze-coding-dev-sdk';
import { users, adminOperations } from '@/storage/database';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  is_admin: boolean;
}

export interface AdminSession {
  userId: number;
  username: string;
  isAdmin: boolean;
  loginAt: string;
  ip?: string;
}

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'default-secret-change-in-production';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24小时

/**
 * 管理员登录
 */
export async function adminLogin(
  username: string,
  password: string,
  ip: string = 'unknown'
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    console.log('[Auth] Login attempt:', { username, ip });

    // 验证用户登录
    const user = await userManager.verifyLogin(username, password);

    console.log('[Auth] User verification result:', user ? 'success' : 'failed');

    if (!user) {
      console.log('[Auth] User not found or invalid password');
      return { success: false, error: '用户名或密码错误' };
    }

    console.log('[Auth] User data:', {
      userId: user.userId,
      username: user.username,
      isAdmin: user.isAdmin,
      status: user.status,
    });

    // 检查是否是管理员
    if (!user.isAdmin) {
      return { success: false, error: '无管理员权限' };
    }

    // 更新最后登录信息
    await userManager.updateLastLogin(user.userId, ip);

    // 记录操作日志（可选操作，失败不影响登录）
    try {
      const db = await getDb();
      await db.insert(adminOperations).values({
        adminId: user.userId,
        operationType: 'login',
        operationModule: 'auth',
        operationDetail: '管理员登录',
        ipAddress: ip,
        result: 'success',
      });
    } catch (logError) {
      console.error('[Auth] Failed to log operation:', logError);
      // 不影响登录流程
    }

    // 创建会话
    const sessionData: AdminSession = {
      userId: user.userId,
      username: user.username,
      isAdmin: user.isAdmin,
      loginAt: new Date().toISOString(),
      ip,
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // 设置Cookie
    const cookieStore = await cookies();
    
    console.log('[Auth] Setting cookie:', {
      name: SESSION_COOKIE_NAME,
    });
    
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: false, // 开发环境必须设置为false
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    console.log('[Auth] Cookie set successfully');

    return {
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
    };
  } catch (error) {
    console.error('[Auth] Login error:', error);
    console.error('[Auth] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return { success: false, error: '登录失败，请稍后重试' };
  }
}

/**
 * 管理员登出
 */
export async function adminLogout(userId: number, ip: string = 'unknown'): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    // 记录操作日志（可选操作，失败不影响登出）
    try {
      const db = await getDb();
      await db.insert(adminOperations).values({
        adminId: userId,
        operationType: 'logout',
        operationModule: 'auth',
        operationDetail: '管理员登出',
        ipAddress: ip,
        result: 'success',
      });
    } catch (logError) {
      console.error('[Auth] Failed to log logout:', logError);
    }
  } catch (error) {
    console.error('[Auth] Logout error:', error);
  }
}

/**
 * 获取当前登录的管理员
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);

    console.log('[Auth] Getting current admin, sessionToken:', sessionToken ? 'found' : 'not found');

    if (!sessionToken) {
      console.log('[Auth] No session token found');
      return null;
    }

    // 解析session
    const sessionData: AdminSession = JSON.parse(
      Buffer.from(sessionToken.value, 'base64').toString()
    );

    // 验证session是否过期
    const loginTime = new Date(sessionData.loginAt);
    const now = new Date();
    const age = now.getTime() - loginTime.getTime();

    if (age > SESSION_MAX_AGE) {
      return null;
    }

    // 查询用户信息（确保用户仍然存在且是管理员）
    const user = await userManager.getUserById(sessionData.userId);

    if (!user || !user.isAdmin || user.status !== 'active') {
      return null;
    }

    return {
      id: user.userId,
      username: user.username,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      status: user.status,
      is_admin: user.isAdmin,
    };
  } catch (error) {
    console.error('[Auth] Get current admin error:', error);
    return null;
  }
}

/**
 * 验证管理员权限
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return null;
  }

  if (!admin.is_admin || admin.status !== 'active') {
    return null;
  }

  return admin;
}

/**
 * 修改管理员密码
 */
export async function changeAdminPassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
  ip: string = 'unknown'
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    const bcrypt = (await import('bcrypt')).default;

    // 获取用户
    const [user] = await db
      .select({
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.userId, userId));

    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    const isValidOldPassword = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!isValidOldPassword) {
      return { success: false, error: '原密码错误' };
    }

    // 验证新密码强度
    if (newPassword.length < 8) {
      return { success: false, error: '密码长度至少8位' };
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return { success: false, error: '密码必须包含大小写字母和数字' };
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.userId, userId));

    // 记录操作日志
    await db.insert(adminOperations).values({
      adminId: userId,
      operationType: 'change_password',
      operationModule: 'auth',
      operationDetail: '修改密码',
      ipAddress: ip,
      result: 'success',
    });

    return { success: true };
  } catch (error) {
    console.error('[Auth] Change password error:', error);
    return { success: false, error: '修改密码失败，请稍后重试' };
  }
}

/**
 * 记录管理员操作
 */
export async function logAdminOperation(params: {
  adminId: number;
  operationType: string;
  operationModule?: string;
  operationDetail?: string;
  operationData?: any;
  ip?: string;
  result?: string;
  errorMessage?: string;
}): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(adminOperations).values({
      adminId: params.adminId,
      operationType: params.operationType,
      operationModule: params.operationModule,
      operationDetail: params.operationDetail,
      operationData: params.operationData ? params.operationData : null,
      ipAddress: params.ip || 'unknown',
      result: params.result || 'success',
      errorMessage: params.errorMessage,
    });
  } catch (error) {
    console.error('[Auth] Log operation error:', error);
  }
}

/**
 * 检查密码是否需要强制修改
 */
export async function checkPasswordRequiredChange(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    const bcrypt = (await import('bcrypt')).default;

    const [user] = await db
      .select({
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.userId, userId));

    if (!user) {
      return false;
    }

    const isDefaultPassword = await bcrypt.compare('111111', user.passwordHash);
    return isDefaultPassword;
  } catch (error) {
    console.error('[Auth] Check password required change error:', error);
    return false;
  }
}
