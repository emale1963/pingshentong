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
  profession: string;
  overall_score: number;
  review_items: ReviewItem[];
  confirmed_items: string[];
}

interface Report {
  id: number;
  professions: string[];
  file_name: string;
  created_at: string;
  reviews: Review[];
}

interface Export {
  id: number;
  export_type: string;
  file_url: string;
  file_name: string;
  status: string;
  created_at: string;
}

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // 获取报告信息
      const reportResponse = await fetch(`/api/reports/${params.id}`);
      if (reportResponse.ok) {
        setReport(await reportResponse.json());
      }

      // 获取导出记录
      const exportsResponse = await fetch(`/api/reports/${params.id}/exports`);
      if (exportsResponse.ok) {
        setExports(await exportsResponse.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'word' | 'pdf' | 'excel') => {
    setGenerating(true);

    try {
      const response = await fetch(`/api/reports/${params.id}/exports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ export_type: type }),
      });

      if (response.ok) {
        const result = await response.json();
        // 刷新导出列表
        await fetchData();
        
        // 启动轮询检查导出状态
        const checkInterval = setInterval(async () => {
          await fetchData();
          const updatedExports = exports.find(e => e.id === result.id);
          if (updatedExports && updatedExports.status !== 'pending') {
            clearInterval(checkInterval);
            if (updatedExports.status === 'completed') {
              alert('文档生成成功！');
            } else {
              alert('文档生成失败，请重试');
            }
          }
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.error || '导出失败，请重试');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('网络错误，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (exportId: number) => {
    const exportItem = exports.find(e => e.id === exportId);
    if (exportItem && exportItem.file_url) {
      window.open(exportItem.file_url, '_blank');
    }
  };

  const getProfessionName = (profession: string) => {
    return PROFESSION_NAMES[profession] || profession;
  };

  const getExportTypeBadge = (type: string) => {
    const typeMap = {
      word: { label: 'Word', color: 'bg-blue-100 text-blue-800', icon: '📄' },
      pdf: { label: 'PDF', color: 'bg-red-100 text-red-800', icon: '📕' },
      excel: { label: 'Excel', color: 'bg-green-100 text-green-800', icon: '📊' },
    };
    const typeInfo = typeMap[type as keyof typeof typeMap];
    return typeInfo || { label: type, color: 'bg-gray-100 text-gray-800', icon: '📁' };
  };

  const getExportStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: '生成中', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
      failed: { label: '失败', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return statusInfo || { label: status, color: 'bg-gray-100 text-gray-800' };
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

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">加载失败</h3>
          <p className="text-red-600 mb-4">报告不存在</p>
          <Button onClick={() => router.back()}>返回</Button>
        </div>
      </div>
    );
  }

  // 汇总所有专业的评审意见
  const allReviewItems = report.reviews.flatMap(review =>
    review.review_items.map(item => ({
      ...item,
      profession: review.profession,
      professionName: getProfessionName(review.profession),
      confirmed: review.confirmed_items.includes(item.id) || item.confirmed,
      score: review.overall_score,
    }))
  );

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">导出评审报告</h1>
            <p className="text-gray-600">{report.file_name}</p>
            <div className="flex items-center space-x-2 mt-2">
              {report.professions.map(p => (
                <span key={p} className="px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700">
                  {getProfessionName(p)}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date(report.created_at).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      </div>

      {/* 导出选项 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">选择导出格式</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { type: 'word' as const, title: 'Word 文档', desc: '.docx 格式，方便编辑', icon: '📄' },
            { type: 'pdf' as const, title: 'PDF 文档', desc: '.pdf 格式，适合打印', icon: '📕' },
            { type: 'excel' as const, title: 'Excel 表格', desc: '.xlsx 格式，数据分析', icon: '📊' },
          ].map((format) => (
            <button
              key={format.type}
              onClick={() => handleExport(format.type)}
              disabled={generating}
              className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-4xl mb-3">{format.icon}</span>
              <h3 className="font-semibold text-gray-900 mb-1">{format.title}</h3>
              <p className="text-sm text-gray-500">{format.desc}</p>
            </button>
          ))}
        </div>

        {generating && (
          <div className="flex items-center justify-center text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span>正在生成文档，请稍候...</span>
          </div>
        )}
      </div>

      {/* 评审报告预览 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">评审报告预览</h2>

        {report.reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无评审结果
          </div>
        ) : (
          <div className="space-y-6">
            {/* 报告汇总 */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">报告汇总</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">评审专业</p>
                  <p className="text-2xl font-bold text-blue-600">{report.reviews.length}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">总意见数</p>
                  <p className="text-2xl font-bold text-yellow-600">{allReviewItems.length}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">高严重度</p>
                  <p className="text-2xl font-bold text-red-600">
                    {allReviewItems.filter(i => i.severity === 'high').length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">已确认</p>
                  <p className="text-2xl font-bold text-green-600">
                    {allReviewItems.filter(i => i.confirmed).length}
                  </p>
                </div>
              </div>
            </div>

            {/* 各专业汇总 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">各专业评分</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.reviews.map((review) => (
                  <div key={review.profession} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {getProfessionName(review.profession)}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        review.overall_score >= 80 ? 'bg-green-100 text-green-800' :
                        review.overall_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {review.overall_score}分
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">总意见:</span>
                        <span className="text-gray-900">{review.review_items.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">高严重度:</span>
                        <span className="text-gray-900">
                          {review.review_items.filter(i => i.severity === 'high').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">已确认:</span>
                        <span className="text-gray-900">
                          {review.review_items.filter(i =>
                            review.confirmed_items.includes(i.id) || i.confirmed
                          ).length}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 意见列表（仅显示已确认的） */}
            {allReviewItems.filter(i => i.confirmed).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  已确认的评审意见 ({allReviewItems.filter(i => i.confirmed).length}条)
                </h3>
                <div className="space-y-3">
                  {allReviewItems
                    .filter(i => i.confirmed)
                    .map((item, index) => (
                    <div key={`${item.profession}-${item.id}`} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                              {item.professionName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.severity === 'high' ? 'bg-red-100 text-red-800' :
                              item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.severity === 'high' ? '高' : item.severity === 'medium' ? '中' : '低'}
                            </span>
                          </div>
                          <p className="text-gray-900 mb-2">{item.description}</p>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">规范依据:</span> {item.standard}</p>
                            <p><span className="font-medium">建议方案:</span> {item.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 导出历史 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">导出历史</h2>

        {exports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无导出记录
          </div>
        ) : (
          <div className="space-y-3">
            {exports.map((exportItem) => {
              const typeInfo = getExportTypeBadge(exportItem.export_type);
              const statusInfo = getExportStatusBadge(exportItem.status);
              return (
                <div key={exportItem.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{typeInfo.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{exportItem.file_name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}">
                          {typeInfo.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}">
                          {statusInfo.label}
                        </span>
                        <span>{new Date(exportItem.created_at).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={exportItem.status !== 'completed'}
                    onClick={() => handleDownload(exportItem.id)}
                  >
                    {exportItem.status === 'completed' ? '下载' : '生成中...'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
