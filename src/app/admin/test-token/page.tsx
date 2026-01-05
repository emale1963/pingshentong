'use client';

import { useState } from 'react';

export default function TestToken() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const testTokenLogin = async () => {
    setLogs([]);
    addLog('开始Token登录测试...');

    // 步骤1：登录获取token
    addLog('步骤1: 登录并获取token...');
    try {
      const response = await fetch('/api/admin/login-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456' }),
      });

      const data = await response.json();
      addLog(`登录结果: ${JSON.stringify(data)}`);

      if (!data.success || !data.token) {
        addLog('❌ 登录失败或未返回token！');
        return;
      }

      // 保存token
      localStorage.setItem('admin_session_token', data.token);
      addLog(`✓ Token已保存: ${data.token.substring(0, 30)}...`);
    } catch (error) {
      addLog(`❌ 登录错误: ${error}`);
      return;
    }

    // 等待500ms
    addLog('等待500ms...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 步骤2：使用token检查登录状态
    addLog('步骤2: 使用token检查登录状态...');
    try {
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch('/api/admin/login', {
        headers: {
          'X-Session-Token': token || '',
        },
      });

      const data = await response.json();
      addLog(`状态检查: success=${data.success}`);

      if (!data.success) {
        addLog('❌ Token验证失败！');
        addLog(`错误信息: ${data.error}`);
        return;
      }

      addLog('✓ Token验证成功');
      addLog(`✓ 用户: ${data.user.username}`);
      addLog('✓ 测试全部通过！');

      // 跳转到dashboard
      addLog('准备跳转到dashboard...');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 1500);
    } catch (error) {
      addLog(`❌ 状态检查错误: ${error}`);
      return;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6">Token登录测试</h1>

        <button
          onClick={testTokenLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 mb-6"
        >
          运行Token登录测试
        </button>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
          <h2 className="text-sm font-semibold mb-2 text-gray-300">测试日志：</h2>
          <div className="font-mono text-xs space-y-1 max-h-96 overflow-auto">
            {logs.length === 0 && <div className="text-gray-500">点击上方按钮开始测试</div>}
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>此测试使用localStorage存储token，不依赖cookie</p>
          <p>Token通过X-Session-Token header传递</p>
        </div>
      </div>
    </div>
  );
}
