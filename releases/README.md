# AI 评审系统 - 代码包下载说明

## 压缩包信息

**文件名**: `ai-review-system_20260109_143008.tar.gz`  
**大小**: 311 KB  
**位置**: `./releases/` 目录

## 打包内容

此压缩包包含完整的 AI 评审系统源代码，包括：

### 已包含的内容
- ✅ 完整的 Next.js 源代码
- ✅ 数据库脚本（schema.sql, sample_standards_data.sql）
- ✅ Docker 配置文件（Dockerfile, docker-compose.yml）
- ✅ Nginx 配置文件
- ✅ 自动化部署脚本（scripts/docker-deploy.sh, scripts/quick-deploy.sh）
- ✅ 环境配置模板（.env.production.example）
- ✅ 完整的部署文档（DEPLOYMENT.md, DOCKER_DEPLOY_GUIDE.md）
- ✅ package.json（依赖配置）

### 已排除的内容
- ❌ node_modules（依赖包，需要在服务器重新安装）
- ❌ .next（构建产物，需要在服务器重新构建）
- ❌ .git（Git 仓库信息）
- ❌ backups（备份文件）
- ❌ logs（日志文件）
- ❌ .env.production（包含敏感配置信息）
- ❌ 其他临时和缓存文件

## 下载方式

### 方式 1: 直接下载（如果平台支持）

在文件管理器中找到 `releases/ai-review-system_20260109_143008.tar.gz` 文件并下载。

### 方式 2: 使用 SCP 命令下载

```bash
# 从服务器下载到本地
scp username@your-server:/path/to/project/releases/ai-review-system_20260109_143008.tar.gz ./
```

### 方式 3: 使用 SFTP 客户端

使用 FileZilla、WinSCP 等工具连接服务器，找到文件并下载。

---

## 部署到服务器

### 步骤 1: 上传压缩包到服务器

```bash
# 使用 SCP 上传
scp ai-review-system_20260109_143008.tar.gz user@14.103.72.48:/opt/

# 或使用 SFTP 客户端上传
```

### 步骤 2: 在服务器上解压

```bash
# 连接到服务器
ssh user@14.103.72.48

# 创建项目目录
cd /opt
mkdir -p ai-review-system
cd ai-review-system

# 解压文件
tar -xzf /opt/ai-review-system_20260109_143008.tar.gz

# 或如果压缩包直接在目录中
tar -xzf ai-review-system_20260109_143008.tar.gz
```

### 步骤 3: 配置环境变量

```bash
# 复制配置模板
cp .env.production.example .env.production

# 编辑配置文件
nano .env.production
```

**必须修改的配置项：**

```env
DB_PASSWORD=YourStrongPassword123!
AI_API_KEY=your_api_key
AI_API_URL=https://api.example.com/v1/chat
JWT_SECRET=your_32_character_random_secret
SESSION_SECRET=your_session_secret
COOKIE_SECRET=your_cookie_secret
```

### 步骤 4: 执行快速部署

```bash
# 赋予脚本执行权限
chmod +x scripts/quick-deploy.sh

# 执行快速部署
./scripts/quick-deploy.sh
```

### 步骤 5: 访问应用

部署成功后，在浏览器中访问：
- 主页: `http://14.103.72.48`
- 管理后台: `http://14.103.72.48/admin`

---

## 重新打包代码

如果需要重新打包代码，执行：

```bash
# 执行打包脚本
./scripts/package.sh

# 新的压缩包会生成在 releases/ 目录
```

---

## 常见问题

### 1. 解压后没有 scripts 目录

确保解压时使用了正确的命令：

```bash
# ✅ 正确：解压到当前目录
tar -xzf ai-review-system_*.tar.gz

# ❌ 错误：不要使用 -C 参数指定不同的目录
tar -xzf ai-review-system_*.tar.gz -C /other/path
```

### 2. 找不到 package.json

确保在项目根目录执行部署：

```bash
# ✅ 正确：在项目目录中
cd /opt/ai-review-system
ls package.json  # 应该能看到这个文件

# 执行部署
./scripts/quick-deploy.sh
```

### 3. 部署脚本没有执行权限

```bash
# 赋予执行权限
chmod +x scripts/quick-deploy.sh
chmod +x scripts/docker-deploy.sh
chmod +x scripts/package.sh
```

### 4. 部署失败提示找不到 .env.production

```bash
# 确保复制了配置模板
cp .env.production.example .env.production

# 检查文件是否存在
ls .env.production
```

---

## 快速参考

```bash
# 1. 打包代码
./scripts/package.sh

# 2. 上传到服务器
scp releases/ai-review-system_*.tar.gz user@14.103.72.48:/opt/

# 3. 连接服务器
ssh user@14.103.72.48

# 4. 解压并部署
cd /opt
mkdir -p ai-review-system
cd ai-review-system
tar -xzf /opt/ai-review-system_*.tar.gz
cp .env.production.example .env.production
nano .env.production  # 配置环境变量
chmod +x scripts/quick-deploy.sh
./scripts/quick-deploy.sh
```

---

## 需要帮助？

如遇到问题，请参考：
- [DOCKER_DEPLOY_GUIDE.md](DOCKER_DEPLOY_GUIDE.md) - Docker 部署详细指南
- [DEPLOYMENT.md](DEPLOYMENT.md) - 完整部署文档
- [CHECKLIST.md](CHECKLIST.md) - 部署前检查清单
