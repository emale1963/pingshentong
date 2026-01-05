/**
 * 认证和权限管理工具
 */

// 检查管理员登录状态
export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return sessionStorage.getItem('adminLoggedIn') === 'true';
}

// 设置管理员登录状态
export function setAdminLoggedIn(loggedIn: boolean): void {
  if (typeof window !== 'undefined') {
    if (loggedIn) {
      sessionStorage.setItem('adminLoggedIn', 'true');
    } else {
      sessionStorage.removeItem('adminLoggedIn');
    }
  }
}

// 管理员登出
export function adminLogout(): void {
  setAdminLoggedIn(false);
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

// 验证管理员凭据
export function validateAdminCredentials(username: string, password: string): boolean {
  // 默认凭据: admin / 111111
  return username === 'admin' && password === '111111';
}

// 检查是否首次登录(需要修改密码)
export function isFirstLogin(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return sessionStorage.getItem('adminPasswordChanged') !== 'true';
}

// 标记密码已修改
export function setPasswordChanged(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('adminPasswordChanged', 'true');
  }
}

// 修改管理员密码(实际应用中应该存储到数据库)
export function changeAdminPassword(currentPassword: string, newPassword: string): { success: boolean; message: string } {
  // 简单验证: 当前密码应该是默认密码
  if (currentPassword !== '111111') {
    return { success: false, message: '当前密码不正确' };
  }

  // 验证新密码强度
  if (newPassword.length < 6) {
    return { success: false, message: '密码长度至少为6位' };
  }

  // 实际应用中,这里应该将新密码加密后存储到数据库
  // 现在只是简单地标记密码已修改
  setPasswordChanged();
  sessionStorage.setItem('adminPassword', newPassword);

  return { success: true, message: '密码修改成功' };
}

// 验证密码(使用存储的密码或默认密码)
export function verifyPassword(password: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const storedPassword = sessionStorage.getItem('adminPassword');
  const currentPassword = storedPassword || '111111';

  return password === currentPassword;
}
