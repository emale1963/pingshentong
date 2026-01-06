import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 搜索规范库
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/standards/search called');

  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword parameter is required' },
        { status: 400 }
      );
    }

    const searchPattern = `%${keyword}%`;

    // 构建查询 - 搜索规范和条款
    let query = `
      SELECT DISTINCT
        s.id as standard_id,
        s.category,
        s.code,
        s.title,
        s.short_name,
        s.version,
        s.status,
        a.id as article_id,
        a.article_code,
        a.article_content,
        a.section_code,
        a.section_title,
        a.requirement_level
      FROM standards_library s
      LEFT JOIN standard_articles a ON s.id = a.standard_id
      WHERE s.is_active = true
        AND (
          s.code ILIKE $1 OR
          s.title ILIKE $1 OR
          s.short_name ILIKE $1 OR
          s.keywords ILIKE $1 OR
          a.article_code ILIKE $1 OR
          a.article_content ILIKE $1 OR
          a.keywords ILIKE $1
        )
    `;
    const values: any[] = [searchPattern];
    let paramIndex = 2;

    if (category) {
      query += ` AND s.category = $${paramIndex++}`;
      values.push(category);
    }

    query += ` ORDER BY
      CASE
        WHEN s.code ILIKE $1 THEN 1
        WHEN a.article_code ILIKE $1 THEN 2
        WHEN s.title ILIKE $1 THEN 3
        ELSE 4
      END,
      s.code,
      a.section_code,
      a.article_code
    LIMIT $${paramIndex++}`;

    values.push(limit);

    const result = await pool.query(query, values);

    // 按规范分组
    const standardsMap = new Map();

    result.rows.forEach((row: any) => {
      if (!standardsMap.has(row.standard_id)) {
        standardsMap.set(row.standard_id, {
          id: row.standard_id,
          category: row.category,
          code: row.code,
          title: row.title,
          short_name: row.short_name,
          version: row.version,
          status: row.status,
          articles: [],
        });
      }

      if (row.article_id) {
        standardsMap.get(row.standard_id).articles.push({
          id: row.article_id,
          article_code: row.article_code,
          article_content: row.article_content,
          section_code: row.section_code,
          section_title: row.section_title,
          requirement_level: row.requirement_level,
        });
      }
    });

    const results = Array.from(standardsMap.values());

    console.log(`[API] Search returned ${results.length} standards with keyword: "${keyword}"`);

    return NextResponse.json({
      keyword,
      total: results.length,
      data: results,
    });
  } catch (error) {
    console.error('[API] Failed to search standards:', error);
    return NextResponse.json(
      { error: 'Failed to search standards' },
      { status: 500 }
    );
  }
}
