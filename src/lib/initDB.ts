/**
 * 数据库初始化脚本
 * 创建必要的表和索引
 */

import pool from './db';

const CREATE_TABLES_SQL = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 报告表
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  professions TEXT[] NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  status VARCHAR(20) DEFAULT 'submitted',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 评审表
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  profession VARCHAR(50) NOT NULL,
  ai_analysis TEXT,
  manual_review TEXT,
  review_items JSONB DEFAULT '[]'::jsonb,
  confirmed_items TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 导出记录表
CREATE TABLE IF NOT EXISTS exports (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  export_type VARCHAR(20) NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_report_id ON reviews(report_id);
CREATE INDEX IF NOT EXISTS idx_reviews_profession ON reviews(profession);
CREATE INDEX IF NOT EXISTS idx_exports_report_id ON exports(report_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);

-- 插入默认系统配置
INSERT INTO system_configs (key, value, description) VALUES
  ('max_file_size', '20', '最大文件上传大小(MB)'),
  ('allowed_file_types', 'pdf,doc,docx', '允许的文件类型'),
  ('default_ai_model', 'kimi-k2', '默认AI模型'),
  ('enable_ocr', 'false', '是否启用OCR功能')
ON CONFLICT (key) DO NOTHING;

-- 插入默认管理员账户(需要在使用时修改密码)
INSERT INTO users (username, email, password_hash, is_admin) VALUES
  ('admin', 'admin@example.com', '$2b$10$placeholder_hash_replace_me', TRUE)
ON CONFLICT (username) DO NOTHING;
`;

/**
 * 初始化数据库
 */
export async function initDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    console.log('[Database] Starting database initialization...');

    // 执行SQL脚本
    await client.query(CREATE_TABLES_SQL);

    client.release();
    console.log('[Database] Database initialized successfully');
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * 检查数据库连接和表是否存在
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  tables: string[];
  error?: string;
}> {
  try {
    const client = await pool.connect();

    // 检查表是否存在
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    client.release();

    const tables = tablesResult.rows.map(row => row.table_name);

    return {
      connected: true,
      tables,
    };
  } catch (error) {
    console.error('[Database] Health check failed:', error);
    return {
      connected: false,
      tables: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<{
  size: string;
  tables: Array<{
    name: string;
    rows: number;
  }>;
}> {
  try {
    const client = await pool.connect();

    // 获取数据库大小
    const sizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    // 获取每个表的行数
    const tablesResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        n_tup_ins - n_tup_del as row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    client.release();

    return {
      size: sizeResult.rows[0].size,
      tables: tablesResult.rows.map(row => ({
        name: row.tablename,
        rows: row.row_count,
      })),
    };
  } catch (error) {
    console.error('[Database] Failed to get stats:', error);
    throw error;
  }
}
