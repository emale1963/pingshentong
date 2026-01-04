// 临时内存存储（用于数据库未配置时的降级方案）
interface ReviewItem {
  id: string;
  description: string;
  standard: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  confirmed: boolean;
}

interface TempReview {
  id: number;
  report_id: number;
  profession: string;
  ai_analysis: string;
  manual_review: string;
  overall_score: number;
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
    const reviewTemplates: Record<string, Partial<TempReview>> = {
      architecture: {
        profession: 'architecture',
        ai_analysis: '建筑专业总体设计合理，建筑功能布局清晰。但在消防疏散通道设计和无障碍设施方面存在一些问题，建议进一步优化。',
        overall_score: 78,
        review_items: [
          {
            id: 'arch_1',
            description: '建筑防火分区划分不符合规范要求',
            standard: 'GB 50016-2014 建筑设计防火规范 第5.3.1条',
            severity: 'high',
            suggestion: '重新划分防火分区，确保每个防火分区面积不超过规范要求，并设置符合要求的防火墙和防火门',
            confirmed: false
          },
          {
            id: 'arch_2',
            description: '无障碍设施设计不完善',
            standard: 'GB 50763-2012 无障碍设计规范 第3.7条',
            severity: 'medium',
            suggestion: '补充设置无障碍通道、无障碍卫生间和无障碍电梯，坡道坡度不大于1:12',
            confirmed: false
          },
          {
            id: 'arch_3',
            description: '建筑立面设计可进一步优化',
            standard: 'GB 50096-2011 住宅设计规范 第5.4条',
            severity: 'low',
            suggestion: '建议增加建筑立面层次感，优化遮阳设计，提升建筑节能性能',
            confirmed: false
          }
        ],
        manual_review: '',
        confirmed_items: []
      },
      structure: {
        profession: 'structure',
        ai_analysis: '结构设计整体安全可靠，结构体系合理。但在抗震设计和构件配筋方面需要进一步优化。',
        overall_score: 82,
        review_items: [
          {
            id: 'struct_1',
            description: '部分柱截面尺寸偏小',
            standard: 'GB 50011-2010 建筑抗震设计规范 第6.3.3条',
            severity: 'high',
            suggestion: '增加柱截面尺寸至满足轴压比要求，或采用高强度混凝土',
            confirmed: false
          },
          {
            id: 'struct_2',
            description: '剪力墙配筋率略低于规范要求',
            standard: 'JGJ 3-2010 高层建筑混凝土结构技术规程 第7.2.18条',
            severity: 'medium',
            suggestion: '提高剪力墙竖向和水平分布钢筋配筋率至0.25%以上',
            confirmed: false
          }
        ],
        manual_review: '',
        confirmed_items: []
      },
      plumbing: {
        profession: 'plumbing',
        ai_analysis: '给排水系统设计基本合理，但在消防给水系统和排水系统设计方面存在一些问题。',
        overall_score: 75,
        review_items: [
          {
            id: 'plumb_1',
            description: '消防水泵房位置设置不合理',
            standard: 'GB 50974-2014 消防给水及消火栓系统技术规范 第5.5.2条',
            severity: 'high',
            suggestion: '将消防水泵房设置在建筑首层，确保消防水泵自灌式吸水',
            confirmed: false
          },
          {
            id: 'plumb_2',
            description: '排水管径偏小，易堵塞',
            standard: 'GB 50015-2019 建筑给水排水设计标准 第4.4.7条',
            severity: 'medium',
            suggestion: '增大排水立管管径，优化排水坡度',
            confirmed: false
          }
        ],
        manual_review: '',
        confirmed_items: []
      },
      electrical: {
        profession: 'electrical',
        ai_analysis: '电气系统设计总体符合规范要求，但在配电系统安全性和照明设计方面有待改进。',
        overall_score: 80,
        review_items: [
          {
            id: 'elec_1',
            description: '配电室安全出口数量不足',
            standard: 'GB 50052-2009 供配电系统设计规范 第4.1.2条',
            severity: 'high',
            suggestion: '增加配电室安全出口至2个，确保安全出口之间的距离不小于5m',
            confirmed: false
          },
          {
            id: 'elec_2',
            description: '应急照明照度不符合规范',
            standard: 'GB 50034-2013 建筑照明设计标准 第5.5.2条',
            severity: 'medium',
            suggestion: '提高疏散通道应急照明照度至不小于5lx',
            confirmed: false
          }
        ],
        manual_review: '',
        confirmed_items: []
      },
      hvac: {
        profession: 'hvac',
        ai_analysis: '暖通空调系统设计合理，能满足使用需求。但在新风系统和排烟系统设计方面需要完善。',
        overall_score: 77,
        review_items: [
          {
            id: 'hvac_1',
            description: '新风量不足',
            standard: 'GB 50736-2012 民用建筑供暖通风与空气调节设计规范 第3.0.6条',
            severity: 'medium',
            suggestion: '增加新风机组容量，确保新风量满足人员卫生要求',
            confirmed: false
          },
          {
            id: 'hvac_2',
            description: '排烟风机选型偏小',
            standard: 'GB 51251-2017 建筑防烟排烟系统技术标准 第4.6.1条',
            severity: 'high',
            suggestion: '增大排烟风机排风量，确保排烟量满足规范要求',
            confirmed: false
          }
        ],
        manual_review: '',
        confirmed_items: []
      },
      fire: {
        profession: 'fire',
        ai_analysis: '消防系统设计总体符合要求，但在火灾报警系统和消防设备配置方面需要加强。',
        overall_score: 76,
        review_items: [
          {
            id: 'fire_1',
            description: '火灾探测器布置密度不足',
            standard: 'GB 50116-2013 火灾自动报警系统设计规范 第6.2.2条',
            severity: 'medium',
            suggestion: '增加火灾探测器数量，确保保护半径和面积符合规范要求',
            confirmed: false
          },
          {
            id: 'fire_2',
            description: '消防器材配置数量不足',
            standard: 'GB 50140-2005 建筑灭火器配置设计规范 第6.1.1条',
            severity: 'high',
            suggestion: '按规范要求增设灭火器、消火栓等消防器材',
            confirmed: false
          }
        ],
        manual_review: '',
        confirmed_items: []
      },
      landscape: {
        profession: 'landscape',
        ai_analysis: '景观设计整体效果良好，绿化配置合理。在景观照明和水景设计方面可以进一步优化。',
        overall_score: 83,
        review_items: [
          {
            id: 'land_1',
            description: '植物配置密度偏高',
            standard: 'CJJ 82-2012 园林绿化工程施工及验收规范 第4.2.3条',
            severity: 'low',
            suggestion: '适当降低植物配置密度，为植物生长预留空间',
            confirmed: false
          }
        ],
        manual_review: '',
        confirmed_items: []
      },
      interior: {
        profession: 'interior',
        ai_analysis: '室内设计美观实用，功能布局合理。在材料选择和施工工艺方面需要注意。',
        overall_score: 79,
        review_items: [
          {
            id: 'int_1',
            description: '部分装饰材料环保性能指标不明确',
            standard: 'GB 50325-2020 民用建筑工程室内环境污染控制标准 第3.1.1条',
            severity: 'medium',
            suggestion: '明确装饰材料的环保性能指标，选用符合国家标准的环保材料',
            confirmed: false
          }
        ],
        manual_review: '',
        confirmed_items: []
      },
      cost: {
        profession: 'cost',
        ai_analysis: '造价控制总体合理，预算编制完整。在工程量计算和单价分析方面需要进一步核实。',
        overall_score: 81,
        review_items: [
          {
            id: 'cost_1',
            description: '部分工程量计算存在偏差',
            standard: 'GB 50500-2013 建设工程工程量清单计价规范 第4.2.1条',
            severity: 'medium',
            suggestion: '重新核对工程量计算，确保与设计图纸一致',
            confirmed: false
          }
        ],
        manual_review: '',
        confirmed_items: []
      }
    };

    const now = new Date().toISOString();
    
    return professions
      .filter(p => reviewTemplates[p])
      .map(p => {
        const template = reviewTemplates[p] as Partial<TempReview> & { review_items?: ReviewItem[] };
        return {
          profession: p,
          report_id: reportId,
          ai_analysis: template.ai_analysis || '',
          overall_score: template.overall_score || 0,
          id: this.reviewIdCounter++,
          review_items: template.review_items || [],
          confirmed_items: [],
          manual_review: template.manual_review || '',
          created_at: now,
          updated_at: now,
        } as TempReview;
      });
  }
}

export const tempStorage = new TempStorage();
