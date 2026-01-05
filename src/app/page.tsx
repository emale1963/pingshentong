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
        <div className="max-w-[var(--max-width-content)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 主卡片 */}
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
            <div className="card">
              {/* 文件上传区域 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  上传文件
                </label>

                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept=".pdf,.doc,.docx"
                  maxSize={20}
                  disabled={isSubmitting}
                />
              </div>

              {/* 专业选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  选择 AI 模型
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isSubmitting || modelsLoading}
                  className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-[var(--radius-base)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modelsLoading ? (
                    <option>加载中...</option>
                  ) : availableModels.length === 0 ? (
                    <option>暂无可用模型</option>
                  ) : (
                    availableModels.map((model) => {
                      const healthInfo = modelHealth[model.id];
                      const isAvailable = healthInfo?.available !== undefined
                        ? healthInfo.available
                        : true;
                      const isUnhealthy = healthInfo?.available === false;

                      return (
                        <option
                          key={model.id}
                          value={model.id}
                          disabled={!isAvailable || isUnhealthy}
                        >
                          {model.name}
                          {model.isDefault ? ' (默认)' : ''}
                          {!isAvailable || isUnhealthy ? ' (不可用)' : ''}
                        </option>
                      );
                    })
                  )}
                </select>

                {/* 选中的模型信息 */}
                {selectedModel && !modelsLoading && (
                  <div className="mt-2 p-3 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {availableModels.find(m => m.id === selectedModel)?.name}
                        </span>
                        {availableModels.find(m => m.id === selectedModel)?.isDefault && (
                          <span className="px-2 py-0.5 bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)] text-xs rounded-[var(--radius-sm)]">
                            默认
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {modelHealth[selectedModel]?.available !== false && (
                          <span className="text-xs text-[var(--color-success)] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"></span>
                            可用
                          </span>
                        )}
                        {modelHealth[selectedModel]?.responseTime && (
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {modelHealth[selectedModel]?.responseTime}ms
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {availableModels.find(m => m.id === selectedModel)?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* 上传进度 */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="mb-6">
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

        </div>
      </div>
    </div>
  );
}
