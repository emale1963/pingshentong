'use client';

import { useState, useEffect } from 'react';

interface ModelStatus {
  modelId: string;
  name: string;
  description: string;
  provider: string;
  available: boolean;
  lastChecked: string;
  error?: string;
  errorCode?: string;
  responseTime?: number;
  enabled: boolean;
  isDefault: boolean;
  priority: number;
}

export default function ModelsPage() {
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/models', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setModels(data.models);
        setDefaultModel(data.defaultModel);
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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId, action: 'test' }),
      });

      if (response.ok) {
        alert('测试成功');
        fetchModels();
      } else {
        const data = await response.json();
        alert('测试失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Test model error:', error);
      alert('测试失败');
    } finally {
      setTesting(false);
    }
  };

  const handleToggleEnabled = async (modelId: string, enabled: boolean) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/admin/models/config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          action: enabled ? 'enable' : 'disable',
        }),
      });

      if (response.ok) {
        fetchModels();
      } else {
        const data = await response.json();
        alert('操作失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Toggle model enabled error:', error);
      alert('操作失败');
    } finally {
      setUpdating(false);
    }
  };

  const handleSetDefault = async (modelId: string) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/admin/models/config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          action: 'setDefault',
        }),
      });

      if (response.ok) {
        fetchModels();
      } else {
        const data = await response.json();
        alert('设置失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Set default model error:', error);
      alert('设置失败');
    } finally {
      setUpdating(false);
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
          <p className="text-sm text-gray-600 mt-1">管理和监控AI模型状态，配置模型启用/禁用</p>
        </div>
        <button
          onClick={fetchModels}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={testing || updating}
        >
          刷新状态
        </button>
      </div>

      {/* 当前默认模型提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-800">当前默认模型:</span>
          <span className="text-sm font-bold text-blue-900">
            {models.find(m => m.modelId === defaultModel)?.name || '未设置'}
          </span>
        </div>
      </div>

      {/* 模型卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <div
            key={model.modelId}
            className={`bg-white rounded-lg shadow p-6 border-2 ${
              model.available ? 'border-green-300' : 'border-red-300'
            } ${!model.enabled ? 'opacity-60' : ''} ${model.isDefault ? 'ring-2 ring-blue-500' : ''}`}
          >
            {/* 头部：模型名称和状态 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{model.provider}</p>
              </div>
              <div className="flex items-center space-x-2">
                {model.isDefault && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    默认
                  </span>
                )}
                <span className={`inline-flex items-center justify-center h-3 w-3 rounded-full ${
                  model.available ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
              </div>
            </div>

            {/* 描述 */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{model.description}</p>

            {/* 状态信息 */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">连接状态:</span>
                <span className={`font-medium ${
                  model.available ? 'text-green-600' : 'text-red-600'
                }`}>
                  {model.available ? '可用' : '不可用'}
                </span>
              </div>
              {model.responseTime && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">响应时间:</span>
                  <span className="text-gray-900">{model.responseTime}ms</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">启用状态:</span>
                <span className={`font-medium ${
                  model.enabled ? 'text-green-600' : 'text-red-600'
                }`}>
                  {model.enabled ? '已启用' : '已禁用'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">最后检查:</span>
                <span className="text-gray-500 text-xs">
                  {new Date(model.lastChecked).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>

            {/* 错误信息 */}
            {model.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <div className="font-medium text-red-700">{model.error}</div>
                {model.errorCode && (
                  <div className="text-xs text-red-600 mt-1">错误代码: {model.errorCode}</div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-2">
              <button
                onClick={() => handleTest(model.modelId)}
                disabled={testing || !model.enabled || !model.available}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? '测试中...' : '测试连接'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleToggleEnabled(model.modelId, !model.enabled)}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    model.enabled
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } disabled:opacity-50`}
                >
                  {model.enabled ? '禁用' : '启用'}
                </button>

                {!model.isDefault && model.enabled && (
                  <button
                    onClick={() => handleSetDefault(model.modelId)}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    设为默认
                  </button>
                )}

                {model.isDefault && (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                  >
                    当前默认
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 说明 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <h4 className="font-medium text-gray-900 mb-2">说明</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>可用状态：</strong>显示模型连接是否正常</li>
          <li><strong>启用状态：</strong>禁用的模型将不会被系统使用</li>
          <li><strong>默认模型：</strong>系统首选使用的模型，设置后将以该模型为主</li>
          <li><strong>响应时间：</strong>模型响应的平均时间，越短越好</li>
        </ul>
      </div>
    </div>
  );
}
