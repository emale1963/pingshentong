'use client';

import { useState } from 'react';

export default function SimpleLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [result, setResult] = useState('');

  const handleLogin = async () => {
    setResult('正在登录...');
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const text = await response.text();
      
      setResult(`状态码: ${response.status}\n响应内容:\n${text}`);
    } catch (error) {
      setResult(`错误: ${error}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">简单登录测试</h1>
        
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
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            登录
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <p>默认用户名: admin</p>
          <p>默认密码: 123456</p>
        </div>
      </div>
    </div>
  );
}
