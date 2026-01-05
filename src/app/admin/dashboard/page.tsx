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
    
    // 每1分钟自动刷新
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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
          <div className="mt-2 text-xs text-[var(--color-brand-primary)]">本周 +12%</div>
        </div>
        <div className="card">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">总评审数</div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{stats?.totalReviews || 0}</div>
          <div className="mt-2 text-xs text-[var(--color-brand-primary)]">本周 +8%</div>
        </div>
        <div className="card">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">用户总数</div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{stats?.totalUsers || 0}</div>
          <div className="mt-2 text-xs text-[var(--color-brand-primary)]">本周 +5</div>
        </div>
        <div className="card">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">活跃用户</div>
          <div className="text-3xl font-bold text-[var(--color-brand-primary)]">{stats?.activeUsers || 0}</div>
          <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">本周活跃</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 模型使用情况 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">模型使用情况</h2>
          <div className="space-y-4">
            {stats?.modelUsage.map((usage) => (
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
            ))}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">最近活动</h2>
          <div className="space-y-3">
            {stats?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)] text-xs font-medium">
                    {activity.type}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text-primary)]">{activity.detail}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <a href="/admin/review-configs" className="block p-4 border border-[var(--color-border-secondary)] rounded-[var(--radius-md)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-bg-hover)] transition-all duration-[var(--transition-fast)]">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">评审配置</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">管理专业评审规则</div>
          </a>
          <a href="/admin/prompts" className="block p-4 border border-[var(--color-border-secondary)] rounded-[var(--radius-md)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-bg-hover)] transition-all duration-[var(--transition-fast)]">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">AI评审提示词</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">管理AI提示词</div>
          </a>
          <a href="/admin/fallback-reviews" className="block p-4 border border-[var(--color-border-secondary)] rounded-[var(--radius-md)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-bg-hover)] transition-all duration-[var(--transition-fast)]">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">降级评审要点</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">管理降级方案</div>
          </a>
          <a href="/admin/models" className="block p-4 border border-[var(--color-border-secondary)] rounded-[var(--radius-md)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-bg-hover)] transition-all duration-[var(--transition-fast)]">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">AI模型</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">配置和测试模型</div>
          </a>
          <a href="/admin/users" className="block p-4 border border-[var(--color-border-secondary)] rounded-[var(--radius-md)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-bg-hover)] transition-all duration-[var(--transition-fast)]">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">用户管理</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">管理用户和权限</div>
          </a>
          <a href="/admin/system" className="block p-4 border border-[var(--color-border-secondary)] rounded-[var(--radius-md)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-bg-hover)] transition-all duration-[var(--transition-fast)]">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">系统监测</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">监控系统状态</div>
          </a>
        </div>
      </div>
    </div>
  );
}
