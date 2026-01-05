/**
 * 管理员认证和授权
 */

import { cookies } from 'next/headers';
import pool from './db';
import bcrypt from 'bcrypt';

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
    const client = await pool.connect();

    // 查询用户
    const result = await client.query(
      'SELECT * FROM users WHERE username = $1 AND is_admin = true',
      [username]
    );

    if (result.rows.length === 0) {
      client.release();
      return { success: false, error: '用户名或密码错误' };
    }

    const user = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      client.release();
      return { success: false, error: '用户名或密码错误' };
    }

    // 检查账户状态
    if (user.status !== 'active') {
      client.release();
      return { success: false, error: '账户已被禁用' };
    }

    // 创建会话
    const sessionData: AdminSession = {
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin,
      loginAt: new Date().toISOString(),
      ip,
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // 更新最后登录信息
    await client.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, last_login_ip = $1 WHERE id = $2',
      [ip, user.id]
    );

    // 记录操作日志
    await client.query(`
      INSERT INTO admin_operations (admin_id, operation_type, operation_module, operation_detail, ip_address, result)
      VALUES ($1, 'login', 'auth', '管理员登录', $2, 'success')
    `, [user.id, ip]);

    client.release();

    // 设置Cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        is_admin: user.is_admin,
      },
    };
  } catch (error) {
    console.error('[Auth] Login error:', error);
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

    // 记录操作日志
    const client = await pool.connect();
    await client.query(`
      INSERT INTO admin_operations (admin_id, operation_type, operation_module, operation_detail, ip_address, result)
      VALUES ($1, 'logout', 'auth', '管理员登出', $2, 'success')
    `, [userId, ip]);
    client.release();
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

    if (!sessionToken) {
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
    const client = await pool.connect();
    const result = await client.query(
      'SELECT id, username, email, full_name, role, status, is_admin FROM users WHERE id = $1 AND is_admin = true',
      [sessionData.userId]
    );
    client.release();

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      is_admin: user.is_admin,
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
    const client = await pool.connect();

    // 验证旧密码
    const result = await client.query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_admin = true',
      [userId]
    );

    if (result.rows.length === 0) {
      client.release();
      return { success: false, error: '用户不存在' };
    }

    const isValidOldPassword = await bcrypt.compare(oldPassword, result.rows[0].password_hash);

    if (!isValidOldPassword) {
      client.release();
      return { success: false, error: '原密码错误' };
    }

    // 验证新密码强度
    if (newPassword.length < 8) {
      client.release();
      return { success: false, error: '密码长度至少8位' };
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      client.release();
      return { success: false, error: '密码必须包含大小写字母和数字' };
    }

    // 检查密码历史（防止使用最近的密码）
    // 这里简化处理，实际应该有密码历史表

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // 记录操作日志
    await client.query(`
      INSERT INTO admin_operations (admin_id, operation_type, operation_module, operation_detail, ip_address, result)
      VALUES ($1, 'change_password', 'auth', '修改密码', $2, 'success')
    `, [userId, ip]);

    client.release();

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
    const client = await pool.connect();
    await client.query(`
      INSERT INTO admin_operations (
        admin_id,
        operation_type,
        operation_module,
        operation_detail,
        operation_data,
        ip_address,
        result,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      params.adminId,
      params.operationType,
      params.operationModule,
      params.operationDetail,
      params.operationData ? JSON.stringify(params.operationData) : null,
      params.ip || 'unknown',
      params.result || 'success',
      params.errorMessage,
    ]);
    client.release();
  } catch (error) {
    console.error('[Auth] Log operation error:', error);
  }
}

/**
 * 检查密码是否需要强制修改
 */
export async function checkPasswordRequiredChange(userId: number): Promise<boolean> {
  try {
    const client = await pool.connect();

    // 检查是否是默认密码（111111）
    const result = await client.query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_admin = true',
      [userId]
    );

    if (result.rows.length === 0) {
      client.release();
      return false;
    }

    const isDefaultPassword = await bcrypt.compare('111111', result.rows[0].password_hash);

    client.release();

    return isDefaultPassword;
  } catch (error) {
    console.error('[Auth] Check password required change error:', error);
    return false;
  }
}
