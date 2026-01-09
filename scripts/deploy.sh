#!/bin/bash

# AI 评审系统自动化部署脚本
# 使用方法: ./scripts/deploy.sh [option]
# 选项:
#   init     - 初始化部署
#   update   - 更新部署
#   backup   - 备份数据
#   restore  - 恢复数据
#   logs     - 查看日志
#   stop     - 停止服务
#   start    - 启动服务
#   restart  - 重启服务

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
DEPLOY_DIR="/var/www/ai-review-system"
BACKUP_DIR="/var/backups/ai-review-system"
LOG_DIR="$DEPLOY_DIR/logs"
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

# 函数：检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 用户或 sudo 运行此脚本"
        exit 1
    fi
}

# 函数：创建必要的目录
create_directories() {
    print_info "创建必要的目录..."
    mkdir -p $DEPLOY_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p $LOG_DIR
    mkdir -p /var/scripts

    print_success "目录创建完成"
}

# 函数：安装依赖
install_dependencies() {
    print_info "检查并安装系统依赖..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_info "安装 Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi

    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        print_info "安装 pnpm..."
        npm install -g pnpm
    fi

    # 检查 PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_info "安装 PostgreSQL..."
        apt-get update
        apt-get install -y postgresql postgresql-contrib
        systemctl start postgresql
        systemctl enable postgresql
    fi

    # 检查 Nginx
    if ! command -v nginx &> /dev/null; then
        print_info "安装 Nginx..."
        apt-get install -y nginx
        systemctl start nginx
        systemctl enable nginx
    fi

    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        print_info "安装 PM2..."
        npm install -g pm2
    fi

    print_success "依赖安装完成"
}

# 函数：配置数据库
setup_database() {
    print_info "配置数据库..."

    if [ ! -f "$DEPLOY_DIR/.env.production" ]; then
        print_error "环境配置文件不存在: $DEPLOY_DIR/.env.production"
        print_info "请先创建并配置 .env.production 文件"
        exit 1
    fi

    # 从环境配置文件中读取数据库配置
    source "$DEPLOY_DIR/.env.production"

    # 创建数据库和用户
    sudo -u postgres psql << EOF
SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
SELECT 'CREATE USER $DB_USER WITH PASSWORD '\''$DB_PASSWORD'\''' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER')\gexec
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

    # 初始化数据库表
    if [ -f "$DEPLOY_DIR/database/schema.sql" ]; then
        print_info "初始化数据库表..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$DEPLOY_DIR/database/schema.sql"
        print_success "数据库表初始化完成"
    fi

    # 导入示例数据
    if [ -f "$DEPLOY_DIR/database/sample_standards_data.sql" ]; then
        print_info "导入示例数据..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$DEPLOY_DIR/database/sample_standards_data.sql"
        print_success "示例数据导入完成"
    fi

    print_success "数据库配置完成"
}

# 函数：安装应用依赖
install_app_dependencies() {
    print_info "安装应用依赖..."
    cd $DEPLOY_DIR
    pnpm install --frozen-lockfile
    print_success "应用依赖安装完成"
}

# 函数：构建应用
build_app() {
    print_info "构建应用..."
    cd $DEPLOY_DIR
    pnpm run build
    print_success "应用构建完成"
}

# 函数：启动应用
start_app() {
    print_info "启动应用..."
    cd $DEPLOY_DIR

    # 停止旧进程
    pm2 delete ai-review-system 2>/dev/null || true

    # 启动新进程
    pm2 start npm --name "ai-review-system" -- start

    # 保存 PM2 配置
    pm2 save

    # 设置开机自启
    pm2 startup systemd -u root --hp /root

    print_success "应用启动完成"
}

# 函数：配置 Nginx
setup_nginx() {
    print_info "配置 Nginx..."

    if [ -f "$DEPLOY_DIR/nginx/conf.d/default.conf" ]; then
        cp "$DEPLOY_DIR/nginx/conf.d/default.conf" /etc/nginx/sites-available/ai-review-system
        ln -sf /etc/nginx/sites-available/ai-review-system /etc/nginx/sites-enabled/
    fi

    # 测试 Nginx 配置
    nginx -t

    # 重载 Nginx
    systemctl reload nginx

    print_success "Nginx 配置完成"
}

# 函数：备份
backup() {
    print_info "开始备份..."

    mkdir -p $BACKUP_DIR

    # 备份数据库
    source "$DEPLOY_DIR/.env.production"
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_DIR/db_$DATE.sql

    # 备份上传文件（如果有）
    if [ -d "$DEPLOY_DIR/public/uploads" ]; then
        tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $DEPLOY_DIR public/uploads
    fi

    # 备份环境配置
    cp $DEPLOY_DIR/.env.production $BACKUP_DIR/.env.production_$DATE

    # 清理30天前的备份
    find $BACKUP_DIR -type f -mtime +30 -delete

    print_success "备份完成: $BACKUP_DIR"
}

# 函数：恢复
restore() {
    if [ -z "$1" ]; then
        print_error "请指定备份文件"
        exit 1
    fi

    print_info "开始恢复..."

    # 恢复数据库
    source "$DEPLOY_DIR/.env.production"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME < $1

    print_success "恢复完成"
}

# 函数：查看日志
view_logs() {
    pm2 logs ai-review-system
}

# 函数：初始化部署
init_deploy() {
    check_root
    create_directories
    install_dependencies
    install_app_dependencies
    setup_database
    build_app
    start_app
    setup_nginx

    print_success "初始化部署完成！"
    print_info "请访问 http://$(hostname -I | awk '{print $1}') 查看应用"
}

# 函数：更新部署
update_deploy() {
    check_root

    print_info "开始更新..."

    # 备份
    backup

    # 停止应用
    pm2 stop ai-review-system

    # 拉取最新代码
    cd $DEPLOY_DIR
    # git pull origin main  # 如果使用 Git

    # 安装依赖
    pnpm install --frozen-lockfile

    # 构建应用
    pnpm run build

    # 启动应用
    pm2 restart ai-review-system

    print_success "更新完成"
}

# 主逻辑
case "${1:-}" in
    init)
        init_deploy
        ;;
    update)
        update_deploy
        ;;
    backup)
        backup
        ;;
    restore)
        restore $2
        ;;
    logs)
        view_logs
        ;;
    stop)
        pm2 stop ai-review-system
        print_success "服务已停止"
        ;;
    start)
        pm2 start ai-review-system
        print_success "服务已启动"
        ;;
    restart)
        pm2 restart ai-review-system
        print_success "服务已重启"
        ;;
    *)
        echo "用法: $0 {init|update|backup|restore|logs|stop|start|restart}"
        echo ""
        echo "选项说明:"
        echo "  init     - 初始化部署"
        echo "  update   - 更新部署"
        echo "  backup   - 备份数据"
        echo "  restore  - 恢复数据 (需要指定备份文件)"
        echo "  logs     - 查看日志"
        echo "  stop     - 停止服务"
        echo "  start    - 启动服务"
        echo "  restart  - 重启服务"
        exit 1
        ;;
esac
