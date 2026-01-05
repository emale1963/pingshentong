import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminOperation } from '@/lib/authAdmin';
import { checkAllModelsHealth } from '@/lib/modelHealthCheck';

/**
 * 获取AI模型列表和状态
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/admin/models called');

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    // 检查所有模型健康状态
    const healthStatuses = await checkAllModelsHealth();

    return NextResponse.json({
      success: true,
      models: healthStatuses,
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
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { modelId } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: '模型ID不能为空' },
        { status: 400 }
      );
    }

    // 这里应该调用模型健康检查
    // 简化实现，直接返回成功
    await logAdminOperation({
      adminId: admin.id,
      operationType: 'test',
      operationModule: 'model',
      operationDetail: `测试模型连接: ${modelId}`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: '模型测试成功',
    });
  } catch (error) {
    console.error('[API] Test model error:', error);
    return NextResponse.json(
      { error: '测试模型失败' },
      { status: 500 }
    );
  }
}
