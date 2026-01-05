'use client';

import { useState } from 'react';

export default function InlineTest() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const testAll = async () => {
    setLogs([]);
    addLog('开始完整测试流程...');

    // 步骤1：登录
    addLog('步骤1: 尝试登录...');
    try {
      const loginRes = await fetch('/api/admin/simple-login-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456' }),
        credentials: 'include',
      });
      const loginData = await loginRes.json();
      addLog(`登录结果: ${JSON.stringify(loginData)}`);

      if (!loginData.success) {
        addLog('❌ 登录失败！');
        return;
      }
      addLog('✓ 登录成功');
    } catch (error) {
      addLog(`❌ 登录错误: ${error}`);
      return;
    }

    // 等待1秒
    addLog('等待1秒...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 步骤2：检查Cookie
    addLog('步骤2: 检查Cookie...');
    try {
      const cookieRes = await fetch('/api/admin/check-cookie', {
        credentials: 'include',
      });
      const cookieData = await cookieRes.json();
      addLog(`Cookie检查: hasCookie=${cookieData.hasCookie}`);

      if (!cookieData.hasCookie) {
        addLog('❌ Cookie未设置！');
        addLog('所有Cookies: ' + JSON.stringify(cookieData.allCookies));
        return;
      }
      addLog('✓ Cookie已设置');
    } catch (error) {
      addLog(`❌ Cookie检查错误: ${error}`);
      return;
    }

    // 等待500ms
    addLog('等待500ms...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 步骤3：检查登录状态
    addLog('步骤3: 检查登录状态...');
    try {
      const statusRes = await fetch('/api/admin/login', {
        credentials: 'include',
      });
      const statusData = await statusRes.json();
      addLog(`状态检查: success=${statusData.success}`);

      if (!statusData.success) {
        addLog('❌ 登录状态检查失败！');
        addLog(`错误信息: ${statusData.error}`);
        return;
      }
      addLog('✓ 登录状态正常');
      addLog('✓ 测试全部通过！');
    } catch (error) {
      addLog(`❌ 状态检查错误: ${error}`);
      return;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6">内联登录测试</h1>

        <button
          onClick={testAll}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 mb-6"
        >
          运行完整测试
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

        <div className="mt-4 text-xs text-gray-500">
          <p>此测试会依次执行：登录 → 检查Cookie → 检查登录状态</p>
        </div>
      </div>
    </div>
  );
}
