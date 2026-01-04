'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ProfessionSelector from '@/components/ProfessionSelector';
import Button from '@/components/Button';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [professions, setProfessions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
            提交可研报告
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            上传建筑可研报告，选择评审专业，系统将使用AI进行智能评审分析
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 文件上传 */}
          <div>
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".pdf,.doc,.docx"
              maxSize={50}
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
