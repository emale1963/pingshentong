import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminOperation } from '@/lib/authAdmin';
import pool from '@/lib/db';

/**
 * 获取关键词列表
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/admin/keywords called');

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const profession = searchParams.get('profession');
    const category = searchParams.get('category');
    const keyword = searchParams.get('keyword');

    const client = await pool.connect();

    let query = 'SELECT * FROM review_keywords WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (profession) {
      paramCount++;
      query += ` AND profession = $${paramCount}`;
      params.push(profession);
    }

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (keyword) {
      paramCount++;
      query += ` AND keyword ILIKE $${paramCount}`;
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY profession, category, weight DESC';

    const result = await client.query(query, params);
    client.release();

    return NextResponse.json({
      success: true,
      keywords: result.rows,
    });
  } catch (error) {
    console.error('[API] Get keywords error:', error);
    return NextResponse.json(
      { error: '获取关键词失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建关键词
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/keywords called');

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      profession,
      keyword,
      category = 'general',
      weight = 1.00,
      description,
      isActive = true,
    } = body;

    // 验证必填字段
    if (!profession || !keyword) {
      return NextResponse.json(
        { error: '专业和关键词不能为空' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // 创建关键词
      const result = await client.query(
        `INSERT INTO review_keywords (
          profession, keyword, category, weight, description, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [profession, keyword, category, weight, description, isActive, admin.username]
      );

      // 记录操作日志
      await logAdminOperation({
        adminId: admin.id,
        operationType: 'create',
        operationModule: 'keyword',
        operationDetail: `添加关键词: ${keyword} (${profession} - ${category})`,
        operationData: { profession, keyword, category },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });

      client.release();

      return NextResponse.json({
        success: true,
        keyword: result.rows[0],
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('[API] Create keyword error:', error);
    return NextResponse.json(
      { error: '创建关键词失败' },
      { status: 500 }
    );
  }
}
