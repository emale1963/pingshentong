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
  suggestion: string;
  confirmed: boolean;
}

interface Review {
  profession: string;
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

  const handleExport = async (type: 'word') => {
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
          const latestExports = await fetch(`/api/reports/${params.id}/exports`).then(res => res.json());
          setExports(latestExports);

          const updatedExport = latestExports.find((e: Export) => e.id === result.id);
          if (updatedExport && updatedExport.status !== 'pending') {
            clearInterval(checkInterval);
            if (updatedExport.status === 'completed') {
              // 自动下载文件
              if (updatedExport.file_url) {
                window.open(updatedExport.file_url, '_blank');
                alert('文档生成成功，已自动下载！');
              } else {
                alert('文档生成成功，但下载链接无效，请手动在导出历史中下载');
              }
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
    }))
  );

  return (
    <div className="max-w-7xl mx-auto pt-[var(--navbar-height)] py-6 px-4">
      {/* 报告信息 */}
      <div className="mb-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h1 className="text-lg font-bold text-gray-900">导出评审报告</h1>
                <span className="text-gray-400">|</span>
                <p className="text-gray-600 truncate">{report.file_name}</p>
              </div>
              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                {report.professions.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-blue-50 rounded-full text-xs text-blue-700">
                    {getProfessionName(p)}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400">
                {new Date(report.created_at).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>

          {/* 导出按钮区域 - 移到这里 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">导出评审报告</h2>
                <p className="text-xs text-gray-500 mt-0.5">.docx 格式，包含完整的评审意见和AI分析</p>
              </div>
              <button
                onClick={() => handleExport('word')}
                disabled={generating}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg mr-2">📄</span>
                <span>{generating ? '生成中...' : '下载Word报告'}</span>
              </button>
            </div>

            {generating && (
              <div className="flex items-center justify-center text-blue-600 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">正在生成Word文档，请稍候...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 评审报告预览 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">评审报告预览</h2>

        {report.reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            暂无评审结果
          </div>
        ) : (
          <div className="space-y-4">
            {/* 意见列表（仅显示已确认的）*/}
            {allReviewItems.filter(i => i.confirmed).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  已确认的评审意见 ({allReviewItems.filter(i => i.confirmed).length}条)
                </h3>
                <div className="space-y-2">
                  {allReviewItems
                    .filter(i => i.confirmed)
                    .map((item, index) => (
                    <div key={`${item.profession}-${item.id}`} className="border border-gray-200 rounded p-3">
                      <div className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                              {item.professionName}
                            </span>
                          </div>
                          <p className="text-gray-900 text-sm mb-1">{item.description}</p>
                          <div className="space-y-0.5 text-xs text-gray-600">
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
    </div>
  );
}
