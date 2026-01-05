'use client';

import { useEffect, useState } from 'react';

export default function CookieDebug() {
  const [serverCookies, setServerCookies] = useState<any>(null);
  const [browserCookies, setBrowserCookies] = useState('');

  const checkCookies = async () => {
    // 检查服务器端cookie
    try {
      const response = await fetch('/api/admin/check-cookie', {
        credentials: 'include',
      });
      const data = await response.json();
      setServerCookies(data);
    } catch (error) {
      console.error('Error checking cookies:', error);
    }

    // 显示浏览器中的所有cookie
    setBrowserCookies(document.cookie);
  };

  const login = async () => {
    try {
      const response = await fetch('/api/admin/simple-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456' }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Login result:', data);

      if (data.success) {
        setTimeout(() => checkCookies(), 500);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  useEffect(() => {
    checkCookies();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Cookie调试工具</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">浏览器Cookies (document.cookie)</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {browserCookies || '(无)'}
          </pre>
          <p className="text-sm text-gray-600 mt-2">
            注意：httpOnly的cookie不会显示在这里
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">服务器端Cookies</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(serverCookies, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4">
          <button
            onClick={login}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            登录并检查Cookie
          </button>
          <button
            onClick={checkCookies}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            刷新Cookie状态
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">调试步骤：</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>点击"登录并检查Cookie"按钮</li>
            <li>查看服务器端Cookies中的hasCookie是否为true</li>
            <li>查看浏览器Cookies中是否有test_cookie</li>
            <li>如果admin_session存在但浏览器端看不到，说明它是httpOnly</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
