import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();

    // 获取各种统计数据
    const [reportsResult, usersResult, completedResult, reviewingResult] = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM reports'),
      client.query('SELECT COUNT(*) as count FROM users'),
      client.query('SELECT COUNT(*) as count FROM reports WHERE status = $1', ['completed']),
      client.query('SELECT COUNT(*) as count FROM reports WHERE status = $1', ['reviewing']),
    ]);

    client.release();

    const stats = {
      totalReports: parseInt(reportsResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count),
      completedReports: parseInt(completedResult.rows[0].count),
      reviewingReports: parseInt(reviewingResult.rows[0].count),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
