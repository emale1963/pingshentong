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
  PageBreak,
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
  road: '道路',
};

interface ReviewItem {
  id: string;
  description: string;
  standard: string;
  suggestion: string;
  display_order?: number;
  confirmed: boolean;
}

interface Review {
  profession: string;
  ai_analysis: string;
  review_items: ReviewItem[];
  confirmed_items: string[];
}

interface Report {
  id: number;
  file_name: string;
  created_at: string;
  professions: string[];
  reviews: Review[];
}

export async function generateReviewReport(report: Report): Promise<Buffer> {
  const { reviews, file_name, created_at, id } = report;

  // 统计数据
  const totalReviews = reviews.length;
  const totalItems = reviews.reduce((sum, r) => sum + r.review_items.length, 0);

  // 创建文档内容
  const docChildren: any[] = [];

  // 标题部分
  docChildren.push(
    new Paragraph({
      text: '评审报告',
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
        after: convertInchesToTwip(0.2),
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
        new TextRun('本次评审共涉及 '),
        new TextRun({
          text: String(totalReviews),
          bold: true,
        }),
        new TextRun(' 个专业，'),
        new TextRun({
          text: String(totalItems),
          bold: true,
        }),
        new TextRun(' 条评审意见。'),
      ],
      spacing: { after: 200 },
    }),

    // 评审统计表
    ...createReviewSummaryTable(reviews),
  );

  // 三、专业评审详情
  docChildren.push(
    new Paragraph({
      text: '三、专业评审详情',
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: convertInchesToTwip(0.3),
        after: convertInchesToTwip(0.2),
      },
    })
  );

  // 按专业分组显示评审意见
  reviews.forEach((review, reviewIndex) => {
    const professionName = PROFESSION_NAMES[review.profession] || review.profession;

    docChildren.push(
      new Paragraph({
        text: `${reviewIndex + 1}. ${professionName}专业`,
        heading: HeadingLevel.HEADING_3,
        spacing: {
          before: convertInchesToTwip(0.25),
          after: convertInchesToTwip(0.15),
        },
      })
    );

    // AI分析
    if (review.ai_analysis) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'AI分析: ', bold: true }),
            new TextRun(review.ai_analysis),
          ],
          spacing: { after: 150 },
        })
      );
    }

    // 评审意见（按display_order排序）
    const sortedItems = [...review.review_items].sort((a, b) =>
      (a.display_order || 0) - (b.display_order || 0)
    );

    sortedItems.forEach((item, itemIndex) => {
      const itemNumber = `${reviewIndex + 1}.${itemIndex + 1}`;

      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${itemNumber}. 问题描述：`,
              bold: true,
            }),
            new TextRun(item.description),
          ],
          spacing: { before: 150, after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '    规范依据：',
              bold: true,
            }),
            new TextRun(item.standard),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '    修改建议：',
              bold: true,
            }),
            new TextRun(item.suggestion),
          ],
          spacing: { after: 250 },
        })
      );
    });

    // 专业之间加分页
    if (reviewIndex < reviews.length - 1) {
      docChildren.push(new Paragraph({ text: '' }));
    }
  });

  // 创建文档
  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren,
    }],
  });

  return await Packer.toBuffer(doc);
}

function createReviewSummaryTable(reviews: Review[]): (Paragraph | Table)[] {
  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '专业', bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '意见总数', bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '已确认', bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '待确认', bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
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
            children: [new Paragraph(String(review.review_items.length))],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [
              new Paragraph(String(review.review_items.filter(i => i.confirmed).length)),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [
              new Paragraph(String(review.review_items.filter(i => !i.confirmed).length)),
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
