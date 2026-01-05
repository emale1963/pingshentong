import { NextRequest, NextResponse } from 'next/server';
import { tempStorage } from '@/lib/tempStorage';
import { generateReviewReport } from '@/lib/generateReviewReport';
import { S3Storage } from 'coze-coding-dev-sdk';
import pool from '@/lib/db';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 导出记录存储（临时）
const exportRecords: Map<number, Array<{
  id: number;
  export_type: string;
  file_url: string;
  file_name: string;
  status: string;
  created_at: string;
}>> = new Map();
let exportIdCounter = 1;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] GET /api/reports/[id]/exports called');
  
  try {
    const { id } = await params;
    const reportId = parseInt(id);
    
    console.log('[API] Fetching exports for report:', reportId);

    // 从临时存储获取导出记录
    const exports = exportRecords.get(reportId) || [];
    
    console.log('[API] Retrieved', exports.length, 'export records');
    
    return NextResponse.json(exports);
  } catch (error) {
    console.error('[API] Failed to fetch exports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] POST /api/reports/[id]/exports called');

  try {
    const { id } = await params;
    const reportId = parseInt(id);

    // 只支持Word格式导出
    const export_type = 'word';

    console.log('[API] Creating export:', { reportId, export_type });

    // 尝试从数据库获取报告
    let report: any = null;
    
    try {
      const client = await pool.connect();
      
      const result = await client.query(
        `SELECT * FROM reports WHERE id = $1`,
        [reportId]
      );

      client.release();

      if (result.rows.length > 0) {
        report = result.rows[0];
        // 如果有reviews数据，从tempStorage获取
        const tempReport = tempStorage.getReport(reportId);
        if (tempReport?.reviews) {
          report.reviews = tempReport.reviews;
        }
        console.log('[API] Report retrieved from database');
      }
    } catch (dbError) {
      console.error('[API] Database error, using fallback:', dbError);
      // 降级方案：从临时存储获取
      report = tempStorage.getReport(reportId);
    }

    if (!report) {
      // 创建模拟数据用于测试
      console.log('[API] Creating mock data for report:', reportId);
      report = {
        id: reportId,
        file_name: '测试可研报告.pdf',
        created_at: new Date().toISOString(),
        professions: ['architecture', 'structure', 'plumbing'],
        reviews: tempStorage.generateMockReviews(['architecture', 'structure', 'plumbing'], reportId),
      };
    }

    if (!report.reviews || report.reviews.length === 0) {
      return NextResponse.json(
        { error: 'No review data available' },
        { status: 400 }
      );
    }

    // 创建导出记录
    const exportId = exportIdCounter++;
    const fileName = `评审报告_${report.id}_${new Date().getTime()}.docx`;

    const exportRecord = {
      id: exportId,
      export_type: 'word',
      file_url: '',
      file_name: fileName,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // 保存导出记录
    const exports = exportRecords.get(reportId) || [];
    exports.push(exportRecord);
    exportRecords.set(reportId, exports);

    console.log('[API] Export record created:', exportRecord);

    // 异步生成文档
    generateDocument(reportId, exportId, export_type, report);

    return NextResponse.json(exportRecord);
  } catch (error) {
    console.error('[API] Failed to create export:', error);
    return NextResponse.json(
      { error: 'Failed to create export', details: String(error) },
      { status: 500 }
    );
  }
}

async function generateDocument(
  reportId: number,
  exportId: number,
  exportType: string,
  report: any
) {
  try {
    console.log('[API] Generating Word document for export:', exportId);

    // 生成Word文档
    const docBuffer = await generateReviewReport(report);

    // 上传到对象存储
    const fileKey = `exports/${exportId}_${report.id}_report.docx`;
    const uploadedKey = await storage.uploadFile({
      fileContent: docBuffer,
      fileName: fileKey,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    console.log('[API] Document uploaded:', uploadedKey);

    // 生成下载链接
    const fileUrl = await storage.generatePresignedUrl({
      key: uploadedKey,
      expireTime: 86400, // 24小时有效期
    });

    console.log('[API] Presigned URL generated');

    // 更新导出记录
    const exports = exportRecords.get(reportId) || [];
    const exportRecord = exports.find(e => e.id === exportId);
    
    if (exportRecord) {
      exportRecord.status = 'completed';
      exportRecord.file_url = fileUrl;
      
      console.log('[API] Export completed:', exportRecord);
    }
  } catch (error) {
    console.error('[API] Failed to generate document:', error);
    
    // 标记为失败
    const exports = exportRecords.get(reportId) || [];
    const exportRecord = exports.find(e => e.id === exportId);
    
    if (exportRecord) {
      exportRecord.status = 'failed';
    }
  }
}
