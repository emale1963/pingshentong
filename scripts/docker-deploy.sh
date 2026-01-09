#!/bin/bash

# AI 评审系统 Docker 部署脚本
# 使用方法: ./scripts/docker-deploy.sh [option]
# 选项:
#   init     - 初始化部署
#   start    - 启动服务
#   stop     - 停止服务
#   restart  - 重启服务
#   logs     - 查看日志
#   update   - 更新服务
#   backup   - 备份数据
#   restore  - 恢复数据
#   clean    - 清理资源

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 函数：打印信息
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

# 函数：检查 Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 函数：检查环境配置
check_env() {
    if [ ! -f ".env.production" ]; then
        print_error "环境配置文件不存在: .env.production"
        print_info "请先复制 .env.production.example 为 .env.production 并配置"
        exit 1
    fi
}

# 函数：初始化部署
init_deploy() {
    print_info "初始化 Docker 部署..."

    check_docker
    check_env

    # 创建必要的目录
    mkdir -p $BACKUP_DIR
    mkdir -p nginx/ssl
    mkdir -p logs

    # 创建 .env 文件供 Docker Compose 使用
    cp .env.production .env

    print_info "构建 Docker 镜像..."
    docker compose build

    print_info "启动服务..."
    docker compose up -d

    print_info "等待服务启动..."
    sleep 10

    print_info "检查服务状态..."
    docker compose ps

    print_success "初始化部署完成！"
    print_info "请访问 http://localhost 查看应用"
    print_info "使用 'docker compose logs -f' 查看日志"
}

# 函数：启动服务
start_services() {
    print_info "启动服务..."
    docker compose up -d
    print_success "服务已启动"
}

# 函数：停止服务
stop_services() {
    print_info "停止服务..."
    docker compose down
    print_success "服务已停止"
}

# 函数：重启服务
restart_services() {
    print_info "重启服务..."
    docker compose restart
    print_success "服务已重启"
}

# 函数：查看日志
view_logs() {
    SERVICE=${2:-}
    if [ -n "$SERVICE" ]; then
        docker compose logs -f $SERVICE
    else
        docker compose logs -f
    fi
}

# 函数：更新服务
update_services() {
    print_info "更新服务..."

    # 备份
    backup_data

    # 拉取最新代码
    # git pull origin main

    # 重新构建并启动
    docker compose down
    docker compose build --no-cache
    docker compose up -d

    print_success "服务更新完成"
}

# 函数：备份数据
backup_data() {
    print_info "备份数据..."

    mkdir -p $BACKUP_DIR

    # 备份数据库
    docker compose exec -T postgres pg_dump -U review_user report_review > $BACKUP_DIR/db_$DATE.sql

    # 备份配置文件
    cp .env.production $BACKUP_DIR/.env.production_$DATE

    # 清理30天前的备份
    find $BACKUP_DIR -type f -mtime +30 -delete

    print_success "备份完成: $BACKUP_DIR/db_$DATE.sql"
}

# 函数：恢复数据
restore_data() {
    if [ -z "$1" ]; then
        print_error "请指定备份文件"
        exit 1
    fi

    print_info "恢复数据..."

    # 恢复数据库
    docker compose exec -T postgres psql -U review_user report_review < $1

    print_success "数据恢复完成"
}

# 函数：清理资源
clean_resources() {
    print_warning "此操作将删除所有容器、卷和网络，数据将会丢失！"
    read -p "确定要继续吗？(yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_info "操作已取消"
        exit 0
    fi

    print_info "清理资源..."
    docker compose down -v
    print_success "资源清理完成"
}

# 函数：显示状态
show_status() {
    print_info "服务状态:"
    docker compose ps

    echo ""
    print_info "磁盘使用情况:"
    docker system df
}

# 主逻辑
case "${1:-}" in
    init)
        init_deploy
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs $@
        ;;
    update)
        update_services
        ;;
    backup)
        backup_data
        ;;
    restore)
        restore_data $2
        ;;
    clean)
        clean_resources
        ;;
    status)
        show_status
        ;;
    *)
        echo "用法: $0 {init|start|stop|restart|logs|update|backup|restore|clean|status}"
        echo ""
        echo "选项说明:"
        echo "  init     - 初始化部署"
        echo "  start    - 启动服务"
        echo "  stop     - 停止服务"
        echo "  restart  - 重启服务"
        echo "  logs     - 查看日志 (可指定服务名，如: logs web)"
        echo "  update   - 更新服务"
        echo "  backup   - 备份数据"
        echo "  restore  - 恢复数据 (需要指定备份文件)"
        echo "  clean    - 清理所有资源（慎用！）"
        echo "  status   - 显示服务状态"
        exit 1
        ;;
esac
