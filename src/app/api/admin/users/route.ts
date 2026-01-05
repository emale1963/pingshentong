import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminOperation } from '@/lib/authAdmin';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

/**
 * 获取用户列表
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/admin/users called');

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const keyword = searchParams.get('keyword');

    const client = await pool.connect();

    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (keyword) {
      paramCount++;
      query += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`;
      params.push(`%${keyword}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(pageSize, (page - 1) * pageSize);

    const result = await client.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    if (role) {
      countParamCount++;
      countQuery += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    if (keyword) {
      countParamCount++;
      countQuery += ` AND (username ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR full_name ILIKE $${countParamCount})`;
      countParams.push(`%${keyword}%`);
    }

    const countResult = await client.query(countQuery, countParams);

    client.release();

    return NextResponse.json({
      success: true,
      users: result.rows,
      pagination: {
        page,
        pageSize,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / pageSize),
      },
    });
  } catch (error) {
    console.error('[API] Get users error:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建用户
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/users called');

  try {
    // 验证管理员权限
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: '未登录或无权限' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      username,
      email,
      password,
      fullName,
      role = 'user',
      status = 'active',
      isAdmin = false,
      dailyUploadLimit = 10,
      maxFileSizeMb = 20,
    } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // 检查用户名是否已存在
      const existingResult = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingResult.rows.length > 0) {
        client.release();
        return NextResponse.json(
          { error: '用户名已存在' },
          { status: 400 }
        );
      }

      // 加密密码
      const passwordHash = await bcrypt.hash(password, 10);

      // 创建用户
      const result = await client.query(
        `INSERT INTO users (
          username, email, password_hash, full_name, role, status, is_admin,
          daily_upload_limit, max_file_size_mb
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, username, email, full_name, role, status, is_admin, created_at`,
        [
          username,
          email,
          passwordHash,
          fullName,
          role,
          status,
          isAdmin,
          dailyUploadLimit,
          maxFileSizeMb,
        ]
      );

      // 记录操作日志
      await logAdminOperation({
        adminId: admin.id,
        operationType: 'create',
        operationModule: 'user',
        operationDetail: `创建用户: ${username}`,
        operationData: { username, email, role },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });

      client.release();

      return NextResponse.json({
        success: true,
        user: result.rows[0],
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('[API] Create user error:', error);
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    );
  }
}
