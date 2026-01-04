import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { aiReviewService } from '@/services/aiReview';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const client = await pool.connect();

    // 查询报告信息
    const reportResult = await client.query(
      'SELECT * FROM reports WHERE id = $1',
      [params.id]
    );

    if (reportResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const report = reportResult.rows[0];

    // 更新报告状态为评审中
    await client.query(
      'UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['reviewing', params.id]
    );

    client.release();

    // 调用 AI 评审服务
    // 这里应该读取实际的上传文件内容
    // 暂时使用模拟内容
    const reportContent = `建筑可研报告：${report.title}\n项目类型：${report.project_type}\n文件名：${report.file_name}`;

    try {
      const reviewResult = await aiReviewService.analyzeReport(
        reportContent,
        report.project_type
      );

      // 保存评审结果到数据库
      const reviewClient = await pool.connect();

      await reviewClient.query(
        `INSERT INTO reviews (report_id, ai_analysis, overall_score, key_issues, suggestions)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          params.id,
          reviewResult.ai_analysis,
          reviewResult.overall_score,
          JSON.stringify(reviewResult.key_issues),
          JSON.stringify(reviewResult.suggestions),
        ]
      );

      // 更新报告状态为已完成
      await reviewClient.query(
        'UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', params.id]
      );

      reviewClient.release();

      return NextResponse.json({
        success: true,
        review: reviewResult,
      });
    } catch (aiError) {
      console.error('AI review failed:', aiError);

      // 更新报告状态为失败
      const errorClient = await pool.connect();
      await errorClient.query(
        'UPDATE reports SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['failed', String(aiError), params.id]
      );
      errorClient.release();

      return NextResponse.json(
        { error: 'AI review failed', details: String(aiError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to trigger review:', error);
    return NextResponse.json(
      { error: 'Failed to trigger review' },
      { status: 500 }
    );
  }
}
