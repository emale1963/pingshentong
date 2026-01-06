import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

/**
 * 初始化数据库表和示例数据
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/init-standards called');

  try {
    const { schemaOnly = false } = await request.json().catch(() => ({}));

    // 读取schema文件
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    const client = await pool.connect();

    try {
      console.log('[API] Executing schema SQL...');
      await client.query(schemaSQL);
      console.log('[API] Schema executed successfully');
    } catch (error) {
      console.error('[API] Error executing schema:', error);
      client.release();
      return NextResponse.json(
        { error: 'Failed to execute schema', details: String(error) },
        { status: 500 }
      );
    }

    if (!schemaOnly) {
      // 读取示例数据文件
      const sampleDataPath = path.join(process.cwd(), 'database', 'sample_standards_data.sql');
      const sampleDataSQL = fs.readFileSync(sampleDataPath, 'utf-8');

      try {
        console.log('[API] Executing sample data SQL...');
        await client.query(sampleDataSQL);
        console.log('[API] Sample data executed successfully');
      } catch (error) {
        console.error('[API] Error executing sample data:', error);
        client.release();
        return NextResponse.json(
          { error: 'Failed to execute sample data', details: String(error) },
          { status: 500 }
        );
      }
    }

    client.release();

    return NextResponse.json({
      success: true,
      message: schemaOnly
        ? 'Database schema initialized successfully'
        : 'Database schema and sample data initialized successfully',
    });
  } catch (error) {
    console.error('[API] Failed to initialize database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    );
  }
}
