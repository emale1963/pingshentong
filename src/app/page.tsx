'use client';

import { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import ProfessionSelector from '@/components/ProfessionSelector';
import Button from '@/components/Button';

interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  isDefault: boolean;
}

interface ModelHealthInfo {
  available: boolean;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
  responseTime?: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [professions, setProfessions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('doubao-seed');
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelHealth, setModelHealth] = useState<Record<string, ModelHealthInfo>>({});
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    fetchModels();
    checkModelsHealth();
  }, []);

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

  const checkModelsHealth = async () => {
    try {
      setCheckingHealth(true);
      const response = await fetch('/api/models/health');
      if (response.ok) {
        const data = await response.json();
        const healthMap: Record<string, ModelHealthInfo> = {};
        data.models.forEach((model: any) => {
          healthMap[model.modelId] = {
            available: model.available,
            error: model.error,
            errorCode: model.errorCode,
            errorDetails: model.errorDetails,
            responseTime: model.responseTime,
          };
        });
        setModelHealth(healthMap);

        // 如果当前选中的模型不可用，切换到第一个可用模型
        if (!healthMap[selectedModel]?.available && data.availableModels.length > 0) {
          setSelectedModel(data.availableModels[0]);
        }
      }
    } catch (error) {
      console.error('Failed to check model health:', error);
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('请上传文件');
      return;
    }
    if (professions.length === 0) {
      alert('请选择评审专业');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('professions', JSON.stringify(professions));

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();

        // 自动触发评审
        try {
          const reviewResponse = await fetch(`/api/reports/${result.id}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelType: selectedModel }),
          });

          if (reviewResponse.ok) {
            // 直接跳转到报告详情页,不显示alert
            window.location.href = `/review/${result.id}`;
          } else {
            // 即使评审启动失败,也跳转到详情页,让用户手动触发
            window.location.href = `/review/${result.id}`;
          }
        } catch (reviewError) {
          console.error('Failed to start review:', reviewError);
          // 即使评审启动失败,也跳转到详情页
          window.location.href = `/review/${result.id}`;
        }
      } else {
        const error = await response.json();
        alert(error.message || '提交失败，请重试');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败，请检查网络连接');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setProfessions([]);
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      {/* 主内容区 */}
      <div className="pt-[var(--navbar-height)]">
        <div className="max-w-[var(--max-width-content)] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 页面标题 */}
          <div className="text-center mb-12 fade-in">
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              提交报告
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              上传报告，选择评审专业，系统将使用AI进行智能评审分析
            </p>
          </div>

          {/* 主卡片 */}
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="card">
              {/* 文件上传区域 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  上传文件
                </label>

                <div className="mb-4 p-4 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)] border border-[var(--color-border-secondary)]">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <span className="font-medium">支持格式：</span>PDF、DOC、DOCX
                    <span className="mx-2">|</span>
                    <span className="font-medium">最大大小：</span>20MB
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    • 标准PDF 1.4及以上版本
                    <br />
                    • 文本型PDF优先支持
                  </p>
                </div>

                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept=".pdf,.doc,.docx"
                  maxSize={20}
                  disabled={isSubmitting}
                />
              </div>

              {/* 专业选择 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  选择评审专业
                </label>
                <ProfessionSelector
                  selectedProfessions={professions}
                  onChange={setProfessions}
                  label=""
                  disabled={isSubmitting}
                />
              </div>

              {/* AI模型选择 */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                    选择 AI 模型
                  </label>
                  <button
                    type="button"
                    onClick={checkModelsHealth}
                    disabled={checkingHealth}
                    className="text-sm text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    {checkingHealth ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[var(--color-brand-primary)] border-t-transparent rounded-full spinner"></div>
                        检测中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        检测模型状态
                      </>
                    )}
                  </button>
                </div>

                {/* 模型健康状态摘要 */}
                {Object.keys(modelHealth).length > 0 && (
                  <div className="mb-4 p-4 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      <span className="font-medium">模型状态:</span>{' '}
                      <span className="text-[var(--color-success)]">
                        {Object.values(modelHealth).filter(h => h.available).length} 个可用
                      </span>
                      {' '}/{' '}
                      <span className="text-[var(--color-text-tertiary)]">{Object.keys(modelHealth).length} 个模型</span>
                    </div>
                  </div>
                )}

                {modelsLoading ? (
                  <div className="text-center py-8 text-[var(--color-text-tertiary)]">
                    <div className="w-8 h-8 border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)] rounded-full spinner mx-auto"></div>
                    <p className="mt-2">加载模型列表中...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {availableModels.map((model) => {
                      const healthInfo = modelHealth[model.id];
                      const isAvailable = healthInfo?.available !== undefined
                        ? healthInfo.available
                        : true;
                      const isUnhealthy = healthInfo?.available === false;

                      return (
                        <div
                          key={model.id}
                          onClick={() => !isSubmitting && isAvailable && setSelectedModel(model.id)}
                          className={`
                            p-5 border-2 rounded-[var(--radius-lg)] transition-all cursor-pointer relative
                            ${selectedModel === model.id
                              ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)]'
                              : isUnhealthy
                              ? 'border-[var(--color-error)] bg-[rgba(239,68,68,0.05)] opacity-60 cursor-not-allowed'
                              : 'border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]'
                            }
                            ${isSubmitting ? 'opacity-50' : ''}
                          `}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-[var(--color-text-primary)] text-sm flex items-center">
                              {model.name}
                              <span className={`ml-2 w-2 h-2 rounded-full ${
                                isAvailable ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'
                              }`} />
                            </h4>
                            {selectedModel === model.id && (
                              <span className="text-[var(--color-brand-primary)] text-lg">✓</span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--color-text-secondary)] mb-2">{model.description}</p>
                          <p className="text-xs text-[var(--color-text-tertiary)] mb-2">提供商: {model.provider}</p>
                          {model.isDefault && (
                            <span className="inline-block mt-2 px-2 py-1 bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)] text-xs rounded-[var(--radius-sm)]">
                              默认推荐
                            </span>
                          )}
                          {healthInfo?.responseTime && isAvailable && (
                            <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                              响应时间: {healthInfo.responseTime}ms
                            </div>
                          )}
                          {isUnhealthy && healthInfo?.error && (
                            <div className="mt-2 p-2 bg-[rgba(239,68,68,0.1)] border border-[var(--color-error)] rounded-[var(--radius-sm)]">
                              <div className="flex items-start gap-2">
                                {healthInfo.errorCode === 'INSUFFICIENT_QUOTA' && (
                                  <svg className="h-4 w-4 text-[var(--color-error)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                )}
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-[var(--color-error)] mb-1">
                                    {healthInfo.errorCode ? `[${healthInfo.errorCode}] ` : ''}
                                    {healthInfo.error}
                                  </div>
                                  {healthInfo.responseTime && (
                                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                      响应时间: {healthInfo.responseTime}ms
                                    </div>
                                  )}
                                  {healthInfo.errorDetails && (
                                    <details className="mt-1">
                                      <summary className="text-xs text-[var(--color-error)] cursor-pointer hover:text-[var(--color-error)]">
                                        查看详情
                                      </summary>
                                      <div className="mt-1 text-xs text-[var(--color-error)] break-words">
                                        {healthInfo.errorDetails.slice(0, 200)}
                                        {healthInfo.errorDetails.length > 200 && '...'}
                                      </div>
                                    </details>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 上传进度 */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="mb-8">
                  <div className="bg-[var(--color-border-secondary)] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[var(--color-brand-primary)] h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
                    {uploadProgress < 100 ? '上传中...' : '处理中...'}
                  </p>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-[var(--color-border-secondary)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  重置
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={!file || professions.length === 0}
                >
                  {isSubmitting ? '提交中...' : '提交报告'}
                </Button>
              </div>
            </div>
          </form>

          {/* 使用说明 */}
          <div className="max-w-4xl mx-auto mt-8">
            <div className="card bg-[var(--color-brand-primary-light)] border-[var(--color-brand-primary)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">使用说明</h3>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[var(--color-brand-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>支持上传 PDF、DOC、DOCX 格式文件，最大 50MB</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[var(--color-brand-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>可选择一个或多个专业进行评审，选择"全专业"将覆盖其他选项</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[var(--color-brand-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>提交后系统将自动进行 AI 智能评审分析</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[var(--color-brand-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>评审完成后可在评审页面查看详细的分析结果</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
