import { NextRequest, NextResponse } from 'next/server';
import { professionPromptManager } from '@/storage/database/professionPromptManager';

/**
 * GET /api/admin/prompts/:id - 获取单个系统提示词
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prompts = await professionPromptManager.getAllPrompts();
    const prompt = prompts.find(p => p.id === parseInt(id));

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: prompt });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/prompts/:id - 更新系统提示词
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { promptContent, promptVersion, isActive } = body;

    const prompt = await professionPromptManager.updatePrompt(parseInt(id), {
      promptContent,
      promptVersion,
      isActive,
    });

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: prompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/prompts/:id - 删除系统提示词
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await professionPromptManager.deletePrompt(parseInt(id));

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
