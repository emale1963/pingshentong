'use client';

import { useState } from 'react';

export default function TestDebugLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setResult('正在登录...');
    
    try {
      const startTime = Date.now();
      const response = await fetch('/api/admin/debug-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        data = {
          error: '无法解析JSON响应',
          rawText: await response.text(),
        };
      }
      
      setResult(`耗时: ${duration}ms\n\n状态码: ${response.status}\nOK: ${response.ok}\n\n响应:\n${JSON.stringify(data, null, 2)}`);
      
      if (response.ok && data.success) {
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 1000);
      }
    } catch (error) {
      setResult(`错误: ${error}\n\n详情: ${error instanceof Error ? error.message : String(error)}\n堆栈: ${error instanceof Error ? error.stack : 'N/A'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-6">调试登录</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="text-xs whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
