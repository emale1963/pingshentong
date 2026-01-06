import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 获取单个规范详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] GET /api/standards/[id] called');

  try {
    const { id } = await params;
    const standardId = parseInt(id);

    // 获取规范基本信息
    const result = await pool.query(
      `SELECT
        id,
        category,
        code,
        title,
        short_name,
        version,
        publish_date,
        effective_date,
        status,
        content,
        keywords,
        summary,
        attachment_url,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM standards_library
      WHERE id = $1`,
      [standardId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Standard not found' },
        { status: 404 }
      );
    }

    // 获取规范条款
    const articlesResult = await pool.query(
      `SELECT
        id,
        article_code,
        article_content,
        section_code,
        section_title,
        keywords,
        requirement_level,
        created_at,
        updated_at
      FROM standard_articles
      WHERE standard_id = $1
      ORDER BY section_code, article_code`,
      [standardId]
    );

    const standard = result.rows[0];
    standard.articles = articlesResult.rows;

    console.log('[API] Standard retrieved:', standard.id);

    return NextResponse.json(standard);
  } catch (error) {
    console.error('[API] Failed to fetch standard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standard' },
      { status: 500 }
    );
  }
}

// 更新规范
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] PUT /api/standards/[id] called');

  try {
    const { id } = await params;
    const standardId = parseInt(id);
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // 构建动态更新语句
    const allowedFields = [
      'category', 'code', 'title', 'short_name', 'version',
      'publish_date', 'effective_date', 'status', 'content',
      'keywords', 'summary', 'attachment_url', 'is_active'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(standardId);

    const query = `
      UPDATE standards_library
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Standard not found' },
        { status: 404 }
      );
    }

    console.log('[API] Standard updated:', result.rows[0]);

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('[API] Failed to update standard:', error);

    // 处理唯一约束冲突
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Standard with same category, code and version already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update standard' },
      { status: 500 }
    );
  }
}

// 删除规范（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] DELETE /api/standards/[id] called');

  try {
    const { id } = await params;
    const standardId = parseInt(id);

    const result = await pool.query(
      `UPDATE standards_library
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *`,
      [standardId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Standard not found' },
        { status: 404 }
      );
    }

    console.log('[API] Standard deleted (soft):', result.rows[0].id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to delete standard:', error);
    return NextResponse.json(
      { error: 'Failed to delete standard' },
      { status: 500 }
    );
  }
}
