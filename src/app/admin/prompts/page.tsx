'use client';

import { useState, useEffect } from 'react';
import { PROFESSION_NAMES } from '@/lib/prompts';

interface SystemPrompt {
  id: number;
  profession: string;
  promptContent: string;
  promptVersion: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function PromptsManagementPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    profession: '',
    promptContent: '',
    promptVersion: '1.0',
    isActive: true,
  });

  // 加载提示词列表
  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/admin/prompts');
      const result = await response.json();
      if (result.success) {
        setPrompts(result.data);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  // 创建提示词
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        setFormData({ profession: '', promptContent: '', promptVersion: '1.0', isActive: true });
        loadPrompts();
      } else {
        alert(result.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create prompt:', error);
      alert('创建失败');
    }
  };

  // 更新提示词
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;

    try {
      const response = await fetch(`/api/admin/prompts/${editingPrompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptContent: editingPrompt.promptContent,
          promptVersion: editingPrompt.promptVersion,
          isActive: editingPrompt.isActive,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setEditingPrompt(null);
        loadPrompts();
      } else {
        alert(result.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update prompt:', error);
      alert('更新失败');
    }
  };

  // 删除提示词
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个提示词吗？')) return;

    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        loadPrompts();
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">评审提示词管理</h1>
          <div className="text-center py-8">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">评审提示词管理</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            添加提示词
          </button>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  专业
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提示词版本
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prompts.map((prompt) => (
                <tr key={prompt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {PROFESSION_NAMES[prompt.profession] || prompt.profession}
                    </div>
                    <div className="text-sm text-gray-500">{prompt.profession}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prompt.promptVersion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        prompt.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {prompt.isActive ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(prompt.updatedAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingPrompt(prompt)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {prompts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    暂无提示词，点击"添加提示词"创建
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 创建提示词弹窗 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[101]">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold">添加提示词</h2>
              </div>
              <form onSubmit={handleCreate} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    专业
                  </label>
                  <select
                    required
                    value={formData.profession}
                    onChange={(e) =>
                      setFormData({ ...formData, profession: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">请选择专业</option>
                    {Object.entries(PROFESSION_NAMES).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name} ({key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    版本
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.promptVersion}
                    onChange={(e) =>
                      setFormData({ ...formData, promptVersion: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="1.0"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提示词内容
                  </label>
                  <textarea
                    required
                    rows={15}
                    value={formData.promptContent}
                    onChange={(e) =>
                      setFormData({ ...formData, promptContent: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                    placeholder="输入AI评审的系统提示词..."
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">启用</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    创建
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 编辑提示词弹窗 */}
        {editingPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[101]">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold">编辑提示词</h2>
              </div>
              <form onSubmit={handleUpdate} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    专业
                  </label>
                  <div className="text-gray-900 font-medium">
                    {PROFESSION_NAMES[editingPrompt.profession] || editingPrompt.profession}
                  </div>
                  <div className="text-sm text-gray-500">{editingPrompt.profession}</div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    版本
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPrompt.promptVersion}
                    onChange={(e) =>
                      setEditingPrompt({ ...editingPrompt, promptVersion: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提示词内容
                  </label>
                  <textarea
                    required
                    rows={15}
                    value={editingPrompt.promptContent}
                    onChange={(e) =>
                      setEditingPrompt({ ...editingPrompt, promptContent: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingPrompt.isActive}
                      onChange={(e) =>
                        setEditingPrompt({ ...editingPrompt, isActive: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">启用</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingPrompt(null)}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    更新
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
