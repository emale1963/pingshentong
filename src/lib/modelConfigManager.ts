/**
 * 模型配置管理器
 * 管理模型的启用/禁用状态和默认模型设置
 */

import { AIModelType, AI_MODELS } from '@/types/models';

export interface ModelConfig {
  modelId: AIModelType;
  enabled: boolean;
  isDefault: boolean;
  priority: number; // 优先级，用于选择模型时排序
  lastUpdated: string;
}

class ModelConfigManager {
  private configs: Map<AIModelType, ModelConfig> = new Map();
  private defaultModel: AIModelType = 'kimi-k2' as AIModelType;

  constructor() {
    this.initializeConfigs();
  }

  /**
   * 初始化模型配置
   */
  private initializeConfigs() {
    const modelIds: AIModelType[] = Object.keys(AI_MODELS) as AIModelType[];
    const now = new Date().toISOString();

    // 初始化所有模型配置，默认都启用
    modelIds.forEach((modelId, index) => {
      this.configs.set(modelId, {
        modelId,
        enabled: true,
        isDefault: modelId === this.defaultModel,
        priority: index + 1,
        lastUpdated: now,
      });
    });

    console.log('[Model Config Manager] Initialized configs:', Array.from(this.configs.values()));
  }

  /**
   * 获取所有模型配置
   */
  getAllConfigs(): ModelConfig[] {
    return Array.from(this.configs.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * 获取指定模型的配置
   */
  getModelConfig(modelId: AIModelType): ModelConfig | undefined {
    return this.configs.get(modelId);
  }

  /**
   * 更新模型配置
   */
  updateModelConfig(modelId: AIModelType, updates: Partial<Omit<ModelConfig, 'modelId' | 'lastUpdated'>>): ModelConfig | null {
    const config = this.configs.get(modelId);
    if (!config) {
      return null;
    }

    const updatedConfig = {
      ...config,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    this.configs.set(modelId, updatedConfig);

    console.log('[Model Config Manager] Updated config:', updatedConfig);

    return updatedConfig;
  }

  /**
   * 启用/禁用模型
   */
  setModelEnabled(modelId: AIModelType, enabled: boolean): boolean {
    const config = this.configs.get(modelId);
    if (!config) {
      return false;
    }

    // 如果要禁用的模型是默认模型，需要先更改默认模型
    if (!enabled && config.isDefault) {
      const enabledConfigs = this.getAllConfigs().filter(c => c.enabled && c.modelId !== modelId);
      if (enabledConfigs.length > 0) {
        this.setDefaultModel(enabledConfigs[0].modelId);
      }
    }

    this.updateModelConfig(modelId, { enabled });
    return true;
  }

  /**
   * 设置默认模型
   */
  setDefaultModel(modelId: AIModelType): boolean {
    const config = this.configs.get(modelId);
    if (!config || !config.enabled) {
      return false;
    }

    // 清除之前的默认模型
    this.getAllConfigs().forEach(c => {
      if (c.isDefault) {
        this.updateModelConfig(c.modelId, { isDefault: false });
      }
    });

    // 设置新的默认模型
    this.updateModelConfig(modelId, { isDefault: true });
    this.defaultModel = modelId;

    console.log('[Model Config Manager] Set default model:', modelId);
    return true;
  }

  /**
   * 获取默认模型
   */
  getDefaultModel(): AIModelType {
    const config = this.getAllConfigs().find(c => c.isDefault && c.enabled);
    if (!config) {
      // 如果没有默认模型或默认模型被禁用，返回第一个启用的模型
      const firstEnabled = this.getAllConfigs().find(c => c.enabled);
      return firstEnabled?.modelId || 'kimi-k2';
    }
    return config.modelId;
  }

  /**
   * 获取所有启用的模型
   */
  getEnabledModels(): AIModelType[] {
    return this.getAllConfigs()
      .filter(c => c.enabled)
      .map(c => c.modelId);
  }

  /**
   * 检查模型是否启用
   */
  isModelEnabled(modelId: AIModelType): boolean {
    const config = this.configs.get(modelId);
    return config?.enabled ?? false;
  }
}

// 导出单例实例
export const modelConfigManager = new ModelConfigManager();
