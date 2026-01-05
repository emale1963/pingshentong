import { NextResponse } from 'next/server';
import { initDatabase, checkDatabaseHealth } from '@/lib/initDB';

/**
 * 数据库初始化API
 * 初始化所有表结构并创建默认管理员账号
 */
export async function GET(request: NextRequest) {
  console.log('[API] Database initialization requested');

  try {
    // 先检查数据库健康状态
    const health = await checkDatabaseHealth();

    if (!health.connected) {
      return NextResponse.json(
        {
          success: false,
          error: '数据库连接失败',
          details: health.error,
        },
        { status: 500 }
      );
    }

    console.log('[API] Database connected, initializing...');

    // 初始化数据库
    await initDatabase();

    // 再次检查健康状态
    const healthAfter = await checkDatabaseHealth();

    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      data: {
        connected: healthAfter.connected,
        tableCount: healthAfter.tables.length,
        tables: healthAfter.tables,
      },
    });
  } catch (error) {
    console.error('[API] Database initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '数据库初始化失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// 动态导入 NextRequest 类型（在文件顶部已导入）
import type { NextRequest } from 'next/server';
