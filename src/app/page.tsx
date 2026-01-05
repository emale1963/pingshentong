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

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [professions, setProfessions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('kimi-k2');
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    fetchModels();
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
            alert('报告提交成功！系统正在进行智能分析...');
            // 跳转到报告详情页
            window.location.href = `/review/${result.id}`;
          } else {
            alert('报告提交成功，但评审启动失败，请手动触发评审');
            window.location.href = `/review/${result.id}`;
          }
        } catch (reviewError) {
          console.error('Failed to start review:', reviewError);
          alert('报告提交成功，但评审启动失败，请手动触发评审');
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
                <span className="font-medium">最大文件大小：</span>100MB
              </p>
            </div>
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".pdf,.doc,.docx"
              maxSize={100}
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择 AI 模型
            </label>
            {modelsLoading ? (
              <div className="text-center py-8 text-gray-500">加载模型列表中...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => !isSubmitting && setSelectedModel(model.id)}
                    className={`
                      p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${selectedModel === model.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{model.name}</h4>
                      {selectedModel === model.id && (
                        <span className="text-blue-500 text-xl">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                    <p className="text-xs text-gray-500">提供商: {model.provider}</p>
                    {model.isDefault && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        默认
                      </span>
                    )}
                  </div>
                ))}
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
