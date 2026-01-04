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
  landscape: '景观',
  interior: '室内',
  cost: '造价',
};

interface ReviewItem {
  id: string;
  description: string;
  standard: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  confirmed: boolean;
}

interface Review {
  id: number;
  profession: string;
  ai_analysis: string;
  manual_review: string;
  overall_score: number;
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

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 3000); // 每3秒刷新一次
    return () => clearInterval(interval);
  }, [params.id]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);

        // 默认选中第一个专业
        if (data.reviews && data.reviews.length > 0 && !selectedTab) {
          setSelectedTab(data.reviews[0].profession);
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

  const handleConfirmItem = async (profession: string, itemId: string) => {
    try {
      await fetch(`/api/reviews/${report?.id}/${profession}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      // 重新获取数据
      fetchReport();
    } catch (error) {
      console.error('Failed to confirm item:', error);
    }
  };

  const handleTriggerReview = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}/review`, {
        method: 'POST',
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
      submitted: { label: '已提交', color: 'bg-blue-100 text-blue-800' },
      reviewing: { label: '评审中', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
      failed: { label: '失败', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.submitted;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityMap = {
      high: { label: '高', color: 'bg-red-100 text-red-800' },
      medium: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
      low: { label: '低', color: 'bg-blue-100 text-blue-800' },
    };
    const severityInfo = severityMap[severity as keyof typeof severityMap];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityInfo.color}`}>
        {severityInfo.label}
      </span>
    );
  };

  const getProfessionName = (profession: string) => {
    return PROFESSION_NAMES[profession] || profession;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">加载失败</h3>
          <p className="text-red-600 mb-4">{error || '报告不存在'}</p>
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
    );
  }

  const selectedReview = report.reviews.find(r => r.profession === selectedTab);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      {/* 返回按钮 */}
      <Button
        variant="secondary"
        onClick={() => router.back()}
        className="mb-6"
      >
        ← 返回
      </Button>

      {/* 报告信息 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.file_name}</h1>
            <div className="flex items-center space-x-2">
              {report.professions.map(p => (
                <span key={p} className="px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700">
                  {getProfessionName(p)}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(report.status)}
            <p className="mt-2 text-sm text-gray-500">
              {new Date(report.created_at).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      </div>

      {/* 状态提示和操作按钮 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {report.status === 'submitted' && (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">等待评审</h3>
              <p className="text-gray-600">报告已提交，点击下方按钮开始 AI 智能评审</p>
            </div>
            <Button onClick={handleTriggerReview}>
              开始评审
            </Button>
          </div>
        )}

        {report.status === 'reviewing' && (
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI 正在评审中...</h3>
              <p className="text-gray-600">请稍候，系统正在智能分析报告内容</p>
            </div>
          </div>
        )}

        {report.status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">评审失败</h3>
            <p className="text-red-600 mb-4">{report.error_message || '评审过程中发生错误'}</p>
            <Button onClick={handleTriggerReview}>
              重新评审
            </Button>
          </div>
        )}
      </div>

      {/* 评审结果 */}
      {report.status === 'completed' && report.reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 专业标签页 */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {report.reviews.map((review) => (
                <button
                  key={review.profession}
                  onClick={() => setSelectedTab(review.profession)}
                  className={`
                    px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${selectedTab === review.profession
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <span>{getProfessionName(review.profession)}</span>
                    {review.overall_score && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {review.overall_score}分
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* 评审详情 */}
          {selectedReview && (
            <div className="p-6">
              {/* AI 分析概要 */}
              {selectedReview.ai_analysis && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI 评审意见
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.ai_analysis}</p>
                  </div>
                </div>
              )}

              {/* 评审意见列表 */}
              {selectedReview.review_items && selectedReview.review_items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    评审意见 ({selectedReview.review_items.length}条)
                  </h3>

                  <div className="space-y-4">
                    {selectedReview.review_items.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getSeverityBadge(item.severity)}
                              <h4 className="font-medium text-gray-900">{item.description}</h4>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-start">
                                <span className="text-gray-500 mr-2 font-medium whitespace-nowrap">规范依据:</span>
                                <span className="text-gray-700">{item.standard}</span>
                              </div>

                              <div className="flex items-start">
                                <span className="text-gray-500 mr-2 font-medium whitespace-nowrap">建议方案:</span>
                                <span className="text-gray-700">{item.suggestion}</span>
                              </div>
                            </div>
                          </div>

                          <div className="ml-4">
                            <input
                              type="checkbox"
                              checked={selectedReview.confirmed_items.includes(item.id) || item.confirmed}
                              onChange={() => handleConfirmItem(selectedReview.profession, item.id)}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    人工评审意见
                  </h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.manual_review}</p>
                  </div>
                </div>
              )}

              {/* 导出按钮 */}
              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/export/${report.id}`)}
                >
                  导出评审报告
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
