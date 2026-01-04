'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);

  // 登录表单状态
  const [loginData, setLoginData] = useState({
    email: '',
    phone: '',
    password: '',
    code: '',
  });

  // 注册表单状态
  const [registerData, setRegisterData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    code: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // 简单验证
    const newErrors: Record<string, string> = {};
    if (loginType === 'email' && !loginData.email) {
      newErrors.email = '请输入邮箱地址';
    }
    if (loginType === 'phone' && !loginData.phone) {
      newErrors.phone = '请输入手机号码';
    }
    if (!loginData.password) {
      newErrors.password = '请输入密码';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // 这里调用登录 API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginType === 'email' ? {
          email: loginData.email,
          password: loginData.password,
        } : {
          phone: loginData.phone,
          password: loginData.password,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // 保存 token
        localStorage.setItem('token', result.token);
        router.push('/');
      } else {
        const error = await response.json();
        setErrors({ form: error.message || '登录失败' });
      }
    } catch (error) {
      setErrors({ form: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // 简单验证
    const newErrors: Record<string, string> = {};
    if (!registerData.email && !registerData.phone) {
      newErrors.email = '请输入邮箱或手机号';
    }
    if (registerData.password.length < 6) {
      newErrors.password = '密码至少6位';
    }
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // 这里调用注册 API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          phone: registerData.phone,
          password: registerData.password,
        }),
      });

      if (response.ok) {
        // 切换到登录页面
        setIsLogin(true);
        setRegisterData({ email: '', phone: '', password: '', confirmPassword: '', code: '' });
      } else {
        const error = await response.json();
        setErrors({ form: error.message || '注册失败' });
      }
    } catch (error) {
      setErrors({ form: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // 这里实现第三方登录逻辑
    console.log(`Social login with ${provider}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? '登录账户' : '注册账户'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? '还没有账户？' : '已有账户？'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="font-medium text-blue-600 hover:text-blue-500 ml-1"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* 登录表单 */}
          {isLogin ? (
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              {/* 登录方式切换 */}
              <div className="flex space-x-4 mb-6">
                <button
                  type="button"
                  onClick={() => setLoginType('email')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginType === 'email'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  邮箱登录
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('phone')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginType === 'phone'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  手机号登录
                </button>
              </div>

              {loginType === 'email' ? (
                <Input
                  label="邮箱地址"
                  type="email"
                  placeholder="请输入邮箱"
                  value={loginData.email}
                  onChange={(value) => setLoginData({ ...loginData, email: value })}
                  error={errors.email}
                  icon="📧"
                />
              ) : (
                <Input
                  label="手机号码"
                  type="tel"
                  placeholder="请输入手机号"
                  value={loginData.phone}
                  onChange={(value) => setLoginData({ ...loginData, phone: value })}
                  error={errors.phone}
                  icon="📱"
                />
              )}

              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                value={loginData.password}
                onChange={(value) => setLoginData({ ...loginData, password: value })}
                error={errors.password}
                showPasswordToggle
                required
              />

              {errors.form && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
                  {errors.form}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                fullWidth
              >
                登录
              </Button>
            </form>
          ) : (
            /* 注册表单 */
            <form className="space-y-6" onSubmit={handleRegisterSubmit}>
              <Input
                label="邮箱地址（选填）"
                type="email"
                placeholder="请输入邮箱"
                value={registerData.email}
                onChange={(value) => setRegisterData({ ...registerData, email: value })}
                error={errors.email}
                icon="📧"
              />

              <Input
                label="手机号码（选填）"
                type="tel"
                placeholder="请输入手机号"
                value={registerData.phone}
                onChange={(value) => setRegisterData({ ...registerData, phone: value })}
                error={errors.phone}
                icon="📱"
              />

              <Input
                label="密码"
                type="password"
                placeholder="至少6位密码"
                value={registerData.password}
                onChange={(value) => setRegisterData({ ...registerData, password: value })}
                error={errors.password}
                showPasswordToggle
                required
              />

              <Input
                label="确认密码"
                type="password"
                placeholder="再次输入密码"
                value={registerData.confirmPassword}
                onChange={(value) => setRegisterData({ ...registerData, confirmPassword: value })}
                error={errors.confirmPassword}
                showPasswordToggle
                required
              />

              {errors.form && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
                  {errors.form}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                fullWidth
              >
                注册
              </Button>
            </form>
          )}

          {/* 分割线 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或</span>
              </div>
            </div>

            {/* 第三方登录 */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('wechat')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5 mr-2 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.5 13.5c0-2.2 2.7-4 6-4s6 1.8 6 4-2.7 4-6 4-6-1.8-6-4zm6 3c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
                  <path d="M7 4.5c-3.3 0-6 1.8-6 4 0 1.4.9 2.6 2.4 3.4l-.6 2.2 2.2-1.1c.7.2 1.3.3 2 .3.3 0 .5 0 .8 0-.2-.6-.3-1.2-.3-1.9 0-2.2 2.7-4 6-4 .3 0 .5 0 .8 0-.3-.6-.5-1.3-.5-2 0-2.2 2.7-4 6-4 .6 0 1.1.1 1.7.2l2-1.2-.5 1.8c.9.5 1.8 1.3 2.4 2.3.1-.3.2-.7.2-1.1 0-2.2-2.7-4-6-4z"/>
                </svg>
                微信登录
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('dingtalk')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5 mr-2 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                </svg>
                钉钉登录
              </button>
            </div>
          </div>

          {/* 首页链接 */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
