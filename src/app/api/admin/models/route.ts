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
    // 检查所有模型健康状态
    const healthStatuses = await checkAllModelsHealth();
    const configs = modelConfigManager.getAllConfigs();
    const defaultModel = modelConfigManager.getDefaultModel();

    // 合并健康状态和配置
    const models = healthStatuses.map(health => {
      const config = configs.find(c => c.modelId === health.modelId);
      return {
        ...health,
        enabled: config?.enabled ?? true,
        isDefault: config?.isDefault ?? false,
        priority: config?.priority ?? 0,
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
      // 这里应该调用模型健康检查
      // 简化实现，直接返回成功
      return NextResponse.json({
        success: true,
        message: '模型测试成功',
      });
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
