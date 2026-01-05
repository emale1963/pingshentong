'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TokenLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 封装带token的fetch
  const fetchWithToken = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_session_token');
    const headers = {
      ...options.headers,
      ...(token ? { 'X-Session-Token': token } : {}),
    };
    return fetch(url, { ...options, headers });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[TokenLogin] 开始登录...');
      
      const response = await fetch('/api/admin/login-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('[TokenLogin] 响应:', data);

      if (response.ok && data.success) {
        // 保存token到localStorage
        localStorage.setItem('admin_session_token', data.token);
        console.log('[TokenLogin] Token已保存到localStorage');
        
        // 跳转到dashboard
        router.push('/admin/dashboard');
      } else {
        setError(data.error || '登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('[TokenLogin] 错误:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">后台管理系统</h1>
          <p className="text-sm text-gray-600">管理员登录（Token模式）</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入密码"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>默认账号：admin / 密码：123456</p>
          <p className="mt-1">此模式使用localStorage存储token，不依赖cookie</p>
        </div>
      </div>
    </div>
  );
}
