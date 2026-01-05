import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { tempStorage } from '@/lib/tempStorage';

export async function GET(request: NextRequest) {
  try {
    // 尝试从数据库获取统计数据
    const client = await pool.connect();

    // 获取各种统计数据
    const [reportsResult, usersResult, completedResult, reviewingResult, failedResult, reviewsResult] = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM reports'),
      client.query('SELECT COUNT(*) as count FROM users'),
      client.query('SELECT COUNT(*) as count FROM reports WHERE status = $1', ['completed']),
      client.query('SELECT COUNT(*) as count FROM reports WHERE status = $1', ['reviewing']),
      client.query('SELECT COUNT(*) as count FROM reports WHERE status = $1', ['failed']),
      client.query('SELECT COUNT(*) as count FROM reviews'),
    ]);

    client.release();

    const stats = {
      totalReports: parseInt(reportsResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count),
      completedReports: parseInt(completedResult.rows[0].count),
      reviewingReports: parseInt(reviewingResult.rows[0].count),
      failedReports: parseInt(failedResult.rows[0].count),
      totalReviews: parseInt(reviewsResult.rows[0].count),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch stats from database, using temp storage:', error);

    // 降级方案:从临时存储获取统计数据
    const reports = tempStorage.getAllReports();
    const stats = {
      totalReports: reports.length,
      totalUsers: 1, // 暂时硬编码
      completedReports: reports.filter(r => r.status === 'completed').length,
      reviewingReports: reports.filter(r => r.status === 'reviewing').length,
      failedReports: reports.filter(r => r.status === 'failed').length,
      totalReviews: reports.reduce((sum, r) => sum + (r.reviews?.length || 0), 0),
    };

    return NextResponse.json(stats);
  }
}
