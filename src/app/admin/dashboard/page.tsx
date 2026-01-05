'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalReports: number;
  totalReviews: number;
  totalUsers: number;
  activeUsers: number;
  modelUsage: {
    modelId: string;
    count: number;
  }[];
  recentActivity: {
    id: number;
    type: string;
    detail: string;
    timestamp: string;
  }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 模拟数据
      setStats({
        totalReports: 150,
        totalReviews: 420,
        totalUsers: 85,
        activeUsers: 32,
        modelUsage: [
          { modelId: 'doubao-seed', count: 280 },
          { modelId: 'kimi-k2', count: 95 },
          { modelId: 'deepseek-r1', count: 45 },
        ],
        recentActivity: [
          { id: 1, type: '评审', detail: '完成建筑专业评审', timestamp: '2026-01-05 10:30' },
          { id: 2, type: '上传', detail: '用户上传新报告', timestamp: '2026-01-05 10:25' },
          { id: 3, type: '登录', detail: '管理员登录系统', timestamp: '2026-01-05 10:20' },
        ],
      });
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          刷新数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">总报告数</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalReports || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">总评审数</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalReviews || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">用户总数</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">活跃用户</div>
          <div className="text-3xl font-bold text-blue-600">{stats?.activeUsers || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 模型使用情况 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">模型使用情况</h2>
          <div className="space-y-4">
            {stats?.modelUsage.map((usage) => (
              <div key={usage.modelId} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{usage.modelId}</span>
                <div className="flex items-center">
                  <div className="w-48 bg-gray-200 rounded-full h-2 mr-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(usage.count / (stats?.totalReviews || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{usage.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h2>
          <div className="space-y-3">
            {stats?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                    {activity.type}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.detail}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/admin/review-configs" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="text-sm font-medium text-gray-900">评审配置</div>
            <div className="text-xs text-gray-500 mt-1">管理专业评审规则</div>
          </a>
          <a href="/admin/models" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="text-sm font-medium text-gray-900">AI模型</div>
            <div className="text-xs text-gray-500 mt-1">配置和测试模型</div>
          </a>
          <a href="/admin/users" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="text-sm font-medium text-gray-900">用户管理</div>
            <div className="text-xs text-gray-500 mt-1">管理用户和权限</div>
          </a>
          <a href="/admin/system" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="text-sm font-medium text-gray-900">系统监测</div>
            <div className="text-xs text-gray-500 mt-1">监控系统状态</div>
          </a>
        </div>
      </div>
    </div>
  );
}
