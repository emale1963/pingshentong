'use client';

import { useState, useEffect } from 'react';

interface ModelStatus {
  modelId: string;
  name: string;
  available: boolean;
  lastChecked: string;
  error?: string;
  errorCode?: string;
  responseTime?: number;
}

export default function ModelsPage() {
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/models');
      const data = await response.json();

      if (data.success) {
        setModels(data.models);
      }
    } catch (error) {
      console.error('Fetch models error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (modelId: string) => {
    try {
      setTesting(true);
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId }),
      });

      if (response.ok) {
        alert('测试成功');
        fetchModels();
      } else {
        alert('测试失败');
      }
    } catch (error) {
      console.error('Test model error:', error);
      alert('测试失败');
    } finally {
      setTesting(false);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI模型管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理和监控AI模型状态</p>
        </div>
        <button
          onClick={fetchModels}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={testing}
        >
          刷新状态
        </button>
      </div>

      {/* 模型卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <div
            key={model.modelId}
            className={`bg-white rounded-lg shadow p-6 border-2 ${
              model.available ? 'border-green-300' : 'border-red-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
              <span className={`inline-flex items-center justify-center h-3 w-3 rounded-full ${
                model.available ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">状态:</span>
                <span className={`font-medium ${
                  model.available ? 'text-green-600' : 'text-red-600'
                }`}>
                  {model.available ? '可用' : '不可用'}
                </span>
              </div>
              {model.responseTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">响应时间:</span>
                  <span className="text-gray-900">{model.responseTime}ms</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">最后检查:</span>
                <span className="text-gray-500">
                  {new Date(model.lastChecked).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>

            {model.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <div className="font-medium text-red-700">{model.error}</div>
                {model.errorCode && (
                  <div className="text-xs text-red-600 mt-1">错误代码: {model.errorCode}</div>
                )}
              </div>
            )}

            <button
              onClick={() => handleTest(model.modelId)}
              disabled={testing}
              className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {testing ? '测试中...' : '测试连接'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
