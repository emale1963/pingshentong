'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminInit() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInit = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/init-admin', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setMessage('管理员账号初始化成功！默认账号：admin / 密码：1111');
        setTimeout(() => {
          router.push('/admin/login');
        }, 2000);
      } else {
        setSuccess(false);
        setMessage(data.error || '初始化失败');
      }
    } catch (error) {
      setSuccess(false);
      setMessage('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">初始化管理员账号</h1>
          <p className="text-sm text-gray-600">首次使用需要初始化默认管理员账号</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleInit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '初始化中...' : '初始化管理员账号'}
        </button>

        <div className="mt-6 text-center">
          <a href="/admin/login" className="text-blue-600 hover:underline text-sm">
            返回登录页面
          </a>
        </div>
      </div>
    </div>
  );
}
