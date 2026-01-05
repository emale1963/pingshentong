import { NextResponse } from 'next/server';
import { tempStorage } from '@/lib/tempStorage';

export async function GET() {
  console.log('[Debug] Checking temp storage');
  
  const allReports = tempStorage.getAllReports();
  console.log('[Debug] Total reports in temp storage:', allReports.length);
  
  allReports.forEach(report => {
    console.log('[Debug] Report:', report.id, report.file_name, report.status);
    if (report.reviews && report.reviews.length > 0) {
      console.log('[Debug]   Reviews:', report.reviews.length);
      report.reviews.forEach(review => {
        console.log('[Debug]     -', review.profession, ':', review.review_items.length, 'items');
      });
    }
  });
  
  return NextResponse.json({
    total: allReports.length,
    reports: allReports.map(r => ({
      id: r.id,
      file_name: r.file_name,
      status: r.status,
      professions: r.professions,
      reviews_count: r.reviews?.length || 0,
    }))
  });
}
