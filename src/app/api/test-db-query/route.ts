import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('[API] Test DB query called');
  
  try {
    const client = await pool.connect();
    console.log('[API] Database connected');

    const result = await client.query(
      `SELECT * FROM reports WHERE id = $1`,
      [1]
    );

    client.release();
    console.log('[API] Query completed, rows:', result.rows.length);

    return NextResponse.json({
      success: true,
      rows: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('[API] Database error:', error);
    return NextResponse.json(
      { error: 'Database error', details: String(error) },
      { status: 500 }
    );
  }
}
