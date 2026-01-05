import { NextResponse } from 'next/server';
import { PROFESSION_PROMPTS, PROFESSION_NAMES } from '@/lib/prompts';
import { professionPromptManager, professionFallbackReviewManager } from '@/storage/database/professionPromptManager';

/**
 * 初始化评审提示词到数据库
 * 将硬编码的提示词导入到数据库中
 */
export async function POST() {
  try {
    let createdPrompts = 0;
    let updatedPrompts = 0;
    let createdReviews = 0;
    
    // 1. 导入系统提示词
    for (const [profession, promptContent] of Object.entries(PROFESSION_PROMPTS)) {
      const existingPrompt = await professionPromptManager.getPromptByProfession(profession);
      
      if (existingPrompt) {
        // 如果已存在，检查是否需要更新
        if (existingPrompt.promptContent !== promptContent) {
          await professionPromptManager.updatePrompt(existingPrompt.id, {
            promptContent,
            promptVersion: '1.1',
            isActive: true,
          });
          updatedPrompts++;
        }
      } else {
        // 如果不存在，创建新的
        await professionPromptManager.createPrompt({
          profession,
          promptContent,
          promptVersion: '1.0',
          isActive: true,
          createdBy: 'system',
        });
        createdPrompts++;
      }
    }

    // 2. 导入降级评审要点
    const professionReviews: Record<string, Array<{ desc: string; standard: string; suggestion: string }>> = {
      architecture: [
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
      ],
      structure: [
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
      ],
      cost: [
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
      ],
      plumbing: [
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
      ],
      electrical: [
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
      ],
      hvac: [
        {
          desc: '空调系统选型是否合理，是否满足节能要求',
          standard: 'GB 50189-2015《公共建筑节能设计标准》',
          suggestion: '优化空调系统设计，提高能效比'
        }
      ],
      fire: [
        {
          desc: '消防设施配置是否齐全，是否满足防火要求',
          standard: 'GB 50016-2014(2018版)《建筑设计防火规范》',
          suggestion: '补充完善消防设施配置'
        }
      ],
      road: [
        {
          desc: '道路设计是否满足交通需求，线形是否合理',
          standard: 'CJJ 37-2012《城市道路工程设计规范》',
          suggestion: '优化道路线形设计，确保行车安全'
        }
      ],
      landscape: [
        {
          desc: '景观设计是否与建筑风格协调，绿化配置是否合理',
          standard: '《城市绿化条例》及地方绿化标准',
          suggestion: '优化景观设计方案，提升环境品质'
        }
      ],
      interior: [
        {
          desc: '室内设计是否满足功能需求，装修材料是否符合环保要求',
          standard: 'GB 50325-2020《民用建筑工程室内环境污染控制标准》',
          suggestion: '优化室内设计方案，选用环保材料'
        }
      ]
    };

    // 为每个专业导入降级评审要点
    for (const [profession, reviews] of Object.entries(professionReviews)) {
      // 先删除该专业的所有旧评审要点
      await professionFallbackReviewManager.deleteReviewsByProfession(profession);
      
      // 创建新的评审要点
      const reviewData = reviews.map((item, index) => ({
        profession,
        description: item.desc,
        standard: item.standard,
        suggestion: item.suggestion,
        displayOrder: index + 1,
        isActive: true,
        createdBy: 'system',
      }));
      
      await professionFallbackReviewManager.createReviewsBatch(reviewData);
      createdReviews += reviewData.length;
    }

    return NextResponse.json({
      success: true,
      message: '初始化完成',
      data: {
        createdPrompts,
        updatedPrompts,
        createdReviews,
      },
    });
  } catch (error) {
    console.error('Failed to initialize prompts:', error);
    return NextResponse.json(
      { success: false, error: '初始化失败' },
      { status: 500 }
    );
  }
}
