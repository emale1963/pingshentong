# 建筑可研报告智能评审系统

基于 React + Node.js + PostgreSQL 的完整网站系统，用于建筑领域可研报告智能评审。

## 核心功能模块

### 1. 用户前端界面
- **报告提交页面** (`/`)：上传可研报告文件，填写项目信息
- **我的报告** (`/reports`)：查看所有提交的报告列表
- **报告详情** (`/reports/[id]`)：查看 AI 评审结果，包括综合评分、关键问题和改进建议

### 2. 后台管理系统
- **管理首页** (`/admin`)：查看系统统计数据（总报告数、用户数、评审状态）
- **报告管理** (`/admin/reports`)：查看和管理所有报告，按状态筛选
- **用户管理** (`/admin/users`)：管理系统用户
- **评审管理** (`/admin/reviews`)：人工评审和 AI 配置
- **系统配置** (`/admin/config`)：评审标准和权重配置

### 3. 数据库设计
完整的 PostgreSQL 数据库表结构，包括：
- **users**：用户信息
- **reports**：可研报告
- **reviews**：评审记录
- **review_config**：评审配置

Schema 文件：`database/schema.sql`

### 4. 大模型集成接口
- 集成豆包大语言模型进行智能评审分析
- 支持从可行性分析、技术方案、经济指标、环境影响、安全保障、合规性等维度进行评审
- 自动生成综合评分、关键问题和改进建议
- 支持流式和非流式响应

### 5. 文档处理服务
- 集成 S3 兼容对象存储服务
- 支持文件上传、下载、管理
- 自动生成签名访问 URL
- 支持多种文件格式（PDF、Word 等）

## 技术栈

- **前端框架**：Next.js 16 (App Router) + React 19
- **语言**：TypeScript 5
- **样式**：Tailwind CSS 4
- **后端**：Node.js + Next.js API Routes
- **数据库**：PostgreSQL
- **大模型**：豆包 (Doubao) 大语言模型
- **对象存储**：S3 兼容存储服务
- **依赖管理**：pnpm

## 项目结构

```
.
├── database/
│   └── schema.sql                    # 数据库表结构定义
├── src/
│   ├── app/
│   │   ├── api/                      # API 路由
│   │   │   ├── reports/              # 报告相关 API
│   │   │   │   ├── route.ts          # 报告列表、创建
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # 报告详情、更新
│   │   │   │       └── review/
│   │   │   │           └── route.ts  # AI 评审触发
│   │   │   └── admin/                # 后台管理 API
│   │   │       ├── stats/route.ts    # 统计数据
│   │   │       ├── reports/route.ts  # 报告管理
│   │   │       └── users/route.ts    # 用户管理
│   │   ├── admin/                    # 后台管理页面
│   │   ├── reports/                  # 用户报告页面
│   │   ├── page.tsx                  # 首页（报告提交）
│   │   ├── layout.tsx                # 根布局
│   │   └── globals.css               # 全局样式
│   ├── components/
│   │   └── Navbar.tsx                # 导航栏组件
│   ├── lib/
│   │   └── db.ts                     # 数据库连接配置
│   └── services/
│       └── aiReview.ts               # AI 评审服务
└── README.md
```

## 初始化数据库

在运行项目前，需要先初始化 PostgreSQL 数据库：

```bash
# 连接到数据库并执行 schema.sql
psql -h <host> -U <user> -d <database> -f database/schema.sql
```

## 环境变量配置

需要配置以下环境变量（在 `.env.local` 文件中）：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=report_review
DB_USER=postgres
DB_PASSWORD=postgres

# 对象存储配置
COZE_BUCKET_ENDPOINT_URL=<endpoint_url>
COZE_BUCKET_NAME=<bucket_name>
```

## 安装依赖

```bash
pnpm install
```

## 运行开发服务器

```bash
# 开发环境（支持热更新）
bash .cozeproj/scripts/dev_run.sh

# 或者
pnpm dev
```

服务将在 `http://localhost:5000` 启动。

## 构建生产版本

```bash
pnpm build
```

## 主要功能说明

### 报告提交流程
1. 用户在首页填写报告标题和项目类型
2. 上传可研报告文件（PDF 或 Word）
3. 文件自动上传到对象存储
4. 系统创建报告记录并返回报告 ID
5. 后台自动触发 AI 评审分析

### AI 评审流程
1. 读取上传的文件内容
2. 调用豆包大模型进行智能分析
3. 从 6 个维度进行评审：
   - 可行性分析（25%）
   - 技术方案（20%）
   - 经济指标（20%）
   - 环境影响（15%）
   - 安全保障（10%）
   - 合规性（10%）
4. 生成综合评分（0-100 分）
5. 提取关键问题和改进建议
6. 保存评审结果到数据库
7. 更新报告状态为"已完成"

### 后台管理功能
- 查看系统整体运行状态
- 管理所有用户的报告
- 管理系统用户
- 配置评审标准和权重

## API 接口文档

### 报告相关
- `GET /api/reports` - 获取报告列表
- `POST /api/reports` - 创建新报告（上传文件）
- `GET /api/reports/[id]` - 获取报告详情
- `PUT /api/reports/[id]` - 更新报告信息
- `POST /api/reports/[id]/review` - 触发 AI 评审

### 后台管理
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/reports` - 获取所有报告
- `GET /api/admin/users` - 获取所有用户

## 注意事项

1. **数据库初始化**：首次运行前必须执行 `database/schema.sql` 初始化数据库表
2. **环境变量**：确保配置正确的数据库和对象存储连接信息
3. **大模型调用**：AI 评审功能需要配置大模型服务访问权限
4. **文件上传限制**：当前限制上传文件最大 50MB
5. **用户认证**：当前版本暂未实现完整的用户认证系统，待后续完善

## 后续优化建议

1. **用户认证**：集成完整的登录注册、JWT 认证系统
2. **权限控制**：实现基于角色的访问控制（RBAC）
3. **文件解析**：增强 PDF/Word 文件内容解析能力
4. **流式响应**：实现 AI 评审结果的流式实时展示
5. **评审配置**：支持自定义评审标准和权重
6. **历史版本**：支持报告版本管理和评审历史
7. **导出功能**：支持评审结果导出为 PDF/Word
8. **消息通知**：集成邮件/消息通知系统
