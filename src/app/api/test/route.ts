import { NextRequest, NextResponse } from 'next/server';
import { tempStorage } from '@/lib/tempStorage';

export async function GET(request: NextRequest) {
  console.log('[API] Test route called');
  
  // 创建一个测试报告
  const professions = ['architecture', 'structure', 'plumbing'];
  const report = tempStorage.createReport({
    user_id: 1,
    professions: professions,
    file_url: 'test/file.pdf',
    file_name: '测试可研报告.pdf',
    file_size: 1024000,
    status: 'submitted',
  });

  console.log('[API] Test report created:', report);

  return NextResponse.json({
    message: 'Test report created',
    report: report,
    reviewPageUrl: `/review/${report.id}`
  });
}
