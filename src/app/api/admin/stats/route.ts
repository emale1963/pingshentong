import { NextRequest, NextResponse } from 'next/server';
import { desc, sql, eq, and, gte } from 'drizzle-orm';
import { db } from '@/lib/db-drizzle';
import { users, reports, modelUsageStats, systemLogs } from '@/storage/database/shared/schema';

export async function GET(request: NextRequest) {
  try {
    // 获取各种统计数据
    const [totalReportsResult, totalUsersResult, completedReportsResult, modelUsageResult] = await Promise.all([
      // 总报告数
      db.select({ count: sql<number>`count(*)` }).from(reports),
      // 用户总数
      db.select({ count: sql<number>`count(*)` }).from(users),
      // 已完成的报告数（作为评审数）
      db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, 'completed')),
      // 模型使用情况（按模型ID汇总）
      db.select({
        modelId: modelUsageStats.modelId,
        modelName: modelUsageStats.modelName,
        count: sql<number>`sum(${modelUsageStats.callCount})`.mapWith(Number),
      })
      .from(modelUsageStats)
      .groupBy(modelUsageStats.modelId, modelUsageStats.modelName)
      .orderBy(desc(sql`sum(${modelUsageStats.callCount})`)),
    ]);

    // 计算活跃用户（最近7天登录的用户）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.lastLoginAt, sevenDaysAgo.toISOString()));

    const stats = {
      totalReports: totalReportsResult[0]?.count || 0,
      totalReviews: completedReportsResult[0]?.count || 0,
      totalUsers: totalUsersResult[0]?.count || 0,
      activeUsers: activeUsersResult[0]?.count || 0,
      modelUsage: modelUsageResult.map((item) => ({
        modelId: item.modelId || item.modelName || 'unknown',
        count: item.count || 0,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch stats from database:', error);

    // 降级方案：返回空数据
    const stats = {
      totalReports: 0,
      totalReviews: 0,
      totalUsers: 0,
      activeUsers: 0,
      modelUsage: [],
    };

    return NextResponse.json(stats);
  }
}
