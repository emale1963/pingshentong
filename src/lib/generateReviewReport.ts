import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  convertInchesToTwip,
} from 'docx';

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

interface ReviewItem {
  id: string;
  description: string;
  standard: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  confirmed: boolean;
}

interface Review {
  profession: string;
  overall_score: number;
  review_items: ReviewItem[];
  confirmed_items: string[];
  ai_analysis?: string;
}

interface Report {
  id: number;
  file_name: string;
  created_at: string;
  professions: string[];
  reviews: Review[];
}

export async function generateReviewReport(report: Report, includeConfirmedOnly: boolean = false): Promise<Buffer> {
  const { reviews, file_name, created_at, id } = report;

  // 统计数据
  const totalReviews = reviews.length;
  const totalItems = reviews.flatMap(r => r.review_items).length;
  const highSeverity = reviews.flatMap(r => r.review_items).filter(i => i.severity === 'high').length;
  const confirmedCount = reviews.flatMap(r => r.review_items).filter(i => 
    (includeConfirmedOnly ? i.confirmed : true)
  ).length;

  // 汇总所有需要显示的意见
  let allItems: Array<ReviewItem & { profession: string; professionName: string; score: number }> = [];
  
  reviews.forEach(review => {
    const itemsToInclude = includeConfirmedOnly
      ? review.review_items.filter(i => i.confirmed)
      : review.review_items;
    
    itemsToInclude.forEach(item => {
      allItems.push({
        ...item,
        profession: review.profession,
        professionName: PROFESSION_NAMES[review.profession] || review.profession,
        score: review.overall_score,
      });
    });
  });

  // 如果只显示已确认的，按严重度排序；否则按专业分组
  allItems.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    if (includeConfirmedOnly) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return 0;
  });

  // 创建文档
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // 标题
        new Paragraph({
          text: '建筑可研报告智能评审报告',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: convertInchesToTwip(0.3),
          },
        }),
        new Paragraph({
          text: `报告编号: ${id}`,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: convertInchesToTwip(0.3),
          },
        }),
        new Paragraph({
          text: `生成时间: ${new Date(created_at).toLocaleString('zh-CN')}`,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: convertInchesToTwip(0.5),
          },
        }),

        // 分隔线
        new Paragraph({
          text: '─'.repeat(50),
          alignment: AlignmentType.CENTER,
          spacing: {
            before: convertInchesToTwip(0.2),
            after: convertInchesToTwip(0.4),
          },
        }),

        // 一、项目概述
        new Paragraph({
          text: '一、项目概述',
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: convertInchesToTwip(0.2),
            after: convertInchesToTwip(0.2),
          },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '原报告名称: ',
              bold: true,
            }),
            new TextRun(file_name),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '评审专业: ',
              bold: true,
            }),
            new TextRun(report.professions.map(p => PROFESSION_NAMES[p] || p).join('、')),
          ],
          spacing: { after: 100 },
        }),

        // 二、评审汇总
        new Paragraph({
          text: '二、评审汇总',
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: convertInchesToTwip(0.2),
            after: convertInchesToTwip(0.2),
          },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '本次评审共涉及 ',
            }),
            new TextRun({
              text: String(totalReviews),
              bold: true,
            }),
            new TextRun(' 个专业，'),
            new TextRun({
              text: String(totalItems),
              bold: true,
            }),
            new TextRun(' 条评审意见，其中高严重度意见 '),
            new TextRun({
              text: String(highSeverity),
              bold: true,
              color: 'FF0000',
            }),
            new TextRun(' 条。'),
          ],
          spacing: { after: 200 },
        }),

        // 评分汇总表
        ...createScoreSummaryTable(reviews),

        // 三、专业评审详情
        new Paragraph({
          text: '三、专业评审详情',
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: convertInchesToTwip(0.3),
            after: convertInchesToTwip(0.2),
          },
        }),

        ...createProfessionalReviews(reviews, includeConfirmedOnly, allItems),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

function createScoreSummaryTable(reviews: Review[]): (Paragraph | Table)[] {
  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '专业', bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '评分', bold: true })] })],
          width: { size: 15, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '意见总数', bold: true })] })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '高严重度', bold: true })] })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '已确认', bold: true })] })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    ...reviews.map(review => 
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(PROFESSION_NAMES[review.profession] || review.profession)],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: String(review.overall_score),
                    color: review.overall_score >= 80 ? '008000' : review.overall_score >= 60 ? 'FFA500' : 'FF0000',
                    bold: true,
                  }),
                ],
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph(String(review.review_items.length))],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: String(review.review_items.filter(i => i.severity === 'high').length),
                    color: 'FF0000',
                  }),
                ],
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [
              new Paragraph(String(review.review_items.filter(i => i.confirmed).length)),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      })
    ),
  ];

  return [
    new Table({
      rows: tableRows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
    }),
    new Paragraph({ text: '', spacing: { after: 200 } }),
  ];
}

function createProfessionalReviews(
  reviews: Review[],
  includeConfirmedOnly: boolean,
  allItems: Array<ReviewItem & { profession: string; professionName: string; score: number }>
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (includeConfirmedOnly) {
    // 只显示已确认的评审意见，按严重度排序
    paragraphs.push(
      new Paragraph({
        text: '已确认的评审意见',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 200 },
      })
    );

    allItems.forEach((item, index) => {
      const severityText = item.severity === 'high' ? '高' : item.severity === 'medium' ? '中' : '低';
      const severityColor = item.severity === 'high' ? 'FF0000' : item.severity === 'medium' ? 'FFA500' : '0000FF';

      paragraphs.push(
        new Paragraph({
          text: `${index + 1}. [${item.professionName}] ${item.description}`,
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 150, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '严重程度: ', bold: true }),
            new TextRun({ text: severityText, bold: true, color: severityColor }),
            new TextRun({ text: '   规范依据: ', bold: true }),
            new TextRun(item.standard),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '建议方案: ', bold: true }),
            new TextRun(item.suggestion),
          ],
          spacing: { after: 250 },
        })
      );
    });
  } else {
    // 按专业分组显示所有意见
    reviews.forEach((review, reviewIndex) => {
      paragraphs.push(
        new Paragraph({
          text: `${reviewIndex + 1}. ${PROFESSION_NAMES[review.profession] || review.profession}专业`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 150 },
        })
      );

      // AI分析
      if (review.ai_analysis) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'AI分析: ', bold: true }),
              new TextRun(review.ai_analysis),
            ],
            spacing: { after: 150 },
          })
        );
      }

      // 评审意见
      review.review_items.forEach((item, itemIndex) => {
        const severityText = item.severity === 'high' ? '高' : item.severity === 'medium' ? '中' : '低';
        const severityColor = item.severity === 'high' ? 'FF0000' : item.severity === 'medium' ? 'FFA500' : '0000FF';
        const confirmedText = item.confirmed ? ' ✓' : '';

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${itemIndex + 1}. ${item.description}${confirmedText}`,
                bold: item.severity === 'high',
              }),
            ],
            spacing: { before: 100, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '  严重程度: ', bold: true }),
              new TextRun({ text: severityText, bold: true, color: severityColor }),
            ],
            indent: { firstLine: 400 },
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '  规范依据: ', bold: true }),
              new TextRun(item.standard),
            ],
            indent: { firstLine: 400 },
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '  建议方案: ', bold: true }),
              new TextRun(item.suggestion),
            ],
            indent: { firstLine: 400 },
            spacing: { after: 200 },
          })
        );
      });
    });
  }

  return paragraphs;
}
