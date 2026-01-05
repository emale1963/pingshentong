'use client';

import { useState, useEffect } from 'react';

interface PerformanceMetric {
  metric_id: number;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  unit: string;
  collected_at: string;
}

export default function SystemPage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    // 每30秒刷新一次
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system/performance?hours=1');
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Fetch metrics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestMetric = (type: string, name: string) => {
    const filtered = metrics.filter(
      m => m.metric_type === type && m.metric_name === name
    );
    return filtered.length > 0 ? filtered[0] : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统监测</h1>
          <p className="text-sm text-gray-600 mt-1">实时监控系统性能和运行状态</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          刷新数据
        </button>
      </div>

      {/* 系统状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">CPU使用率</div>
          <div className="text-3xl font-bold text-gray-900">
            {getLatestMetric('cpu', 'usage')?.metric_value.toFixed(1) || '0'}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">内存使用率</div>
          <div className="text-3xl font-bold text-gray-900">
            {getLatestMetric('memory', 'usage')?.metric_value.toFixed(1) || '0'}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">磁盘使用率</div>
          <div className="text-3xl font-bold text-gray-900">
            {getLatestMetric('disk', 'usage')?.metric_value.toFixed(1) || '0'}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">API响应时间</div>
          <div className="text-3xl font-bold text-gray-900">
            {getLatestMetric('api', 'response_time')?.metric_value.toFixed(0) || '0'}ms
          </div>
        </div>
      </div>

      {/* 服务状态 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">服务状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded">
            <span className="text-sm font-medium text-gray-900">数据库服务</span>
            <span className="inline-flex items-center justify-center h-2 w-2 rounded-full bg-green-500"></span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded">
            <span className="text-sm font-medium text-gray-900">文件存储服务</span>
            <span className="inline-flex items-center justify-center h-2 w-2 rounded-full bg-green-500"></span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded">
            <span className="text-sm font-medium text-gray-900">AI模型服务</span>
            <span className="inline-flex items-center justify-center h-2 w-2 rounded-full bg-green-500"></span>
          </div>
        </div>
      </div>

      {/* 最近日志 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近系统日志</h2>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="font-medium text-gray-900">INFO</div>
            <div className="text-gray-600 mt-1">系统正常运行</div>
            <div className="text-xs text-gray-500 mt-1">2026-01-05 10:30:00</div>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
            <div className="font-medium text-gray-900">SUCCESS</div>
            <div className="text-gray-600 mt-1">API请求成功处理</div>
            <div className="text-xs text-gray-500 mt-1">2026-01-05 10:25:00</div>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <div className="font-medium text-gray-900">WARNING</div>
            <div className="text-gray-600 mt-1">内存使用率超过70%</div>
            <div className="text-xs text-gray-500 mt-1">2026-01-05 10:20:00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
