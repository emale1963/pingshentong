// 临时内存存储（用于数据库未配置时的降级方案）
interface ReviewItem {
  id: string;
  description: string;
  standard: string;
  suggestion: string;
  confirmed: boolean;
  display_order?: number;
}

interface TempReview {
  id: number;
  report_id: number;
  profession: string;
  ai_analysis: string;
  manual_review: string;
  review_items: ReviewItem[];
  confirmed_items: string[];
  created_at: string;
  updated_at: string;
}

interface TempReport {
  id: number;
  user_id: number;
  professions: string[];
  file_url: string;
  file_name: string;
  file_size: number;
  status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  reviews?: TempReview[];
}

class TempStorage {
  private reports: Map<number, TempReport> = new Map();
  private reviews: Map<number, TempReview[]> = new Map();
  private idCounter: number = 1;
  private reviewIdCounter: number = 1;

  createReport(data: Omit<TempReport, 'id' | 'created_at' | 'updated_at'>): TempReport {
    const id = this.idCounter++;
    const now = new Date().toISOString();
    const report: TempReport = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    this.reports.set(id, report);
    return report;
  }

  getReport(id: number): TempReport | undefined {
    const report = this.reports.get(id);
    if (report && report.id) {
      return {
        ...report,
        reviews: this.reviews.get(report.id) || [],
      };
    }
    return report;
  }

  getAllReports(): TempReport[] {
    return Array.from(this.reports.values())
      .map(report => ({
        ...report,
        reviews: this.reviews.get(report.id) || [],
      }))
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  updateReport(id: number, updates: Partial<TempReport>): TempReport | undefined {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const updated = {
      ...report,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.reports.set(id, updated);
    return updated;
  }

  deleteReport(id: number): boolean {
    this.reviews.delete(id);
    return this.reports.delete(id);
  }

  // 评审相关操作
  startReview(reportId: number): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    this.updateReport(reportId, { status: 'reviewing' });
    return true;
  }

  completeReview(reportId: number, reviews: TempReview[]): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    this.updateReport(reportId, { status: 'completed' });
    this.reviews.set(reportId, reviews);
    return true;
  }

  failReview(reportId: number, errorMessage: string): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;

    this.updateReport(reportId, { 
      status: 'failed', 
      error_message: errorMessage 
    });
    return false;
  }

  confirmReviewItem(reportId: number, profession: string, itemId: string): boolean {
    const report = this.reviews.get(reportId);
    if (!report) return false;

    const review = report.find(r => r.profession === profession);
    if (!review) return false;

    const item = review.review_items.find(i => i.id === itemId);
    if (!item) return false;

    item.confirmed = !item.confirmed;
    if (item.confirmed && !review.confirmed_items.includes(itemId)) {
      review.confirmed_items.push(itemId);
    } else if (!item.confirmed) {
      const index = review.confirmed_items.indexOf(itemId);
      if (index > -1) {
        review.confirmed_items.splice(index, 1);
      }
    }

    return true;
  }

  // 生成模拟评审数据
  generateMockReviews(professions: string[], reportId: number): TempReview[] {
    const reviewTemplates: Record<string, {
      profession: string;
      ai_analysis: string;
      review_items: Array<{
        id: string;
        description: string;
        standard: string;
        suggestion: string;
      }>;
    }> = {
      architecture: {
        profession: 'architecture',
        ai_analysis: '建筑专业总体设计合理，建筑功能布局清晰。但在消防疏散通道设计和无障碍设施方面存在一些问题，建议进一步优化。',
        review_items: [
          {
            id: 'arch_1',
            description: '建筑防火分区划分不符合规范要求',
            standard: 'GB 50016-2014 建筑设计防火规范 第5.3.1条',
            suggestion: '重新划分防火分区，确保每个防火分区面积不超过规范要求，并设置符合要求的防火墙和防火门'
          },
          {
            id: 'arch_2',
            description: '无障碍设施设计不完善',
            standard: 'GB 50763-2012 无障碍设计规范 第3.7条',
            suggestion: '补充设置无障碍通道、无障碍卫生间和无障碍电梯，坡道坡度不大于1:12'
          },
          {
            id: 'arch_3',
            description: '建筑立面设计可进一步优化',
            standard: 'GB 50096-2011 住宅设计规范 第5.4条',
            suggestion: '建议增加建筑立面层次感，优化遮阳设计，提升建筑节能性能'
          },
          {
            id: 'arch_4',
            description: '建筑疏散通道宽度不足',
            standard: 'GB 50016-2014 建筑设计防火规范 第5.5.18条',
            suggestion: '增加疏散通道宽度至不小于1.2m，确保人员疏散安全'
          },
          {
            id: 'arch_5',
            description: '建筑节能设计需要加强',
            standard: 'GB 50189-2015 公共建筑节能设计标准 第3.3.1条',
            suggestion: '优化建筑围护结构热工性能，采用节能门窗和保温材料'
          },
          {
            id: 'arch_6',
            description: '建筑空间利用率有待提高',
            standard: 'GB 50096-2011 住宅设计规范 第5.1.2条',
            suggestion: '优化平面布局设计，提高空间利用率，减少无效空间'
          },
          {
            id: 'arch_7',
            description: '建筑采光设计不符合要求',
            standard: 'GB 50033-2013 建筑采光设计标准 第4.0.2条',
            suggestion: '增加采光面积，优化窗户设计，确保室内采光充足'
          },
          {
            id: 'arch_8',
            description: '建筑通风设计需要改善',
            standard: 'GB 50736-2012 民用建筑供暖通风与空气调节设计规范 第3.0.6条',
            suggestion: '优化通风系统设计，增加自然通风面积，改善室内空气质量'
          }
        ],
      },
      structure: {
        profession: 'structure',
        ai_analysis: '结构设计整体安全可靠，结构体系合理。但在抗震设计和构件配筋方面需要进一步优化。',
        review_items: [
          {
            id: 'struct_1',
            description: '部分柱截面尺寸偏小',
            standard: 'GB 50011-2010 建筑抗震设计规范 第6.3.3条',
            suggestion: '增加柱截面尺寸至满足轴压比要求，或采用高强度混凝土'
          },
          {
            id: 'struct_2',
            description: '剪力墙配筋率略低于规范要求',
            standard: 'JGJ 3-2010 高层建筑混凝土结构技术规程 第7.2.18条',
            suggestion: '提高剪力墙竖向和水平分布钢筋配筋率至0.25%以上'
          },
          {
            id: 'struct_3',
            description: '梁柱节点抗震性能不足',
            standard: 'GB 50011-2010 建筑抗震设计规范 第6.2.13条',
            suggestion: '加强梁柱节点构造，增设加密区箍筋，提高节点抗震性能'
          },
          {
            id: 'struct_4',
            description: '基础设计深度不够',
            standard: 'GB 50007-2011 建筑地基基础设计规范 第5.2.4条',
            suggestion: '加深基础设计至持力层，或采用桩基础方案'
          },
          {
            id: 'struct_5',
            description: '结构材料选用不够合理',
            standard: 'GB 50010-2010 混凝土结构设计规范 第4.1.2条',
            suggestion: '优化结构材料选用，采用高性能混凝土和高强度钢筋'
          },
          {
            id: 'struct_6',
            description: '楼板厚度不足',
            standard: 'GB 50010-2010 混凝土结构设计规范 第9.1.2条',
            suggestion: '增加楼板厚度至满足规范要求的最小厚度'
          }
        ],
      },
      plumbing: {
        profession: 'plumbing',
        ai_analysis: '给排水系统设计基本合理，但在消防给水系统和排水系统设计方面存在一些问题。',
        review_items: [
          {
            id: 'plumb_1',
            description: '消防水泵房位置设置不合理',
            standard: 'GB 50974-2014 消防给水及消火栓系统技术规范 第5.5.2条',
            suggestion: '将消防水泵房设置在建筑首层，确保消防水泵自灌式吸水'
          },
          {
            id: 'plumb_2',
            description: '排水管径偏小，易堵塞',
            standard: 'GB 50015-2019 建筑给水排水设计标准 第4.4.7条',
            suggestion: '增大排水立管管径，优化排水坡度'
          },
          {
            id: 'plumb_3',
            description: '消防水池容量不足',
            standard: 'GB 50974-2014 消防给水及消火栓系统技术规范 第4.3.4条',
            suggestion: '扩大消防水池容量，确保消防用水量满足规范要求'
          },
          {
            id: 'plumb_4',
            description: '给水系统水压不稳定',
            standard: 'GB 50015-2019 建筑给水排水设计标准 第3.3.6条',
            suggestion: '增设稳压设备，确保给水系统水压稳定'
          },
          {
            id: 'plumb_5',
            description: '雨水排放系统设计不完善',
            standard: 'GB 50015-2019 建筑给水排水设计标准 第4.9.12条',
            suggestion: '优化雨水排放系统设计，增设雨水收集设施'
          },
          {
            id: 'plumb_6',
            description: '热水系统保温措施不足',
            standard: 'GB 50015-2019 建筑给水排水设计标准 第5.2.4条',
            suggestion: '加强热水管道保温，减少热损失'
          }
        ],
      },
      electrical: {
        profession: 'electrical',
        ai_analysis: '电气系统设计总体符合规范要求，但在配电系统安全性和照明设计方面有待改进。',
        review_items: [
          {
            id: 'elec_1',
            description: '配电室安全出口数量不足',
            standard: 'GB 50052-2009 供配电系统设计规范 第4.1.2条',
            suggestion: '增加配电室安全出口至2个，确保安全出口之间的距离不小于5m'
          },
          {
            id: 'elec_2',
            description: '应急照明照度不符合规范',
            standard: 'GB 50034-2013 建筑照明设计标准 第5.5.2条',
            suggestion: '提高疏散通道应急照明照度至不小于5lx'
          },
          {
            id: 'elec_3',
            description: '配电线路保护措施不够完善',
            standard: 'GB 50054-2011 低压配电设计规范 第6.2.1条',
            suggestion: '完善配电线路保护措施，增设漏电保护和过载保护'
          },
          {
            id: 'elec_4',
            description: '接地系统设计不符合要求',
            standard: 'GB 50057-2010 建筑物防雷设计规范 第4.3.1条',
            suggestion: '完善接地系统设计，确保接地电阻符合规范要求'
          },
          {
            id: 'elec_5',
            description: '弱电系统设计不完整',
            standard: 'GB 50314-2015 智能建筑设计标准 第3.2.3条',
            suggestion: '完善弱电系统设计，增加智能化管理功能'
          },
          {
            id: 'elec_6',
            description: '电气节能措施不足',
            standard: 'GB 50034-2013 建筑照明设计标准 第6.3.1条',
            suggestion: '采用节能照明设备，优化照明控制系统，降低能耗'
          }
        ],
      },
      hvac: {
        profession: 'hvac',
        ai_analysis: '暖通空调系统设计合理，能满足使用需求。但在新风系统和排烟系统设计方面需要完善。',
        review_items: [
          {
            id: 'hvac_1',
            description: '新风量不足',
            standard: 'GB 50736-2012 民用建筑供暖通风与空气调节设计规范 第3.0.6条',
            suggestion: '增加新风机组容量，确保新风量满足人员卫生要求'
          },
          {
            id: 'hvac_2',
            description: '排烟风机选型偏小',
            standard: 'GB 51251-2017 建筑防烟排烟系统技术标准 第4.6.1条',
            suggestion: '增大排烟风机排风量，确保排烟量满足规范要求'
          },
          {
            id: 'hvac_3',
            description: '空调系统分区不合理',
            standard: 'GB 50736-2012 民用建筑供暖通风与空气调节设计规范 第5.3.1条',
            suggestion: '优化空调系统分区设计，提高系统运行效率'
          },
          {
            id: 'hvac_4',
            description: '冷热源系统设计不够优化',
            standard: 'GB 50736-2012 民用建筑供暖通风与空气调节设计规范 第6.4.1条',
            suggestion: '优化冷热源系统设计，采用高效节能的冷热源设备'
          },
          {
            id: 'hvac_5',
            description: '风管保温措施不足',
            standard: 'GB 50736-2012 民用建筑供暖通风与空气调节设计规范 第9.1.5条',
            suggestion: '加强风管保温，减少冷热损失'
          },
          {
            id: 'hvac_6',
            description: '通风系统风量计算不准确',
            standard: 'GB 50736-2012 民用建筑供暖通风与空气调节设计规范 第4.1.2条',
            suggestion: '重新计算通风系统风量，确保风量满足使用要求'
          }
        ],
      },
      fire: {
        profession: 'fire',
        ai_analysis: '消防系统设计总体符合要求，但在火灾报警系统和消防设备配置方面需要加强。',
        review_items: [
          {
            id: 'fire_1',
            description: '火灾探测器布置密度不足',
            standard: 'GB 50116-2013 火灾自动报警系统设计规范 第6.2.2条',
            suggestion: '增加火灾探测器数量，确保保护半径和面积符合规范要求'
          },
          {
            id: 'fire_2',
            description: '消防器材配置数量不足',
            standard: 'GB 50140-2005 建筑灭火器配置设计规范 第6.1.1条',
            suggestion: '按规范要求增设灭火器、消火栓等消防器材'
          },
          {
            id: 'fire_3',
            description: '消防通道宽度不够',
            standard: 'GB 50016-2014 建筑设计防火规范 第5.5.18条',
            suggestion: '拓宽消防通道至不小于4m，确保消防车辆通行'
          },
          {
            id: 'fire_4',
            description: '自动喷水灭火系统设计不完善',
            standard: 'GB 50084-2017 自动喷水灭火系统设计规范 第5.0.1条',
            suggestion: '完善自动喷水灭火系统设计，确保喷水强度和作用面积符合规范'
          },
          {
            id: 'fire_5',
            description: '消防电源可靠性不足',
            standard: 'GB 50016-2014 建筑设计防火规范 第10.1.3条',
            suggestion: '完善消防电源设计，采用双路供电或自备发电机组'
          }
        ],
      },
      road: {
        profession: 'road',
        ai_analysis: '道路工程设计基本合理，在线形设计和路面结构方面需要进一步完善。',
        review_items: [
          {
            id: 'road_1',
            description: '道路平曲线半径偏小',
            standard: 'JTG D20-2017 公路路线设计规范 第7.2.2条',
            suggestion: '增大平曲线半径至满足规范要求的最小半径'
          },
          {
            id: 'road_2',
            description: '路面结构厚度不足',
            standard: 'JTG D50-2017 公路沥青路面设计规范 第6.1.1条',
            suggestion: '增加路面结构厚度至满足交通荷载要求'
          },
          {
            id: 'road_3',
            description: '道路排水系统设计不完善',
            standard: 'JTG/T D33-2012 公路排水设计规范 第4.1.2条',
            suggestion: '完善道路排水系统设计，增设排水设施'
          },
          {
            id: 'road_4',
            description: '道路纵坡设计不合理',
            standard: 'JTG D20-2017 公路路线设计规范 第8.2.1条',
            suggestion: '优化道路纵坡设计，确保纵坡满足规范要求'
          },
          {
            id: 'road_5',
            description: '交通安全设施配置不足',
            standard: 'JTG D81-2017 公路交通安全设施设计规范 第4.1.1条',
            suggestion: '完善交通安全设施配置，增设标志标线和护栏'
          },
          {
            id: 'road_6',
            description: '道路绿化设计有待优化',
            standard: 'CJJ 75-97 城市道路绿化规划与设计规范 第3.2.3条',
            suggestion: '优化道路绿化设计，提高道路景观效果'
          }
        ],
      },
      landscape: {
        profession: 'landscape',
        ai_analysis: '景观设计整体效果良好，绿化配置合理。在景观照明和水景设计方面可以进一步优化。',
        review_items: [
          {
            id: 'land_1',
            description: '植物配置密度偏高',
            standard: 'CJJ 82-2012 园林绿化工程施工及验收规范 第4.2.3条',
            suggestion: '适当降低植物配置密度，为植物生长预留空间'
          },
          {
            id: 'land_2',
            description: '景观照明设计不够完善',
            standard: 'CJJ 45-2015 城市道路照明设计标准 第5.1.2条',
            suggestion: '完善景观照明设计，采用节能高效的照明设备'
          },
          {
            id: 'land_3',
            description: '水景设计存在安全隐患',
            standard: 'GB 50763-2012 无障碍设计规范 第3.7.1条',
            suggestion: '在水景周边增设安全防护设施，确保使用安全'
          },
          {
            id: 'land_4',
            description: '景观小品设计不够协调',
            standard: 'CJJ 48-92 公园设计规范 第3.4.2条',
            suggestion: '优化景观小品设计，与整体景观风格相协调'
          },
          {
            id: 'land_5',
            description: '绿化植物选择不够合理',
            standard: 'CJJ 82-2012 园林绿化工程施工及验收规范 第3.1.3条',
            suggestion: '选择适应当地气候的植物品种，提高成活率'
          }
        ],
      },
      interior: {
        profession: 'interior',
        ai_analysis: '室内设计美观实用，功能布局合理。在材料选择和施工工艺方面需要注意。',
        review_items: [
          {
            id: 'int_1',
            description: '部分装饰材料环保性能指标不明确',
            standard: 'GB 50325-2020 民用建筑工程室内环境污染控制标准 第3.1.1条',
            suggestion: '明确装饰材料的环保性能指标，选用符合国家标准的环保材料'
          },
          {
            id: 'int_2',
            description: '室内装修施工工艺不够规范',
            standard: 'GB 50327-2001 住宅装饰装修工程施工规范 第4.1.3条',
            suggestion: '规范装修施工工艺，确保施工质量符合规范要求'
          },
          {
            id: 'int_3',
            description: '室内照明设计不够合理',
            standard: 'GB 50034-2013 建筑照明设计标准 第5.3.1条',
            suggestion: '优化室内照明设计，采用合理的照明方式和灯具布置'
          },
          {
            id: 'int_4',
            description: '室内色彩搭配需要优化',
            standard: 'JGJ 36-2016 住宅设计规范 第5.1.1条',
            suggestion: '优化室内色彩搭配，创造舒适的室内环境'
          },
          {
            id: 'int_5',
            description: '室内空间利用率有待提高',
            standard: 'JGJ 36-2016 住宅设计规范 第5.1.2条',
            suggestion: '优化室内空间布局，提高空间利用率'
          }
        ],
      },
      cost: {
        profession: 'cost',
        ai_analysis: '造价控制总体合理，预算编制完整。在工程量计算和单价分析方面需要进一步核实。',
        review_items: [
          {
            id: 'cost_1',
            description: '部分工程量计算存在偏差',
            standard: 'GB 50500-2013 建设工程工程量清单计价规范 第4.2.1条',
            suggestion: '重新核对工程量计算，确保与设计图纸一致'
          },
          {
            id: 'cost_2',
            description: '材料单价与市场价格不符',
            standard: 'GB 50500-2013 建设工程工程量清单计价规范 第5.2.1条',
            suggestion: '调研市场价格，调整材料单价至合理水平'
          },
          {
            id: 'cost_3',
            description: '费用构成不完整',
            standard: 'GB 50500-2013 建设工程工程量清单计价规范 第4.1.5条',
            suggestion: '补充完善费用构成，确保各项费用齐全'
          },
          {
            id: 'cost_4',
            description: '定额套用不够准确',
            standard: 'GB 50500-2013 建设工程工程量清单计价规范 第5.2.2条',
            suggestion: '核实定额套用准确性，确保定额与实际施工相符'
          },
          {
            id: 'cost_5',
            description: '措施费用估算不足',
            standard: 'GB 50500-2013 建设工程工程量清单计价规范 第4.2.4条',
            suggestion: '重新测算措施费用，确保措施费用充足'
          },
          {
            id: 'cost_6',
            description: '不可预见费用比例偏低',
            standard: 'GB 50500-2013 建设工程工程量清单计价规范 第4.2.5条',
            suggestion: '适当提高不可预见费用比例，增强预算的弹性'
          }
        ],
      },
    };

    const now = new Date().toISOString();

    return professions
      .filter(p => reviewTemplates[p])
      .map(p => {
        const template = reviewTemplates[p];
        return {
          profession: p,
          report_id: reportId,
          ai_analysis: template.ai_analysis || '',
          id: this.reviewIdCounter++,
          review_items: template.review_items.map((item, index) => ({
            ...item,
            confirmed: false,
            display_order: index + 1,
          })),
          confirmed_items: [],
          manual_review: '',
          created_at: now,
          updated_at: now,
        } as TempReview;
      });
  }
}

export const tempStorage = new TempStorage();
