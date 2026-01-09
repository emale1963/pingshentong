# AI评审系统 - 快速开始指南

## 方案一：Docker 部署（推荐，最简单）

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

### 5分钟快速部署

```bash
# 1. 复制并配置环境变量文件
cp .env.production.example .env.production
nano .env.production  # 编辑配置，至少设置数据库密码和 AI API 密钥

# 2. 赋予脚本执行权限
chmod +x scripts/docker-deploy.sh

# 3. 初始化部署（会自动构建并启动所有服务）
./scripts/docker-deploy.sh init

# 4. 查看日志确认服务正常启动
docker compose logs -f
```

### 常用命令

```bash
# 启动服务
./scripts/docker-deploy.sh start

# 停止服务
./scripts/docker-deploy.sh stop

# 重启服务
./scripts/docker-deploy.sh restart

# 查看日志
./scripts/docker-deploy.sh logs

# 备份数据
./scripts/docker-deploy.sh backup

# 查看服务状态
./scripts/docker-deploy.sh status
```

### 访问应用

部署成功后，访问：
- 应用主页: http://localhost
- 管理后台: http://localhost/admin

---

## 方案二：直接部署（推荐用于测试环境）

### 前置要求
- Ubuntu 20.04+ / CentOS 7+
- Node.js 18+ / pnpm 8+
- PostgreSQL 14+
- Nginx

### 10分钟快速部署

```bash
# 1. 安装系统依赖
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib nginx
npm install -g pnpm

# 2. 安装 PM2 进程管理器
npm install -g pm2

# 3. 创建部署目录
sudo mkdir -p /var/www/ai-review-system
sudo chown -R $USER:$USER /var/www/ai-review-system
cd /var/www/ai-review-system

# 4. 上传代码（选择一种方式）
# 方式A: 使用 Git
git clone <your-repo-url> .

# 方式B: 直接上传压缩包后解压
# tar -xzf ai-review-system.tar.gz

# 5. 配置环境变量
cp .env.production.example .env.production
nano .env.production  # 根据实际情况修改配置

# 6. 安装依赖并构建
pnpm install
pnpm run build

# 7. 初始化数据库
sudo -u postgres psql
# 在 psql 中执行:
# CREATE DATABASE report_review;
# CREATE USER review_user WITH PASSWORD 'your_password';
# GRANT ALL PRIVILEGES ON DATABASE report_review TO review_user;
# \q

psql -U review_user -d report_review -f database/schema.sql
psql -U review_user -d report_review -f database/sample_standards_data.sql

# 8. 使用自动化部署脚本（推荐）
sudo chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh init

# 或者手动启动
pm2 start npm --name "ai-review-system" -- start
pm2 save
pm2 startup

# 9. 配置 Nginx
sudo cp nginx/conf.d/default.conf /etc/nginx/sites-available/ai-review-system
sudo ln -s /etc/nginx/sites-available/ai-review-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 访问应用

部署成功后，访问：
- 应用主页: http://服务器IP
- 管理后台: http://服务器IP/admin

---

## 首次使用

### 1. 初始化管理员账户

访问 `http://your-domain.com/admin/init`，按照页面提示初始化管理员账户。

### 2. 登录管理后台

使用创建的管理员账户登录：`http://your-domain.com/admin/login`

### 3. 配置 AI 服务和对象存储

在管理后台的"系统设置"中配置：
- AI 服务 API 密钥和 URL
- 对象存储（S3）的访问凭证
- 其他必要的配置项

### 4. 创建评审标准和模型

在管理后台的"评审配置"中创建：
- 评审标准
- 评审模型
- 关键词库

### 5. 开始使用

上传图纸或文件，系统将自动进行 AI 评审。

---

## 环境变量配置说明

### 必须配置的项

```env
# 数据库
DB_PASSWORD=your_secure_password

# AI 服务
AI_API_KEY=your_ai_api_key
AI_API_URL=https://api.example.com

# 安全密钥（使用强随机字符串）
JWT_SECRET=your_very_long_random_jwt_secret_key
SESSION_SECRET=your_session_secret_key
COOKIE_SECRET=your_cookie_secret_key
```

### 可选配置项

```env
# 对象存储（如果需要文件上传功能）
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket
```

---

## 故障排查

### 服务无法启动

```bash
# 查看日志
pm2 logs ai-review-system

# Docker 部署查看日志
docker compose logs -f
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 测试连接
psql -U review_user -d report_review -h localhost
```

### 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :80
```

---

## 下一步

- 阅读完整部署文档: [DEPLOYMENT.md](DEPLOYMENT.md)
- 查看系统管理文档: [docs/ADMIN_SYSTEM.md](docs/ADMIN_SYSTEM.md)
- 了解功能特性: [README.md](README.md)

---

## 获取帮助

如遇到问题，请检查：
1. 系统日志和应用日志
2. 环境变量配置是否正确
3. 数据库服务是否正常
4. 网络连接和防火墙设置

祝使用愉快！
