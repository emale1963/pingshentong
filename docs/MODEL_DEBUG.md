# 大模型调试与使用指南

## 概述

本系统集成了三个大语言模型:
- **豆包 Seed** (默认推荐) - 字节跳动开发的高性能大语言模型
- **Kimi K2** - 月之暗面开发的长上下文大语言模型
- **DeepSeek R1** - 深度求索开发的推理强化模型

## 当前状态

### 模型配置

| 模型ID | 模型名称 | 集成模型ID | 提供商 | 状态 |
|--------|---------|-----------|--------|------|
| doubao-seed | 豆包 Seed | doubao-seed-1-6-251015 | 字节跳动 | 默认推荐 |
| kimi-k2 | Kimi K2 | kimi-k2-250905 | 月之暗面 | 可用 |
| deepseek-r1 | DeepSeek R1 | deepseek-r1-250528 | 深度求索 | 可用 |

### 错误类型说明

系统会自动检测模型连接状态,并显示以下错误类型:

| 错误代码 | 错误描述 | 可能原因 | 解决方案 |
|---------|---------|---------|---------|
| INSUFFICIENT_QUOTA | AI服务资源点不足,请升级服务套餐 | 集成服务资源配额不足 | 联系管理员升级服务套餐 |
| NETWORK_ERROR | 网络连接失败,请检查网络设置 | 网络不可达或DNS解析失败 | 检查网络连接和防火墙设置 |
| TIMEOUT_ERROR | 模型响应超时 | 网络延迟或服务响应慢 | 稍后重试或检查网络质量 |
| AUTH_ERROR | API认证失败,请检查配置 | API密钥无效或过期 | 检查API密钥配置 |
| MODEL_NOT_FOUND | 模型不存在或未配置 | 模型ID错误或服务不可用 | 检查模型ID配置 |
| SERVER_ERROR | AI服务暂时不可用,请稍后重试 | 服务端错误(500/502/503) | 稍后重试 |
| RATE_LIMIT | 请求过于频繁,请稍后重试 | 超出API调用频率限制 | 稍后重试或调整调用频率 |
| CONFIG_ERROR | AI服务配置错误 | SDK配置不正确 | 检查服务配置 |

## 使用指南

### 1. 查看模型状态

在首页提交报告时,可以看到所有AI模型的状态:
- ✅ 绿色圆点 = 模型可用
- ❌ 红色圆点 = 模型不可用

### 2. 检测模型连接

点击"检测模型状态"按钮,系统会实时测试所有模型的连接状态。

### 3. 选择模型

- 点击可用的模型卡片进行选择
- 不可用的模型会显示为灰色,无法选择
- 系统会自动切换到第一个可用模型

### 4. 查看错误详情

如果模型不可用,可以点击"查看详情"展开错误信息:
- 错误代码
- 友好的错误描述
- 响应时间
- 详细的技术错误信息

## API 接口

### 获取所有模型健康状态

```bash
GET /api/models/health
```

响应示例:
```json
{
  "models": [
    {
      "modelId": "doubao-seed",
      "name": "豆包 Seed",
      "available": false,
      "lastChecked": "2026-01-05T02:44:16.217Z",
      "error": "AI服务资源点不足,请升级服务套餐",
      "errorCode": "INSUFFICIENT_QUOTA",
      "errorDetails": "...",
      "responseTime": 151
    }
  ],
  "availableModels": [],
  "summary": {
    "total": 3,
    "available": 0,
    "unavailable": 3
  }
}
```

### 获取模型状态摘要

```bash
GET /api/models/health?summary=true
```

响应示例:
```json
{
  "total": 3,
  "available": 0,
  "unavailable": 3,
  "lastChecked": "2026-01-05T02:44:16.220Z"
}
```

## 优先级策略

1. **豆包 Seed** (优先级最高)
   - 默认选中的模型
   - 已确认在生产环境中可用
   - 响应速度快,稳定性好

2. **Kimi K2**
   - 长上下文能力强
   - 适合复杂文档分析

3. **DeepSeek R1**
   - 推理能力强
   - 适合逻辑分析任务

## 注意事项

1. **文心一言和通义千问**
   - 这两个模型不在当前可用的集成服务列表中
   - 暂不支持
   - 未来可能通过集成服务扩展支持

2. **资源配额**
   - 当前开发环境资源点不足
   - 生产环境需要升级付费版套餐
   - 联系管理员获取服务套餐

3. **缓存策略**
   - 模型健康状态缓存 5 分钟
   - 自动刷新机制
   - 可手动点击"检测模型状态"强制刷新

## 故障排查

### 所有模型显示不可用

1. 检查网络连接
2. 查看错误代码和详情
3. 确认集成服务配额是否充足
4. 检查API密钥配置

### 模型响应超时

1. 检查网络延迟
2. 确认AI服务状态
3. 尝试使用其他可用模型

### 认证失败

1. 检查API密钥是否配置
2. 确认密钥是否过期
3. 联系管理员重新配置

## 开发者指南

### 修改模型配置

编辑 `src/types/models.ts`:

```typescript
export const AI_MODELS: Record<AIModelType, AIModel> = {
  'doubao-seed': {
    id: 'doubao-seed',
    name: '豆包 Seed',
    modelId: 'doubao-seed-1-6-251015',
    provider: '字节跳动',
  },
  // ...其他模型
};
```

### 修改默认模型

编辑 `src/types/models.ts`:

```typescript
export const DEFAULT_MODEL: AIModelType = 'doubao-seed';
```

### 自定义错误处理

编辑 `src/lib/modelHealthCheck.ts` 中的 `checkModelHealth` 函数。

## 更新日志

### 2026-01-05
- ✅ 修正模型ID配置
- ✅ 优化错误分类和提示
- ✅ 增强前端模型状态显示
- ✅ 添加详细的错误详情展示
- ✅ 实现模型健康检查API
- ✅ 设置豆包Seed为默认推荐模型
