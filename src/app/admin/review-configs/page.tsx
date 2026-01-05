'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReviewConfig {
  config_id: number;
  profession: string;
  config_name: string;
  review_depth: string;
  is_active: boolean;
  keyword_count: number;
  created_at: string;
  updated_at: string;
}

export default function ReviewConfigsPage() {
  const [configs, setConfigs] = useState<ReviewConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReviewConfig | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/review-configs', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setConfigs(data.configs);
      }
    } catch (error) {
      console.error('Fetch configs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (configId: number) => {
    if (!confirm('确定要删除这个评审配置吗？')) return;

    try {
      const response = await fetch(`/api/admin/review-configs/${configId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchConfigs();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('Delete config error:', error);
      alert('删除失败');
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
          <h1 className="text-2xl font-bold text-gray-900">评审配置管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理各专业的评审规则和关键词</p>
        </div>
        <button
          onClick={() => {
            setEditingConfig(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          添加配置
        </button>
      </div>

      {/* 配置列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                专业
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                配置名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                评审深度
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                关键词数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {configs.map((config) => (
              <tr key={config.config_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {config.profession}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {config.config_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {config.review_depth}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {config.keyword_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    config.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {config.is_active ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/review-configs/${config.config_id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    详情
                  </Link>
                  <button
                    onClick={() => {
                      setEditingConfig(config);
                      setShowModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(config.config_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 添加/编辑模态框（简化版） */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">
              {editingConfig ? '编辑配置' : '添加配置'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  专业代码
                </label>
                <input
                  type="text"
                  defaultValue={editingConfig?.profession}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例如: architecture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配置名称
                </label>
                <input
                  type="text"
                  defaultValue={editingConfig?.config_name}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例如: 建筑专业默认配置"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  取消
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
