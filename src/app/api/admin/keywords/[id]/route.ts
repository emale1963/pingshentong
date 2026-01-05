import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminOperation } from '@/lib/authAdmin';
import pool from '@/lib/db';

/**
 * 更新关键词
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log(`[API] PUT /api/admin/keywords/${(await context.params).id} called`);

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const keywordId = parseInt((await context.params).id);
    const body = await request.json();
    const {
      keyword,
      category,
      weight,
      description,
      isActive,
    } = body;

    const client = await pool.connect();

    try {
      // 检查关键词是否存在
      const existingResult = await client.query(
        'SELECT * FROM review_keywords WHERE keyword_id = $1',
        [keywordId]
      );

      if (existingResult.rows.length === 0) {
        client.release();
        return NextResponse.json(
          { error: '关键词不存在' },
          { status: 404 }
        );
      }

      const oldKeyword = existingResult.rows[0];

      // 更新关键词
      const result = await client.query(
        `UPDATE review_keywords
         SET
           keyword = COALESCE($1, keyword),
           category = COALESCE($2, category),
           weight = COALESCE($3, weight),
           description = COALESCE($4, description),
           is_active = COALESCE($5, is_active)
         WHERE keyword_id = $6
         RETURNING *`,
        [keyword, category, weight, description, isActive, keywordId]
      );

      // 记录操作日志
      await logAdminOperation({
        adminId: admin.id,
        operationType: 'update',
        operationModule: 'keyword',
        operationDetail: `更新关键词: ${result.rows[0].keyword}`,
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
    console.error('[API] Update keyword error:', error);
    return NextResponse.json(
      { error: '更新关键词失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除关键词
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log(`[API] DELETE /api/admin/keywords/${(await context.params).id} called`);

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const keywordId = parseInt((await context.params).id);

    const client = await pool.connect();

    try {
      // 获取关键词信息
      const existingResult = await client.query(
        'SELECT * FROM review_keywords WHERE keyword_id = $1',
        [keywordId]
      );

      if (existingResult.rows.length === 0) {
        client.release();
        return NextResponse.json(
          { error: '关键词不存在' },
          { status: 404 }
        );
      }

      const keyword = existingResult.rows[0];

      // 删除关键词
      await client.query('DELETE FROM review_keywords WHERE keyword_id = $1', [keywordId]);

      // 记录操作日志
      await logAdminOperation({
        adminId: admin.id,
        operationType: 'delete',
        operationModule: 'keyword',
        operationDetail: `删除关键词: ${keyword.keyword} (${keyword.profession})`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });

      client.release();

      return NextResponse.json({
        success: true,
        message: '关键词删除成功',
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('[API] Delete keyword error:', error);
    return NextResponse.json(
      { error: '删除关键词失败' },
      { status: 500 }
    );
  }
}
