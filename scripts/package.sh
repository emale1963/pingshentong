#!/bin/bash

# AI 评审系统 - 代码打包脚本
# 用途：打包项目代码，排除不必要的文件

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

# 配置
PROJECT_NAME="ai-review-system"
DATE=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="./releases"
ARCHIVE_NAME="${PROJECT_NAME}_${DATE}.tar.gz"

# 创建输出目录
print_info "创建输出目录..."
mkdir -p $OUTPUT_DIR

# 打包代码（先排除 releases 目录避免冲突）
print_info "打包项目代码..."
print_info "排除文件: node_modules, .next, .git, backups, logs, .env.production, releases 等"

tar -czf "$OUTPUT_DIR/$ARCHIVE_NAME" \
  --exclude="node_modules" \
  --exclude=".next" \
  --exclude=".git" \
  --exclude=".gitignore" \
  --exclude="backups" \
  --exclude="logs" \
  --exclude="releases" \
  --exclude=".env" \
  --exclude=".env.local" \
  --exclude=".env.development" \
  --exclude=".env.production" \
  --exclude="*.log" \
  --exclude=".DS_Store" \
  --exclude="Thumbs.db" \
  --exclude="coverage" \
  --exclude=".nyc_output" \
  --exclude="dist" \
  --exclude="build" \
  .

# 检查打包是否成功
if [ -f "$OUTPUT_DIR/$ARCHIVE_NAME" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_DIR/$ARCHIVE_NAME" | cut -f1)
    print_success "打包完成！"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  打包信息${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "文件名: ${ARCHIVE_NAME}"
    echo -e "位置:   $OUTPUT_DIR/$ARCHIVE_NAME"
    echo -e "大小:   $FILE_SIZE"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    print_info "使用方法:"
    echo "  1. 下载压缩包: $OUTPUT_DIR/$ARCHIVE_NAME"
    echo "  2. 上传到服务器: scp $OUTPUT_DIR/$ARCHIVE_NAME user@server:/opt/"
    echo "  3. 在服务器解压: tar -xzf $ARCHIVE_NAME"
    echo ""
    print_info "提示: .env.production.example 已包含，请在服务器上复制为 .env.production 并配置"
else
    print_error "打包失败"
    exit 1
fi
