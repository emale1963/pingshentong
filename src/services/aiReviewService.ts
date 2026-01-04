import { LLMClient, Config } from 'coze-coding-dev-sdk';

const PROFESSION_NAMES: Record<string, string> = {
  architecture: '建筑',
  structure: '结构',
  plumbing: '给排水',
  electrical: '电气',
  hvac: '暖通',
  fire: '消防',
  landscape: '景观',
  interior: '室内',
  cost: '造价',
};

const PROFESSION_PROMPTS: Record<string, string> = {
  architecture: `你是专业的建筑设计师和评审专家，负责评审建筑可研报告中的建筑专业部分。
评审要点：
1. 建筑布局和功能分区是否合理
2. 建筑防火设计和消防疏散通道
3. 无障碍设施和通用设计
4. 建筑外观和立面设计
5. 建筑节能和绿色建筑设计
6. 建筑空间利用率

请严格按照JSON格式返回评审结果：
{
  "ai_analysis": "建筑专业的整体评价和分析",
  "overall_score": 75-95之间的综合评分,
  "review_items": [
    {
      "id": "唯一编号",
      "description": "问题描述",
      "standard": "依据的国家规范或标准（如GB 50016-2014）",
      "severity": "high/medium/low",
      "suggestion": "具体的修改建议"
    }
  ]
}`,

  structure: `你是专业的结构工程师和评审专家，负责评审建筑可研报告中的结构专业部分。
评审要点：
1. 结构体系的合理性和安全性
2. 抗震设计和抗震措施
3. 基础设计和地基处理
4. 主要构件的截面尺寸和配筋
5. 结构材料的选用
6. 结构计算和验算

请严格按照JSON格式返回评审结果：
{
  "ai_analysis": "结构专业的整体评价和分析",
  "overall_score": 75-95之间的综合评分,
  "review_items": [
    {
      "id": "唯一编号",
      "description": "问题描述",
      "standard": "依据的国家规范或标准（如GB 50011-2010）",
      "severity": "high/medium/low",
      "suggestion": "具体的修改建议"
    }
  ]
}`,

  plumbing: `你是专业的给排水工程师和评审专家，负责评审建筑可研报告中的给排水专业部分。
评审要点：
1. 给水系统的设计和参数
2. 排水系统和污水处理
3. 消防给水系统设计
4. 节水措施和水资源利用
5. 管材和设备的选型
6. 管道布置和施工可行性

请严格按照JSON格式返回评审结果：
{
  "ai_analysis": "给排水专业的整体评价和分析",
  "overall_score": 75-95之间的综合评分,
  "review_items": [
    {
      "id": "唯一编号",
      "description": "问题描述",
      "standard": "依据的国家规范或标准",
      "severity": "high/medium/low",
      "suggestion": "具体的修改建议"
    }
  ]
}`,

  electrical: `你是专业的电气工程师和评审专家，负责评审建筑可研报告中的电气专业部分。
评审要点：
1. 供电系统和配电设计
2. 照明系统和照明设计
3. 防雷和接地系统
4. 弱电系统和智能化设计
5. 消防电气设计
6. 电气节能措施

请严格按照JSON格式返回评审结果：
{
  "ai_analysis": "电气专业的整体评价和分析",
  "overall_score": 75-95之间的综合评分,
  "review_items": [
    {
      "id": "唯一编号",
      "description": "问题描述",
      "standard": "依据的国家规范或标准",
      "severity": "high/medium/low",
      "suggestion": "具体的修改建议"
    }
  ]
}`,

  hvac: `你是专业的暖通工程师和评审专家，负责评审建筑可研报告中的暖通专业部分。
评审要点：
1. 空调系统设计选型
2. 通风系统和排烟设计
3. 冷热源系统设计
4. 空调系统的节能设计
5. 暖通设备的选型
6. 管道和风管设计

请严格按照JSON格式返回评审结果：
{
  "ai_analysis": "暖通专业的整体评价和分析",
  "overall_score": 75-95之间的综合评分,
  "review_items": [
    {
      "id": "唯一编号",
      "description": "问题描述",
      "standard": "依据的国家规范或标准",
      "severity": "high/medium/low",
      "suggestion": "具体的修改建议"
    }
  ]
}`,

  fire: `你是专业的消防工程师和评审专家，负责评审建筑可研报告中的消防专业部分。
评审要点：
1. 建筑防火分区划分
2. 安全疏散设计
3. 消防设施配置
4. 自动报警系统设计
5. 自动喷水灭火系统
6. 防排烟系统设计

请严格按照JSON格式返回评审结果：
{
  "ai_analysis": "消防专业的整体评价和分析",
  "overall_score": 75-95之间的综合评分,
  "review_items": [
    {
      "id": "唯一编号",
      "description": "问题描述",
      "standard": "依据的国家规范或标准",
      "severity": "high/medium/low",
      "suggestion": "具体的修改建议"
    }
  ]
}`,

  landscape: `你是专业的景观设计师和评审专家，负责评审建筑可研报告中的景观专业部分。
评审要点：
1. 景观总体布局
2. 绿化设计和植物配置
3. 景观小品和硬质景观
4. 水景设计
5. 景观照明设计
6. 生态环保和可持续发展

请严格按照JSON格式返回评审结果：
{
  "ai_analysis": "景观专业的整体评价和分析",
  "overall_score": 75-95之间的综合评分,
  "review_items": [
    {
      "id": "唯一编号",
      "description": "问题描述",
      "standard": "依据的国家规范或标准",
      "severity": "high/medium/low",
      "suggestion": "具体的修改建议"
    }
  ]
}`,

  interior: `你是专业的室内设计师和评审专家，负责评审建筑可研报告中的室内专业部分。
评审要点：
1. 室内功能布局
2. 室内装修设计风格
3. 室内材料选用
4. 室内照明设计
5. 室内色彩和材质搭配
6. 室内人体工程学

请严格按照JSON格式返回评审结果：
{
  "ai_analysis": "室内专业的整体评价和分析",
  "overall_score": 75-95之间的综合评分,
  "review_items": [
    {
      "id": "唯一编号",
      "description": "问题描述",
      "standard": "依据的国家规范或标准",
      "severity": "high/medium/low",
      "suggestion": "具体的修改建议"
    }
  ]
}`,

  cost: `你是专业的造价工程师和评审专家，负责评审建筑可研报告中的造价专业部分。
评审要点：
1. 投资估算的合理性
2. 工程量计算的准确性
3. 定额和价格的选用
4. 费用构成的完整性
5. 经济效益分析
6. 投资回报和风险评估

请严格按照JSON格式返回评审结果：
{
  "ai_analysis": "造价专业的整体评价和分析",
  "overall_score": 75-95之间的综合评分,
  "review_items": [
    {
      "id": "唯一编号",
      "description": "问题描述",
      "standard": "依据的国家规范或标准",
      "severity": "high/medium/low",
      "suggestion": "具体的修改建议"
    }
  ]
}`,
};

interface ReviewItem {
  id: string;
  description: string;
  standard: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

interface ReviewResult {
  profession: string;
  ai_analysis: string;
  overall_score: number;
  review_items: ReviewItem[];
}

export class AIReviewService {
  private client: LLMClient;

  constructor() {
    const config = new Config();
    this.client = new LLMClient(config);
  }

  async analyzeProfession(
    profession: string,
    reportSummary: string
  ): Promise<ReviewResult> {
    const systemPrompt = PROFESSION_PROMPTS[profession];
    if (!systemPrompt) {
      throw new Error(`Unsupported profession: ${profession}`);
    }

    const professionName = PROFESSION_NAMES[profession] || profession;

    const userPrompt = `请对以下建筑可研报告的${professionName}专业进行评审：

报告概述：
${reportSummary}

请严格按照JSON格式返回评审结果，包含：
- ai_analysis: ${professionName}专业的整体评价和分析（详细说明该专业的优缺点）
- overall_score: 75-95之间的综合评分（根据整体质量给出合理评分）
- review_items: 评审意见数组，每条意见包含id、description、standard、severity、suggestion

注意：
1. severity必须为"high"、"medium"或"low"之一
2. standard应引用相关的国家规范或标准（如GB 50016-2014）
3. id使用格式：${profession.substring(0, 4)}_序号（如arch_1、stru_1）
4. review_items至少包含1-3条意见，根据实际情况调整`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    try {
      console.log(`[AI Review] Starting ${profession} profession analysis...`);
      
      // 设置超时时间（60秒）
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI评审超时')), 60000);
      });

      const response = await Promise.race([
        this.client.invoke(messages, {
          model: 'doubao-seed-1-6-251015',
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
      if (!result.ai_analysis || typeof result.overall_score !== 'number' || !Array.isArray(result.review_items)) {
        throw new Error('评审结果数据结构不完整');
      }

      // 生成唯一的ID
      result.review_items = result.review_items.map((item: any, index: number) => ({
        ...item,
        id: item.id || `${profession.substring(0, 4)}_${index + 1}`,
        confirmed: false,
      }));

      console.log(`[AI Review] ${profession} review generated: ${result.review_items.length} items, score: ${result.overall_score}`);

      return {
        profession,
        ai_analysis: result.ai_analysis,
        overall_score: result.overall_score,
        review_items: result.review_items,
      } as ReviewResult;
    } catch (error) {
      console.error(`[AI Review] Error analyzing ${profession}:`, error);
      
      // 如果AI失败，返回默认的评审结果
      console.log(`[AI Review] ${profession}: Using fallback review`);
      return {
        profession,
        ai_analysis: `${PROFESSION_NAMES[profession] || profession}专业评审：由于AI分析服务暂时不可用，无法提供详细分析。建议人工审查该专业的设计内容，确保符合相关国家规范和标准。`,
        overall_score: 75,
        review_items: [
          {
            id: `${profession.substring(0, 4)}_1`,
            description: 'AI评审服务暂时不可用，建议人工审查',
            standard: '建议参考相关国家规范',
            severity: 'medium',
            suggestion: '请联系管理员检查AI服务状态，或进行人工评审',
          },
        ],
      } as ReviewResult;
    }
  }

  async analyzeReport(
    professions: string[],
    reportSummary: string
  ): Promise<ReviewResult[]> {
    console.log(`[AI Review] Starting analysis for ${professions.length} professions...`);
    
    const results: ReviewResult[] = [];
    
    // 并行分析各个专业
    const promises = professions.map(profession => 
      this.analyzeProfession(profession, reportSummary)
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
          const result = await this.analyzeProfession(profession, reportSummary);
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
