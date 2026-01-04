import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    // 查询所有报告
    const allReports = await client.query(`SELECT id, file_name, status FROM reports ORDER BY id DESC`);
    
    // 查询特定报告
    const specificReport = await client.query(`SELECT * FROM reports WHERE id = 1`);
    
    client.release();

    return NextResponse.json({
      message: 'Database connection successful',
      allReports: allReports.rows,
      specificReport: specificReport.rows,
      allReportsCount: allReports.rows.length,
      specificReportCount: specificReport.rows.length,
    });
  } catch (error) {
    console.error('[Test DB] Error:', error);
    return NextResponse.json(
      { error: 'Database connection failed', details: String(error) },
      { status: 500 }
    );
  }
}
