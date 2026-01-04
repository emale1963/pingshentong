import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const client = await pool.connect();

    // 查询报告及其评审记录
    const result = await client.query(
      `SELECT r.*,
              json_build_object(
                'id', rv.id,
                'ai_analysis', rv.ai_analysis,
                'manual_review', rv.manual_review,
                'overall_score', rv.overall_score,
                'key_issues', rv.key_issues,
                'suggestions', rv.suggestions,
                'created_at', rv.created_at
              ) as review
       FROM reports r
       LEFT JOIN reviews rv ON r.id = rv.report_id
       WHERE r.id = $1`,
      [params.id]
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
    const { title, project_type, status } = body;

    const client = await pool.connect();

    const result = await client.query(
      `UPDATE reports
       SET title = COALESCE($1, title),
           project_type = COALESCE($2, project_type),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [title, project_type, status, params.id]
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
