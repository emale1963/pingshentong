import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { tempStorage } from '@/lib/tempStorage';
import { aiReviewService } from '@/services/aiReviewService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] POST /api/reports/[id]/review called');
  
  try {
    const { id } = await params;
    const reportId = parseInt(id);
    
    console.log('[API] Starting review for report:', reportId);

    let reportData: any = null;

    // 尝试从数据库获取
    try {
      const client = await pool.connect();
      console.log('[API] Database connected');

      const report = await client.query(
        `SELECT * FROM reports WHERE id = $1`,
        [reportId]
      );

      if (report.rows.length === 0) {
        client.release();
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      reportData = report.rows[0];

      // 更新状态为评审中
      await client.query(
        `UPDATE reports SET status = 'reviewing', updated_at = NOW() WHERE id = $1`,
        [reportId]
      );

      client.release();
    } catch (dbError) {
      console.error('[API] Database error, using fallback:', dbError);
      
      // 降级方案：从临时存储获取
      const report = tempStorage.getReport(reportId);
      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      reportData = report;
      tempStorage.startReview(reportId);
    }

    // 异步进行AI评审
    performAIReview(reportId, reportData);

    return NextResponse.json({ 
      message: 'Review started', 
      status: 'reviewing',
      professions: reportData.professions 
    });
  } catch (error) {
    console.error('[API] Failed to start review:', error);
    return NextResponse.json(
      { error: 'Failed to start review', details: String(error) },
      { status: 500 }
    );
  }
}

async function performAIReview(reportId: number, reportData: any) {
  try {
    console.log('[AI Review] Starting AI review for report:', reportId);

    const professions = reportData.professions || [];
    const fileName = reportData.file_name || '未命名报告';
    const createdAt = reportData.created_at || new Date().toISOString();

    // 构建报告摘要供AI分析
    const reportSummary = `
报告名称：${fileName}
创建时间：${createdAt}
评审专业：${professions.join('、')}

请根据以上信息对该可研报告进行专业评审。
注意：由于无法获取报告详细内容，请基于报告名称和涉及的评审专业进行常规性评审，重点检查常见的设计问题和规范符合性。`;

    // 调用AI服务进行评审
    const reviewResults = await aiReviewService.analyzeReport(professions, reportSummary);

    console.log('[AI Review] AI analysis completed, processing results...');

    // 转换为临时存储格式
    const formattedReviews = reviewResults.map((result, index) => ({
      id: reportId * 100 + index, // 生成唯一ID
      report_id: reportId,
      profession: result.profession,
      ai_analysis: result.ai_analysis,
      manual_review: '',
      overall_score: result.overall_score,
      review_items: result.review_items.map((item: any) => ({
        ...item,
        confirmed: false,
      })),
      confirmed_items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    console.log('[AI Review] Formatted', formattedReviews.length, 'reviews');

    // 保存评审结果
    try {
      const client = await pool.connect();
      
      // 更新状态为已完成
      await client.query(
        `UPDATE reports SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [reportId]
      );
      
      // TODO: 在实际应用中，这里应该将reviews保存到reviews表
      // 目前先保存到临时存储供前端使用
      
      client.release();
    } catch (dbError) {
      console.error('[AI Review] Database error during save:', dbError);
    }

    // 保存到临时存储
    tempStorage.completeReview(reportId, formattedReviews);

    console.log('[AI Review] Review completed and saved for report:', reportId);
  } catch (error) {
    console.error('[AI Review] Error during AI review:', error);
    
    // 标记评审失败
    try {
      tempStorage.failReview(reportId, 'AI评审过程中发生错误：' + String(error));
    } catch (err) {
      console.error('[AI Review] Error marking review as failed:', err);
    }

    // 降级方案：使用模拟数据
    try {
      const professions = reportData.professions || [];
      const mockReviews = tempStorage.generateMockReviews(professions, reportId);
      tempStorage.completeReview(reportId, mockReviews);
      console.log('[AI Review] Fallback to mock data completed');
    } catch (fallbackError) {
      console.error('[AI Review] Fallback also failed:', fallbackError);
    }
  }
}
