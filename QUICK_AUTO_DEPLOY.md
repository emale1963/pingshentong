# 🚀 快速自动部署指南

本指南帮助你快速将 AI 评审系统部署到云服务器（14.103.72.48）。

---

## ⚡ 快速开始（5 分钟完成）

### 方式一：GitHub Actions 自动部署（推荐）

**优点：** 推送代码后自动部署，无需手动操作

#### 步骤 1：在服务器上初始化（1 分钟）

```bash
# SSH 连接到服务器
ssh root@14.103.72.48

# 下载并运行初始化脚本
curl -o server-init.sh https://raw.githubusercontent.com/emale1963/pingshentong/main/scripts/server-init.sh
chmod +x server-init.sh
./server-init.sh
```

初始化脚本会自动安装 Docker 并配置环境。

#### 步骤 2：配置 GitHub Secrets（2 分钟）

1. **生成 SSH 密钥**（在本地电脑执行）：
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
   cat ~/.ssh/github_actions_deploy.pub
   ```

2. **添加公钥到服务器**：
   ```bash
   ssh-copy-id -i ~/.ssh/github_actions_deploy.pub root@14.103.72.48
   ```

3. **在 GitHub 仓库配置 Secrets**：
   - 打开：https://github.com/emale1963/pingshentong/settings/secrets/actions
   - 添加以下 3 个 Secrets：

     | Name | Value |
     |------|-------|
     | `SERVER_HOST` | `14.103.72.48` |
     | `SERVER_USER` | `root` |
     | `SSH_PRIVATE_KEY` | 复制私钥内容（`cat ~/.ssh/github_actions_deploy`）|

#### 步骤 3：配置环境变量（1 分钟）

```bash
# 连接到服务器
ssh root@14.103.72.48

# 编辑环境变量
cd /opt/ai-review-system
nano .env.production
```

**必须修改的配置：**
```env
DB_PASSWORD=你的数据库密码
AI_API_KEY=你的AI服务密钥
AI_API_URL=你的AI服务地址
JWT_SECRET=随机生成32位密钥
SESSION_SECRET=随机生成32位密钥
COOKIE_SECRET=随机生成32位密钥
```

生成随机密钥：`openssl rand -base64 32`

保存后执行：
```bash
cp .env.production .env
```

#### 步骤 4：首次部署（1 分钟）

```bash
cd /opt/ai-review-system
./scripts/server-deploy.sh
```

部署完成后访问：http://14.103.72.48

#### 步骤 5：测试自动部署

修改任意文件并推送到 GitHub：
```bash
git add .
git commit -m "test: 测试自动部署"
git push origin main
```

GitHub 会自动触发部署流程，几分钟后访问服务器即可看到更新。

---

### 方式二：手动部署（适用于单次部署）

如果不想配置 GitHub Actions，可以直接在服务器手动部署：

```bash
# 1. SSH 连接到服务器
ssh root@14.103.72.48

# 2. 克隆代码
git clone https://github.com/emale1963/pingshentong.git /opt/ai-review-system
cd /opt/ai-review-system

# 3. 配置环境变量
cp .env.production.example .env.production
nano .env.production  # 编辑配置
cp .env.production .env

# 4. 部署
./scripts/quick-deploy.sh
```

---

## 📋 环境变量配置说明

### 必须配置的变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DB_PASSWORD` | PostgreSQL 数据库密码 | `MySecurePassword123!` |
| `AI_API_KEY` | AI 服务 API 密钥 | `sk-xxx...` |
| `AI_API_URL` | AI 服务地址 | `https://api.example.com/v1/chat` |
| `JWT_SECRET` | JWT 签名密钥（32位以上） | `a1b2c3d4e5f6g7h8i9j0...` |
| `SESSION_SECRET` | Session 加密密钥（32位以上） | `z9y8x7w6v5u4t3s2r1q0...` |
| `COOKIE_SECRET` | Cookie 加密密钥（32位以上） | `m1n2o3p4q5r6s7t8u9v0...` |

### 可选配置

如果需要对象存储功能，可以配置：
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET_NAME`

---

## 🔧 常用命令

### 在服务器上

```bash
# 查看服务状态
cd /opt/ai-review-system && docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 手动更新部署
git pull && ./scripts/server-deploy.sh
```

### GitHub Actions

- 查看部署状态：https://github.com/emale1963/pingshentong/actions
- 手动触发部署：Actions → Auto Deploy → Run workflow

---

## ✅ 验证部署

部署完成后，执行以下检查：

1. **检查服务状态**
   ```bash
   docker compose ps
   ```
   应该看到 3 个容器都在运行：
   - ai-review-db
   - ai-review-web
   - ai-review-nginx

2. **访问应用**
   - 主页：http://14.103.72.48
   - 管理后台：http://14.103.72.48/admin

3. **首次使用**
   - 访问 http://14.103.72.48/admin/init 初始化管理员账户
   - 登录管理后台配置 AI 服务

---

## 🐛 故障排查

### 问题 1：容器启动失败

```bash
# 查看日志
docker compose logs web
```

### 问题 2：无法访问网站

```bash
# 检查防火墙
ufw status

# 开放端口
ufw allow 80/tcp
ufw allow 443/tcp
```

### 问题 3：GitHub Actions 部署失败

1. 检查 GitHub Secrets 配置是否正确
2. 查看 Actions 日志中的错误信息
3. 确认服务器 SSH 连接正常

---

## 📚 详细文档

- [完整自动部署指南](AUTO_DEPLOY_GUIDE.md) - 详细的配置步骤和故障排查
- [Docker 部署指南](DOCKER_DEPLOY_GUIDE.md) - Docker 相关配置
- [部署检查清单](CHECKLIST.md) - 部署前检查项

---

## 🎉 完成

恭喜！AI 评审系统已成功部署到云服务器。

**访问地址：** http://14.103.72.48

**管理后台：** http://14.103.72.48/admin

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 [AUTO_DEPLOY_GUIDE.md](AUTO_DEPLOY_GUIDE.md) 的故障排查部分
2. 检查 GitHub Actions 日志
3. 查看服务器日志：`docker compose logs -f`
