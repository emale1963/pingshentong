import { NextRequest, NextResponse } from 'next/server';
import { checkAllModelsHealth, getAvailableModels, getModelHealthSummary } from '@/lib/modelHealthCheck';

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/models/health called');

  const searchParams = request.nextUrl.searchParams;
  const summary = searchParams.get('summary') === 'true';

  try {
    // 只返回摘要信息
    if (summary) {
      const summaryData = getModelHealthSummary();
      return NextResponse.json(summaryData);
    }

    // 返回所有模型的详细健康状态
    const healthStatuses = await checkAllModelsHealth();
    const availableModels = await getAvailableModels();

    return NextResponse.json({
      models: healthStatuses,
      availableModels,
      summary: {
        total: healthStatuses.length,
        available: availableModels.length,
        unavailable: healthStatuses.length - availableModels.length,
      },
    });
  } catch (error) {
    console.error('[API] Failed to check model health:', error);
    return NextResponse.json(
      { error: 'Failed to check model health', details: String(error) },
      { status: 500 }
    );
  }
}
