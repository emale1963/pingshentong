/**
 * 大模型健康检查服务
 * 检测各个大模型的可用性
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { AIModelType, AI_MODELS } from '@/types/models';

export interface ModelHealthStatus {
  modelId: AIModelType;
  name: string;
  available: boolean;
  lastChecked: string;
  error?: string;
  errorCode?: string; // 错误代码
  errorDetails?: string; // 详细错误信息
  responseTime?: number; // 响应时间（毫秒）
}

// 缓存检测结果
const healthCache = new Map<AIModelType, {
  status: ModelHealthStatus;
  timestamp: number;
}>();

// 缓存有效期（5分钟）
const CACHE_TTL = 5 * 60 * 1000;

/**
 * 获取LLM客户端实例
 */
function getLLMClient(): LLMClient {
  try {
    const config = new Config();
    return new LLMClient(config);
  } catch (error) {
    console.error('[Model Health Check] Failed to initialize LLM client:', error);
    throw new Error('AI服务初始化失败');
  }
}

/**
 * 检查单个模型的健康状态
 */
async function checkModelHealth(modelId: AIModelType): Promise<ModelHealthStatus> {
  const startTime = Date.now();
  const model = AI_MODELS[modelId];
  const now = new Date().toISOString();

  console.log(`[Model Health Check] Checking model: ${modelId} (${model.name})...`);

  try {
    const client = getLLMClient();

    // 发送一个简单的测试请求
    const testMessages = [
      { role: 'user' as const, content: '你好，请回复"模型可用"' }
    ];

    const response = await Promise.race([
      client.invoke(testMessages, {
        model: model.modelId,
        temperature: 0.1,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('模型响应超时')), 30000); // 30秒超时
      }),
    ]);

    const responseTime = Date.now() - startTime;

    console.log(`[Model Health Check] ${modelId} is available, response time: ${responseTime}ms`);

    return {
      modelId,
      name: model.name,
      available: true,
      lastChecked: now,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = '未知错误';
    let errorCode = 'UNKNOWN_ERROR';
    let errorDetails = '';

    // 分类错误类型
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';

      // 资源点不足
      if (errorMessage.includes('资源点不足') || errorMessage.includes('付费版套餐')) {
        errorCode = 'INSUFFICIENT_QUOTA';
        errorMessage = 'AI服务资源点不足，请升级服务套餐';
      }
      // 网络相关错误
      else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        errorCode = 'NETWORK_ERROR';
        errorMessage = '网络连接失败，请检查网络设置';
      }
      // 超时错误
      else if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
        errorCode = 'TIMEOUT_ERROR';
        errorMessage = '模型响应超时';
      }
      // API认证错误
      else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('认证失败')) {
        errorCode = 'AUTH_ERROR';
        errorMessage = 'API认证失败，请检查配置';
      }
      // 模型不存在
      else if (errorMessage.includes('404') || errorMessage.includes('模型不存在')) {
        errorCode = 'MODEL_NOT_FOUND';
        errorMessage = '模型不存在或未配置';
      }
      // 服务端错误
      else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        errorCode = 'SERVER_ERROR';
        errorMessage = 'AI服务暂时不可用，请稍后重试';
      }
      // 速率限制
      else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorCode = 'RATE_LIMIT';
        errorMessage = '请求过于频繁，请稍后重试';
      }
      // 配置错误
      else if (errorMessage.includes('config') || errorMessage.includes('配置')) {
        errorCode = 'CONFIG_ERROR';
        errorMessage = 'AI服务配置错误';
      }
    }

    console.error(`[Model Health Check] ${modelId} is unavailable:`, {
      errorCode,
      errorMessage,
      details: errorDetails || String(error),
    });

    return {
      modelId,
      name: model.name,
      available: false,
      lastChecked: now,
      error: errorMessage,
      errorCode,
      errorDetails: errorDetails || String(error),
      responseTime,
    };
  }
}

/**
 * 检查所有模型的健康状态
 */
export async function checkAllModelsHealth(): Promise<ModelHealthStatus[]> {
  console.log('[Model Health Check] Starting health check for all models...');

  const results: ModelHealthStatus[] = [];
  const modelIds: AIModelType[] = Object.keys(AI_MODELS) as AIModelType[];

  // 并行检查所有模型
  const healthChecks = modelIds.map(modelId => checkModelHealth(modelId));

  try {
    const healthResults = await Promise.all(healthChecks);
    results.push(...healthResults);

    // 更新缓存
    const timestamp = Date.now();
    for (const status of results) {
      healthCache.set(status.modelId, {
        status,
        timestamp,
      });
    }

    console.log('[Model Health Check] All models checked:', {
      total: results.length,
      available: results.filter(r => r.available).length,
      unavailable: results.filter(r => !r.available).length,
    });
  } catch (error) {
    console.error('[Model Health Check] Failed to check models:', error);

    // 如果检查失败，返回所有模型为不可用
    for (const modelId of modelIds) {
      results.push({
        modelId,
        name: AI_MODELS[modelId].name,
        available: false,
        lastChecked: new Date().toISOString(),
        error: '健康检查失败',
      });
    }
  }

  return results;
}

/**
 * 获取单个模型的健康状态（带缓存）
 */
export async function getModelHealthStatus(
  modelId: AIModelType,
  useCache: boolean = true
): Promise<ModelHealthStatus> {
  // 检查缓存
  if (useCache) {
    const cached = healthCache.get(modelId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Model Health Check] Returning cached status for ${modelId}`);
      return cached.status;
    }
  }

  // 执行健康检查
  const status = await checkModelHealth(modelId);

  // 更新缓存
  healthCache.set(modelId, {
    status,
    timestamp: Date.now(),
  });

  return status;
}

/**
 * 获取所有可用的模型
 */
export async function getAvailableModels(): Promise<AIModelType[]> {
  const healthStatuses = await checkAllModelsHealth();
  return healthStatuses
    .filter(status => status.available)
    .map(status => status.modelId);
}

/**
 * 批量检查模型是否可用（使用缓存）
 */
export async function areModelsAvailable(modelIds: AIModelType[]): Promise<Record<AIModelType, boolean>> {
  const results: Record<AIModelType, boolean> = {
    'doubao-seed': false,
    'kimi-k2': false,
    'deepseek-r1': false,
  };

  for (const modelId of modelIds) {
    try {
      const status = await getModelHealthStatus(modelId);
      results[modelId] = status.available;
    } catch (error) {
      console.error(`[Model Health Check] Failed to check ${modelId}:`, error);
      results[modelId] = false;
    }
  }

  return results;
}

/**
 * 获取模型状态摘要
 */
export function getModelHealthSummary(): {
  total: number;
  available: number;
  unavailable: number;
  lastChecked?: string;
} {
  const statuses = Array.from(healthCache.values());

  return {
    total: statuses.length,
    available: statuses.filter(s => s.status.available).length,
    unavailable: statuses.filter(s => !s.status.available).length,
    lastChecked: statuses.length > 0
      ? new Date(Math.max(...statuses.map(s => s.timestamp))).toISOString()
      : undefined,
  };
}

/**
 * 清除缓存
 */
export function clearModelHealthCache(): void {
  healthCache.clear();
  console.log('[Model Health Check] Cache cleared');
}
