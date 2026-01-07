import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
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
    })
  );

  // 项目概述
  docChildren.push(
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
          font: '仿宋',
          size: 24, // 小四号（12磅）
        }),
        new TextRun({
          text: file_name,
          font: '仿宋',
          size: 24,
        }),
      ],
      spacing: { after: 150, line: 450 }, // 1.5倍行距
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: '评审专业: ',
          bold: true,
          font: '仿宋',
          size: 24,
        }),
        new TextRun({
          text: report.professions.map(p => PROFESSION_NAMES[p] || p).join('、'),
          font: '仿宋',
          size: 24,
        }),
      ],
      spacing: { after: 150, line: 450 },
    })
  );

  // 专业评审详情
  docChildren.push(
    new Paragraph({
      text: '二、专业评审详情',
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

    // 评审通（原AI分析）
    if (review.ai_analysis) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '评审通: ',
              bold: true,
              font: '仿宋',
              size: 24, // 小四号
            }),
            new TextRun({
              text: review.ai_analysis,
              font: '仿宋',
              size: 24,
            }),
          ],
          spacing: { after: 200, line: 450 },
        })
      );
    }

    // 评审意见（按display_order排序，只导出已确认的）
    const sortedItems = [...review.review_items]
      .filter(item => item.confirmed || review.confirmed_items.includes(item.id))
      .sort((a, b) =>
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
              font: '仿宋',
              size: 24, // 小四号
            }),
            new TextRun({
              text: item.description,
              font: '仿宋',
              size: 24,
            }),
          ],
          spacing: { before: 200, after: 150, line: 450 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '    规范依据：',
              bold: true,
              font: '仿宋',
              size: 24,
            }),
            new TextRun({
              text: item.standard,
              font: '仿宋',
              size: 24,
            }),
          ],
          spacing: { after: 150, line: 450 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '    修改建议：',
              bold: true,
              font: '仿宋',
              size: 24,
            }),
            new TextRun({
              text: item.suggestion,
              font: '仿宋',
              size: 24,
            }),
          ],
          spacing: { after: 300, line: 450 }, // 每条意见间额外空行
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
