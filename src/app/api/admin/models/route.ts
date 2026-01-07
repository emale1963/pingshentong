import { NextRequest, NextResponse } from 'next/server';
import { checkAllModelsHealth } from '@/lib/modelHealthCheck';
import { modelConfigManager } from '@/lib/modelConfigManager';
import { AIModelType } from '@/types/models';

/**
 * 获取AI模型列表和状态
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/admin/models called');

  try {
    // 检查内置模型的健康状态
    const healthStatuses = await checkAllModelsHealth();
    const configs = modelConfigManager.getAllConfigs();
    const defaultModel = modelConfigManager.getDefaultModel();

    // 合并健康状态和配置，包括所有模型（内置+自定义）
    const models = configs.map(config => {
      const health = healthStatuses.find(h => h.modelId === config.modelId);

      return {
        modelId: config.modelId,
        name: config.name,
        description: config.description,
        provider: config.provider,
        available: health?.available ?? false,
        lastChecked: health?.lastChecked ?? new Date().toISOString(),
        error: health?.error,
        errorCode: health?.errorCode,
        responseTime: health?.responseTime,
        enabled: config.enabled,
        isDefault: config.isDefault,
        priority: config.priority,
        isCustom: config.isCustom,
        apiConfig: config.apiConfig, // 包含API配置
      };
    });

    return NextResponse.json({
      success: true,
      models,
      defaultModel,
    });
  } catch (error) {
    console.error('[API] Get models error:', error);
    return NextResponse.json(
      { error: '获取模型列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 测试模型连接
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/models called');

  try {
    const body = await request.json();
    const { modelId, action } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: '模型ID不能为空' },
        { status: 400 }
      );
    }

    // 测试模型连接
    if (action === 'test') {
      console.log(`[API] Testing model: ${modelId}`);

      // 调用模型健康检查
      try {
        const { checkSingleModelHealth } = await import('@/lib/modelHealthCheck');
        const healthStatus = await checkSingleModelHealth(modelId);

        console.log(`[API] Model test result:`, healthStatus);

        if (healthStatus.available) {
          return NextResponse.json({
            success: true,
            message: '模型测试成功',
            healthStatus,
          });
        } else {
          return NextResponse.json({
            success: false,
            message: healthStatus.error || '模型测试失败',
            healthStatus,
          });
        }
      } catch (error) {
        console.error('[API] Model test error:', error);
        return NextResponse.json(
          { error: '模型测试失败: ' + (error instanceof Error ? error.message : '未知错误') },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: '不支持的操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Test model error:', error);
    return NextResponse.json(
      { error: '测试模型失败' },
      { status: 500 }
    );
  }
}
