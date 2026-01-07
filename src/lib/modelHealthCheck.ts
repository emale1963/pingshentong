/**
 * 大模型健康检查服务
 * 检测各个大模型的可用性
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { AIModelType, AI_MODELS } from '@/types/models';
import { modelConfigManager } from './modelConfigManager';

export interface ModelHealthStatus {
  modelId: string; // 改为 string 类型，支持自定义模型
  name: string;
  available: boolean;
  lastChecked: string;
  error?: string;
  errorCode?: string; // 错误代码
  errorDetails?: string; // 详细错误信息
  responseTime?: number; // 响应时间（毫秒）
  isCustom?: boolean; // 是否为自定义模型
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
async function checkModelHealth(modelId: string): Promise<ModelHealthStatus> {
  const startTime = Date.now();
  const now = new Date().toISOString();

  console.log(`[Model Health Check] Checking model: ${modelId}...`);

  // 首先检查是否为内置模型（检查 modelId 或 id 字段）
  const builtInModel = Object.values(AI_MODELS).find(m => m.modelId === modelId || m.id === modelId);

  if (builtInModel) {
    // 内置模型的健康检查
    return await checkBuiltInModelHealth(modelId as AIModelType, builtInModel);
  } else {
    // 自定义模型的健康检查
    return await checkCustomModelHealth(modelId);
  }
}

/**
 * 检查内置模型的健康状态
 */
async function checkBuiltInModelHealth(modelId: AIModelType, model: typeof AI_MODELS[AIModelType]): Promise<ModelHealthStatus> {
  const startTime = Date.now();
  const now = new Date().toISOString();

  console.log(`[Model Health Check] Checking built-in model: ${modelId} (${model.name})...`);

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
      isCustom: false,
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
      isCustom: false,
    };
  }
}

/**
 * 检查自定义模型的健康状态
 */
async function checkCustomModelHealth(modelId: string): Promise<ModelHealthStatus> {
  const startTime = Date.now();
  const now = new Date().toISOString();

  console.log(`[Model Health Check] Checking custom model: ${modelId}...`);

  try {
    // 从配置管理器获取模型配置
    const config = modelConfigManager.getModelConfig(modelId);

    if (!config) {
      return {
        modelId,
        name: modelId,
        available: false,
        lastChecked: now,
        error: '模型配置不存在',
        errorCode: 'MODEL_NOT_FOUND',
        isCustom: true,
      };
    }

    // 检查是否配置了 API 端点
    if (!config.apiConfig || !config.apiConfig.endpoint) {
      return {
        modelId,
        name: config.name,
        available: false,
        lastChecked: now,
        error: '未配置 API 端点',
        errorCode: 'NO_API_ENDPOINT',
        responseTime: Date.now() - startTime,
        isCustom: true,
      };
    }

    // 尝试调用外部 API 进行健康检查
    try {
      const { endpoint, apiKey, apiVersion, model: actualModel } = config.apiConfig;

      // 构建测试请求
      const testRequest = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
          ...(apiVersion && { 'API-Version': apiVersion }),
        },
        body: JSON.stringify({
          model: actualModel || modelId,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10,
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!testRequest.ok) {
        const errorText = await testRequest.text();
        let errorMessage = 'API 调用失败';
        let errorCode = 'API_ERROR';

        // 根据状态码判断错误类型
        if (testRequest.status === 401) {
          errorMessage = 'API 密钥无效或已过期';
          errorCode = 'AUTH_ERROR';
        } else if (testRequest.status === 404) {
          errorMessage = 'API 端点不存在或模型 ID 错误';
          errorCode = 'MODEL_NOT_FOUND';
        } else if (testRequest.status === 429) {
          errorMessage = 'API 调用频率超限';
          errorCode = 'RATE_LIMIT';
        } else if (testRequest.status >= 500) {
          errorMessage = 'API 服务器错误';
          errorCode = 'SERVER_ERROR';
        }

        console.error(`[Model Health Check] ${modelId} API call failed:`, {
          status: testRequest.status,
          error: errorText,
        });

        return {
          modelId,
          name: config.name,
          available: false,
          lastChecked: now,
          error: errorMessage,
          errorCode,
          errorDetails: errorText,
          responseTime,
          isCustom: true,
        };
      }

      const responseData = await testRequest.json();

      // 检查返回数据格式是否正确
      if (!responseData || typeof responseData !== 'object') {
        return {
          modelId,
          name: config.name,
          available: false,
          lastChecked: now,
          error: 'API 返回数据格式错误',
          errorCode: 'INVALID_RESPONSE',
          responseTime,
          isCustom: true,
        };
      }

      console.log(`[Model Health Check] ${modelId} (custom) is available, response time: ${responseTime}ms`);

      return {
        modelId,
        name: config.name,
        available: true,
        lastChecked: now,
        responseTime,
        isCustom: true,
      };
    } catch (fetchError) {
      const responseTime = Date.now() - startTime;
      let errorMessage = 'API 调用失败';
      let errorCode = 'API_ERROR';

      if (fetchError instanceof Error) {
        errorMessage = fetchError.message;

        // 网络相关错误
        if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
          errorMessage = '无法连接到 API 端点';
          errorCode = 'NETWORK_ERROR';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
          errorMessage = 'API 响应超时';
          errorCode = 'TIMEOUT_ERROR';
        }
      }

      console.error(`[Model Health Check] ${modelId} API call error:`, errorMessage);

      return {
        modelId,
        name: config.name,
        available: false,
        lastChecked: now,
        error: errorMessage,
        errorCode,
        responseTime,
        isCustom: true,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = '未知错误';
    let errorCode = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`[Model Health Check] ${modelId} is unavailable:`, errorMessage);

    return {
      modelId,
      name: modelId,
      available: false,
      lastChecked: now,
      error: errorMessage,
      errorCode,
      responseTime,
      isCustom: true,
    };
  }
}

/**
 * 检查所有模型的健康状态（包括内置和自定义模型）
 */
export async function checkAllModelsHealth(): Promise<ModelHealthStatus[]> {
  console.log('[Model Health Check] Starting health check for all models...');

  const results: ModelHealthStatus[] = [];

  // 1. 检查所有内置模型
  const builtInModelIds: AIModelType[] = Object.keys(AI_MODELS) as AIModelType[];

  // 2. 从配置管理器获取所有模型（包括自定义模型）
  const allConfigs = modelConfigManager.getAllConfigs();

  // 3. 收集所有需要检查的模型ID（使用 string 类型，因为支持自定义模型）
  const modelIdsToCheck: string[] = Array.from(new Set([
    ...builtInModelIds,
    ...allConfigs.map(c => c.modelId),
  ]));

  console.log(`[Model Health Check] Checking ${modelIdsToCheck.length} models total...`);

  // 4. 并行检查所有模型
  const healthChecks = modelIdsToCheck.map(modelId => checkModelHealth(modelId));

  try {
    const healthResults = await Promise.all(healthChecks);
    results.push(...healthResults);

    // 更新缓存
    const timestamp = Date.now();
    for (const status of results) {
      healthCache.set(status.modelId as AIModelType, {
        status,
        timestamp,
      });
    }

    console.log('[Model Health Check] All models checked:', {
      total: results.length,
      available: results.filter(r => r.available).length,
      unavailable: results.filter(r => !r.available).length,
      customModels: results.filter(r => r.isCustom).length,
    });
  } catch (error) {
    console.error('[Model Health Check] Failed to check models:', error);

    // 如果检查失败，返回所有模型为不可用
    for (const modelId of modelIdsToCheck) {
      const config = modelConfigManager.getModelConfig(modelId);
      results.push({
        modelId,
        name: config?.name || modelId,
        available: false,
        lastChecked: new Date().toISOString(),
        error: '健康检查失败',
        isCustom: config?.isCustom ?? false,
      });
    }
  }

  return results;
}

/**
 * 检查单个模型的健康状态（导出供外部调用）
 */
export async function checkSingleModelHealth(modelId: string): Promise<ModelHealthStatus> {
  return await checkModelHealth(modelId);
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
export async function getAvailableModels(): Promise<string[]> {
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
