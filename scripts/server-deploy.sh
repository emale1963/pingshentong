#!/bin/bash

# AI 评审系统 - 服务器端自动部署脚本
# 用途：在云服务器上自动部署应用

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
BACKUP_DIR="/opt/ai-review-system/backups"

print_step "开始部署 AI 评审系统"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装"
    print_info "请运行以下命令安装 Docker："
    echo "curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose 未安装"
    exit 1
fi

print_success "Docker 环境检查通过"

# 切换到应用目录
print_step "切换到应用目录"
cd $APP_DIR || {
    print_warning "应用目录不存在，创建目录"
    mkdir -p $APP_DIR
    cd $APP_DIR
}

# 检查环境变量文件
print_step "检查环境配置"
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        print_info "从 .env.production 创建 .env 文件"
        cp .env.production .env
    else
        print_error "未找到 .env 或 .env.production 文件"
        print_info "请先配置环境变量文件"
        exit 1
    fi
fi

# 创建必要的目录
print_step "创建必要的目录"
mkdir -p backups nginx/ssl logs
print_success "目录创建完成"

# 停止现有服务
print_step "停止现有服务"
if [ -f docker-compose.yml ]; then
    docker compose down 2>/dev/null || true
    print_success "现有服务已停止"
fi

# 备份旧版本
print_step "备份旧版本"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
mkdir -p $BACKUP_PATH

if [ -d "node_modules" ] || [ -d ".next" ] || [ -f "docker-compose.yml" ]; then
    cp -r node_modules .next docker-compose.yml Dockerfile nginx $BACKUP_PATH/ 2>/dev/null || true
    print_success "旧版本已备份到 $BACKUP_PATH"
fi

# 清理旧备份（保留最近5个）
print_step "清理旧备份"
ls -t $BACKUP_DIR/ | tail -n +6 | xargs -I {} rm -rf $BACKUP_DIR/{} 2>/dev/null || true
print_success "旧备份清理完成"

# 构建镜像
print_step "构建 Docker 镜像"
print_info "正在构建应用镜像，请耐心等待..."
docker compose build --no-cache
print_success "镜像构建完成"

# 启动服务
print_step "启动服务"
docker compose up -d
print_success "服务已启动"

# 等待服务就绪
print_step "等待服务启动"
print_info "等待数据库和 Web 应用启动..."
sleep 20

# 检查服务状态
print_step "检查服务状态"
docker compose ps

# 检查容器健康状态
print_info "检查容器健康状态..."
sleep 5

FAILED_CONTAINERS=$(docker compose ps --format json | jq -r '.[] | select(.State != "running") | .Service')

if [ ! -z "$FAILED_CONTAINERS" ]; then
    print_error "以下容器启动失败：$FAILED_CONTAINERS"
    print_info "查看日志："
    docker compose logs --tail=50
    exit 1
fi

print_success "所有服务启动成功"

# 显示访问信息
print_step "部署完成！"

print_success "应用已成功部署到服务器！"
echo ""
echo -e "${GREEN}访问地址：${NC}"
echo "  主页:     http://14.103.72.48"
echo "  管理后台: http://14.103.72.48/admin"
echo ""
echo -e "${YELLOW}首次使用步骤：${NC}"
echo "  1. 访问 http://14.103.72.48/admin/init 初始化管理员账户"
echo "  2. 登录管理后台: http://14.103.72.48/admin/login"
echo "  3. 配置 AI 服务和评审标准"
echo ""
echo -e "${GREEN}常用命令：${NC}"
echo "  查看日志:    docker compose logs -f"
echo "  重启服务:    docker compose restart"
echo "  停止服务:    docker compose down"
echo "  查看状态:    docker compose ps"
echo ""

# 运行健康检查
print_step "健康检查"
sleep 5

# 检查 Web 服务
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$HTTP_CODE" = "000" ]; then
    print_warning "Web 服务可能尚未就绪"
else
    print_success "Web 服务响应正常 (HTTP $HTTP_CODE)"
fi

# 检查 Nginx
NGINX_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "000")
if [ "$NGINX_CODE" = "000" ]; then
    print_warning "Nginx 服务可能尚未就绪"
else
    print_success "Nginx 服务响应正常 (HTTP $NGINX_CODE)"
fi

print_success "部署脚本执行完毕！"
