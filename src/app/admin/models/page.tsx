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

      {/* 模型列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                模型名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                提供商
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                连接状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                响应时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                启用状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {models.map((model) => (
              <tr
                key={model.modelId}
                className={`
                  ${model.isDefault ? 'bg-blue-50' : ''}
                  ${!model.enabled ? 'opacity-60' : ''}
                `}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{model.name}</div>
                        {model.isDefault && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            默认
                          </span>
                        )}
                        {model.isCustom && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            自定义
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{model.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{model.provider}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                  {model.error && (
                    <div className="text-xs text-red-500 mt-1 truncate max-w-xs" title={model.error}>
                      {model.error}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {model.responseTime ? `${model.responseTime}ms` : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${
                    model.enabled ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {model.enabled ? '已启用' : '已禁用'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTest(model.modelId)}
                      disabled={testing || !model.enabled || !model.available}
                      className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      测试
                    </button>
                    <button
                      onClick={() => handleToggleEnabled(model.modelId, !model.enabled)}
                      disabled={updating}
                      className={model.enabled ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                    >
                      {model.enabled ? '禁用' : '启用'}
                    </button>
                    {!model.isDefault && model.enabled && (
                      <button
                        onClick={() => handleSetDefault(model.modelId)}
                        disabled={updating}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        设为默认
                      </button>
                    )}
                    {model.isCustom && (
                      <button
                        onClick={() => handleConfigAPI(model.modelId)}
                        disabled={updating}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        配置API
                      </button>
                    )}
                    {model.isCustom && (
                      <button
                        onClick={() => handleDeleteCustomModel(model.modelId)}
                        disabled={updating}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
