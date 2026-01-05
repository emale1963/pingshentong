import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers: Record<string, string> = {};
    
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return NextResponse.json({
      method: request.method,
      url: request.url,
      headers,
      body,
      cookies: request.cookies.getAll(),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error reading request',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
