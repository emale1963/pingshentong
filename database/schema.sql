-- 建筑可研报告智能评审系统 - 数据库设计

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 可研报告表
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    project_type VARCHAR(100),
    file_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 评审记录表
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    ai_analysis TEXT,
    manual_review TEXT,
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    key_issues JSONB,
    suggestions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 评审配置表
CREATE TABLE IF NOT EXISTS review_config (
    id SERIAL PRIMARY KEY,
    config_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    weight_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引创建
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reviews_report_id ON reviews(report_id);
CREATE INDEX idx_users_email ON users(email);

-- 插入默认评审配置
INSERT INTO review_config (config_name, description, criteria, weight_config) VALUES
(
    '建筑可研报告评审标准',
    '建筑领域可研报告智能评审的默认配置',
    '[
        {"code": "feasibility", "name": "可行性分析", "description": "项目技术可行性和经济可行性分析"},
        {"code": "technical", "name": "技术方案", "description": "技术方案合理性和先进性"},
        {"code": "economic", "name": "经济指标", "description": "投资估算、经济效益分析"},
        {"code": "environment", "name": "环境影响", "description": "环境影响评估和环保措施"},
        {"code": "safety", "name": "安全保障", "description": "安全生产方案和风险评估"},
        {"code": "compliance", "name": "合规性", "description": "符合国家和地方政策法规"}
    ]'::jsonb,
    '{
        "feasibility": 25,
        "technical": 20,
        "economic": 20,
        "environment": 15,
        "safety": 10,
        "compliance": 10
    }'::jsonb
) ON CONFLICT (config_name) DO NOTHING;
