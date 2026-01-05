'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  all: '全专业',
};

interface Report {
  id: number;
  professions: string[];
  status: string;
  created_at: string;
  file_name: string;
}

export default function MyReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
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

  const getProfessionTags = (professions: string[]) => {
    return professions.map(p => PROFESSION_NAMES[p] || p).join('、');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="pt-[var(--navbar-height)]">
        <div className="max-w-[var(--max-width-content)] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 页面标题 */}
          <div className="mb-8 fade-in">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
              评审记录
            </h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)] rounded-full spinner mx-auto"></div>
              <p className="mt-4 text-[var(--color-text-secondary)]">加载中...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="card text-center py-12">
              <svg
                className="mx-auto h-16 w-16 text-[var(--color-border-primary)]"
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
              <h3 className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">主人，没查到您的评审记录</h3>
              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-[var(--radius-base)] text-sm font-medium text-white bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] transition-all duration-[var(--transition-fast)]"
                >
                  提交新报告
                </Link>
              </div>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <ul className="divide-y divide-[var(--color-border-secondary)]">
                {reports.map((report) => (
                  <li key={report.id}>
                    <Link
                      href={`/review/${report.id}`}
                      className="block hover:bg-[var(--color-bg-hover)] transition-colors duration-[var(--transition-fast)]"
                    >
                      <div className="px-6 py-5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium text-[var(--color-brand-primary)] truncate hover:text-[var(--color-brand-primary-hover)] transition-colors">
                              {report.file_name}
                            </p>
                            <div className="mt-2 flex items-center">
                              {report.professions.length > 0 && (
                                <span className="px-3 py-1 bg-[var(--color-brand-primary-light)] rounded text-xs text-[var(--color-brand-primary)]">
                                  {getProfessionTags(report.professions)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 flex-shrink-0">
                            {getStatusBadge(report.status)}
                            <p className="text-sm text-[var(--color-text-tertiary)] whitespace-nowrap">
                              {new Date(report.created_at).toLocaleDateString('zh-CN')}
                            </p>
                            <svg
                              className="w-5 h-5 text-[var(--color-border-primary)]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
