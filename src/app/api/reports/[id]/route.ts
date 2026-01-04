import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
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

    // 查询所有评审记录
    const reviewsResult = await client.query(
      'SELECT * FROM reviews WHERE report_id = $1 ORDER BY profession',
      [params.id]
    );

    client.release();

    return NextResponse.json({
      ...report,
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { status, professions } = body;

    const client = await pool.connect();

    const result = await client.query(
      `UPDATE reports
       SET status = COALESCE($1, status),
           professions = COALESCE($2, professions),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, professions ? JSON.stringify(professions) : null, params.id]
    );

    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
