import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 获取规范的条款列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] GET /api/standards/[id]/articles called');

  try {
    const { id } = await params;
    const standardId = parseInt(id);
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');
    const sectionCode = searchParams.get('sectionCode');

    let query = `
      SELECT
        id,
        standard_id,
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
    `;
    const values: any[] = [standardId];
    let paramIndex = 2;

    if (sectionCode) {
      query += ` AND section_code = $${paramIndex++}`;
      values.push(sectionCode);
    }

    if (keyword) {
      query += ` AND (
        article_code ILIKE $${paramIndex++} OR
        article_content ILIKE $${paramIndex++} OR
        keywords ILIKE $${paramIndex++}
      )`;
      const searchPattern = `%${keyword}%`;
      values.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY section_code, article_code`;

    const result = await pool.query(query, values);

    console.log(`[API] Retrieved ${result.rows.length} articles for standard: ${standardId}`);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[API] Failed to fetch articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// 添加规范条款
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] POST /api/standards/[id]/articles called');

  try {
    const { id } = await params;
    const standardId = parseInt(id);
    const body = await request.json();
    const {
      article_code,
      article_content,
      section_code,
      section_title,
      keywords,
      requirement_level = 'mandatory',
    } = body;

    // 验证必填字段
    if (!article_code || !article_content) {
      return NextResponse.json(
        { error: 'Missing required fields: article_code, article_content' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO standard_articles (
        standard_id, article_code, article_content, section_code,
        section_title, keywords, requirement_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        standardId,
        article_code,
        article_content,
        section_code,
        section_title,
        keywords,
        requirement_level,
      ]
    );

    console.log('[API] Article created:', result.rows[0]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('[AI] Failed to create article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
