import { NextRequest, NextResponse } from 'next/server';
import { tempStorage } from '@/lib/tempStorage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; profession: string }> }
) {
  console.log('[API] POST /api/reports/[id]/reviews/[profession]/confirm called');

  try {
    const { id, profession } = await params;
    const reportId = parseInt(id);

    const body = await request.json();
    const { itemId } = body;

    console.log('[API] Confirming item:', { reportId, profession, itemId });

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId' },
        { status: 400 }
      );
    }

    // 使用临时存储（降级方案）
    const success = tempStorage.confirmReviewItem(reportId, profession, itemId);

    if (success) {
      console.log('[API] Item confirmed successfully');
      return NextResponse.json({ success: true });
    } else {
      console.log('[API] Failed to confirm item');
      return NextResponse.json(
        { error: 'Failed to confirm item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Failed to confirm item:', error);
    return NextResponse.json(
      { error: 'Failed to confirm item', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; profession: string }> }
) {
  console.log('[API] DELETE /api/reports/[id]/reviews/[profession]/confirm called');

  try {
    const { id, profession } = await params;
    const reportId = parseInt(id);

    const body = await request.json();
    const { itemId } = body;

    console.log('[API] Unconfirming item:', { reportId, profession, itemId });

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId' },
        { status: 400 }
      );
    }

    // 使用临时存储（降级方案）
    const success = tempStorage.unconfirmReviewItem(reportId, profession, itemId);

    if (success) {
      console.log('[API] Item unconfirmed successfully');
      return NextResponse.json({ success: true });
    } else {
      console.log('[API] Failed to unconfirm item');
      return NextResponse.json(
        { error: 'Failed to unconfirm item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Failed to unconfirm item:', error);
    return NextResponse.json(
      { error: 'Failed to unconfirm item', details: String(error) },
      { status: 500 }
    );
  }
}

