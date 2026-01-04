import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { tempStorage } from '@/lib/tempStorage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] POST /api/reports/[id]/review called');
  
  try {
    const { id } = await params;
    const reportId = parseInt(id);
    
    console.log('[API] Starting review for report:', reportId);

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

      const reportData = report.rows[0];

      // 更新状态为评审中
      await client.query(
        `UPDATE reports SET status = 'reviewing', updated_at = NOW() WHERE id = $1`,
        [reportId]
      );

      client.release();

      // 模拟异步评审过程（3秒后完成）
      setTimeout(async () => {
        try {
          const client2 = await pool.connect();
          
          // 生成评审数据并保存
          const professions = reportData.professions || [];
          const reviews = tempStorage.generateMockReviews(professions, reportId);
          
          // TODO: 在实际应用中，这里应该将reviews保存到reviews表
          
          await client2.query(
            `UPDATE reports SET status = 'completed', updated_at = NOW() WHERE id = $1`,
            [reportId]
          );
          
          client2.release();
          console.log('[API] Review completed for report:', reportId);
        } catch (error) {
          console.error('[API] Error completing review:', error);
        }
      }, 3000);

      return NextResponse.json({ message: 'Review started', status: 'reviewing' });
    } catch (dbError) {
      console.error('[API] Database error, using fallback:', dbError);
      
      // 降级方案：使用临时存储
      const report = tempStorage.getReport(reportId);
      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      // 开始评审
      tempStorage.startReview(reportId);

      // 模拟异步评审过程（3秒后完成）
      setTimeout(() => {
        try {
          const professions = report.professions || [];
          const reviews = tempStorage.generateMockReviews(professions, reportId);
          tempStorage.completeReview(reportId, reviews);
          console.log('[API] Review completed for report:', reportId);
        } catch (error) {
          console.error('[API] Error completing review:', error);
          tempStorage.failReview(reportId, '评审过程中发生错误');
        }
      }, 3000);

      return NextResponse.json({ message: 'Review started', status: 'reviewing' });
    }
  } catch (error) {
    console.error('[API] Failed to start review:', error);
    return NextResponse.json(
      { error: 'Failed to start review', details: String(error) },
      { status: 500 }
    );
  }
}
