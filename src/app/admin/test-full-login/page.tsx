'use client';

import { useState } from 'react';

export default function TestFullLogin() {
  const [step, setStep] = useState<'login' | 'check-cookie' | 'check-status' | 'done'>('login');
  const [loginResult, setLoginResult] = useState<any>(null);
  const [cookieResult, setCookieResult] = useState<any>(null);
  const [statusResult, setStatusResult] = useState<any>(null);

  const step1Login = async () => {
    setStep('login');
    console.log('=== Step 1: Login ===');
    
    try {
      const response = await fetch('/api/admin/simple-login-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456' }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Login response:', data);
      setLoginResult(data);

      if (data.success) {
        // 等待cookie被设置
        await new Promise(resolve => setTimeout(resolve, 1000));
        step2CheckCookie();
      } else {
        alert('登录失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('登录错误: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const step2CheckCookie = async () => {
    setStep('check-cookie');
    console.log('=== Step 2: Check Cookie ===');
    
    try {
      const response = await fetch('/api/admin/check-cookie', {
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Cookie check result:', data);
      setCookieResult(data);

      if (data.hasCookie) {
        await new Promise(resolve => setTimeout(resolve, 500));
        step3CheckStatus();
      } else {
        alert('Cookie未设置成功！');
      }
    } catch (error) {
      console.error('Cookie check error:', error);
      alert('Cookie检查错误: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const step3CheckStatus = async () => {
    setStep('check-status');
    console.log('=== Step 3: Check Login Status ===');
    
    try {
      const response = await fetch('/api/admin/login', {
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Login status result:', data);
      setStatusResult(data);

      if (data.success) {
        setStep('done');
        // 跳转到dashboard
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 1500);
      } else {
        alert('登录状态检查失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Status check error:', error);
      alert('状态检查错误: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl w-full">
        <h1 className="text-3xl font-bold mb-6">完整登录测试</h1>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-between mb-8">
          {[
            { key: 'login', label: '登录' },
            { key: 'check-cookie', label: '检查Cookie' },
            { key: 'check-status', label: '检查状态' },
            { key: 'done', label: '完成' },
          ].map((s, index) => {
            const stepKeys = ['login', 'check-cookie', 'check-status', 'done'];
            const currentIndex = stepKeys.indexOf(step);
            const itemIndex = index;

            return (
              <div key={s.key} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${currentIndex > itemIndex ? 'bg-green-500 text-white' : ''}
                    ${currentIndex === itemIndex ? 'bg-blue-500 text-white' : ''}
                    ${currentIndex < itemIndex ? 'bg-gray-300 text-gray-600' : ''}
                  `}
                >
                  {currentIndex > itemIndex ? '✓' : index + 1}
                </div>
                <span className="ml-2 text-sm font-medium">{s.label}</span>
                {index < 3 && (
                  <div className="w-16 h-1 bg-gray-200 mx-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* 操作按钮 */}
        <div className="mb-6">
          {step === 'login' && (
            <button
              onClick={step1Login}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 text-lg font-medium"
            >
              开始测试登录流程
            </button>
          )}
          {step === 'done' && (
            <div className="text-center text-green-600 font-medium">
              ✓ 测试完成，正在跳转到dashboard...
            </div>
          )}
        </div>

        {/* 结果显示 */}
        <div className="space-y-4">
          {loginResult && (
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2">步骤1: 登录结果</h3>
              <pre className="text-xs overflow-auto">{JSON.stringify(loginResult, null, 2)}</pre>
            </div>
          )}

          {cookieResult && (
            <div className="bg-yellow-50 p-4 rounded">
              <h3 className="font-semibold mb-2">步骤2: Cookie检查结果</h3>
              <pre className="text-xs overflow-auto">{JSON.stringify(cookieResult, null, 2)}</pre>
            </div>
          )}

          {statusResult && (
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold mb-2">步骤3: 状态检查结果</h3>
              <pre className="text-xs overflow-auto">{JSON.stringify(statusResult, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>提示：查看浏览器控制台（F12）获取详细日志</p>
        </div>
      </div>
    </div>
  );
}
