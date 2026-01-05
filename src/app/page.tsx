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
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            提交报告
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            上传报告，选择评审专业，系统将使用AI进行智能评审分析
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 文件上传 */}
          <div>
            <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">支持文件格式：</span>PDF、DOC、DOCX
                <span className="mx-2">|</span>
                <span className="font-medium">最大文件大小：</span>20MB
              </p>
              <p className="text-xs text-blue-600 mt-1">
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
          <div>
            <ProfessionSelector
              selectedProfessions={professions}
              onChange={setProfessions}
              label="选择评审专业"
              disabled={isSubmitting}
            />
          </div>

          {/* AI模型选择 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                选择 AI 模型
              </label>
              <button
                type="button"
                onClick={checkModelsHealth}
                disabled={checkingHealth}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
              >
                {checkingHealth ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    检测中...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    检测模型状态
                  </>
                )}
              </button>
            </div>

            {/* 模型健康状态摘要 */}
            {Object.keys(modelHealth).length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">模型状态:</span>{' '}
                  <span className="text-green-600">
                    {Object.values(modelHealth).filter(h => h.available).length} 个可用
                  </span>
                  {' '}/{' '}
                  <span className="text-gray-500">{Object.keys(modelHealth).length} 个模型</span>
                </div>
              </div>
            )}

            {modelsLoading ? (
              <div className="text-center py-8 text-gray-500">加载模型列表中...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableModels.map((model) => {
                  const healthInfo = modelHealth[model.id];
                  const isAvailable = healthInfo?.available !== undefined
                    ? healthInfo.available
                    : true; // 默认认为可用
                  const isUnhealthy = healthInfo?.available === false;

                  return (
                    <div
                      key={model.id}
                      onClick={() => !isSubmitting && isAvailable && setSelectedModel(model.id)}
                      className={`
                        p-4 border-2 rounded-lg transition-all relative
                        ${selectedModel === model.id
                          ? 'border-blue-500 bg-blue-50'
                          : isUnhealthy
                          ? 'border-red-200 bg-red-50 opacity-70 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                        ${isSubmitting ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          {model.name}
                          <span className={`ml-2 w-2 h-2 rounded-full ${
                            isAvailable ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        </h4>
                        {selectedModel === model.id && (
                          <span className="text-blue-500 text-xl">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                      <p className="text-xs text-gray-500 mb-2">提供商: {model.provider}</p>
                      {model.isDefault && (
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          默认推荐
                        </span>
                      )}
                      {healthInfo?.responseTime && isAvailable && (
                        <div className="mt-2 text-xs text-gray-500">
                          响应时间: {healthInfo.responseTime}ms
                        </div>
                      )}
                      {isUnhealthy && healthInfo?.error && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded">
                          <div className="flex items-start gap-2">
                            {healthInfo.errorCode === 'INSUFFICIENT_QUOTA' && (
                              <svg className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            )}
                            <div className="flex-1">
                              <div className="text-xs font-medium text-red-700 mb-1">
                                {healthInfo.errorCode ? `[${healthInfo.errorCode}] ` : ''}
                                {healthInfo.error}
                              </div>
                              {healthInfo.responseTime && (
                                <div className="text-xs text-gray-500 mt-1">
                                  响应时间: {healthInfo.responseTime}ms
                                </div>
                              )}
                              {healthInfo.errorDetails && (
                                <details className="mt-1">
                                  <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                                    查看详情
                                  </summary>
                                  <div className="mt-1 text-xs text-red-600 break-words">
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
            <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4 pt-4">
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
              loading={isSubmitting}
              disabled={!file || professions.length === 0}
            >
              {isSubmitting ? '提交中...' : '提交报告'}
            </Button>
          </div>
        </form>
      </div>

      {/* 提示信息 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">使用说明</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 支持上传 PDF、DOC、DOCX 格式文件，最大 50MB</li>
          <li>• 可选择一个或多个专业进行评审，选择"全专业"将覆盖其他选项</li>
          <li>• 提交后系统将自动进行 AI 智能评审分析</li>
          <li>• 评审完成后可在评审页面查看详细的分析结果</li>
        </ul>
      </div>
    </div>
  );
}
