-- 建筑可研报告智能评审系统 - 数据库设计

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 可研报告表
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    professions JSONB NOT NULL DEFAULT '[]'::jsonb,
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
    profession VARCHAR(50) NOT NULL,
    ai_analysis TEXT,
    manual_review TEXT,
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    review_items JSONB DEFAULT '[]'::jsonb,
    confirmed_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, profession)
);

-- 评审意见项结构
-- review_items: [
--   {
--     "id": "1",
--     "description": "问题描述",
--     "standard": "规范依据",
--     "severity": "high|medium|low",
--     "suggestion": "建议修改方案",
--     "confirmed": false
--   }
-- ]

-- 评审配置表
CREATE TABLE IF NOT EXISTS review_config (
    id SERIAL PRIMARY KEY,
    profession VARCHAR(50) UNIQUE NOT NULL,
    config_name VARCHAR(100),
    criteria JSONB NOT NULL,
    weight_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 导出记录表
CREATE TABLE IF NOT EXISTS exports (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    export_type VARCHAR(20) DEFAULT 'word' CHECK (export_type IN ('word', 'pdf', 'excel')),
    file_url TEXT,
    file_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引创建
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reviews_report_id ON reviews(report_id);
CREATE INDEX idx_reviews_profession ON reviews(profession);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- 插入默认评审配置（按专业）
INSERT INTO review_config (profession, config_name, criteria, weight_config) VALUES
(
    'architecture',
    '建筑专业评审标准',
    '[
        {"code": "planning", "name": "规划设计", "description": "总平面布局合理性"},
        {"code": "facade", "name": "立面设计", "description": "建筑立面设计效果"},
        {"code": "space", "name": "空间组织", "description": "空间布局和使用功能"},
        {"code": "energy", "name": "节能设计", "description": "建筑节能措施"}
    ]'::jsonb,
    '{
        "planning": 30,
        "facade": 25,
        "space": 25,
        "energy": 20
    }'::jsonb
),
(
    'structure',
    '结构专业评审标准',
    '[
        {"code": "design", "name": "结构设计", "description": "结构选型和设计参数"},
        {"code": "load", "name": "荷载计算", "description": "荷载取值和计算准确性"},
        {"code": "materials", "name": "材料选用", "description": "结构材料选择和规格"},
        {"code": "safety", "name": "结构安全", "description": "结构安全系数和冗余度"}
    ]'::jsonb,
    '{
        "design": 30,
        "load": 25,
        "materials": 25,
        "safety": 20
    }'::jsonb
),
(
    'plumbing',
    '给排水专业评审标准',
    '[
        {"code": "water", "name": "给水系统", "description": "给水系统设计合理性"},
        {"code": "drainage", "name": "排水系统", "description": "排水系统设计合理性"},
        {"code": "fire_water", "name": "消防给水", "description": "消防给水系统"},
        {"code": "materials", "name": "管材选用", "description": "管道材料选择"}
    ]'::jsonb,
    '{
        "water": 30,
        "drainage": 25,
        "fire_water": 25,
        "materials": 20
    }'::jsonb
),
(
    'electrical',
    '电气专业评审标准',
    '[
        {"code": "power", "name": "配电系统", "description": "配电系统设计"},
        {"code": "lighting", "name": "照明系统", "description": "照明设计标准"},
        {"code": "safety", "name": "电气安全", "description": "电气安全措施"},
        {"code": "energy", "name": "节能措施", "description": "电气节能设计"}
    ]'::jsonb,
    '{
        "power": 30,
        "lighting": 25,
        "safety": 25,
        "energy": 20
    }'::jsonb
),
(
    'hvac',
    '暖通专业评审标准',
    '[
        {"code": "ac", "name": "空调系统", "description": "空调系统设计"},
        {"code": "ventilation", "name": "通风系统", "description": "通风系统设计"},
        {"code": "fire_vent", "name": "消防通风", "description": "防排烟系统"},
        {"code": "energy", "name": "节能措施", "description": "暖通节能设计"}
    ]'::jsonb,
    '{
        "ac": 30,
        "ventilation": 25,
        "fire_vent": 25,
        "energy": 20
    }'::jsonb
),
(
    'fire',
    '消防专业评审标准',
    '[
        {"code": "system", "name": "消防系统", "description": "消防系统完整性"},
        {"code": "evacuation", "name": "疏散设计", "description": "疏散通道和安全出口"},
        {"code": "equipment", "name": "消防设备", "description": "消防设备配置"},
        {"code": "compliance", "name": "规范符合性", "description": "消防规范符合性"}
    ]'::jsonb,
    '{
        "system": 30,
        "evacuation": 30,
        "equipment": 20,
        "compliance": 20
    }'::jsonb
),
(
    'landscape',
    '景观专业评审标准',
    '[
        {"code": "design", "name": "景观设计", "description": "景观方案设计"},
        {"code": "planting", "name": "植物配置", "description": "植物选择和配置"},
        {"code": "materials", "name": "材料选用", "description": "景观材料选择"},
        {"code": "water_feature", "name": "水景设计", "description": "水景和景观设施"}
    ]'::jsonb,
    '{
        "design": 35,
        "planting": 30,
        "materials": 20,
        "water_feature": 15
    }'::jsonb
),
(
    'interior',
    '室内专业评审标准',
    '[
        {"code": "layout", "name": "空间布局", "description": "室内空间组织"},
        {"code": "materials", "name": "材料选用", "description": "室内材料选择"},
        {"code": "lighting", "name": "照明设计", "description": "室内照明效果"},
        {"code": "safety", "name": "室内安全", "description": "室内安全措施"}
    ]'::jsonb,
    '{
        "layout": 30,
        "materials": 30,
        "lighting": 25,
        "safety": 15
    }'::jsonb
),
(
    'cost',
    '造价专业评审标准',
    '[
        {"code": "estimate", "name": "投资估算", "description": "投资估算准确性"},
        {"code": "budget", "name": "预算编制", "description": "预算编制合理性"},
        {"code": "analysis", "name": "经济分析", "description": "经济分析深度"},
        {"code": "control", "name": "造价控制", "description": "造价控制措施"}
    ]'::jsonb,
    '{
        "estimate": 30,
        "budget": 30,
        "analysis": 25,
        "control": 15
    }'::jsonb
)
ON CONFLICT (profession) DO NOTHING;
