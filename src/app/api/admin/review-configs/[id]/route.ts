import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminOperation } from '@/lib/authAdmin';
import pool from '@/lib/db';

/**
 * 获取单个评审配置
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log(`[API] GET /api/admin/review-configs/${(await context.params).id} called`);

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const configId = parseInt((await context.params).id);

    const client = await pool.connect();

    // 获取评审配置
    const result = await client.query(
      'SELECT * FROM review_configs WHERE config_id = $1',
      [configId]
    );

    if (result.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: '评审配置不存在' },
        { status: 404 }
      );
    }

    // 获取该专业的关键词列表
    const keywordsResult = await client.query(
      `SELECT * FROM review_keywords
       WHERE profession = $1
       ORDER BY category, weight DESC`,
      [result.rows[0].profession]
    );

    client.release();

    return NextResponse.json({
      success: true,
      config: {
        ...result.rows[0],
        keywords: keywordsResult.rows,
      },
    });
  } catch (error) {
    console.error('[API] Get review config error:', error);
    return NextResponse.json(
      { error: '获取评审配置失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新评审配置
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log(`[API] PUT /api/admin/review-configs/${(await context.params).id} called`);

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const configId = parseInt((await context.params).id);
    const body = await request.json();
    const {
      configName,
      configContent,
      reviewDepth,
      minOpinionLength,
      maxOpinionLength,
      ruleTemplate,
      isActive,
    } = body;

    const client = await pool.connect();

    try {
      // 检查配置是否存在
      const existingResult = await client.query(
        'SELECT * FROM review_configs WHERE config_id = $1',
        [configId]
      );

      if (existingResult.rows.length === 0) {
        client.release();
        return NextResponse.json(
          { error: '评审配置不存在' },
          { status: 404 }
        );
      }

      const oldConfig = existingResult.rows[0];

      // 更新配置
      const result = await client.query(
        `UPDATE review_configs
         SET
           config_name = COALESCE($1, config_name),
           config_content = COALESCE($2, config_content),
           review_depth = COALESCE($3, review_depth),
           min_opinion_length = COALESCE($4, min_opinion_length),
           max_opinion_length = COALESCE($5, max_opinion_length),
           rule_template = COALESCE($6, rule_template),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
         WHERE config_id = $8
         RETURNING *`,
        [
          configName,
          configContent ? JSON.stringify(configContent) : null,
          reviewDepth,
          minOpinionLength,
          maxOpinionLength,
          ruleTemplate,
          isActive,
          configId,
        ]
      );

      // 记录操作日志
      await logAdminOperation({
        adminId: admin.id,
        operationType: 'update',
        operationModule: 'review_config',
        operationDetail: `更新评审配置: ${result.rows[0].config_name}`,
        operationData: {
          old: {
            configName: oldConfig.config_name,
            isActive: oldConfig.is_active,
          },
          new: {
            configName: result.rows[0].config_name,
            isActive: result.rows[0].is_active,
          },
        },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });

      client.release();

      return NextResponse.json({
        success: true,
        config: result.rows[0],
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('[API] Update review config error:', error);
    return NextResponse.json(
      { error: '更新评审配置失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除评审配置
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log(`[API] DELETE /api/admin/review-configs/${(await context.params).id} called`);

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const configId = parseInt((await context.params).id);

    const client = await pool.connect();

    try {
      // 获取配置信息
      const existingResult = await client.query(
        'SELECT * FROM review_configs WHERE config_id = $1',
        [configId]
      );

      if (existingResult.rows.length === 0) {
        client.release();
        return NextResponse.json(
          { error: '评审配置不存在' },
          { status: 404 }
        );
      }

      const config = existingResult.rows[0];

      // 删除配置
      await client.query('DELETE FROM review_configs WHERE config_id = $1', [configId]);

      // 删除相关关键词
      await client.query(
        'DELETE FROM review_keywords WHERE profession = $1',
        [config.profession]
      );

      // 记录操作日志
      await logAdminOperation({
        adminId: admin.id,
        operationType: 'delete',
        operationModule: 'review_config',
        operationDetail: `删除评审配置: ${config.config_name} (${config.profession})`,
        operationData: { configId, profession: config.profession },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });

      client.release();

      return NextResponse.json({
        success: true,
        message: '评审配置删除成功',
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('[API] Delete review config error:', error);
    return NextResponse.json(
      { error: '删除评审配置失败' },
      { status: 500 }
    );
  }
}
