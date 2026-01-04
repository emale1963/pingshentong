import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();

    // 查询所有用户
    const result = await client.query(
      `SELECT id, username, email, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    client.release();

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
