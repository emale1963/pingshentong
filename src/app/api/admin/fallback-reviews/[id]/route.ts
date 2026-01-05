import { NextRequest, NextResponse } from 'next/server';
import { professionFallbackReviewManager } from '@/storage/database/professionPromptManager';

/**
 * GET /api/admin/fallback-reviews/:id - 获取单个降级评审要点
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reviews = await professionFallbackReviewManager.getAllReviews();
    const review = reviews.find(r => r.id === parseInt(id));

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('Error fetching fallback review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fallback review' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/fallback-reviews/:id - 更新降级评审要点
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { description, standard, suggestion, displayOrder, isActive } = body;

    const review = await professionFallbackReviewManager.updateReview(parseInt(id), {
      description,
      standard,
      suggestion,
      displayOrder,
      isActive,
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('Error updating fallback review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update fallback review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/fallback-reviews/:id - 删除降级评审要点
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await professionFallbackReviewManager.deleteReview(parseInt(id));

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting fallback review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete fallback review' },
      { status: 500 }
    );
  }
}
