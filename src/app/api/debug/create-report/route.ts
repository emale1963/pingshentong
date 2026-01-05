import { NextRequest, NextResponse } from 'next/server';
import { tempStorage } from '@/lib/tempStorage';
import { aiReviewService } from '@/services/aiReviewService';

export async function POST(request: NextRequest) {
  console.log('[Debug] Creating test report in temp storage');
  
  try {
    const body = await request.json();
    const professions = body.professions || ['architecture'];
    
    const report = tempStorage.createReport({
      user_id: 1,
      professions: professions,
      file_url: 'test/test.pdf',
      file_name: 'test_report.pdf',
      file_size: 1024,
      status: 'submitted',
    });
    
    console.log('[Debug] Test report created:', report.id);
    
    return NextResponse.json({
      reportId: report.id,
      professions,
      message: 'Test report created'
    });
  } catch (error) {
    console.error('[Debug] Failed to create test report:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
