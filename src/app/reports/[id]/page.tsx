'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Review {
  id: number;
  ai_analysis: string;
  manual_review: string | null;
  overall_score: number | null;
  key_issues: any;
  suggestions: any;
  created_at: string;
}

interface Report {
  id: number;
  title: string;
  project_type: string;
  status: string;
  created_at: string;
  file_name: string;
  review: Review | null;
}

export default function ReportDetail() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [params.id]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
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

  const getStatusText = (status: string) => {
    const statusMap = {
      submitted: '已提交',
      reviewing: '评审中',
      completed: '已完成',
      failed: '失败',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      submitted: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
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
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center"
      >
        ← 返回
      </button>

      {/* 报告信息 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h1>
            <p className="text-gray-600">{report.file_name}</p>
            {report.project_type && (
              <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                {report.project_type}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
              {getStatusText(report.status)}
            </span>
            <p className="mt-2 text-sm text-gray-500">
              提交时间：{new Date(report.created_at).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      </div>

      {/* AI 评审结果 */}
      {report.review && report.review.ai_analysis ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI 智能评审结果
          </h2>

          {report.review.overall_score !== null && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-700">综合评分</span>
                <span className="text-3xl font-bold text-blue-600">{report.review.overall_score}</span>
              </div>
            </div>
          )}

          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{report.review.ai_analysis}</div>
          </div>

          {report.review.key_issues && Object.keys(report.review.key_issues).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">关键问题</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.review.key_issues).map(([key, value]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{key}</h4>
                    <p className="text-sm text-gray-600">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.review.suggestions && Object.keys(report.review.suggestions).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">改进建议</h3>
              <div className="space-y-3">
                {Object.entries(report.review.suggestions).map(([key, value]) => (
                  <div key={key} className="flex items-start">
                    <span className="inline-block w-2 h-2 mt-2 mr-3 bg-green-500 rounded-full"></span>
                    <div>
                      <span className="font-medium text-gray-900">{key}: </span>
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">AI 正在分析报告，请稍候...</p>
            <button
              onClick={fetchReport}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              刷新状态
            </button>
          </div>
        </div>
      )}

      {/* 人工评审（如果有） */}
      {report.review && report.review.manual_review && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            人工评审意见
          </h2>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{report.review.manual_review}</div>
          </div>
        </div>
      )}
    </div>
  );
}
