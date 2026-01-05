import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminOperation } from '@/lib/authAdmin';
import pool from '@/lib/db';

/**
 * 获取所有评审配置
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/admin/review-configs called');

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const client = await pool.connect();

    // 获取评审配置列表
    const result = await client.query(`
      SELECT
        config_id,
        profession,
        config_name,
        config_content,
        review_depth,
        min_opinion_length,
        max_opinion_length,
        rule_template,
        is_active,
        created_at,
        updated_at
      FROM review_configs
      ORDER BY profession
    `);

    // 获取关键词统计
    const keywordStats = await client.query(`
      SELECT
        profession,
        COUNT(*) as keyword_count
      FROM review_keywords
      WHERE is_active = true
      GROUP BY profession
    `);

    const statsMap: Record<string, number> = {};
    keywordStats.rows.forEach(row => {
      statsMap[row.profession] = row.keyword_count;
    });

    client.release();

    const configs = result.rows.map(row => ({
      ...row,
      keywordCount: statsMap[row.profession] || 0,
    }));

    return NextResponse.json({
      success: true,
      configs,
    });
  } catch (error) {
    console.error('[API] Get review configs error:', error);
    return NextResponse.json(
      { error: '获取评审配置失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建评审配置
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/review-configs called');

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
      configName,
      configContent,
      reviewDepth = 'medium',
      minOpinionLength = 100,
      maxOpinionLength = 500,
      ruleTemplate,
      isActive = true,
    } = body;

    // 验证必填字段
    if (!profession || !configName) {
      return NextResponse.json(
        { error: '专业和配置名称不能为空' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // 检查专业是否已存在
      const existingResult = await client.query(
        'SELECT config_id FROM review_configs WHERE profession = $1',
        [profession]
      );

      if (existingResult.rows.length > 0) {
        client.release();
        return NextResponse.json(
          { error: '该专业的评审配置已存在' },
          { status: 400 }
        );
      }

      // 创建评审配置
      const result = await client.query(
        `INSERT INTO review_configs (
          profession, config_name, config_content, review_depth,
          min_opinion_length, max_opinion_length, rule_template, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          profession,
          configName,
          JSON.stringify(configContent || {}),
          reviewDepth,
          minOpinionLength,
          maxOpinionLength,
          ruleTemplate,
          isActive,
        ]
      );

      // 记录操作日志
      await logAdminOperation({
        adminId: admin.id,
        operationType: 'create',
        operationModule: 'review_config',
        operationDetail: `创建评审配置: ${configName} (${profession})`,
        operationData: { profession, configName },
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
    console.error('[API] Create review config error:', error);
    return NextResponse.json(
      { error: '创建评审配置失败' },
      { status: 500 }
    );
  }
}
