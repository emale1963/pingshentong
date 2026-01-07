import { NextRequest, NextResponse } from 'next/server';
import { modelConfigManager } from '@/lib/modelConfigManager';
import { AIModelType } from '@/types/models';

/**
 * 更新模型配置
 * 支持: 启用/禁用模型、设置默认模型
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/models/config called');

  try {
    const body = await request.json();
    const { modelId, action } = body;

    if (!modelId || !action) {
      return NextResponse.json(
        { error: '模型ID和操作类型不能为空' },
        { status: 400 }
      );
    }

    const typedModelId = modelId as AIModelType;

    switch (action) {
      case 'enable':
        // 启用模型
        modelConfigManager.setModelEnabled(typedModelId, true);
        console.log('[API] Model enabled:', typedModelId);
        break;

      case 'disable':
        // 禁用模型
        const success = modelConfigManager.setModelEnabled(typedModelId, false);
        if (!success) {
          return NextResponse.json(
            { error: '无法禁用默认模型，请先设置其他模型为默认' },
            { status: 400 }
          );
        }
        console.log('[API] Model disabled:', typedModelId);
        break;

      case 'setDefault':
        // 设置为默认模型
        const setSuccess = modelConfigManager.setDefaultModel(typedModelId);
        if (!setSuccess) {
          return NextResponse.json(
            { error: '无法设置默认模型，请确保模型已启用' },
            { status: 400 }
          );
        }
        console.log('[API] Default model set:', typedModelId);
        break;

      default:
        return NextResponse.json(
          { error: '不支持的操作类型' },
          { status: 400 }
        );
    }

    // 获取更新后的配置
    const configs = modelConfigManager.getAllConfigs();
    const defaultModel = modelConfigManager.getDefaultModel();

    return NextResponse.json({
      success: true,
      message: '模型配置更新成功',
      configs,
      defaultModel,
    });
  } catch (error) {
    console.error('[API] Update model config error:', error);
    return NextResponse.json(
      { error: '更新模型配置失败' },
      { status: 500 }
    );
  }
}
