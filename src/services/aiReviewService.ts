import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { PROFESSION_NAMES, PROFESSION_PROMPTS } from '@/lib/prompts';
import { AIModelType, AI_MODELS, DEFAULT_MODEL } from '@/types/models';

interface ReviewItem {
  id: string;
  description: string;
  standard: string;
  suggestion: string;
  display_order?: number;
}

interface ReviewResult {
  profession: string;
  ai_analysis: string;
  review_items: ReviewItem[];
}

export class AIReviewService {
  private client?: LLMClient;

  private getClient(): LLMClient {
    if (!this.client) {
      try {
        const config = new Config();
        this.client = new LLMClient(config);
      } catch (error) {
        console.error('[AI Review Service] Failed to initialize LLM client:', error);
        throw new Error('AI服务初始化失败：缺少API密钥配置');
      }
    }
    return this.client;
  }

  async analyzeProfession(
    profession: string,
    reportSummary: string,
    modelType: AIModelType = DEFAULT_MODEL
  ): Promise<ReviewResult> {
    const systemPrompt = PROFESSION_PROMPTS[profession];
    if (!systemPrompt) {
      throw new Error(`Unsupported profession: ${profession}`);
    }

    const professionName = PROFESSION_NAMES[profession] || profession;
    const model = AI_MODELS[modelType] || AI_MODELS[DEFAULT_MODEL];

    const userPrompt = `请对以下报告的${professionName}专业进行评审：

报告概述：
${reportSummary}

请严格按照JSON格式返回评审结果，包含：
- ai_analysis: ${professionName}专业的整体评价和分析
- review_items: 评审意见数组（5-10条），每条意见包含id、description、standard、suggestion

评审意见格式要求：
每条意见必须包含三部分内容：
1. description: 问题描述（具体发现的问题）
2. standard: 规范依据（相关规范名称、编号及具体条款）
3. suggestion: 修改建议（具体可行的修改建议）

注意：
1. id使用格式：${profession.substring(0, 4)}_序号（如arch_1、stru_1）
2. 请提供5-10条评审意见
3. 确保每条意见都有问题描述、规范依据和修改建议三部分
4. 标准应引用相关的国家规范或标准（如GB 50016-2014第X.X.X条）`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    try {
      console.log(`[AI Review] Starting ${profession} profession analysis with model: ${model.name}...`);
      
      // 设置超时时间（60秒）
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI评审超时')), 60000);
      });

      const response = await Promise.race([
        this.getClient().invoke(messages, {
          model: model.modelId,
          temperature: 0.7,
          thinking: 'enabled',
        }),
        timeoutPromise,
      ]);

      console.log(`[AI Review] ${profession} analysis completed, parsing response...`);

      // 解析AI返回的JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[AI Review] ${profession}: AI返回内容不包含有效的JSON`);
        console.log(`[AI Review] ${profession} Raw response:`, response.content.substring(0, 500));
        throw new Error('AI返回格式不正确，无法解析JSON');
      }

      const result = JSON.parse(jsonMatch[0]);

      // 验证数据结构
      if (!result.ai_analysis || !Array.isArray(result.review_items)) {
        throw new Error('评审结果数据结构不完整');
      }

      // 生成唯一的ID并添加display_order
      result.review_items = result.review_items.map((item: any, index: number) => ({
        id: item.id || `${profession.substring(0, 4)}_${index + 1}`,
        description: item.description,
        standard: item.standard,
        suggestion: item.suggestion,
        display_order: index + 1,
      }));

      console.log(`[AI Review] ${profession} review generated: ${result.review_items.length} items`);

      return {
        profession,
        ai_analysis: result.ai_analysis,
        review_items: result.review_items,
      } as ReviewResult;
    } catch (error) {
      console.error(`[AI Review] Error analyzing ${profession}:`, error);

      // 如果AI失败，返回默认的评审结果
      console.log(`[AI Review] ${profession}: Using fallback review`);
      return {
        profession,
        ai_analysis: `${PROFESSION_NAMES[profession] || profession}专业评审：由于AI分析服务暂时不可用，无法提供详细分析。建议人工审查该专业的设计内容，确保符合相关国家规范和标准。`,
        review_items: [
          {
            id: `${profession.substring(0, 4)}_1`,
            description: 'AI评审服务暂时不可用，建议人工审查',
            standard: '建议参考相关国家规范',
            suggestion: '请联系管理员检查AI服务状态，或进行人工评审',
            display_order: 1,
          },
        ],
      } as ReviewResult;
    }
  }

  async analyzeReport(
    professions: string[],
    reportSummary: string,
    modelType: AIModelType = DEFAULT_MODEL
  ): Promise<ReviewResult[]> {
    console.log(`[AI Review] Starting analysis for ${professions.length} professions with model: ${modelType}...`);
    
    const results: ReviewResult[] = [];
    
    // 并行分析各个专业
    const promises = professions.map(profession => 
      this.analyzeProfession(profession, reportSummary, modelType)
    );

    try {
      const professionResults = await Promise.all(promises);
      results.push(...professionResults);
      console.log(`[AI Review] All professions analyzed successfully`);
    } catch (error) {
      console.error('[AI Review] Error during parallel analysis:', error);
      // 如果并行失败，尝试串行
      for (const profession of professions) {
        try {
          const result = await this.analyzeProfession(profession, reportSummary, modelType);
          results.push(result);
        } catch (err) {
          console.error(`[AI Review] Failed to analyze ${profession}:`, err);
        }
      }
    }

    return results;
  }
}

// 导出单例
export const aiReviewService = new AIReviewService();
