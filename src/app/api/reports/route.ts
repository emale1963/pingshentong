import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import pool from '@/lib/db';
import { tempStorage } from '@/lib/tempStorage';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/reports called');
  
  try {
    const client = await pool.connect();
    console.log('[API] Database connected');

    // 查询所有报告，按创建时间倒序
    const result = await client.query(
      `SELECT id, user_id, professions, status, file_name, created_at
       FROM reports
       ORDER BY created_at DESC`
    );

    client.release();
    console.log('[API] Retrieved', result.rows.length, 'reports from database');

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[API] Failed to fetch reports from database, using fallback:', error);
    
    // 降级方案：返回临时存储的报告
    return NextResponse.json(tempStorage.getAllReports().map(r => ({
      id: r.id,
      user_id: r.user_id,
      professions: r.professions,
      status: r.status,
      file_name: r.file_name,
      created_at: r.created_at
    })));
  }
}

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/reports called');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const professionsStr = formData.get('professions') as string;

    console.log('[API] File:', file?.name, 'Size:', file?.size);
    console.log('[API] Professions:', professionsStr);

    if (!file) {
      console.error('[API] Error: Missing file');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 解析专业选择
    let professions: string[] = [];
    try {
      professions = JSON.parse(professionsStr || '[]');
      console.log('[API] Parsed professions:', professions);
    } catch (e) {
      console.error('[API] Error parsing professions:', e);
      return NextResponse.json(
        { error: 'Invalid professions format' },
        { status: 400 }
      );
    }

    // 上传文件到对象存储
    console.log('[API] Uploading file to S3...');
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const objectKey = `reports/${uniqueFileName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    try {
      const uploadedKey = await storage.uploadFile({
        fileContent: fileBuffer,
        fileName: objectKey,
        contentType: file.type,
      });
      console.log('[API] File uploaded successfully, key:', uploadedKey);

      // 生成可访问的签名 URL
      const fileUrl = await storage.generatePresignedUrl({
        key: uploadedKey,
        expireTime: 86400, // 24小时有效期
      });
      console.log('[API] Presigned URL generated');
    } catch (storageError) {
      console.error('[API] Storage error:', storageError);
      // 继续处理，使用临时URL
    }

    const userId = 1; // 暂时硬编码用户ID

    // 尝试使用数据库
    try {
      const client = await pool.connect();
      console.log('[API] Database connected');

      // 插入报告记录
      const result = await client.query(
        `INSERT INTO reports (user_id, professions, file_url, file_name, file_size, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, professions, objectKey, file.name, file.size, 'submitted']
      );

      client.release();
      console.log('[API] Report created in database:', result.rows[0]);

      return NextResponse.json(result.rows[0]);
    } catch (dbError) {
      console.error('[API] Database error, using fallback:', dbError);
      
      // 降级方案：使用临时内存存储
      const report = tempStorage.createReport({
        user_id: userId,
        professions: professions,
        file_url: objectKey,
        file_name: file.name,
        file_size: file.size,
        status: 'submitted',
      });
      
      console.log('[API] Report created in temp storage:', report);
      
      return NextResponse.json(report);
    }
  } catch (error) {
    console.error('[API] Failed to create report:', error);
    return NextResponse.json(
      { error: 'Failed to create report', details: String(error) },
      { status: 500 }
    );
  }
}
