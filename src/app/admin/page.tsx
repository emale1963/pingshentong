'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAdminLoggedIn, adminLogout } from '@/lib/auth';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    completedReports: 0,
    reviewingReports: 0,
    failedReports: 0,
  });

  useEffect(() => {
    // 检查登录状态
    if (!isAdminLoggedIn()) {
      router.push('/');
      return;
    }
    setIsLoggedIn(true);
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = () => {
    adminLogout();
  };

  if (!isLoggedIn) {
    return null;
  }

  const statCards = [
    {
      title: '总报告数',
      value: stats.totalReports,
      color: 'bg-blue-500',
      link: '/admin/reports',
    },
    {
      title: '已完成',
      value: stats.completedReports,
      color: 'bg-green-500',
      link: '/admin/reports?status=completed',
    },
    {
      title: '评审中',
      value: stats.reviewingReports,
      color: 'bg-yellow-500',
      link: '/admin/reports?status=reviewing',
    },
    {
      title: '失败',
      value: stats.failedReports,
      color: 'bg-red-500',
      link: '/admin/reports?status=failed',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">后台管理</h1>
            <p className="mt-2 text-gray-600">系统管理控制台</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            退出登录
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <Link key={card.title} href={card.link}>
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                <p className="text-sm text-gray-600">{card.title}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* 功能菜单 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/reports">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">评审管理</h3>
              </div>
              <p className="text-sm text-gray-600">查看和管理所有评审记录,支持筛选和导出</p>
            </div>
          </Link>

          <Link href="/admin/users">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">用户管理</h3>
              </div>
              <p className="text-sm text-gray-600">查看和管理用户信息,用户行为分析</p>
            </div>
          </Link>

          <Link href="/admin/settings">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">系统配置</h3>
              </div>
              <p className="text-sm text-gray-600">配置系统参数、模型参数、文件上传设置</p>
            </div>
          </Link>

          <Link href="/admin/models">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">AI模型管理</h3>
              </div>
              <p className="text-sm text-gray-600">查看和管理AI模型状态、健康检查</p>
            </div>
          </Link>

          <Link href="/admin/monitoring">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">系统监控</h3>
              </div>
              <p className="text-sm text-gray-600">实时查看系统性能、处理队列、操作日志</p>
            </div>
          </Link>

          <Link href="/admin/change-password">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">修改密码</h3>
              </div>
              <p className="text-sm text-gray-600">修改管理员登录密码,增强账户安全</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
