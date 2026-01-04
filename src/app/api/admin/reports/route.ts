import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();

    // 查询所有报告
    const result = await client.query(
      `SELECT id, user_id, professions, status, file_name, created_at
       FROM reports
       ORDER BY created_at DESC`
    );

    client.release();

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch admin reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
