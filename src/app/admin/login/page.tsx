'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [useSimpleApi, setUseSimpleApi] = useState(false);

  // 页面加载时清除错误
  useEffect(() => {
    setError('');
    setDebugInfo('');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[Login] 开始登录流程');
    console.log('[Login] 用户名:', username);
    console.log('[Login] 密码长度:', password.length);
    console.log('[Login] 使用简化API:', useSimpleApi);

    try {
      const apiUrl = useSimpleApi ? '/api/admin/simple-login' : '/api/admin/login';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      console.log('[Login] 响应状态:', response.status);
      console.log('[Login] 响应OK:', response.ok);

      const data = await response.json();
      console.log('[Login] 响应数据:', data);
      console.log('[Login] response.ok:', response.ok, 'data.success:', data.success);
      
      // 在页面上显示调试信息
      setDebugInfo(JSON.stringify({
        status: response.status,
        ok: response.ok,
        data: data,
      }, null, 2));

      if (response.ok && data.success) {
        console.log('[Login] 登录成功，准备跳转');
        console.log('[Login] Response headers:', response.headers);
        // 等待更长时间确保cookie被设置
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[Login] 开始跳转到dashboard');
        router.push('/admin/dashboard');
      } else {
        console.log('[Login] 登录失败:', data.error);
        console.log('[Login] response.ok:', response.ok, 'data:', data);
        setError(data.error || '登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('[Login] 网络错误:', error);
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
          <p className="text-sm text-gray-600">管理员登录</p>
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

          {debugInfo && (
            <div className="bg-gray-100 border border-gray-300 text-gray-800 px-4 py-3 rounded-lg text-xs font-mono overflow-auto max-h-40">
              <div className="font-bold mb-2">调试信息:</div>
              <pre>{debugInfo}</pre>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <div className="flex items-center justify-center mt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useSimpleApi}
                onChange={(e) => setUseSimpleApi(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-sm text-gray-600">使用简化API（无日志记录）</span>
            </label>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>默认账号：admin / 密码：123456</p>
          <p className="mt-1">首次登录后请修改密码</p>
          <p className="mt-2 text-xs text-blue-600">
            如果登录失败，请勾选"使用简化API"后重试
          </p>
        </div>
      </div>
    </div>
  );
}
