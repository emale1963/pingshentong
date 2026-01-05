/**
 * 数据库初始化脚本
 * 创建必要的表和索引
 */

import pool from './db';
import bcrypt from 'bcrypt';

const CREATE_TABLES_SQL = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(200) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  is_admin BOOLEAN DEFAULT FALSE,
  daily_upload_limit INTEGER DEFAULT 10,
  max_file_size_mb INTEGER DEFAULT 20,
  available_models TEXT[],
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(50),
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

-- 评审配置表
CREATE TABLE IF NOT EXISTS review_configs (
  config_id SERIAL PRIMARY KEY,
  profession VARCHAR(50) NOT NULL UNIQUE,
  config_name VARCHAR(200) NOT NULL,
  config_content JSONB NOT NULL DEFAULT '{}',
  review_depth VARCHAR(20) DEFAULT 'medium',
  min_opinion_length INTEGER DEFAULT 100,
  max_opinion_length INTEGER DEFAULT 500,
  rule_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 关键词表
CREATE TABLE IF NOT EXISTS review_keywords (
  keyword_id SERIAL PRIMARY KEY,
  profession VARCHAR(50) NOT NULL,
  keyword VARCHAR(200) NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  weight DECIMAL(3,2) DEFAULT 1.00,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100)
);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_operations (
  operation_id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  operation_type VARCHAR(50) NOT NULL,
  operation_module VARCHAR(50),
  operation_detail TEXT,
  operation_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  result VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
  log_id SERIAL PRIMARY KEY,
  log_level VARCHAR(20) NOT NULL,
  log_type VARCHAR(50),
  message TEXT NOT NULL,
  module VARCHAR(50),
  function_name VARCHAR(100),
  error_details TEXT,
  request_data JSONB,
  user_id INTEGER REFERENCES users(id),
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 性能监控表
CREATE TABLE IF NOT EXISTS performance_metrics (
  metric_id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,2),
  unit VARCHAR(20),
  metadata JSONB,
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统告警表
CREATE TABLE IF NOT EXISTS system_alerts (
  alert_id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  alert_level VARCHAR(20) DEFAULT 'warning',
  title VARCHAR(200) NOT NULL,
  description TEXT,
  threshold_value DECIMAL(10,2),
  current_value DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  resolution_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 模型使用统计表
CREATE TABLE IF NOT EXISTS model_usage_stats (
  stat_id SERIAL PRIMARY KEY,
  model_id VARCHAR(50) NOT NULL,
  model_name VARCHAR(100),
  call_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_response_time INTEGER DEFAULT 0,
  avg_response_time DECIMAL(10,2),
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0.00,
  profession VARCHAR(50),
  stat_date DATE NOT NULL,
  stat_hour INTEGER CHECK (stat_hour >= 0 AND stat_hour <= 23),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_report_id ON reviews(report_id);
CREATE INDEX IF NOT EXISTS idx_reviews_profession ON reviews(profession);
CREATE INDEX IF NOT EXISTS idx_exports_report_id ON exports(report_id);
CREATE INDEX IF NOT EXISTS idx_review_configs_profession ON review_configs(profession);
CREATE INDEX IF NOT EXISTS idx_review_configs_active ON review_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_review_keywords_profession ON review_keywords(profession);
CREATE INDEX IF NOT EXISTS idx_review_keywords_category ON review_keywords(category);
CREATE INDEX IF NOT EXISTS idx_review_keywords_active ON review_keywords(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_operations_admin ON admin_operations(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_operations_type ON admin_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_admin_operations_time ON admin_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_operations_result ON admin_operations(result);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON system_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_time ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_time ON performance_metrics(collected_at);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_time ON system_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_model_usage_stats_model ON model_usage_stats(model_id);
CREATE INDEX IF NOT EXISTS idx_model_usage_stats_date ON model_usage_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_model_usage_stats_profession ON model_usage_stats(profession);
CREATE UNIQUE INDEX IF NOT EXISTS idx_model_usage_stats_unique ON model_usage_stats(model_id, stat_date, stat_hour, COALESCE(profession, ''));
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

    // 插入默认系统配置
    await client.query(`
      INSERT INTO system_configs (key, value, description) VALUES
        ('max_file_size', '20', '最大文件上传大小(MB)'),
        ('allowed_file_types', 'pdf,doc,docx', '允许的文件类型'),
        ('default_ai_model', 'doubao-seed', '默认AI模型'),
        ('enable_ocr', 'false', '是否启用OCR功能'),
        ('admin_session_timeout', '86400', '管理员会话超时时间(秒)')
      ON CONFLICT (key) DO NOTHING;
    `);

    // 插入默认管理员账户(密码: 111111)
    const defaultPasswordHash = await bcrypt.hash('111111', 10);
    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role, status, is_admin)
      VALUES ('admin', 'admin@example.com', $1, '系统管理员', 'admin', 'active', true)
      ON CONFLICT (username) DO NOTHING;
    `, [defaultPasswordHash]);

    // 插入默认评审配置（如果不存在）
    const professions = [
      'architecture', 'structure', 'plumbing', 'electrical',
      'hvac', 'fire', 'road', 'landscape', 'interior', 'cost'
    ];

    for (const profession of professions) {
      await client.query(`
        INSERT INTO review_configs (profession, config_name, config_content, review_depth)
        VALUES ($1, $2, $3, 'medium')
        ON CONFLICT (profession) DO NOTHING;
      `, [profession, `${profession}默认配置`, JSON.stringify({})]);
    }

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
