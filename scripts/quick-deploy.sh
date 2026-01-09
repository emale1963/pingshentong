#!/bin/bash

# AI 评审系统 - 快速部署脚本
# 用途：在已配置好 Docker 的服务器上一键部署

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

# 检查 Docker
print_step "检查 Docker 环境"
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

print_success "Docker 和 Docker Compose 已安装"

# 检查环境变量文件
print_step "检查环境配置"
if [ ! -f ".env.production" ]; then
    print_warning "未找到 .env.production 文件"
    read -p "是否创建配置文件? (y/n): " create_env

    if [ "$create_env" = "y" ]; then
        cp .env.production.example .env.production
        print_success "已创建 .env.production 文件"
        print_warning "请编辑 .env.production 文件并配置必要的参数"
        print_info "必须配置的参数："
        print_info "  - DB_PASSWORD (数据库密码)"
        print_info "  - AI_API_KEY (AI服务密钥)"
        print_info "  - AI_API_URL (AI服务地址)"
        print_info "  - JWT_SECRET (JWT密钥)"
        print_info "  - SESSION_SECRET (会话密钥)"
        print_info "  - COOKIE_SECRET (Cookie密钥)"

        read -p "是否现在编辑配置文件? (y/n): " edit_now
        if [ "$edit_now" = "y" ]; then
            ${EDITOR:-nano} .env.production
        else
            print_info "稍后手动编辑配置文件: nano .env.production"
            exit 0
        fi
    else
        print_error "请先创建并配置 .env.production 文件"
        exit 1
    fi
fi

print_success "环境配置文件已找到"

# 创建必要的目录
print_step "创建必要的目录"
mkdir -p backups
mkdir -p nginx/ssl
mkdir -p logs
print_success "目录创建完成"

# 创建 .env 文件供 Docker Compose 使用
print_step "准备 Docker 配置"
cp .env.production .env
print_success "Docker 配置准备完成"

# 构建镜像
print_step "构建 Docker 镜像（可能需要几分钟）"
print_info "正在构建应用镜像，请耐心等待..."
docker compose build
print_success "镜像构建完成"

# 启动服务
print_step "启动服务"
docker compose up -d
print_success "服务已启动"

# 等待服务就绪
print_step "等待服务启动"
print_info "等待数据库和 Web 应用启动..."
sleep 15

# 检查服务状态
print_step "检查服务状态"
docker compose ps

# 检查容器健康状态
print_info "检查容器健康状态..."
sleep 5

# 显示访问信息
print_step "部署完成！"

# 获取服务器IP
SERVER_IP=$(hostname -I | awk '{print $1}')

print_success "应用已成功部署！"
echo ""
echo -e "${GREEN}访问地址：${NC}"
echo "  主页:     http://${SERVER_IP}"
echo "  管理后台: http://${SERVER_IP}/admin"
echo ""
echo -e "${YELLOW}首次使用步骤：${NC}"
echo "  1. 访问 http://${SERVER_IP}/admin/init 初始化管理员账户"
echo "  2. 登录管理后台: http://${SERVER_IP}/admin/login"
echo "  3. 配置 AI 服务和评审标准"
echo ""
echo -e "${GREEN}常用命令：${NC}"
echo "  查看日志:    docker compose logs -f"
echo "  重启服务:    docker compose restart"
echo "  停止服务:    docker compose down"
echo "  查看状态:    docker compose ps"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo "  如果使用域名，请确保域名已解析到 ${SERVER_IP}"
echo "  如需配置 HTTPS，请参考 DOCKER_DEPLOY_GUIDE.md"
echo ""

read -p "是否现在查看日志? (y/n): " view_logs
if [ "$view_logs" = "y" ]; then
    print_info "按 Ctrl+C 退出日志查看"
    sleep 2
    docker compose logs -f
fi

print_success "部署脚本执行完毕！"
