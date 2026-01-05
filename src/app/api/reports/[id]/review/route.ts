import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { tempStorage } from '@/lib/tempStorage';
import { aiReviewService } from '@/services/aiReviewService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] POST /api/reports/[id]/review called');
  
  try {
    const paramsResult = await params;
    console.log('[API] Params result:', paramsResult);
    
    const { id } = paramsResult;
    const reportId = parseInt(id);
    
    console.log('[API] Parsing reportId:', id, 'to', reportId, 'Type:', typeof reportId, 'Is NaN:', isNaN(reportId));
    
    // 解析请求体，获取模型参数
    const body = await request.json().catch(() => ({}));
    const modelType = body.modelType || 'kimi-k2'; // 默认使用 Kimi-K2
    
    console.log('[API] Starting review for report:', reportId, 'with model:', modelType);

    let reportData: any = null;

    // 尝试从数据库获取
    try {
      const client = await pool.connect();
      console.log('[API] Database connected successfully');

      const report = await client.query(
        `SELECT * FROM reports WHERE id = $1`,
        [reportId]
      );

      client.release();
      console.log('[API] Query executed, rows returned:', report.rows.length);

      if (report.rows.length > 0) {
        reportData = report.rows[0];
        console.log('[API] Report found in database:', reportData.file_name);

        // 更新状态为评审中
        try {
          const updateClient = await pool.connect();
          await updateClient.query(
            `UPDATE reports SET status = 'reviewing', updated_at = NOW() WHERE id = $1`,
            [reportId]
          );
          updateClient.release();
        } catch (updateError) {
          console.error('[API] Failed to update report status:', updateError);
        }
      }
    } catch (dbError) {
      console.error('[API] Database error, using fallback:', dbError);
    }

    // 如果数据库中没有找到，尝试从临时存储获取
    if (!reportData) {
      console.log('[API] Report not found in database, checking temp storage...');
      const report = tempStorage.getReport(reportId);
      if (!report) {
        console.error('[API] Report not found in temp storage either:', reportId);
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      reportData = report;
      tempStorage.startReview(reportId);
    }

    // 异步进行AI评审
    performAIReview(reportId, reportData, modelType);

    return NextResponse.json({ 
      message: 'Review started', 
      status: 'reviewing',
      professions: reportData.professions,
      modelType 
    });
  } catch (error) {
    console.error('[API] Failed to start review:', error);
    return NextResponse.json(
      { error: 'Failed to start review', details: String(error) },
      { status: 500 }
    );
  }
}

async function performAIReview(reportId: number, reportData: any, modelType: string) {
  try {
    console.log('[AI Review] Starting AI review for report:', reportId, 'with model:', modelType);

    const professions = reportData.professions || [];
    const fileName = reportData.file_name || '未命名报告';
    const fileSize = reportData.file_size || 0;
    const createdAt = reportData.created_at || new Date().toISOString();

    // 构建更详细的报告摘要
    const reportSummary = buildReportSummary(fileName, fileSize, createdAt, professions);

    console.log('[AI Review] Generated report summary:', reportSummary.length, 'characters');

    // 调用AI服务进行评审
    const reviewResults = await aiReviewService.analyzeReport(professions, reportSummary, modelType as any);

    console.log('[AI Review] AI analysis completed, processing results...');

    // 转换为临时存储格式
    const formattedReviews = reviewResults.map((result, index) => ({
      id: reportId * 100 + index, // 生成唯一ID
      report_id: reportId,
      profession: result.profession,
      ai_analysis: result.ai_analysis,
      manual_review: '',
      review_items: result.review_items.map((item: any) => ({
        ...item,
        confirmed: false,
      })),
      confirmed_items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    console.log('[AI Review] Formatted', formattedReviews.length, 'reviews');

    // 保存评审结果
    try {
      const client = await pool.connect();
      
      // 更新状态为已完成
      await client.query(
        `UPDATE reports SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [reportId]
      );
      
      // TODO: 在实际应用中，这里应该将reviews保存到reviews表
      // 目前先保存到临时存储供前端使用
      
      client.release();
    } catch (dbError) {
      console.error('[AI Review] Database error during save:', dbError);
    }

    // 保存到临时存储
    tempStorage.completeReview(reportId, formattedReviews);

    console.log('[AI Review] Review completed and saved for report:', reportId);
  } catch (error) {
    console.error('[AI Review] Error during AI review:', error);
    
    // 标记评审失败
    try {
      tempStorage.failReview(reportId, 'AI评审过程中发生错误：' + String(error));
    } catch (err) {
      console.error('[AI Review] Error marking review as failed:', err);
    }

    // 降级方案：使用基于专业知识的评审
    try {
      const professions = reportData.professions || [];
      const fallbackReviews = generateKnowledgeBasedReviews(professions, reportId);
      tempStorage.completeReview(reportId, fallbackReviews);
      console.log('[AI Review] Fallback to knowledge-based reviews completed');
    } catch (fallbackError) {
      console.error('[AI Review] Fallback also failed:', fallbackError);
    }
  }
}

/**
 * 构建详细的报告摘要
 * 基于文件名、文件大小和评审专业生成更有意义的上下文信息
 */
function buildReportSummary(
  fileName: string,
  fileSize: number,
  createdAt: string,
  professions: string[]
): string {
  // 从文件名中提取项目类型信息
  let projectType = '建筑项目';
  if (fileName.includes('迁建') || fileName.includes('新建')) {
    projectType = '新建工程';
  } else if (fileName.includes('改造') || fileName.includes('扩建')) {
    projectType = '改造扩建工程';
  } else if (fileName.includes('维修') || fileName.includes('修缮')) {
    projectType = '维修工程';
  }

  // 估算文件内容丰富度
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
  let contentRichness = '内容较简单';
  if (fileSize > 10 * 1024 * 1024) {
    contentRichness = '内容详细丰富';
  } else if (fileSize > 5 * 1024 * 1024) {
    contentRichness = '内容较为详细';
  } else if (fileSize > 1 * 1024 * 1024) {
    contentRichness = '内容完整';
  }

  // 专业名称映射
  const professionNames: Record<string, string> = {
    architecture: '建筑',
    structure: '结构',
    plumbing: '给排水',
    electrical: '电气',
    hvac: '暖通',
    fire: '消防',
    road: '道路',
    landscape: '景观',
    interior: '室内',
    cost: '造价',
  };

  const professionList = professions.map(p => professionNames[p] || p).join('、');

  // 生成专业的报告摘要
  const summary = `
## 项目基本信息

- 报告名称：${fileName}
- 项目类型：${projectType}
- 文件大小：${fileSizeMB}MB（${contentRichness}）
- 创建时间：${createdAt}
- 评审专业：${professionList}

## 项目背景

该项目为${projectType}，报告文件已上传至系统。由于技术限制，目前无法直接解析PDF文件的具体内容，需要基于项目名称和涉及的专业进行专业评审。

## 评审重点

本次评审重点关注以下专业的设计合规性和常见问题：
${professions.map(p => `- ${professionNames[p] || p}专业设计`).join('\n')}

## 评审要求

请针对以上专业，重点检查以下方面：
1. 设计是否符合国家现行规范和标准要求
2. 设计方案是否合理、可行
3. 是否存在常见的设计缺陷或安全隐患
4. 节能环保措施是否到位
5. 是否有完善的施工图设计说明

请提供5-10条具体、可操作的评审意见，每条意见需包含问题描述、规范依据和修改建议。
`;

  return summary;
}

/**
 * 生成基于专业知识的评审结果（作为降级方案）
 */
function generateKnowledgeBasedReviews(professions: string[], reportId: number) {
  const professionNames: Record<string, string> = {
    architecture: '建筑',
    structure: '结构',
    plumbing: '给排水',
    electrical: '电气',
    hvac: '暖通',
    fire: '消防',
    road: '道路',
    landscape: '景观',
    interior: '室内',
    cost: '造价',
  };

  return professions.map((profession, index) => ({
    id: reportId * 100 + index,
    report_id: reportId,
    profession,
    ai_analysis: `${professionNames[profession] || profession}专业评审：基于项目名称和${professionNames[profession] || profession}专业规范进行常规性评审。以下评审内容为基于专业知识和规范的通用审查要点，建议结合具体设计文件进行详细复核。`,
    manual_review: '',
    review_items: [
      {
        id: `${profession.substring(0, 4)}_1`,
        description: '设计是否符合${professionNames[profession] || profession}专业的国家现行规范和标准要求',
        standard: '相关国家规范和行业标准',
        suggestion: '核对设计图纸，确保符合规范要求',
        display_order: 1,
        confirmed: false,
      },
      {
        id: `${profession.substring(0, 4)}_2`,
        description: '设计方案是否合理可行，是否满足使用功能需求',
        standard: '设计规范和功能需求',
        suggestion: '优化设计方案，提高实用性',
        display_order: 2,
        confirmed: false,
      },
    ],
    confirmed_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}
