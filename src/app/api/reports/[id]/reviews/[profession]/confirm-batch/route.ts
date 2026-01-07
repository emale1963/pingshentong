import { NextRequest, NextResponse } from 'next/server';
import { tempStorage } from '@/lib/tempStorage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; profession: string }> }
) {
  console.log('[API] POST /api/reports/[id]/reviews/[profession]/confirm-batch called');

  try {
    const { id, profession } = await params;
    const reportId = parseInt(id);

    const body = await request.json();
    const { itemIds } = body;

    console.log('[API] Batch confirming items:', { reportId, profession, itemIds });

    if (!Array.isArray(itemIds)) {
      return NextResponse.json(
        { error: 'itemIds must be an array' },
        { status: 400 }
      );
    }

    // 使用临时存储（降级方案）
    const success = tempStorage.batchConfirmReviewItems(reportId, profession, itemIds);

    if (success) {
      console.log('[API] Batch confirm successful');
      return NextResponse.json({ success: true });
    } else {
      console.log('[API] Failed to batch confirm items');
      return NextResponse.json(
        { error: 'Failed to batch confirm items' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Failed to batch confirm items:', error);
    return NextResponse.json(
      { error: 'Failed to batch confirm items', details: String(error) },
      { status: 500 }
    );
  }
}
