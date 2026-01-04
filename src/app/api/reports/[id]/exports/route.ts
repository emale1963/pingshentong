import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: 实现导出功能
  return NextResponse.json({
    id,
    message: 'Export functionality not yet implemented'
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: 实现导出功能
  return NextResponse.json({
    id,
    message: 'Export functionality not yet implemented'
  });
}
