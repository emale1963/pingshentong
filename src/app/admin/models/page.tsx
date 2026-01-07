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
  isCustom?: boolean;
}

export default function ModelsPage() {
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configModel, setConfigModel] = useState<string>('');
  const [apiConfig, setApiConfig] = useState({
    endpoint: '',
    apiKey: '',
    apiVersion: '',
    model: '',
  });
  const [newModel, setNewModel] = useState({
    modelId: '',
    name: '',
    description: '',
    provider: '自定义',
    apiConfig: {
      endpoint: '',
      apiKey: '',
      apiVersion: '',
      model: '',
    },
  });

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

  const handleDeleteCustomModel = async (modelId: string) => {
    if (!confirm('确定要删除该自定义模型吗？')) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/models/custom?modelId=${encodeURIComponent(modelId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('删除成功');
        fetchModels();
      } else {
        const data = await response.json();
        alert('删除失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Delete custom model error:', error);
      alert('删除失败');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfigAPI = (modelId: string) => {
    const model = models.find(m => m.modelId === modelId);
    if (!model) return;

    setConfigModel(modelId);

    // 从当前模型配置中获取 API 配置
    const currentConfig = model as any;
    setApiConfig({
      endpoint: currentConfig.apiConfig?.endpoint || '',
      apiKey: currentConfig.apiConfig?.apiKey || '',
      apiVersion: currentConfig.apiConfig?.apiVersion || '',
      model: currentConfig.apiConfig?.model || '',
    });

    setShowConfigModal(true);
  };

  const handleUpdateAPIConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!configModel) {
      alert('模型ID不能为空');
      return;
    }

    if (!apiConfig.endpoint) {
      alert('API端点不能为空');
      return;
    }

    try {
      setUpdating(true);

      // 构建请求体
      const requestBody = {
        modelId: configModel,
        apiConfig: {
          endpoint: apiConfig.endpoint,
          ...(apiConfig.apiKey && { apiKey: apiConfig.apiKey }),
          ...(apiConfig.apiVersion && { apiVersion: apiConfig.apiVersion }),
          ...(apiConfig.model && { model: apiConfig.model }),
        }
      };

      const response = await fetch('/api/admin/models/config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestBody,
          action: 'updateAPIConfig'
        }),
      });

      if (response.ok) {
        alert('API配置更新成功');
        setShowConfigModal(false);
        fetchModels();
      } else {
        const data = await response.json();
        alert('更新失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Update API config error:', error);
      alert('更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddCustomModel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newModel.modelId || !newModel.name) {
      alert('模型ID和名称不能为空');
      return;
    }

    try {
      setUpdating(true);

      // 构建请求体，只包含非空的 API 配置字段
      const requestBody = {
        modelId: newModel.modelId,
        name: newModel.name,
        description: newModel.description,
        provider: newModel.provider,
        ...(newModel.apiConfig.endpoint && {
          apiConfig: {
            endpoint: newModel.apiConfig.endpoint,
            ...(newModel.apiConfig.apiKey && { apiKey: newModel.apiConfig.apiKey }),
            ...(newModel.apiConfig.apiVersion && { apiVersion: newModel.apiConfig.apiVersion }),
            ...(newModel.apiConfig.model && { model: newModel.apiConfig.model }),
          }
        }),
      };

      const response = await fetch('/api/admin/models/custom', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert('添加成功');
        setShowAddModal(false);
        setNewModel({
          modelId: '',
          name: '',
          description: '',
          provider: '自定义',
          apiConfig: {
            endpoint: '',
            apiKey: '',
            apiVersion: '',
            model: '',
          },
        });
        fetchModels();
      } else {
        const data = await response.json();
        alert('添加失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Add custom model error:', error);
      alert('添加失败');
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            disabled={testing || updating}
          >
            添加外部模型
          </button>
          <button
            onClick={fetchModels}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            disabled={testing || updating}
          >
            刷新状态
          </button>
        </div>
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

      {/* 模型列表 - 卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <div
            key={model.modelId}
            className={`
              bg-white rounded-lg shadow-md border-2 transition-all hover:shadow-lg
              ${model.isDefault ? 'border-blue-500' : 'border-gray-200'}
              ${!model.enabled ? 'opacity-60' : ''}
            `}
          >
            <div className="p-5">
              {/* 头部：名称和标签 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                    {model.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        默认
                      </span>
                    )}
                    {model.isCustom && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        自定义
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{model.description}</p>
                </div>
              </div>

              {/* 提供商 */}
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>{model.provider}</span>
              </div>

              {/* 状态信息 */}
              <div className="space-y-2 mb-4">
                {/* 连接状态 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">连接状态:</span>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center h-2 w-2 rounded-full ${
                      model.available ? 'bg-green-500' : 'bg-red-500'
                    } mr-2`}></span>
                    <span className={`text-sm font-medium ${
                      model.available ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {model.available ? '可用' : '不可用'}
                    </span>
                  </div>
                </div>

                {/* 响应时间 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">响应时间:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {model.responseTime ? `${model.responseTime}ms` : '-'}
                  </span>
                </div>

                {/* 启用状态 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">启用状态:</span>
                  <span className={`text-sm font-medium ${
                    model.enabled ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {model.enabled ? '已启用' : '已禁用'}
                  </span>
                </div>
              </div>

              {/* 错误信息 */}
              {model.error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-600" title={model.error}>
                    {model.error}
                  </p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleTest(model.modelId)}
                  disabled={testing || !model.enabled || !model.available}
                  className="flex-1 min-w-[70px] px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  测试
                </button>
                <button
                  onClick={() => handleToggleEnabled(model.modelId, !model.enabled)}
                  disabled={updating}
                  className={`flex-1 min-w-[70px] px-3 py-1.5 text-sm rounded transition-colors ${
                    model.enabled
                      ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {model.enabled ? '禁用' : '启用'}
                </button>
                {!model.isDefault && model.enabled && (
                  <button
                    onClick={() => handleSetDefault(model.modelId)}
                    disabled={updating}
                    className="flex-1 min-w-[70px] px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    设为默认
                  </button>
                )}
                {model.isCustom && (
                  <>
                    <button
                      onClick={() => handleConfigAPI(model.modelId)}
                      disabled={updating}
                      className="flex-1 min-w-[70px] px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                    >
                      配置API
                    </button>
                    <button
                      onClick={() => handleDeleteCustomModel(model.modelId)}
                      disabled={updating}
                      className="flex-1 min-w-[70px] px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 添加外部模型弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">添加外部模型</h3>
              <form onSubmit={handleAddCustomModel} className="space-y-4">
                <div>
                  <label htmlFor="modelId" className="block text-sm font-medium text-gray-700 mb-1">
                    模型ID *
                  </label>
                  <input
                    id="modelId"
                    type="text"
                    value={newModel.modelId}
                    onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: gpt-4o"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    模型名称 *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: GPT-4o"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    id="description"
                    value={newModel.description}
                    onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="简要描述模型的特点和用途"
                  />
                </div>
                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                    提供商
                  </label>
                  <input
                    id="provider"
                    type="text"
                    value={newModel.provider}
                    onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: OpenAI"
                  />
                </div>

                {/* API 配置 */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">API 配置（可选）</h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
                        API 端点 *
                      </label>
                      <input
                        id="endpoint"
                        type="url"
                        value={newModel.apiConfig.endpoint}
                        onChange={(e) => setNewModel({
                          ...newModel,
                          apiConfig: { ...newModel.apiConfig, endpoint: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例如: https://api.openai.com/v1/chat/completions"
                      />
                      <p className="text-xs text-gray-500 mt-1">填写完整 URL（可选，用于健康检查）</p>
                    </div>
                    <div>
                      <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                        API 密钥
                      </label>
                      <input
                        id="apiKey"
                        type="password"
                        value={newModel.apiConfig.apiKey}
                        onChange={(e) => setNewModel({
                          ...newModel,
                          apiConfig: { ...newModel.apiConfig, apiKey: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例如: sk-xxx..."
                      />
                      <p className="text-xs text-gray-500 mt-1">用于 API 认证（可选）</p>
                    </div>
                    <div>
                      <label htmlFor="apiVersion" className="block text-sm font-medium text-gray-700 mb-1">
                        API 版本
                      </label>
                      <input
                        id="apiVersion"
                        type="text"
                        value={newModel.apiConfig.apiVersion}
                        onChange={(e) => setNewModel({
                          ...newModel,
                          apiConfig: { ...newModel.apiConfig, apiVersion: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例如: 2023-05-15"
                      />
                      <p className="text-xs text-gray-500 mt-1">部分 API 需要指定版本（可选）</p>
                    </div>
                    <div>
                      <label htmlFor="actualModel" className="block text-sm font-medium text-gray-700 mb-1">
                        实际模型名称
                      </label>
                      <input
                        id="actualModel"
                        type="text"
                        value={newModel.apiConfig.model}
                        onChange={(e) => setNewModel({
                          ...newModel,
                          apiConfig: { ...newModel.apiConfig, model: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例如: gpt-4-turbo-preview"
                      />
                      <p className="text-xs text-gray-500 mt-1">API 调用时使用的模型参数（可选）</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    添加
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 配置API弹窗 */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">配置API</h3>
              <p className="text-sm text-gray-600 mb-4">
                为模型 <span className="font-medium text-gray-900">{configModel}</span> 配置API
              </p>
              <form onSubmit={handleUpdateAPIConfig} className="space-y-4">
                <div>
                  <label htmlFor="config-endpoint" className="block text-sm font-medium text-gray-700 mb-1">
                    API 端点 *
                  </label>
                  <input
                    id="config-endpoint"
                    type="url"
                    value={apiConfig.endpoint}
                    onChange={(e) => setApiConfig({ ...apiConfig, endpoint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: https://api.openai.com/v1/chat/completions"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">填写完整 URL</p>
                </div>
                <div>
                  <label htmlFor="config-apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    API 密钥
                  </label>
                  <input
                    id="config-apiKey"
                    type="password"
                    value={apiConfig.apiKey}
                    onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: sk-xxx..."
                  />
                  <p className="text-xs text-gray-500 mt-1">用于 API 认证（可选）</p>
                </div>
                <div>
                  <label htmlFor="config-apiVersion" className="block text-sm font-medium text-gray-700 mb-1">
                    API 版本
                  </label>
                  <input
                    id="config-apiVersion"
                    type="text"
                    value={apiConfig.apiVersion}
                    onChange={(e) => setApiConfig({ ...apiConfig, apiVersion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: 2023-05-15"
                  />
                  <p className="text-xs text-gray-500 mt-1">部分 API 需要指定版本（可选）</p>
                </div>
                <div>
                  <label htmlFor="config-model" className="block text-sm font-medium text-gray-700 mb-1">
                    实际模型名称
                  </label>
                  <input
                    id="config-model"
                    type="text"
                    value={apiConfig.model}
                    onChange={(e) => setApiConfig({ ...apiConfig, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: gpt-4-turbo-preview"
                  />
                  <p className="text-xs text-gray-500 mt-1">API 调用时使用的模型参数（可选）</p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    保存配置
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
