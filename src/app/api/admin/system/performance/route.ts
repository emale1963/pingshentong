import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authAdmin';
import pool from '@/lib/db';

/**
 * 获取系统性能数据
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/admin/system/performance called');

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
    const hours = parseInt(searchParams.get('hours') || '24');

    const client = await pool.connect();

    // 获取最近的性能指标
    const result = await client.query(
      `SELECT * FROM performance_metrics
       WHERE collected_at > NOW() - INTERVAL '${hours} hours'
       ORDER BY collected_at DESC
       LIMIT 1000`
    );

    // 获取系统服务状态
    const servicesStatus = await client.query(`
      SELECT
        'database' as service_name,
        CASE WHEN COUNT(*) > 0 THEN 'online' ELSE 'offline' END as status
      FROM performance_metrics
      WHERE metric_type = 'database'
      AND collected_at > NOW() - INTERVAL '5 minutes'

      UNION ALL

      SELECT
        'ai_model' as service_name,
        CASE WHEN COUNT(*) > 0 THEN 'online' ELSE 'offline' END as status
      FROM performance_metrics
      WHERE metric_type = 'ai_model'
      AND collected_at > NOW() - INTERVAL '5 minutes'
    `);

    client.release();

    return NextResponse.json({
      success: true,
      metrics: result.rows,
      services: servicesStatus.rows,
    });
  } catch (error) {
    console.error('[API] Get performance error:', error);
    return NextResponse.json(
      { error: '获取性能数据失败' },
      { status: 500 }
    );
  }
}

/**
 * 采集性能数据
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/system/performance called');

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
    const { metrics } = body;

    const client = await pool.connect();

    try {
      // 批量插入性能数据
      for (const metric of metrics) {
        await client.query(
          `INSERT INTO performance_metrics (metric_type, metric_name, metric_value, unit, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            metric.type,
            metric.name,
            metric.value,
            metric.unit,
            metric.metadata ? JSON.stringify(metric.metadata) : null,
          ]
        );
      }

      client.release();

      return NextResponse.json({
        success: true,
        message: '性能数据采集成功',
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('[API] Collect performance error:', error);
    return NextResponse.json(
      { error: '采集性能数据失败' },
      { status: 500 }
    );
  }
}
