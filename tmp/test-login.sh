#!/bin/bash

echo "=== 测试登录流程 ==="

# 1. 测试密码重置
echo "1. 测试密码重置API..."
RESET_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/reset-password)
echo "重置响应: $RESET_RESPONSE"

# 2. 测试登录
echo ""
echo "2. 测试登录API..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' \
  -i)
echo "登录响应:"
echo "$LOGIN_RESPONSE"

# 3. 提取cookie
COOKIE=$(echo "$LOGIN_RESPONSE" | grep -i "set-cookie" | awk '{print $2}' | cut -d';' -f1)
echo ""
echo "3. 提取到的Cookie: $COOKIE"

# 4. 使用cookie访问dashboard
if [ ! -z "$COOKIE" ]; then
  echo ""
  echo "4. 使用Cookie访问GET /api/admin/login..."
  CHECK_RESPONSE=$(curl -s -X GET http://localhost:5000/api/admin/login \
    --cookie "$COOKIE")
  echo "检查响应: $CHECK_RESPONSE"
fi

echo ""
echo "=== 测试完成 ==="
