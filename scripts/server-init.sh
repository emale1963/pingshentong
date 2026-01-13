#!/bin/bash

# AI 评审系统 - 服务器初始化脚本
# 用途：在云服务器上首次部署时初始化环境

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# 配置变量
APP_DIR="/opt/ai-review-system"
GIT_REPO="https://github.com/emale1963/pingshentong.git"

print_step "AI 评审系统 - 服务器初始化"
echo ""
print_info "此脚本将在服务器上初始化部署环境"
print_info "服务器：14.103.72.48"
echo ""
read -p "是否继续？(y/n): " confirm
if [ "$confirm" != "y" ]; then
    print_info "已取消"
    exit 0
fi

# 更新系统
print_step "更新系统"
apt-get update && apt-get upgrade -y
print_success "系统更新完成"

# 安装必要软件
print_step "安装必要软件"
apt-get install -y \
    git \
    curl \
    wget \
    nginx \
    ufw \
    jq
print_success "必要软件安装完成"

# 安装 Docker
print_step "安装 Docker"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
    print_success "Docker 安装完成"
else
    print_success "Docker 已安装"
fi

# 检查 Docker Compose
print_step "检查 Docker Compose"
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose 不可用，请重新安装 Docker"
    exit 1
fi
print_success "Docker Compose 可用"

# 配置防火墙
print_step "配置防火墙"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
print_success "防火墙配置完成"

# 克隆代码
print_step "克隆代码仓库"
if [ -d "$APP_DIR" ]; then
    print_warning "应用目录已存在，拉取最新代码"
    cd $APP_DIR
    git pull
else
    print_info "克隆代码仓库"
    mkdir -p $APP_DIR
    cd $APP_DIR
    git clone $GIT_REPO .
fi
print_success "代码拉取完成"

# 配置环境变量
print_step "配置环境变量"
if [ ! -f ".env.production" ]; then
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        print_info "已创建 .env.production 文件"
    else
        print_error "未找到 .env.production.example 文件"
        exit 1
    fi
fi

print_warning "请编辑 .env.production 文件并配置必要的参数"
print_info "必须配置的参数："
echo "  - DB_PASSWORD (数据库密码)"
echo "  - AI_API_KEY (AI服务密钥)"
echo "  - AI_API_URL (AI服务地址)"
echo "  - JWT_SECRET (JWT密钥)"
echo "  - SESSION_SECRET (会话密钥)"
echo "  - COOKIE_SECRET (Cookie密钥)"

read -p "是否现在编辑配置文件? (y/n): " edit_now
if [ "$edit_now" = "y" ]; then
    ${EDITOR:-nano} .env.production
else
    print_info "稍后手动编辑配置文件: nano .env.production"
fi

# 生成强随机密钥（可选）
print_info "需要生成随机密钥吗？(y/n)"
print_info "这将自动生成 JWT_SECRET、SESSION_SECRET 和 COOKIE_SECRET"
read -p "生成密钥？(y/n): " generate_keys
if [ "$generate_keys" = "y" ]; then
    print_info "生成随机密钥..."
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    COOKIE_SECRET=$(openssl rand -base64 32)

    # 更新配置文件
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.production
    sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env.production
    sed -i "s/^COOKIE_SECRET=.*/COOKIE_SECRET=$COOKIE_SECRET/" .env.production

    print_success "密钥已生成并保存"
fi

# 创建必要的目录
print_step "创建必要的目录"
mkdir -p backups nginx/ssl logs
print_success "目录创建完成"

# 创建 .env 文件供 Docker Compose 使用
cp .env.production .env

# 赋予脚本执行权限
chmod +x scripts/*.sh

# 初始化部署
print_step "初始化部署"
read -p "是否现在开始部署应用？(y/n): " deploy_now
if [ "$deploy_now" = "y" ]; then
    ./scripts/server-deploy.sh
else
    print_info "稍后执行 ./scripts/server-deploy.sh 开始部署"
fi

# 配置开机自启动
print_step "配置开机自启动"
cat > /etc/systemd/system/ai-review.service <<'EOF'
[Unit]
Description=AI Review System
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/ai-review-system
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ai-review.service
print_success "开机自启动配置完成"

# 显示完成信息
print_step "初始化完成！"

print_success "服务器初始化完成！"
echo ""
echo -e "${GREEN}应用目录：${NC} $APP_DIR"
echo ""
echo -e "${YELLOW}后续步骤：${NC}"
echo "  1. 编辑 .env.production 文件配置环境变量"
echo "  2. 执行部署脚本: cd $APP_DIR && ./scripts/server-deploy.sh"
echo "  3. 访问应用: http://14.103.72.48"
echo ""
echo -e "${GREEN}管理命令：${NC}"
echo "  查看日志:    cd $APP_DIR && docker compose logs -f"
echo "  重启服务:    cd $APP_DIR && docker compose restart"
echo "  停止服务:    cd $APP_DIR && docker compose down"
echo "  更新代码:    cd $APP_DIR && git pull && ./scripts/server-deploy.sh"
echo ""
