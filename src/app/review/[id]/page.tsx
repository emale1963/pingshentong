'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/Button';

const PROFESSION_NAMES: Record<string, string> = {
  architecture: '建筑',
  structure: '结构',
  plumbing: '给排水',
  electrical: '电气',
  hvac: '暖通',
  fire: '消防',
  road: '道路',
  landscape: '景观',
  interior: '室内',
  cost: '造价',
};

interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  isDefault: boolean;
}

interface ReviewItem {
  id: string;
  description: string;
  standard: string;
  suggestion: string;
  confirmed: boolean;
  display_order?: number;
}

interface Review {
  id: number;
  profession: string;
  ai_analysis: string;
  manual_review: string;
  review_items: ReviewItem[];
  confirmed_items: string[];
}

interface Report {
  id: number;
  professions: string[];
  status: string;
  file_name: string;
  created_at: string;
  error_message?: string;
  reviews: Review[];
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('kimi-k2');
  const [modelsLoading, setModelsLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    fetchReport();
    fetchModels();
    const interval = setInterval(fetchReport, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  const fetchModels = async () => {
    try {
      setModelsLoading(true);
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models);
        if (data.defaultModel) {
          setSelectedModel(data.defaultModel);
        }
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setModelsLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);

        // 只在还没有选择任何专业时自动切换到第一个专业
        if (!selectedTab && data.reviews && data.reviews.length > 0) {
          setSelectedTab(data.reviews[0].profession);
        }

        // 根据数据库中的confirmed_items初始化勾选状态
        if (data.reviews) {
          const newCheckedItems: Record<string, Set<string>> = {};
          data.reviews.forEach((review: Review) => {
            newCheckedItems[review.profession] = new Set(review.confirmed_items || []);
          });
          setCheckedItems(newCheckedItems);
        }
      } else if (response.status === 404) {
        setError('报告不存在');
      } else {
        setError('加载报告失败');
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheck = async (profession: string, itemId: string) => {
    // 先确定新的状态
    const isChecked = checkedItems[profession]?.has(itemId) || false;
    const newCheckedStatus = !isChecked;

    // 更新本地状态
    setCheckedItems(prev => {
      const newChecked = { ...prev };
      const professionItems = new Set(newChecked[profession] || []);

      if (newCheckedStatus) {
        professionItems.add(itemId);
      } else {
        professionItems.delete(itemId);
      }

      newChecked[profession] = professionItems;
      return newChecked;
    });

    // 同步到数据库
    try {
      await fetch(`/api/reports/${report?.id}/reviews/${profession}/confirm`, {
        method: newCheckedStatus ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
    } catch (error) {
      console.error('Failed to update check status:', error);
      // 如果失败，恢复本地状态
      setCheckedItems(prev => {
        const newChecked = { ...prev };
        const professionItems = new Set(newChecked[profession] || []);

        if (newCheckedStatus) {
          professionItems.delete(itemId);
        } else {
          professionItems.add(itemId);
        }

        newChecked[profession] = professionItems;
        return newChecked;
      });
    }
  };

  const handleSelectAll = async (profession: string) => {
    const review = report?.reviews.find(r => r.profession === profession);
    if (!review) return;

    const currentChecked = checkedItems[profession] || new Set();
    const allSelected = review.review_items.every(item => currentChecked.has(item.id));
    const selectAll = !allSelected;

    // 更新本地状态
    setCheckedItems(prev => {
      const newChecked = { ...prev };
      if (selectAll) {
        // 全选：将该专业所有意见都选中
        newChecked[profession] = new Set(review.review_items.map(item => item.id));
      } else {
        // 取消全选：清空该专业的所有选中
        newChecked[profession] = new Set();
      }
      return newChecked;
    });

    // 同步到数据库
    try {
      const itemsToConfirm = selectAll
        ? review.review_items.map(item => item.id)
        : [];

      await fetch(`/api/reports/${report?.id}/reviews/${profession}/confirm-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: itemsToConfirm }),
      });
    } catch (error) {
      console.error('Failed to batch update check status:', error);
      // 如果失败，恢复本地状态
      setCheckedItems(prev => {
        const newChecked = { ...prev };
        if (selectAll) {
          newChecked[profession] = new Set();
        } else {
          newChecked[profession] = new Set(review.review_items.map(item => item.id));
        }
        return newChecked;
      });
    }
  };

  const handleTriggerReview = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelType: selectedModel }),
      });

      if (response.ok) {
        fetchReport();
      } else {
        alert('触发评审失败');
      }
    } catch (error) {
      console.error('Failed to trigger review:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      submitted: {
        label: '已提交',
        bgColor: 'bg-[rgba(59,130,246,0.1)]',
        textColor: 'text-[var(--color-info)]',
      },
      reviewing: {
        label: '评审中',
        bgColor: 'bg-[rgba(245,158,11,0.1)]',
        textColor: 'text-[var(--color-warning)]',
      },
      completed: {
        label: '已完成',
        bgColor: 'bg-[rgba(16,185,129,0.1)]',
        textColor: 'text-[var(--color-success)]',
      },
      failed: {
        label: '失败',
        bgColor: 'bg-[rgba(239,68,68,0.1)]',
        textColor: 'text-[var(--color-error)]',
      },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.submitted;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getProfessionName = (profession: string) => {
    return PROFESSION_NAMES[profession] || profession;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-secondary)] pt-[var(--navbar-height)]">
        <div className="max-w-[var(--max-width-content)] mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)] rounded-full spinner mx-auto"></div>
            <p className="mt-4 text-[var(--color-text-secondary)]">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-secondary)] pt-[var(--navbar-height)]">
        <div className="max-w-[var(--max-width-content)] mx-auto px-4 py-12">
          <div className="card bg-[rgba(239,68,68,0.05)] border-[var(--color-error)]">
            <h3 className="text-lg font-medium text-[var(--color-error)] mb-2">加载失败</h3>
            <p className="text-[var(--color-error)] mb-4">{error || '报告不存在'}</p>
            <div className="flex space-x-4">
              <Button
                variant="secondary"
                onClick={() => router.back()}
              >
                返回
              </Button>
              <Button onClick={fetchReport}>
                重试
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedReview = report.reviews.find(r => r.profession === selectedTab);

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="pt-[var(--navbar-height)]">
        <div className="max-w-[var(--max-width-content)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 返回按钮 */}
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="mb-6"
          >
            ← 返回
          </Button>

          {/* 报告信息 */}
          <div className="card mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{report.file_name}</h1>
                <div className="flex items-center flex-wrap gap-2">
                  {report.professions.map(p => (
                    <span key={p} className="px-3 py-1 bg-[var(--color-brand-primary-light)] rounded-full text-sm text-[var(--color-brand-primary)]">
                      {getProfessionName(p)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {getStatusBadge(report.status)}
                <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
                  {new Date(report.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>

          {/* 状态提示和操作按钮 */}
          <div className="card mb-6">
            {report.status === 'submitted' && (
              <div className="space-y-6">
                {/* 模型选择器 */}
                <div className="border-b border-[var(--color-border-secondary)] pb-6">
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">选择 AI 模型</h3>
                  {modelsLoading ? (
                    <div className="text-[var(--color-text-tertiary)]">加载模型列表中...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {availableModels.map((model) => (
                        <div
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`
                            p-4 border-2 rounded-[var(--radius-lg)] cursor-pointer transition-all
                            ${selectedModel === model.id
                              ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)]'
                              : 'border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-[var(--color-text-primary)] text-sm">{model.name}</h4>
                            {selectedModel === model.id && (
                              <span className="text-[var(--color-brand-primary)]">✓</span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--color-text-secondary)] mb-2">{model.description}</p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">提供商: {model.provider}</p>
                          {model.isDefault && (
                            <span className="inline-block mt-2 px-2 py-1 bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)] text-xs rounded-[var(--radius-sm)]">
                              默认
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 开始评审按钮 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">等待评审</h3>
                    <p className="text-[var(--color-text-secondary)]">报告已提交，选择模型后点击下方按钮开始 AI 智能评审</p>
                  </div>
                  <Button onClick={handleTriggerReview}>
                    开始评审
                  </Button>
                </div>
              </div>
            )}

            {report.status === 'reviewing' && (
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)] rounded-full spinner"></div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)]">AI 正在评审中...</h3>
                  <p className="text-[var(--color-text-secondary)]">系统正在调用大模型进行智能分析，预计需要 15-30 秒</p>
                </div>
              </div>
            )}

            {report.status === 'failed' && (
              <div className="bg-[rgba(239,68,68,0.05)] border border-[var(--color-error)] rounded-[var(--radius-md)] p-4">
                <h3 className="text-lg font-medium text-[var(--color-error)] mb-2">评审失败</h3>
                <p className="text-[var(--color-error)] mb-4">{report.error_message || '评审过程中发生错误'}</p>
                <Button onClick={handleTriggerReview}>
                  重新评审
                </Button>
              </div>
            )}
          </div>

          {/* 评审结果 */}
          {report.status === 'completed' && report.reviews.length > 0 && (
            <div>
              {/* 导出快捷按钮 */}
              <div className="card bg-[var(--color-brand-primary-light)] border-[var(--color-brand-primary)] mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)]">评审已完成</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm">您可以导出评审报告或继续查看详细评审意见</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => router.push(`/export/${report.id}`)}
                  >
                    导出报告
                  </Button>
                </div>
              </div>

              {/* 评审详情 */}
              <div className="card p-0 overflow-hidden">
                {/* 专业标签页 */}
                <div className="border-b border-[var(--color-border-secondary)]">
                  <nav className="flex -mb-px overflow-x-auto">
                    {report.reviews.map((review) => (
                      <button
                        key={review.profession}
                        onClick={() => setSelectedTab(review.profession)}
                        className={`
                          px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                          ${selectedTab === review.profession
                            ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                            : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{getProfessionName(review.profession)}</span>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* 评审详情 */}
                {!selectedTab ? (
                  <div className="p-12 text-center">
                    <svg
                      className="mx-auto h-16 w-16 text-[var(--color-border-primary)] mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-[var(--color-text-secondary)]">请选择专业查看评审意见</p>
                  </div>
                ) : selectedReview && (
                  <div className="p-6">
                    {/* AI 分析概要 */}
                    {selectedReview.ai_analysis && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-[var(--color-info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          AI 评审意见
                        </h3>
                        <div className="bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.2)] rounded-[var(--radius-md)] p-4">
                          <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">{selectedReview.ai_analysis}</p>
                        </div>
                      </div>
                    )}

                    {/* 评审意见列表 */}
                    {selectedReview.review_items && selectedReview.review_items.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            评审意见 ({selectedReview.review_items.length}条)
                          </h3>
                          <button
                            onClick={() => handleSelectAll(selectedReview.profession)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-light)] rounded-[var(--radius-md)] transition-colors"
                          >
                            <span>
                              {selectedReview.review_items.every(item => (checkedItems[selectedReview.profession] || new Set()).has(item.id))
                                ? '取消全选'
                                : '全选'}
                            </span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          {selectedReview.review_items.map((item) => (
                            <div
                              key={item.id}
                              className="border border-[var(--color-border-secondary)] rounded-[var(--radius-md)] p-4 hover:border-[var(--color-brand-primary)] transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2">{item.description}</h4>

                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-start">
                                      <span className="text-[var(--color-text-tertiary)] mr-2 font-medium whitespace-nowrap">规范依据:</span>
                                      <span className="text-[var(--color-text-secondary)]">{item.standard}</span>
                                    </div>

                                    <div className="flex items-start">
                                      <span className="text-[var(--color-text-tertiary)] mr-2 font-medium whitespace-nowrap">建议方案:</span>
                                      <span className="text-[var(--color-text-secondary)]">{item.suggestion}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="ml-4">
                                  <input
                                    type="checkbox"
                                    checked={checkedItems[selectedReview.profession]?.has(item.id) || false}
                                    onChange={() => handleToggleCheck(selectedReview.profession, item.id)}
                                    className="w-5 h-5 text-[var(--color-brand-primary)] border-[var(--color-border-primary)] rounded-[var(--radius-sm)] focus:ring-[var(--color-brand-primary)]"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 人工评审 */}
                    {selectedReview.manual_review && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          人工评审意见
                        </h3>
                        <div className="bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.3)] rounded-[var(--radius-md)] p-4">
                          <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">{selectedReview.manual_review}</p>
                        </div>
                      </div>
                    )}

                    {/* 导出按钮 */}
                    <div className="mt-6 flex justify-end space-x-4">
                      <Button
                        variant="secondary"
                        onClick={() => router.push(`/export/${report.id}`)}
                      >
                        查看导出历史
                      </Button>
                      <Button
                        onClick={() => router.push(`/export/${report.id}`)}
                      >
                        导出评审报告
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
