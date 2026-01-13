# GitHub Actions 自动部署配置指南

本文档指导你如何配置 GitHub Actions 实现代码推送后自动部署到云服务器。

---

## 方案概述

我们将使用 GitHub Actions 工作流实现自动部署：

1. 开发者推送代码到 GitHub main 分支
2. GitHub Actions 自动触发构建和部署流程
3. 自动打包代码并上传到服务器
4. 服务器自动构建 Docker 镜像并重启服务

---

## 前置条件

- ✅ 云服务器已购买（IP: 14.103.72.48）
- ✅ 服务器 root 密码或 SSH 密钥
- ✅ GitHub 仓库权限
- ✅ 服务器已安装 Docker（如果未安装，初始化脚本会自动安装）

---

## 配置步骤

### 第一步：在服务器上安装基础环境

连接到你的云服务器：

```bash
# 使用密码登录（替换 user 为你的用户名，通常是 root）
ssh user@14.103.72.48

# 或者使用 SSH 密钥登录
ssh -i /path/to/your/key user@14.103.72.48
```

下载并运行初始化脚本：

```bash
# 下载初始化脚本
curl -o server-init.sh https://raw.githubusercontent.com/emale1963/pingshentong/main/scripts/server-init.sh
chmod +x server-init.sh

# 运行初始化脚本
./server-init.sh
```

初始化脚本会自动：
- 更新系统
- 安装 Docker 和 Docker Compose
- 克隆代码仓库
- 配置环境变量
- 创建必要的目录

---

### 第二步：配置 GitHub Secrets

为了让 GitHub Actions 能够连接到你的服务器，需要配置 SSH 密钥。

#### 2.1 生成 SSH 密钥对

**在你的本地电脑上**执行（不是服务器）：

```bash
# 生成 SSH 密钥对（使用 ed25519 算法）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# 查看公钥内容
cat ~/.ssh/github_actions_deploy.pub
```

你会得到类似这样的公钥内容：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEXAMPLE... github-actions-deploy
```

#### 2.2 将公钥添加到服务器

**方式 1：使用 ssh-copy-id（推荐）**

```bash
# 复制公钥到服务器（替换 user 为你的服务器用户名）
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@14.103.72.48
```

**方式 2：手动添加**

```bash
# 连接到服务器
ssh user@14.103.72.48

# 将公钥内容添加到 authorized_keys
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEXAMPLE... github-actions-deploy" >> ~/.ssh/authorized_keys

# 设置正确的权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

#### 2.3 测试 SSH 连接

```bash
# 使用新生成的密钥测试连接（应该能免密登录）
ssh -i ~/.ssh/github_actions_deploy user@14.103.72.48 "echo 'SSH 连接成功！'"
```

如果看到 "SSH 连接成功！" 说明配置正确。

#### 2.4 在 GitHub 仓库中配置 Secrets

1. 打开 GitHub 仓库页面：https://github.com/emale1963/pingshentong
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加以下三个密钥：

| Secret 名称 | 说明 | 值 |
|------------|------|-----|
| `SERVER_HOST` | 服务器 IP 地址 | `14.103.72.48` |
| `SERVER_USER` | 服务器用户名 | 你的服务器用户名（通常是 `root`） |
| `SSH_PRIVATE_KEY` | SSH 私钥内容 | 复制私钥文件的完整内容 |

**获取私钥内容：**

```bash
# 复制私钥内容（包含 BEGIN 和 END 行）
cat ~/.ssh/github_actions_deploy
```

整个私钥内容应该类似：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...（很多行内容）...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ 重要提示：**
- 确保复制了完整的私钥内容（包括 BEGIN 和 END 行）
- 不要添加额外的空行或注释
- 私钥内容应该是一个完整的文本块

---

### 第三步：配置服务器环境变量

连接到服务器，编辑环境变量文件：

```bash
cd /opt/ai-review-system
nano .env.production
```

**必须修改的配置项：**

```env
# 数据库密码（使用强密码）
DB_PASSWORD=YourStrongPasswordHere123!

# AI 服务配置（根据你使用的 AI 服务填写）
AI_API_KEY=your_actual_api_key_here
AI_API_URL=https://api.example.com/v1/chat

# 安全密钥（非常重要！）
JWT_SECRET=your_very_long_random_jwt_secret_key_minimum_32_characters
SESSION_SECRET=another_random_session_secret_key
COOKIE_SECRET=another_random_cookie_secret_key
```

**生成随机密钥的方法：**

```bash
# 生成 JWT_SECRET
openssl rand -base64 32

# 生成 SESSION_SECRET
openssl rand -base64 32

# 生成 COOKIE_SECRET
openssl rand -base64 32
```

保存后，复制到 Docker 使用的配置文件：

```bash
cp .env.production .env
```

---

### 第四步：首次手动部署

首次部署建议手动执行，确保一切正常：

```bash
# 连接到服务器
ssh user@14.103.72.48

# 进入应用目录
cd /opt/ai-review-system

# 执行部署脚本
./scripts/server-deploy.sh
```

脚本会自动：
- 停止现有服务
- 备份旧版本
- 构建 Docker 镜像
- 启动所有服务
- 检查服务状态

**验证部署：**

```bash
# 检查服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 在浏览器访问
# http://14.103.72.48
```

---

### 第五步：测试自动部署

首次手动部署成功后，测试 GitHub Actions 自动部署：

1. **在本地修改代码**：
   ```bash
   # 修改一个文件，例如更新版本号
   echo "1.0.0" > VERSION
   ```

2. **提交并推送到 GitHub**：
   ```bash
   git add .
   git commit -m "test: 测试自动部署"
   git push origin main
   ```

3. **在 GitHub 查看部署状态**：
   - 打开仓库的 **Actions** 标签页
   - 查看最新的 workflow 运行状态
   - 点击查看详细日志

4. **验证服务器上的更新**：
   ```bash
   # 连接到服务器
   ssh user@14.103.72.48

   # 查看最新日志
   cd /opt/ai-review-system
   docker compose logs --tail=50
   ```

---

## 故障排查

### 问题 1：SSH 连接失败

**错误信息：**
```
Permission denied (publickey)
```

**解决方案：**
1. 检查私钥是否正确复制到 GitHub Secrets
2. 确认公钥已添加到服务器的 `~/.ssh/authorized_keys` 文件
3. 检查服务器 SSH 配置：`cat /etc/ssh/sshd_config`
4. 确保 `PubkeyAuthentication yes` 已启用

### 问题 2：Docker 构建失败

**错误信息：**
```
ERROR: failed to build: ...
```

**解决方案：**
1. 检查服务器 Docker 是否正常运行：`docker ps`
2. 查看构建日志：`docker compose build`
3. 检查环境变量配置：`cat .env`

### 问题 3：服务启动失败

**错误信息：**
```
Container exited with code 1
```

**解决方案：**
1. 查看容器日志：`docker compose logs <service-name>`
2. 检查端口占用：`netstat -tuln | grep 3000`
3. 检查磁盘空间：`df -h`

### 问题 4：无法访问应用

**检查清单：**
1. 防火墙是否开放 80 端口：`ufw status`
2. Nginx 是否正常运行：`systemctl status nginx`
3. Docker 服务是否运行：`docker compose ps`
4. 查看浏览器控制台是否有错误

---

## 常用命令

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

# 更新代码并重新部署
git pull && ./scripts/server-deploy.sh
```

### 在本地

```bash
# 推送代码触发自动部署
git add .
git commit -m "update: 更新功能"
git push origin main
```

---

## 安全建议

1. **定期更新密钥**：每 3-6 个月更换一次 SSH 密钥
2. **限制 SSH 访问**：只允许 GitHub Actions 的特定 IP 访问
3. **使用强密码**：数据库密码和管理员密码要足够复杂
4. **定期备份**：使用备份脚本定期备份数据库
5. **监控日志**：定期检查服务器日志，发现异常及时处理

---

## 下一步

完成配置后，你可以：

1. ✅ 修改代码并推送到 GitHub
2. ✅ GitHub Actions 自动构建并部署
3. ✅ 访问 http://14.103.72.48 查看更新

---

## 技术支持

如果遇到问题，请检查：
1. GitHub Actions 日志
2. 服务器 Docker 日志
3. 应用日志文件

祝部署顺利！
