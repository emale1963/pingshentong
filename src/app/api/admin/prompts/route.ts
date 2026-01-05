import { NextRequest, NextResponse } from 'next/server';
import { professionPromptManager } from '@/storage/database/professionPromptManager';

/**
 * GET /api/admin/prompts - 获取所有系统提示词
 */
export async function GET() {
  try {
    const prompts = await professionPromptManager.getAllPrompts();
    return NextResponse.json({ success: true, data: prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prompts - 创建新的系统提示词
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profession, promptContent, promptVersion, isActive, createdBy } = body;

    if (!profession || !promptContent) {
      return NextResponse.json(
        { success: false, error: 'profession and promptContent are required' },
        { status: 400 }
      );
    }

    const prompt = await professionPromptManager.createPrompt({
      profession,
      promptContent,
      promptVersion: promptVersion || '1.0',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: createdBy || 'admin',
    });

    return NextResponse.json({ success: true, data: prompt }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
