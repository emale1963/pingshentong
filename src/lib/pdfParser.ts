/**
 * PDF文件解析服务
 * 支持文本型PDF和部分图片PDF的解析
 */

export interface PDFParseResult {
  text: string;
  pageCount: number;
  hasImages: boolean;
  isScanned: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
  };
}

/**
 * 解析PDF文件
 * 注意：由于沙箱环境限制，这里实现基础解析逻辑
 * 实际生产环境中可以集成pdf-parse或pdfjs-dist等库
 */
export async function parsePDF(fileBuffer: Buffer): Promise<PDFParseResult> {
  try {
    console.log('[PDF Parser] Starting PDF parsing, buffer size:', fileBuffer.length);

    // 简单判断文件类型
    if (!fileBuffer.toString('ascii', 0, 4).startsWith('%PDF')) {
      throw new Error('不是有效的PDF文件');
    }

    // 提取PDF的基本信息
    const text = extractTextFromPDF(fileBuffer);
    const pageCount = estimatePageCount(fileBuffer);
    const hasImages = checkForImages(fileBuffer);
    const isScanned = checkIfScanned(fileBuffer, text);
    const metadata = extractMetadata(fileBuffer);

    const result: PDFParseResult = {
      text: text || '',
      pageCount,
      hasImages,
      isScanned,
      metadata,
    };

    console.log('[PDF Parser] Parsing completed:', {
      pageCount,
      textLength: text.length,
      hasImages,
      isScanned,
    });

    return result;
  } catch (error) {
    console.error('[PDF Parser] Failed to parse PDF:', error);
    throw new Error(`PDF解析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 从PDF中提取文本（简化版）
 * 实际应用中应使用pdf-parse或pdfjs-dist等专门库
 */
function extractTextFromPDF(buffer: Buffer): string {
  try {
    // 简化的文本提取逻辑
    // 查找PDF中的文本流
    const content = buffer.toString('latin1');

    // 提取文本块（简化版）
    const textMatches = content.match(/BT(.*?)ET/g) || [];
    let extractedText = '';

    for (const match of textMatches) {
      // 提取文本内容
      const textParts = match.match(/\((.*?)\)/g) || [];
      for (const part of textParts) {
        const text = part.slice(1, -1).replace(/\\([0-7]{3}|.)/g, (_, esc) => {
          // 处理转义字符
          if (esc.match(/^[0-7]{3}$/)) {
            return String.fromCharCode(parseInt(esc, 8));
          }
          const escapes: Record<string, string> = {
            'n': '\n',
            'r': '\r',
            't': '\t',
            'b': '\b',
            'f': '\f',
            '(': '(',
            ')': ')',
            '\\': '\\',
          };
          return escapes[esc] || esc;
        });
        extractedText += text + ' ';
      }
    }

    // 清理提取的文本
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();

    return extractedText;
  } catch (error) {
    console.error('[PDF Parser] Failed to extract text:', error);
    return '';
  }
}

/**
 * 估算PDF页数
 */
function estimatePageCount(buffer: Buffer): number {
  try {
    const content = buffer.toString('latin1');
    const pageMatches = content.match(/\/Type\s*\/Page[^s]/g) || [];
    return Math.max(1, pageMatches.length);
  } catch (error) {
    return 1;
  }
}

/**
 * 检查PDF中是否包含图片
 */
function checkForImages(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('latin1');
    // 检查图片相关的关键字
    const imageKeywords = [
      '/Subtype',
      '/Image',
      '/XObject',
      'Do Q', // 图片操作符
      'BI', // 图片开始
      'ID', // 图片数据
      'EI', // 图片结束
    ];

    return imageKeywords.some(keyword => content.includes(keyword));
  } catch (error) {
    return false;
  }
}

/**
 * 检查是否为扫描版PDF
 */
function checkIfScanned(buffer: Buffer, extractedText: string): boolean {
  try {
    // 如果提取的文本很少，且包含图片，很可能是扫描版
    const textLength = extractedText.length;
    const hasImages = checkForImages(buffer);

    // 简单的判断逻辑
    if (hasImages && textLength < 500) {
      return true;
    }

    // 检查是否只有图片而没有文本层
    if (hasImages && textLength > 0) {
      // 计算文本密度（字符数 / 页数）
      const pageCount = estimatePageCount(buffer);
      const textDensity = textLength / pageCount;

      // 如果每页平均字符数太少，可能是扫描版
      if (textDensity < 100) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 提取PDF元数据
 */
function extractMetadata(buffer: Buffer): PDFParseResult['metadata'] {
  try {
    const content = buffer.toString('latin1');
    const metadata: any = {};

    // 查找Info对象
    const infoMatch = content.match(/\/Info\s+(\d+\s+\d+\s+R)/);
    if (infoMatch) {
      const infoId = infoMatch[1];
      const infoPattern = new RegExp(`${infoId.replace(/\s/g, '\\s+')}\\s*<<.*?>>`, 'gs');
      const infoContent = content.match(infoPattern)?.[0] || '';

      // 提取各个字段
      const fields = ['Title', 'Author', 'Subject', 'Creator', 'Producer', 'CreationDate'];
      for (const field of fields) {
        const fieldMatch = infoContent.match(new RegExp(`/${field}\\s*\\((.*?)\\)`));
        if (fieldMatch) {
          metadata[field.toLowerCase()] = fieldMatch[1];
        }
      }
    }

    return metadata;
  } catch (error) {
    return undefined;
  }
}

/**
 * 生成PDF分析报告
 */
export function generatePDFAnalysisReport(result: PDFParseResult): string {
  const lines: string[] = [];
  lines.push('=== PDF文件分析报告 ===');
  lines.push(`页数: ${result.pageCount}`);
  lines.push(`文本长度: ${result.text.length} 字符`);
  lines.push(`包含图片: ${result.hasImages ? '是' : '否'}`);
  lines.push(`是否扫描版: ${result.isScanned ? '是' : '否'}`);

  if (result.metadata) {
    lines.push('\n元数据:');
    if (result.metadata.title) lines.push(`  标题: ${result.metadata.title}`);
    if (result.metadata.author) lines.push(`  作者: ${result.metadata.author}`);
    if (result.metadata.subject) lines.push(`  主题: ${result.metadata.subject}`);
    if (result.metadata.creator) lines.push(`  创建工具: ${result.metadata.creator}`);
    if (result.metadata.producer) lines.push(`  生成工具: ${result.metadata.producer}`);
    if (result.metadata.creationDate) lines.push(`  创建日期: ${result.metadata.creationDate}`);
  }

  if (result.text) {
    lines.push('\n文本预览（前500字符）:');
    lines.push(result.text.substring(0, 500));
  }

  if (result.isScanned) {
    lines.push('\n注意: 这是扫描版PDF，文本提取可能不完整，建议使用OCR功能进一步处理。');
  }

  return lines.join('\n');
}
