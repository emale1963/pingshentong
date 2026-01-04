import { NextResponse } from 'next/server';
import { tempStorage } from '@/lib/tempStorage';
import pool from '@/lib/db';

export async function GET() {
  const status = {
    timestamp: new Date().toISOString(),
    system: {
      status: 'online',
      version: '1.0.0',
    },
    storage: {
      temp: {
        reportCount: tempStorage.getAllReports().length,
        status: 'available',
      },
      database: {
        status: 'unknown',
        error: null as string | null,
      },
      objectStorage: {
        status: 'configured',
        bucket: process.env.COZE_BUCKET_NAME || 'not set',
      },
    },
    ai: {
      status: 'configured',
      provider: 'doubao-seed',
      model: 'doubao-seed-1-6-251015',
    },
  };

  // 测试数据库连接
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    status.storage.database.status = 'connected';
  } catch (error) {
    status.storage.database.status = 'disconnected';
    status.storage.database.error = String(error);
  }

  return NextResponse.json(status);
}
