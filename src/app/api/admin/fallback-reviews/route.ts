import { NextRequest, NextResponse } from 'next/server';
import { professionFallbackReviewManager } from '@/storage/database/professionPromptManager';

/**
 * GET /api/admin/fallback-reviews - 获取所有降级评审要点
 * 查询参数: profession (可选) - 按专业筛选
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profession = searchParams.get('profession');

    const reviews = await professionFallbackReviewManager.getAllReviews(
      profession || undefined
    );

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Error fetching fallback reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fallback reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/fallback-reviews - 创建新的降级评审要点
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profession, description, standard, suggestion, displayOrder, isActive, createdBy } = body;

    if (!profession || !description || !standard || !suggestion) {
      return NextResponse.json(
        { success: false, error: 'profession, description, standard, and suggestion are required' },
        { status: 400 }
      );
    }

    const review = await professionFallbackReviewManager.createReview({
      profession,
      description,
      standard,
      suggestion,
      displayOrder: displayOrder || 1,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: createdBy || 'admin',
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    console.error('Error creating fallback review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create fallback review' },
      { status: 500 }
    );
  }
}
