# Docker 部署操作指南

## 前提条件

你的云服务器已经配置好 Docker 和 Docker Compose，可以开始部署了。

---

## 第一步：上传代码到服务器

### 方式 1：使用 Git（推荐）

```bash
# 在服务器上执行
cd /opt
git clone <your-repo-url> ai-review-system
cd ai-review-system
```

### 方式 2：直接上传压缩包

```bash
# 在本地打包代码（在项目根目录执行）
tar -czf ai-review-system.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=backups \
  --exclude=logs \
  .

# 上传到服务器
scp ai-review-system.tar.gz user@your-server:/opt/

# 在服务器上解压
cd /opt
tar -xzf ai-review-system.tar.gz -C ai-review-system
cd ai-review-system
```

---

## 第二步：配置环境变量

这是最关键的一步，必须正确配置才能运行。

```bash
# 复制配置模板
cp .env.production.example .env.production

# 编辑配置文件
nano .env.production  # 或使用 vim .env.production
```

### 必须修改的配置项

请至少修改以下配置：

```env
# ==================
# 必须修改的项
# ==================

# 1. 数据库密码（使用强密码）
DB_PASSWORD=YourStrongPasswordHere123!

# 2. AI 服务配置（根据你使用的 AI 服务填写）
AI_API_KEY=your_actual_api_key_here
AI_API_URL=https://api.example.com/v1/chat

# 3. 安全密钥（非常重要！使用强随机字符串）
# 生成方法：openssl rand -base64 32
JWT_SECRET=your_very_long_random_jwt_secret_key_minimum_32_characters
SESSION_SECRET=another_random_session_secret_key
COOKIE_SECRET=another_random_cookie_secret_key

# 4. 应用 URL（替换为你的域名或服务器IP）
APP_URL=https://your-domain.com
```

### 可选修改的配置项

如果需要对象存储功能：

```env
# 对象存储配置（如使用阿里云OSS、腾讯云COS等）
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=cn-hangzhou
S3_BUCKET_NAME=your-bucket-name
```

如果暂时不需要对象存储，可以留空或注释掉。

### 生成强随机密钥的方法

```bash
# 生成 JWT_SECRET
openssl rand -base64 32

# 生成 SESSION_SECRET
openssl rand -base64 32

# 生成 COOKIE_SECRET
openssl rand -base64 32
```

---

## 第三步：准备必要的目录

```bash
# 创建必要的目录
mkdir -p backups
mkdir -p nginx/ssl
mkdir -p logs
```

### 如果需要配置 HTTPS（可选但推荐）

如果你有自己的域名和 SSL 证书：

```bash
# 将 SSL 证书文件放到 nginx/ssl 目录
# 文件结构：
# nginx/ssl/
#   ├── fullchain.pem    # 证书链文件
#   └── privkey.pem      # 私钥文件
```

---

## 第四步：部署应用

### 方法 1：使用自动化脚本（推荐）

```bash
# 赋予脚本执行权限
chmod +x scripts/docker-deploy.sh

# 执行初始化部署
./scripts/docker-deploy.sh init
```

这个脚本会自动：
- 检查 Docker 环境
- 检查环境配置文件
- 构建 Docker 镜像
- 启动所有服务（PostgreSQL + Web + Nginx）
- 初始化数据库表和示例数据

### 方法 2：手动部署

```bash
# 创建 .env 文件（Docker Compose 使用）
cp .env.production .env

# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看服务状态
docker compose ps
```

---

## 第五步：验证部署

### 1. 检查服务状态

```bash
# 查看所有容器状态
docker compose ps

# 应该看到三个容器都在运行：
# ai-review-db
# ai-review-web
# ai-review-nginx
```

### 2. 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f web
docker compose logs -f postgres
docker compose logs -f nginx
```

### 3. 访问应用

打开浏览器访问：

- **主页**: `http://your-server-ip` 或 `http://your-domain.com`
- **管理后台**: `http://your-server-ip/admin`

### 4. 检查数据库

```bash
# 进入 PostgreSQL 容器
docker compose exec postgres psql -U review_user -d report_review

# 查看数据库表
\dt

# 退出
\q
```

---

## 第六步：初始化系统

首次使用需要初始化管理员账户和系统配置。

### 1. 初始化管理员账户

访问 `http://your-server-ip/admin/init`

按照页面提示：
1. 输入用户名（建议使用 admin）
2. 输入密码（使用强密码）
3. 点击"初始化"按钮

### 2. 登录管理后台

访问 `http://your-server-ip/admin/login`

使用刚才创建的管理员账户登录。

### 3. 配置 AI 服务（如环境变量未配置）

在管理后台的"系统设置"中：
1. 导航到"AI 配置"
2. 输入 AI 服务的 API 密钥和 URL
3. 保存配置

### 4. 创建评审标准和模型

在管理后台的"评审配置"中：
1. 创建评审标准
2. 创建评审模型
3. 配置关键词库

---

## 常用管理命令

```bash
# 启动服务
docker compose up -d
# 或
./scripts/docker-deploy.sh start

# 停止服务
docker compose down
# 或
./scripts/docker-deploy.sh stop

# 重启服务
docker compose restart
# 或
./scripts/docker-deploy.sh restart

# 查看日志
docker compose logs -f
# 或
./scripts/docker-deploy.sh logs

# 查看服务状态
docker compose ps
# 或
./scripts/docker-deploy.sh status

# 备份数据
./scripts/docker-deploy.sh backup

# 更新服务
./scripts/docker-deploy.sh update

# 清理所有资源（慎用）
./scripts/docker-deploy.sh clean
```

---

## 常见问题

### 1. 端口冲突

如果 80 或 443 端口被占用：

编辑 `docker-compose.yml`，修改 Nginx 的端口映射：

```yaml
nginx:
  ports:
    - "8080:80"  # 改为 8080 端口
    - "8443:443"
```

然后重启服务：

```bash
docker compose down
docker compose up -d
```

### 2. 数据库连接失败

检查环境变量配置：

```bash
# 查看 .env 文件
cat .env.production

# 确保 DB_PASSWORD 等配置正确
```

### 3. 镜像构建失败

清理 Docker 缓存后重试：

```bash
docker system prune -a
docker compose build --no-cache
```

### 4. 容器无法启动

查看容器日志：

```bash
docker compose logs <service-name>
```

例如：

```bash
docker compose logs web
docker compose logs postgres
```

---

## 数据备份

### 自动备份

手动备份：

```bash
./scripts/docker-deploy.sh backup
```

备份文件会保存在 `backups/` 目录。

### 恢复数据

```bash
# 列出可用的备份
ls -la backups/

# 恢复指定的备份文件
./scripts/docker-deploy.sh restore backups/db_20240101_120000.sql
```

---

## 更新应用

当代码更新后：

```bash
# 拉取最新代码
git pull origin main

# 更新服务
./scripts/docker-deploy.sh update
```

---

## 监控和维护

### 查看容器资源使用

```bash
docker stats
```

### 查看磁盘使用

```bash
docker system df
```

### 清理未使用的资源

```bash
docker system prune -a
```

---

## 配置 HTTPS（推荐）

如果你有域名和 SSL 证书：

### 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt-get install -y certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书会保存在 /etc/letsencrypt/live/your-domain.com/
# 复制到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# 修改 nginx/conf.d/default.conf，取消 HTTPS 配置的注释
nano nginx/conf.d/default.conf

# 重启 Nginx
docker compose restart nginx
```

### 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# 添加自动续期 cron 任务
crontab -e
```

添加：

```
0 3 * * * certbot renew --quiet && docker compose restart nginx
```

---

## 安全建议

1. **修改所有默认密码**
2. **使用强随机密钥**
3. **启用 HTTPS**
4. **定期备份数据**
5. **定期更新系统和 Docker**
6. **限制数据库访问**（不要将 PostgreSQL 的 5432 端口暴露到外网）
7. **配置防火墙规则**

---

## 获取帮助

如果遇到问题：

1. 查看日志：`docker compose logs -f`
2. 检查配置：`cat .env.production`
3. 查看容器状态：`docker compose ps`
4. 参考：[DEPLOYMENT.md](DEPLOYMENT.md) - 完整部署文档
5. 参考：[CHECKLIST.md](CHECKLIST.md) - 部署检查清单

---

祝部署顺利！🚀
