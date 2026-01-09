# 评审通

## 项目简介

这是一个基于人工智能的建筑可行性研究报告智能评审系统，通过集成大语言模型，实现对建筑可研报告的自动化、专业化评审。

### 核心功能

- **报告提交**：支持拖拽上传、多文件格式（PDF、DOC、DOCX）
- **智能评审**：分专业AI评审（建筑、结构、给排水、电气、暖通、消防、景观、室内、造价）
- **结果展示**：实时状态更新、分专业Tab切换、详细评审意见展示
- **报告导出**：支持Word、PDF、Excel多格式导出，自动上传到对象存储

### 技术栈

- **前端**：Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4
- **后端**：Next.js API Routes + PostgreSQL（可选）
- **AI服务**：豆包/KIMI/deepseek
- **存储**：S3兼容对象存储 + 临时内存存储

## 快速开始

### 1. 环境要求

- Node.js 24+
- pnpm（推荐）

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
# 数据库配置（可选）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=report_review
DB_USER=postgres
DB_PASSWORD=postgres

# 对象存储配置
COZE_BUCKET_ENDPOINT_URL=your_endpoint_url
COZE_BUCKET_NAME=your_bucket_name
```

### 4. 启动开发服务器

```bash
bash .cozeproj/scripts/dev_run.sh 2>&1 >/dev/null &
```

服务将在 `http://localhost:5000` 启动。

## 使用指南

### 1. 提交报告

1. 访问首页 `http://localhost:5000`
2. 点击上传区域或拖拽文件到上传区域
3. 选择需要评审的专业（可多选）
4. 点击"提交报告"按钮
5. 系统将自动触发AI评审

### 2. 查看评审结果

1. 提交成功后，自动跳转到评审页面
2. 系统显示评审状态：
   - **评审中**：AI正在分析（约15-30秒）
   - **已完成**：评审完成，可查看详细意见
3. 切换不同专业Tab查看各专业的评审意见
4. 勾选确认已确认的评审意见
5. 点击"导出报告"按钮导出评审报告

### 3. 导出评审报告

1. 进入导出页面
2. 选择导出格式（Word、PDF、Excel）
3. 系统自动生成文档并上传到对象存储
4. 在导出历史中下载生成的文档

### 4. 我的报告

访问 `/reports` 查看所有已提交的报告列表，包括：
- 报告名称
- 评审专业
- 评审状态
- 创建时间

## API 文档

### 1. 提交报告

```http
POST /api/reports
Content-Type: multipart/form-data

file: 文件（必填）
professions: JSON数组，如["architecture","structure"]（必填）
```

### 2. 获取报告列表

```http
GET /api/reports
```

### 3. 获取报告详情

```http
GET /api/reports/{id}
```

### 4. 触发评审

```http
POST /api/reports/{id}/review
```

### 5. 创建导出

```http
POST /api/reports/{id}/exports
Content-Type: application/json

{
  "export_type": "word" | "pdf" | "excel"
}
```

### 6. 获取导出记录

```http
GET /api/reports/{id}/exports
```

### 7. 系统状态

```http
GET /api/test/status
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页（报告提交）
│   ├── reports/           # 报告列表
│   ├── review/[id]/       # 评审页面
│   ├── export/[id]/       # 导出页面
│   ├── api/               # API路由
│   │   ├── reports/       # 报告相关API
│   │   ├── test/          # 测试API
│   │   └── admin/         # 管理API
│   └── layout.tsx         # 全局布局
├── components/            # React组件
│   ├── Button.tsx
│   ├── FileUpload.tsx
│   ├── Input.tsx
│   ├── Navbar.tsx
│   └── ProfessionSelector.tsx
├── lib/                   # 工具库
│   ├── db.ts             # 数据库连接
│   ├── tempStorage.ts    # 临时存储
│   └── generateReviewReport.ts  # 文档生成
├── services/              # 服务层
│   ├── aiReview.ts       # AI评审服务（旧）
│   └── aiReviewService.ts # AI评审服务（新）
└── database/             # 数据库脚本
    └── schema.sql        # 数据库架构
```

## 数据存储策略

### 临时存储（优先）

系统优先使用内存临时存储，适用于：
- 开发和测试环境
- 数据库不可用时的降级方案
- 需要快速响应的场景

### 数据库（可选）

当PostgreSQL可用时，系统会：
- 将报告数据同步到数据库
- 提供持久化存储
- 支持数据查询和统计

### 对象存储

生成的文档文件会自动上传到S3兼容对象存储：
- 支持大文件存储
- 提供签名URL下载
- 24小时有效期

---

## 部署指南

### 快速部署

系统提供两种部署方式：

#### 1. Docker 部署（推荐）

最简单快捷的部署方式，适合生产环境。

```bash
# 复制环境配置文件
cp .env.production.example .env.production
nano .env.production  # 配置环境变量

# 使用 Docker Compose 部署
chmod +x scripts/docker-deploy.sh
./scripts/docker-deploy.sh init
```

详细文档：[Docker 部署指南](QUICK_START.md#方案一docker-部署推荐最简单)

#### 2. 直接部署

适用于测试环境或需要精细控制的服务器。

```bash
# 使用自动化脚本部署
sudo chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh init
```

详细文档：[直接部署指南](QUICK_START.md#方案二直接部署推荐用于测试环境)

### 完整部署文档

- 📖 **[快速开始指南](QUICK_START.md)** - 5-10分钟快速部署
- 📘 **[完整部署文档](DEPLOYMENT.md)** - 详细的部署和运维指南
- 📗 **[系统管理文档](docs/ADMIN_SYSTEM.md)** - 管理后台使用指南

### 部署方案对比

| 特性 | Docker 部署 | 直接部署 |
|------|------------|---------|
| 难度 | ⭐ 简单 | ⭐⭐ 中等 |
| 环境隔离 | ✅ 完全隔离 | ❌ 需手动配置 |
| 迁移便捷性 | ✅ 高 | ❌ 低 |
| 资源占用 | ⭐⭐⭐ 较高 | ⭐⭐ 较低 |
| 适用场景 | 生产环境 | 测试/开发环境 |

---

## 故障排查

### 常见问题

1. **服务无法启动**
   ```bash
   # 查看 PM2 日志
   pm2 logs ai-review-system

   # Docker 查看日志
   docker compose logs -f
   ```

2. **数据库连接失败**
   - 检查 PostgreSQL 服务状态
   - 验证数据库配置是否正确
   - 检查防火墙设置

3. **AI 评审失败**
   - 确认 AI API 密钥配置正确
   - 检查网络连接
   - 查看后端日志

详细故障排查：[DEPLOYMENT.md](DEPLOYMENT.md#故障排查)

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 许可证

本项目采用 MIT 许可证。

---

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/your-repo/issues)
- 发送邮件至 support@example.com

## AI评审说明

### 评审专业

系统支持以下专业的AI评审：

| 专业 | 英文代码 |
|------|----------|
| 建筑 | architecture |
| 结构 | structure |
| 给排水 | plumbing |
| 电气 | electrical |
| 暖通 | hvac |
| 消防 | fire |
| 景观 | landscape |
| 室内 | interior |
| 造价 | cost |

### AI模型

- **模型**：doubao-seed-1-6-251015
- **超时时间**：60秒
- **温度**：0.7
- **思维链**：启用

### 评审内容

每个专业的评审包括：
1. **AI整体分析**：该专业的综合评价
2. **综合评分**：75-95分之间的评分
3. **评审意见**：
   - 问题描述
   - 规范依据
   - 严重程度（高/中/低）
   - 建议修改方案

## 错误处理

系统实现了完善的错误处理机制：

1. **数据库连接失败**：自动降级到临时存储
2. **AI评审失败**：使用模拟数据或默认评审
3. **对象存储失败**：生成文档失败但保留导出记录
4. **网络错误**：提供友好的错误提示

## 开发指南

### 添加新的评审专业

1. 在 `src/services/aiReviewService.ts` 中添加专业提示词
2. 在 `src/lib/tempStorage.ts` 中添加模拟数据
3. 在 `src/components/ProfessionSelector.tsx` 中添加专业选项

### 修改AI提示词

编辑 `src/services/aiReviewService.ts` 中的 `PROFESSION_PROMPTS` 对象。

### 自定义文档格式

修改 `src/lib/generateReviewReport.ts` 中的文档生成逻辑。

## 测试

### 运行测试

```bash
# 测试系统状态
curl http://localhost:5000/api/test/status

# 测试提交报告
curl -X POST -F "file=@test.pdf" -F 'professions=["architecture"]' http://localhost:5000/api/reports

# 测试触发评审
curl -X POST http://localhost:5000/api/reports/{id}/review
```

## 部署

### 构建项目

```bash
pnpm run build
```

### 启动生产服务

```bash
bash .cozeproj/scripts/deploy_run.sh
```

## 常见问题

### Q1: 数据库连接失败怎么办？

A: 系统会自动使用临时存储，不影响正常使用。如需启用数据库，请检查PostgreSQL服务是否运行，并确认环境变量配置正确。

### Q2: AI评审很慢怎么办？

A: AI评审通常需要15-30秒，这是正常现象。如果超过60秒，系统会使用降级方案。

### Q3: 导出的PDF格式为什么是Word文档？

A: 当前版本PDF和Excel格式实际生成的是Word文档，后续版本将支持真正的PDF和Excel导出。

### Q4: 临时存储的数据会丢失吗？

A: 是的，临时存储在服务重启后会丢失。如需持久化，请配置PostgreSQL数据库。

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系项目维护者。
