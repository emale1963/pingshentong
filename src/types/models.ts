/**
 * 可用的大模型配置
 */
export type AIModelType = 'doubao-seed' | 'kimi-k2' | 'deepseek-r1';

export interface AIModel {
  id: AIModelType;
  name: string;
  description: string;
  modelId: string;
  provider: string;
}

/**
 * 可用的 AI 模型列表
 * 根据集成服务提供的模型ID配置
 */
export const AI_MODELS: Record<AIModelType, AIModel> = {
  'doubao-seed': {
    id: 'doubao-seed',
    name: '豆包 Seed Thinking',
    description: '字节跳动开发的推理增强型大语言模型，具备深度思考能力，适合复杂任务和专业分析',
    modelId: 'doubao-seed-1-6-thinking-250715',
    provider: '字节跳动',
  },
  'kimi-k2': {
    id: 'kimi-k2',
    name: 'Kimi K2',
    description: '月之暗面开发的长上下文大语言模型，适合复杂任务和长文档分析',
    modelId: 'kimi-k2-250905',
    provider: '月之暗面',
  },
  'deepseek-r1': {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    description: '深度求索开发的推理强化模型，适合复杂逻辑推理和专业分析',
    modelId: 'deepseek-r1-250528',
    provider: '深度求索',
  },
} as const;

/**
 * 获取模型详细信息
 */
export function getAIModel(modelId: string): AIModel | undefined {
  return Object.values(AI_MODELS).find(model => model.modelId === modelId);
}

/**
 * 默认使用的模型 - 优先使用Kimi K2
 */
export const DEFAULT_MODEL: AIModelType = 'kimi-k2';

/**
 * 所有的工程专业类型
 */
export type ProfessionType =
  | 'architecture'
  | 'structure'
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'fire'
  | 'road'
  | 'landscape'
  | 'interior'
  | 'cost';

/**
 * 工程专业配置
 */
export interface Profession {
  id: ProfessionType;
  name: string;
  prompt: string;
}

/**
 * 完整的工程专业列表
 */
export const ALL_PROFESSIONS: ProfessionType[] = [
  'architecture',
  'structure',
  'plumbing',
  'electrical',
  'hvac',
  'fire',
  'road',
  'landscape',
  'interior',
  'cost',
];
