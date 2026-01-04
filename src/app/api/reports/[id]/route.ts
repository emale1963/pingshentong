import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { tempStorage } from '@/lib/tempStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] GET /api/reports/[id] called');
  
  try {
    const { id } = await params;
    const reportId = parseInt(id);
    
    console.log('[API] Fetching report with id:', reportId);

    // 尝试从数据库获取
    try {
      const client = await pool.connect();
      console.log('[API] Database connected');

      const result = await client.query(
        `SELECT * FROM reports WHERE id = $1`,
        [reportId]
      );

      client.release();

      if (result.rows.length === 0) {
        console.log('[API] Report not found in database');
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      const report = result.rows[0];
      console.log('[API] Report retrieved:', report);

      return NextResponse.json(report);
    } catch (dbError) {
      console.error('[API] Database error, using fallback:', dbError);
      
      // 降级方案：从临时存储获取
      const report = tempStorage.getReport(reportId);
      if (!report) {
        console.log('[API] Report not found in temp storage');
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      console.log('[API] Report retrieved from temp storage:', report);
      return NextResponse.json(report);
    }
  } catch (error) {
    console.error('[API] Failed to fetch report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
