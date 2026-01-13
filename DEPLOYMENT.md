# AI评审系统云服务器部署指南

## 一、服务器要求

### 1. 硬件要求
- **CPU**: 2核心及以上
- **内存**: 4GB及以上（推荐8GB）
- **磁盘**: 20GB及以上（SSD推荐）

### 2. 软件环境
- **操作系统**: Ubuntu 20.04 / 22.04 LTS 或 CentOS 7+
- **Node.js**: 18.17.0 或更高版本（推荐20.x）
- **pnpm**: 8.x 或更高版本
- **PostgreSQL**: 14 或更高版本
- **Nginx**: 1.18+（反向代理）
- **Git**: 用于代码拉取

## 二、环境准备

### 1. 安装 Node.js 和 pnpm

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 验证安装
node -v  # 应显示 v20.x.x
pnpm -v  # 应显示 8.x.x
```

### 2. 安装 PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
```

在 PostgreSQL 命令行中执行：

```sql
-- 创建数据库
CREATE DATABASE report_review;

-- 创建用户（请替换为你的密码）
CREATE USER review_user WITH PASSWORD 'your_secure_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE report_review TO review_user;
\q
```

### 3. 安装 Nginx

```bash
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 三、部署步骤

### 方案一：直接部署（推荐用于测试环境）

#### 1. 创建部署目录

```bash
sudo mkdir -p /var/www/ai-review-system
sudo chown -R $USER:$USER /var/www/ai-review-system
cd /var/www/ai-review-system
```

#### 2. 上传代码

```bash
# 方式1: 使用 Git（推荐）
git clone <your-repo-url> .

# 方式2: 直接上传压缩包
# 在本地打包代码：tar -czf ai-review-system.tar.gz .
# 上传到服务器后解压
# tar -xzf ai-review-system.tar.gz
```

#### 3. 安装依赖

```bash
pnpm install
```

#### 4. 配置环境变量

创建生产环境配置文件：

```bash
cp .env.local .env.production
nano .env.production
```

配置内容示例：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=report_review
DB_USER=review_user
DB_PASSWORD=your_secure_password

# 对象存储配置（根据实际情况填写）
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=cn-north-1
S3_BUCKET_NAME=your-bucket-name

# AI服务配置（根据实际情况填写）
AI_API_KEY=your_ai_api_key
AI_API_URL=https://api.example.com

# Node.js 环境变量
NODE_ENV=production
PORT=3000
```

#### 5. 初始化数据库

```bash
# 运行数据库初始化脚本
psql -U review_user -d report_review -f database/schema.sql

# 如果有示例数据
psql -U review_user -d report_review -f database/sample_standards_data.sql
```

#### 6. 构建项目

```bash
pnpm run build
```

#### 7. 启动应用（使用 PM2 管理进程）

```bash
# 全局安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "ai-review-system" -- start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

#### 8. 配置 Nginx 反向代理

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/ai-review-system
```

配置内容：

```nginx
upstream ai_review_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name 14.103.72.48;  # 替换为你的域名或服务器IP

    client_max_body_size 100M;

    location / {
        proxy_pass http://ai_review_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/ai-review-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 9. 配置 HTTPS（可选但强烈推荐）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 自动配置 HTTPS（如果有域名）
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 方案二：使用 Docker 部署（推荐用于生产环境）

#### 1. 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt-get install -y docker-compose-plugin

# 重新登录以应用用户组更改
```

#### 2. 使用 Docker Compose 部署

使用提供的 `docker-compose.yml` 文件（见下文）：

```bash
# 构建并启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f

# 初始化数据库
docker compose exec web pnpm run init-db
```

## 四、常用管理命令

### PM2 进程管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs ai-review-system

# 重启应用
pm2 restart ai-review-system

# 停止应用
pm2 stop ai-review-system

# 删除应用
pm2 delete ai-review-system
```

### 数据库备份

```bash
# 备份
pg_dump -U review_user report_review > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复
psql -U review_user report_review < backup_20240101_120000.sql
```

### 日志查看

```bash
# 应用日志
tail -f /var/www/ai-review-system/logs/combined.log

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 五、常见问题排查

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :80

# 杀死进程
sudo kill -9 <PID>
```

### 2. 数据库连接失败

检查数据库服务状态：

```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# 检查防火墙
sudo ufw allow 5432
```

### 3. 权限问题

```bash
# 修改文件权限
sudo chown -R $USER:$USER /var/www/ai-review-system
chmod -R 755 /var/www/ai-review-system
```

### 4. 内存不足

增加 Swap 空间：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 六、性能优化建议

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 配置静态缓存

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. 数据库连接池配置

在 `src/lib/db.ts` 中优化连接池参数：

```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,  // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 4. 启用 Nginx 缓存

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 10m;
    proxy_pass http://ai_review_backend;
    ...
}
```

## 七、安全加固

### 1. 配置防火墙

```bash
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 5432   # 数据库端口仅本地访问
```

### 2. 限制数据库远程访问

编辑 `/etc/postgresql/14/main/pg_hba.conf`：

```conf
# 只允许本地连接
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

重启数据库：

```bash
sudo systemctl restart postgresql
```

### 3. 定期更新

```bash
# 系统更新
sudo apt-get update && sudo apt-get upgrade -y

# 依赖更新
cd /var/www/ai-review-system
pnpm update
```

## 八、监控和日志

### 1. 安装监控工具

```bash
# 安装 htop
sudo apt-get install -y htop

# 安装 iotop
sudo apt-get install -y iotop
```

### 2. 配置日志轮转

创建 `/etc/logrotate.d/ai-review-system`：

```
/var/www/ai-review-system/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload ai-review-system
    endscript
}
```

## 九、备份策略

### 自动备份脚本

创建 `/var/scripts/backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/ai-review-system"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U review_user report_review > $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/ai-review-system/public/uploads

# 删除30天前的备份
find $BACKUP_DIR -type f -mtime +30 -delete
```

添加到 crontab：

```bash
chmod +x /var/scripts/backup.sh

# 每天凌晨2点执行备份
crontab -e
```

添加：

```
0 2 * * * /var/scripts/backup.sh
```

## 十、快速部署检查清单

- [ ] 服务器硬件和系统准备就绪
- [ ] Node.js 和 pnpm 已安装
- [ ] PostgreSQL 已安装并配置
- [ ] 代码已上传到服务器
- [ ] 环境变量已正确配置
- [ ] 数据库已初始化
- [ ] 项目构建成功
- [ ] 应用已启动（PM2）
- [ ] Nginx 已配置并启动
- [ ] HTTPS 证书已配置（生产环境）
- [ ] 防火墙已配置
- [ ] 备份脚本已设置
- [ ] 监控和日志已配置

## 十一、联系支持

如遇到部署问题，请提供以下信息：

1. 服务器操作系统和版本
2. Node.js 和 pnpm 版本
3. PostgreSQL 版本
4. 错误日志（PM2 日志、Nginx 日志）
5. 环境变量配置（脱敏后）

---

**祝部署顺利！**
