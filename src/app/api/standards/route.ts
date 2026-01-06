import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 获取规范列表
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/standards called');

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const keyword = searchParams.get('keyword');
    const status = searchParams.get('status') || 'current';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 构建查询条件
    let query = `
      SELECT
        id,
        category,
        code,
        title,
        short_name,
        version,
        publish_date,
        effective_date,
        status,
        summary,
        is_active,
        created_at,
        updated_at
      FROM standards_library
      WHERE is_active = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (status && status !== 'all') {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (keyword) {
      query += ` AND (
        code ILIKE $${paramIndex++} OR
        title ILIKE $${paramIndex++} OR
        short_name ILIKE $${paramIndex++} OR
        keywords ILIKE $${paramIndex++}
      )`;
      const searchPattern = `%${keyword}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // 获取总数
    const countQuery = query.replace(
      /SELECT.*?FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // 添加排序和分页
    query += ` ORDER BY category ASC, code ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(pageSize, (page - 1) * pageSize);

    const result = await pool.query(query, params);

    console.log(`[API] Retrieved ${result.rows.length} standards (total: ${total})`);

    return NextResponse.json({
      data: result.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch standards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standards' },
      { status: 500 }
    );
  }
}

// 创建规范
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/standards called');

  try {
    const body = await request.json();
    const {
      category,
      code,
      title,
      short_name,
      version,
      publish_date,
      effective_date,
      status = 'current',
      content,
      keywords,
      summary,
      attachment_url,
      created_by = 1,  // 默认创建者为管理员
    } = body;

    // 验证必填字段
    if (!category || !code || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: category, code, title' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO standards_library (
        category, code, title, short_name, version, publish_date,
        effective_date, status, content, keywords, summary,
        attachment_url, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
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
        created_by,
      ]
    );

    console.log('[API] Standard created:', result.rows[0]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('[API] Failed to create standard:', error);

    // 处理唯一约束冲突
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Standard with same category, code and version already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create standard' },
      { status: 500 }
    );
  }
}
