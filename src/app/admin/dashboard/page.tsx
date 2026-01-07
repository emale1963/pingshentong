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
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // 每1分钟自动刷新
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)] rounded-full spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">总报告数</div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{stats?.totalReports || 0}</div>
          <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">累计上传</div>
        </div>
        <div className="card">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">总评审数</div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{stats?.totalReviews || 0}</div>
          <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">已完成评审</div>
        </div>
        <div className="card">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">用户总数</div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{stats?.totalUsers || 0}</div>
          <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">注册用户</div>
        </div>
        <div className="card">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">活跃用户</div>
          <div className="text-3xl font-bold text-[var(--color-brand-primary)]">{stats?.activeUsers || 0}</div>
          <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">7天内活跃</div>
        </div>
      </div>

      {/* 模型使用情况 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">模型使用情况</h2>
        <div className="space-y-4">
          {stats?.modelUsage && stats.modelUsage.length > 0 ? (
            stats.modelUsage.map((usage) => (
              <div key={usage.modelId} className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">{usage.modelId}</span>
                <div className="flex items-center">
                  <div className="w-48 bg-[var(--color-border-secondary)] rounded-full h-2 mr-4">
                    <div
                      className="bg-[var(--color-brand-primary)] h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(usage.count / (stats?.totalReviews || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{usage.count}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-[var(--color-text-tertiary)] py-4 text-center">暂无模型使用数据</div>
          )}
        </div>
      </div>
    </div>
  );
}
