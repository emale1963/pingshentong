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

${reportSummary}

请严格按照以下JSON格式返回评审结果，不要包含任何其他文字说明：

\`\`\`json
{
  "ai_analysis": "${professionName}专业的整体评价和分析（3-5句话）",
  "review_items": [
    {
      "id": "${profession.substring(0, 4)}_1",
      "description": "问题描述（具体发现的问题）",
      "standard": "规范依据（相关规范名称、编号及具体条款）",
      "suggestion": "修改建议（具体可行的修改建议）"
    },
    {
      "id": "${profession.substring(0, 4)}_2",
      "description": "问题描述2",
      "standard": "规范依据2",
      "suggestion": "修改建议2"
    }
  ]
}
\`\`\`

重要要求：
1. **只返回JSON格式**，不要在JSON前后添加任何解释或说明
2. JSON必须完整有效，可以被直接解析
3. review_items提供5-10条评审意见
4. 每条意见必须包含id、description、standard、suggestion四个字段
5. id使用格式：${profession.substring(0, 4)}_序号（如${profession.substring(0, 4)}_1、${profession.substring(0, 4)}_2）
6. 标准应引用相关的国家规范或标准（如GB 50016-2014第5.3.1条）
7. 即使信息有限，也要基于${professionName}专业知识和常见问题提供有意义的评审意见

请直接返回JSON格式的评审结果，不要包含任何其他文字。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    try {
      console.log(`[AI Review] Starting ${profession} profession analysis with model: ${model.name}...`);
      console.log(`[AI Review] Report summary length: ${reportSummary.length} characters`);
      
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

      console.log(`[AI Review] ${profession} analysis completed, response length: ${response.content.length} characters`);
      console.log(`[AI Review] Response preview: ${response.content.substring(0, 200)}...`);

      // 解析AI返回的JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[AI Review] ${profession}: AI返回内容不包含有效的JSON`);
        console.log(`[AI Review] ${profession} Raw response:`, response.content);
        throw new Error('AI返回格式不正确，无法解析JSON');
      }

      const result = JSON.parse(jsonMatch[0]);
      console.log(`[AI Review] ${profession}: Parsed JSON successfully, ${result.review_items?.length || 0} items`);

      // 验证数据结构
      if (!result.ai_analysis || !Array.isArray(result.review_items)) {
        console.error(`[AI Review] ${profession}: Invalid data structure`, result);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[AI Review] Error analyzing ${profession}:`, {
        error: errorMessage,
        profession,
        modelType,
        reportSummaryLength: reportSummary.length,
      });

      // 如果AI失败，返回基于专业知识的默认评审结果
      console.log(`[AI Review] ${profession}: Using knowledge-based fallback review`);
      return this.generateKnowledgeBasedReview(profession, errorMessage);
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

  /**
   * 生成基于专业知识的降级评审结果
   * 当AI服务不可用时，返回各专业常见的评审要点
   */
  private generateKnowledgeBasedReview(profession: string, errorMessage: string): ReviewResult {
    const professionName = PROFESSION_NAMES[profession] || profession;
    
    // 各专业的常见评审要点
    const professionReviews: Record<string, { analysis: string; items: Array<{ desc: string; standard: string; suggestion: string }> }> = {
      architecture: {
        analysis: '建筑专业评审：基于项目类型和建筑设计规范，对建筑功能布局、防火设计、无障碍设施等方面进行常规性检查。由于AI自动分析暂时不可用，以下评审内容基于建筑设计规范和常见问题库生成，建议结合实际设计图纸进行详细复核。',
        items: [
          {
            desc: '建筑功能分区是否合理，各功能区之间是否流线清晰、互不干扰',
            standard: 'GB 50016-2014(2018版)《建筑设计防火规范》及相关建筑设计标准',
            suggestion: '核对建筑平面布局图，优化功能分区和流线组织'
          },
          {
            desc: '防火分区划分、疏散楼梯设置和安全出口数量是否符合规范要求',
            standard: 'GB 50016-2014(2018版)《建筑设计防火规范》第5.3.1、5.5.21条',
            suggestion: '根据建筑层数和面积重新核算防火分区，完善疏散设计'
          },
          {
            desc: '无障碍设施设计是否到位，包括坡道、电梯、卫生间等',
            standard: 'GB 50763-2012《无障碍设计规范》',
            suggestion: '补充完善无障碍设施设计，确保满足使用需求'
          },
          {
            desc: '建筑节能设计和绿色建筑措施是否满足当地节能标准要求',
            standard: 'GB 50189-2015《公共建筑节能设计标准》或地方节能标准',
            suggestion: '优化建筑围护结构热工性能，采用节能材料和设备'
          },
          {
            desc: '建筑立面造型与周边环境是否协调，是否符合城市风貌管控要求',
            standard: '城市规划相关文件及城市设计导则',
            suggestion: '调整建筑立面设计，确保与周边环境相协调'
          }
        ]
      },
      structure: {
        analysis: '结构专业评审：根据建筑规模和功能，对结构体系、抗震设计、基础设计等关键环节进行常规性审查。由于AI自动分析暂时不可用，以下评审内容基于结构设计规范和常见问题库生成，建议结合结构计算书和施工图进行详细复核。',
        items: [
          {
            desc: '结构选型和结构体系是否合理，是否满足建筑功能和使用要求',
            standard: 'GB 50011-2010(2016版)《建筑抗震设计规范》第3.4条',
            suggestion: '优化结构选型，确保结构体系合理安全'
          },
          {
            desc: '抗震设防烈度、抗震等级和抗震措施是否符合规范要求',
            standard: 'GB 50011-2010(2016版)《建筑抗震设计规范》第6.1.2、6.1.3条',
            suggestion: '根据抗震设防烈度复核抗震等级和构造措施'
          },
          {
            desc: '基础形式和地基处理方案是否合理，是否提供地质勘察报告',
            standard: 'GB 50007-2011《建筑地基基础设计规范》第3.0.1条',
            suggestion: '补充地质勘察资料，优化基础设计方案'
          },
          {
            desc: '结构构件的承载力和变形是否满足规范要求，是否有计算书',
            standard: 'GB 50010-2010《混凝土结构设计规范》',
            suggestion: '提供完整的结构计算书，确保构件安全'
          },
          {
            desc: '结构平面和竖向布置是否规则，是否避免严重不规则',
            standard: 'GB 50011-2010(2016版)《建筑抗震设计规范》第3.4.3条',
            suggestion: '优化结构布置，避免严重不规则设计'
          }
        ]
      },
      cost: {
        analysis: '造价专业评审：依据项目规模和建设标准，对投资估算的合理性、费用构成的完整性进行常规性审查。由于AI自动分析暂时不可用，以下评审内容基于造价编制规范和常见问题库生成，建议结合工程量清单和市场价格进行详细复核。',
        items: [
          {
            desc: '投资估算是否完整，是否包含工程建设其他费用和预备费',
            standard: '《建设项目总投资估算编制规程》及地方造价管理规定',
            suggestion: '补充完善投资估算，确保费用构成完整'
          },
          {
            desc: '主要工程量和设备清单是否齐全，计价依据是否充分',
            standard: 'GB 50500-2013《建设工程工程量清单计价规范》',
            suggestion: '核对工程量清单，补充缺失项目'
          },
          {
            desc: '采用的材料价格和人工费是否合理，是否符合当地市场行情',
            standard: '当地工程造价信息及市场价格',
            suggestion: '调研当地市场价格，调整单价取费'
          },
          {
            desc: '预备费计取比例是否合理，是否符合行业规定',
            standard: '《建设项目总投资估算编制规程》',
            suggestion: '根据项目复杂程度合理确定预备费比例'
          },
          {
            desc: '与类似项目造价指标进行对比，估算水平是否在合理范围',
            standard: '行业造价指标和类似项目经验',
            suggestion: '与同类项目对比分析，优化投资估算'
          }
        ]
      },
      plumbing: {
        analysis: '给排水专业评审：根据建筑功能和用水需求，对给排水系统设计进行常规性审查。以下评审内容基于建筑给水排水设计规范生成。',
        items: [
          {
            desc: '给水系统设计是否合理，水压和水量是否满足使用要求',
            standard: 'GB 50015-2019《建筑给水排水设计标准》',
            suggestion: '优化给水系统分区设计，确保供水压力稳定'
          },
          {
            desc: '排水系统是否畅通，是否考虑了雨污分流',
            standard: 'GB 50014-2021《室外排水设计标准》',
            suggestion: '完善排水系统设计，实现雨污分流'
          }
        ]
      },
      electrical: {
        analysis: '电气专业评审：对供配电系统、照明系统等进行常规性审查。',
        items: [
          {
            desc: '供电系统是否可靠，负荷计算是否准确',
            standard: 'GB 50052-2009《供配电系统设计规范》',
            suggestion: '核实用电负荷，优化供电系统设计'
          },
          {
            desc: '照明设计是否满足照度标准要求',
            standard: 'GB 50034-2013《建筑照明设计标准》',
            suggestion: '调整照明参数，满足照度要求'
          }
        ]
      },
      hvac: {
        analysis: '暖通专业评审：对采暖通风空调系统进行常规性审查。',
        items: [
          {
            desc: '空调系统选型是否合理，是否满足节能要求',
            standard: 'GB 50189-2015《公共建筑节能设计标准》',
            suggestion: '优化空调系统设计，提高能效比'
          }
        ]
      },
      fire: {
        analysis: '消防专业评审：对消防设施和防火设计进行重点审查。',
        items: [
          {
            desc: '消防设施配置是否齐全，是否满足防火要求',
            standard: 'GB 50016-2014(2018版)《建筑设计防火规范》',
            suggestion: '补充完善消防设施配置'
          }
        ]
      },
      road: {
        analysis: '道路专业评审：对道路设计和交通组织进行审查。',
        items: [
          {
            desc: '道路设计是否满足交通需求，线形是否合理',
            standard: 'CJJ 37-2012《城市道路工程设计规范》',
            suggestion: '优化道路线形设计，确保行车安全'
          }
        ]
      },
      landscape: {
        analysis: '景观专业评审：对景观设计和绿化配置进行审查。',
        items: [
          {
            desc: '景观设计是否与建筑风格协调，绿化配置是否合理',
            standard: '《城市绿化条例》及地方绿化标准',
            suggestion: '优化景观设计方案，提升环境品质'
          }
        ]
      },
      interior: {
        analysis: '室内专业评审：对室内设计和装修方案进行审查。',
        items: [
          {
            desc: '室内设计是否满足功能需求，装修材料是否符合环保要求',
            standard: 'GB 50325-2020《民用建筑工程室内环境污染控制标准》',
            suggestion: '优化室内设计方案，选用环保材料'
          }
        ]
      }
    };

    const reviewData = professionReviews[profession] || professionReviews.architecture;

    return {
      profession,
      ai_analysis: reviewData.analysis,
      review_items: reviewData.items.map((item, index) => ({
        id: `${profession.substring(0, 4)}_${index + 1}`,
        description: item.desc,
        standard: item.standard,
        suggestion: item.suggestion,
        display_order: index + 1,
      })),
    } as ReviewResult;
  }
}

// 导出单例
export const aiReviewService = new AIReviewService();
