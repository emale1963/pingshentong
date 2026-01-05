'use client';

import { useEffect, useState } from 'react';

export default function TestCookie() {
  const [loginStatus, setLoginStatus] = useState<string>('Loading...');
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // 显示浏览器中的所有cookie
    setCookies(document.cookie);

    // 检查登录状态
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const response = await fetch('/api/admin/login', {
        credentials: 'include',
      });
      const data = await response.json();
      setLoginStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      setLoginStatus(`Error: ${error}`);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: '123456',
        }),
        credentials: 'include',
      });
      const data = await response.json();
      alert(`Login result: ${JSON.stringify(data, null, 2)}`);
      // 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Cookie测试页面</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">浏览器Cookies:</h2>
          <pre className="text-sm">{cookies || '(无)'}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">登录状态:</h2>
          <pre className="text-sm">{loginStatus}</pre>
        </div>

        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          测试登录 (admin/123456)
        </button>

        <button
          onClick={checkLogin}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          重新检查登录状态
        </button>
      </div>
    </div>
  );
}
