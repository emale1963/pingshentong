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
    
    console.log('[API] Fetching report with id:', reportId, 'Type:', typeof reportId, 'Is NaN:', isNaN(reportId));

    if (isNaN(reportId)) {
      console.log('[API] Invalid report ID');
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // 优先从临时存储获取
    const report = tempStorage.getReport(reportId);
    if (report) {
      console.log('[API] Report found in temp storage');
      return NextResponse.json(report);
    }

    console.log('[API] Report not found in temp storage, trying database');

    // 尝试从数据库获取
    try {
      const client = await pool.connect();
      console.log('[API] Database connected');

      const result = await client.query(
        `SELECT * FROM reports WHERE id = $1`,
        [reportId]
      );

      client.release();

      console.log('[API] Query returned', result.rows.length, 'rows');
      
      if (result.rows.length === 0) {
        console.log('[API] Report not found');
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      const dbReport = result.rows[0];
      console.log('[API] Report retrieved from database:', dbReport);

      return NextResponse.json(dbReport);
    } catch (dbError) {
      console.error('[API] Database error:', dbError);
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('[API] Failed to fetch report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
