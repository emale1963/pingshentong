import { NextRequest, NextResponse } from 'next/server';
import { modelConfigManager } from '@/lib/modelConfigManager';

/**
 * 添加自定义模型
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/models/custom called');

  try {
    const body = await request.json();
    const { modelId, name, description, provider } = body;

    if (!modelId || !name) {
      return NextResponse.json(
        { error: '模型ID和名称不能为空' },
        { status: 400 }
      );
    }

    // 检查模型ID是否已存在
    const existingConfig = modelConfigManager.getModelConfig(modelId);
    if (existingConfig) {
      console.log('[API] Model ID already exists:', existingConfig);
      return NextResponse.json(
        { error: '模型ID已存在' },
        { status: 409 }
      );
    }

    // 添加自定义模型
    const newConfig = modelConfigManager.addCustomModel(
      modelId,
      name,
      description || '',
      provider || '自定义'
    );

    console.log('[API] Custom model added, all configs:', modelConfigManager.getAllConfigs());

    return NextResponse.json({
      success: true,
      message: '自定义模型添加成功',
      model: newConfig,
    });
  } catch (error) {
    console.error('[API] Add custom model error:', error);
    return NextResponse.json(
      { error: '添加自定义模型失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除自定义模型
 */
export async function DELETE(request: NextRequest) {
  console.log('[API] DELETE /api/admin/models/custom called');

  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json(
        { error: '模型ID不能为空' },
        { status: 400 }
      );
    }

    // 删除自定义模型
    const success = modelConfigManager.deleteCustomModel(modelId);

    if (!success) {
      return NextResponse.json(
        { error: '无法删除：模型不存在或为内置模型' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '自定义模型删除成功',
    });
  } catch (error) {
    console.error('[API] Delete custom model error:', error);
    return NextResponse.json(
      { error: '删除自定义模型失败' },
      { status: 500 }
    );
  }
}
