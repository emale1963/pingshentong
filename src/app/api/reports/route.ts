import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();

    // 查询所有报告，按创建时间倒序
    const result = await client.query(
      `SELECT id, user_id, professions, status, file_name, created_at
       FROM reports
       ORDER BY created_at DESC`
    );

    client.release();

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const professionsStr = formData.get('professions') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 解析专业选择
    let professions: string[] = [];
    try {
      professions = JSON.parse(professionsStr || '[]');
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid professions format' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const objectKey = `reports/${uniqueFileName}`;

    // 将文件转换为 Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 上传文件到对象存储
    const uploadedKey = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName: objectKey,
      contentType: file.type,
    });

    // 生成可访问的签名 URL
    const fileUrl = await storage.generatePresignedUrl({
      key: uploadedKey,
      expireTime: 86400, // 24小时有效期
    });

    const userId = 1; // 暂时硬编码用户ID

    const client = await pool.connect();

    // 插入报告记录
    const result = await client.query(
      `INSERT INTO reports (user_id, professions, file_url, file_name, file_size, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, professions, fileUrl, file.name, file.size, 'submitted']
    );

    client.release();

    // 异步触发 AI 评审分析
    // 这里可以调用 AI 评审服务
    // scheduleAIReview(result.rows[0].id);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
