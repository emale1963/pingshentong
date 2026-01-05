import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, checkDatabaseHealth, getDatabaseStats } from '@/lib/initDB';

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');

  try {
    switch (action) {
      case 'init':
        await initDatabase();
        return NextResponse.json({ success: true, message: 'Database initialized successfully' });

      case 'health':
        const health = await checkDatabaseHealth();
        return NextResponse.json(health);

      case 'stats':
        const stats = await getDatabaseStats();
        return NextResponse.json(stats);

      default:
        const defaultHealth = await checkDatabaseHealth();
        return NextResponse.json({
          status: 'ok',
          database: defaultHealth.connected,
          tables: defaultHealth.tables.length,
        });
    }
  } catch (error) {
    console.error('[Database API] Error:', error);
    return NextResponse.json(
      {
        error: 'Database operation failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'init') {
      await initDatabase();
      return NextResponse.json({ success: true, message: 'Database initialized successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Database API] Error:', error);
    return NextResponse.json(
      { error: 'Database operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
