/**
 * 模型配置管理器
 * 管理模型的启用/禁用状态和默认模型设置
 */

import { AIModelType, AI_MODELS, AIModel } from '@/types/models';

export interface ModelConfig {
  modelId: string; // 扩展为string类型，支持自定义模型
  name: string;
  description: string;
  provider: string;
  enabled: boolean;
  isDefault: boolean;
  priority: number; // 优先级，用于选择模型时排序
  lastUpdated: string;
  isCustom: boolean; // 是否为自定义模型
}

class ModelConfigManager {
  private configs: Map<string, ModelConfig> = new Map();
  private defaultModel: string = 'kimi-k2';
  private nextPriority = 100; // 自定义模型优先级从100开始

  constructor() {
    // 检查是否已经初始化过
    if (typeof global !== 'undefined' && (global as any).__modelConfigManagerInstance) {
      const existing = (global as any).__modelConfigManagerInstance;
      this.configs = existing.configs;
      this.defaultModel = existing.defaultModel;
      this.nextPriority = existing.nextPriority;
      console.log('[Model Config Manager] Restored from global:', Array.from(this.configs.values()));
    } else {
      this.initializeConfigs();
      // 保存到全局变量
      if (typeof global !== 'undefined') {
        (global as any).__modelConfigManagerInstance = {
          configs: this.configs,
          defaultModel: this.defaultModel,
          nextPriority: this.nextPriority,
        };
      }
    }
  }

  /**
   * 初始化模型配置
   */
  private initializeConfigs() {
    const modelIds: AIModelType[] = Object.keys(AI_MODELS) as AIModelType[];
    const now = new Date().toISOString();

    // 初始化所有内置模型配置，默认都启用
    modelIds.forEach((modelId, index) => {
      const model = AI_MODELS[modelId];
      this.configs.set(modelId, {
        modelId,
        name: model.name,
        description: model.description,
        provider: model.provider,
        enabled: true,
        isDefault: modelId === this.defaultModel,
        priority: index + 1,
        lastUpdated: now,
        isCustom: false,
      });
    });

    this.nextPriority = modelIds.length + 1;

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
  getModelConfig(modelId: string): ModelConfig | undefined {
    return this.configs.get(modelId);
  }

  /**
   * 更新模型配置
   */
  updateModelConfig(modelId: string, updates: Partial<Omit<ModelConfig, 'modelId' | 'lastUpdated'>>): ModelConfig | null {
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
   * 添加自定义模型
   */
  addCustomModel(modelId: string, name: string, description: string, provider: string): ModelConfig {
    const now = new Date().toISOString();

    const newConfig: ModelConfig = {
      modelId,
      name,
      description,
      provider,
      enabled: true,
      isDefault: false,
      priority: this.nextPriority++,
      lastUpdated: now,
      isCustom: true,
    };

    this.configs.set(modelId, newConfig);

    console.log('[Model Config Manager] Added custom model:', newConfig);

    return newConfig;
  }

  /**
   * 删除自定义模型
   */
  deleteCustomModel(modelId: string): boolean {
    const config = this.configs.get(modelId);

    if (!config || !config.isCustom) {
      return false;
    }

    // 如果删除的是默认模型，需要先更改默认模型
    if (config.isDefault) {
      const enabledConfigs = this.getAllConfigs().filter(c => c.enabled && c.modelId !== modelId);
      if (enabledConfigs.length > 0) {
        this.setDefaultModel(enabledConfigs[0].modelId);
      }
    }

    this.configs.delete(modelId);
    console.log('[Model Config Manager] Deleted custom model:', modelId);

    return true;
  }

  /**
   * 启用/禁用模型
   */
  setModelEnabled(modelId: string, enabled: boolean): boolean {
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
  setDefaultModel(modelId: string): boolean {
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
  getDefaultModel(): string {
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
  getEnabledModels(): string[] {
    return this.getAllConfigs()
      .filter(c => c.enabled)
      .map(c => c.modelId);
  }

  /**
   * 检查模型是否启用
   */
  isModelEnabled(modelId: string): boolean {
    const config = this.configs.get(modelId);
    return config?.enabled ?? false;
  }

  /**
   * 检查模型是否为自定义模型
   */
  isCustomModel(modelId: string): boolean {
    const config = this.configs.get(modelId);
    return config?.isCustom ?? false;
  }
}

// 导出单例实例
export const modelConfigManager = new ModelConfigManager();
