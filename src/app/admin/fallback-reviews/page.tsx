'use client';

import { useState, useEffect } from 'react';
import { PROFESSION_NAMES } from '@/lib/prompts';

interface FallbackReview {
  id: number;
  profession: string;
  description: string;
  standard: string;
  suggestion: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FallbackReviewsManagementPage() {
  const [reviews, setReviews] = useState<FallbackReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<FallbackReview | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterProfession, setFilterProfession] = useState('');
  const [formData, setFormData] = useState({
    profession: '',
    description: '',
    standard: '',
    suggestion: '',
    displayOrder: 1,
    isActive: true,
  });

  // 加载评审要点列表
  const loadReviews = async () => {
    try {
      const url = filterProfession
        ? `/api/admin/fallback-reviews?profession=${filterProfession}`
        : '/api/admin/fallback-reviews';
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setReviews(result.data);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [filterProfession]);

  // 创建评审要点
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/fallback-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        setFormData({
          profession: '',
          description: '',
          standard: '',
          suggestion: '',
          displayOrder: 1,
          isActive: true,
        });
        loadReviews();
      } else {
        alert(result.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create review:', error);
      alert('创建失败');
    }
  };

  // 更新评审要点
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    try {
      const response = await fetch(`/api/admin/fallback-reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editingReview.description,
          standard: editingReview.standard,
          suggestion: editingReview.suggestion,
          displayOrder: editingReview.displayOrder,
          isActive: editingReview.isActive,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setEditingReview(null);
        loadReviews();
      } else {
        alert(result.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update review:', error);
      alert('更新失败');
    }
  };

  // 删除评审要点
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个评审要点吗？')) return;

    try {
      const response = await fetch(`/api/admin/fallback-reviews/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        loadReviews();
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">降级评审要点管理</h1>
          <div className="text-center py-8">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">降级评审要点管理</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            添加评审要点
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            专业筛选
          </label>
          <select
            value={filterProfession}
            onChange={(e) => setFilterProfession(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">全部专业</option>
            {Object.entries(PROFESSION_NAMES).map(([key, name]) => (
              <option key={key} value={key}>
                {name} ({key})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  专业
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  规范依据
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  顺序
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
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {PROFESSION_NAMES[review.profession] || review.profession}
                    </div>
                    <div className="text-sm text-gray-500">{review.profession}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md truncate">
                      {review.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-md truncate">
                      {review.standard}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {review.displayOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        review.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {review.isActive ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingReview(review)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无评审要点，点击"添加评审要点"创建
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 创建评审要点弹窗 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[101]">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold">添加评审要点</h2>
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
                    问题描述
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="具体发现的问题"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    规范依据
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.standard}
                    onChange={(e) =>
                      setFormData({ ...formData, standard: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="相关规范名称、编号及具体条款"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    修改建议
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.suggestion}
                    onChange={(e) =>
                      setFormData({ ...formData, suggestion: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="具体可行的修改建议"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    显示顺序
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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

        {/* 编辑评审要点弹窗 */}
        {editingReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[101]">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold">编辑评审要点</h2>
              </div>
              <form onSubmit={handleUpdate} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    专业
                  </label>
                  <div className="text-gray-900 font-medium">
                    {PROFESSION_NAMES[editingReview.profession] || editingReview.profession}
                  </div>
                  <div className="text-sm text-gray-500">{editingReview.profession}</div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    问题描述
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editingReview.description}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, description: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    规范依据
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editingReview.standard}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, standard: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    修改建议
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editingReview.suggestion}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, suggestion: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    显示顺序
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingReview.displayOrder}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, displayOrder: parseInt(e.target.value) || 1 })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingReview.isActive}
                      onChange={(e) =>
                        setEditingReview({ ...editingReview, isActive: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">启用</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingReview(null)}
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
