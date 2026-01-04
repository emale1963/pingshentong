import { LLMClient, Config } from 'coze-coding-dev-sdk';

interface ReviewCriteria {
  code: string;
  name: string;
  description: string;
}

interface ReviewConfig {
  criteria: ReviewCriteria[];
  weightConfig: Record<string, number>;
}

interface ReviewResult {
  ai_analysis: string;
  overall_score: number;
  key_issues: Record<string, string>;
  suggestions: Record<string, string>;
}

export class AIReviewService {
  private client: LLMClient;

  constructor() {
    const config = new Config();
    this.client = new LLMClient(config);
  }

  async analyzeReport(reportContent: string, projectType?: string): Promise<ReviewResult> {
    const systemPrompt = `你是一位专业的建筑领域可研报告评审专家。请对以下建筑可研报告进行全面分析评估。

你需要从以下维度进行评审：

1. 可行性分析 (权重25%)
   - 技术可行性
   - 经济可行性
   - 市场可行性

2. 技术方案 (权重20%)
   - 技术路线的合理性
   - 技术先进性
   - 工程实施可行性

3. 经济指标 (权重20%)
   - 投资估算合理性
   - 经济效益分析
   - 投资回报率分析

4. 环境影响 (权重15%)
   - 环境影响评估完整性
   - 环保措施有效性
   - 可持续发展考虑

5. 安全保障 (权重10%)
   - 安全生产方案
   - 风险评估与控制
   - 应急预案

6. 合规性 (权重10%)
   - 政策符合性
   - 法规遵循性
   - 审批程序合规性

请按以下JSON格式返回评审结果（必须严格遵循此格式）：

{
  "ai_analysis": "整体评审意见（详细分析报告的优缺点）",
  "overall_score": 0-100之间的综合评分,
  "key_issues": {
    "可行性分析": "发现的具体问题",
    "技术方案": "发现的具体问题",
    "经济指标": "发现的具体问题",
    "环境影响": "发现的具体问题",
    "安全保障": "发现的具体问题",
    "合规性": "发现的具体问题"
  },
  "suggestions": {
    "可行性分析": "改进建议",
    "技术方案": "改进建议",
    "经济指标": "改进建议",
    "环境影响": "改进建议",
    "安全保障": "改进建议",
    "合规性": "改进建议"
  }
}

评分标准：
- 90-100分：优秀，报告完整、深入，各项指标优异
- 80-89分：良好，报告较为完整，主要方面表现良好
- 70-79分：中等，报告基本完整，但存在一些不足
- 60-69分：及格，报告存在较多问题
- 60分以下：不及格，报告存在严重问题`;

    const userPrompt = `请对以下建筑可研报告进行评审分析：

项目类型：${projectType || '未指定'}

报告内容：
${reportContent}

请严格按照JSON格式返回评审结果。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    try {
      const response = await this.client.invoke(messages, {
        model: 'doubao-seed-1-6-251015',
        temperature: 0.7,
        thinking: 'enabled',
      });

      // 解析AI返回的JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI返回格式不正确');
      }

      const reviewResult = JSON.parse(jsonMatch[0]);

      // 验证返回的数据结构
      if (!reviewResult.ai_analysis || typeof reviewResult.overall_score !== 'number') {
        throw new Error('评审结果数据结构不完整');
      }

      return reviewResult as ReviewResult;
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw error;
    }
  }

  async analyzeReportStream(
    reportContent: string,
    projectType?: string
  ): Promise<AsyncGenerator<any>> {
    const systemPrompt = `你是一位专业的建筑领域可研报告评审专家。请对以下建筑可研报告进行全面分析评估。

需要从可行性分析、技术方案、经济指标、环境影响、安全保障、合规性等维度进行评审。

请按JSON格式返回评审结果，包含：
- ai_analysis: 整体评审意见
- overall_score: 0-100的综合评分
- key_issues: 各维度发现的问题
- suggestions: 各维度的改进建议`;

    const userPrompt = `请对以下建筑可研报告进行评审分析：
项目类型：${projectType || '未指定'}
报告内容：${reportContent}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    return this.client.stream(messages, {
      model: 'doubao-seed-1-6-251015',
      temperature: 0.7,
    });
  }
}

// 导出单例
export const aiReviewService = new AIReviewService();
