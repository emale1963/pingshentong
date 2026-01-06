import pool from '@/lib/db';

interface StandardArticle {
  id: number;
  standard_id: number;
  article_code: string;
  article_content: string;
  section_code: string;
  section_title: string;
  keywords: string;
  requirement_level: string;
}

interface Standard {
  id: number;
  category: string;
  code: string;
  title: string;
  short_name: string;
  version: string;
  status: string;
  summary: string;
  articles: StandardArticle[];
}

interface StandardSearchResult {
  id: number;
  category: string;
  code: string;
  title: string;
  short_name: string;
  version: string;
  articles: StandardArticle[];
}

export class StandardsLibraryService {
  /**
   * 根据专业获取相关的规范资料
   */
  async getStandardsByCategory(category: string, limit: number = 10): Promise<Standard[]> {
    try {
      const result = await pool.query(
        `SELECT
          id,
          category,
          code,
          title,
          short_name,
          version,
          status,
          summary
        FROM standards_library
        WHERE category = $1 AND is_active = true AND status = 'current'
        ORDER BY code
        LIMIT $2`,
        [category, limit]
      );

      const standards: Standard[] = [];

      for (const row of result.rows) {
        const articlesResult = await pool.query(
          `SELECT
            id,
            standard_id,
            article_code,
            article_content,
            section_code,
            section_title,
            keywords,
            requirement_level
          FROM standard_articles
          WHERE standard_id = $1
          ORDER BY section_code, article_code
          LIMIT 20`,
          [row.id]
        );

        standards.push({
          ...row,
          articles: articlesResult.rows,
        });
      }

      console.log(`[Standards Library] Retrieved ${standards.length} standards for category: ${category}`);
      return standards;
    } catch (error) {
      console.error('[Standards Library] Failed to get standards by category:', error);
      return [];
    }
  }

  /**
   * 根据关键词搜索规范资料
   */
  async searchStandards(keyword: string, category?: string, limit: number = 10): Promise<StandardSearchResult[]> {
    try {
      const searchPattern = `%${keyword}%`;

      let query = `
        SELECT DISTINCT
          s.id,
          s.category,
          s.code,
          s.title,
          s.short_name,
          s.version,
          s.status
        FROM standards_library s
        LEFT JOIN standard_articles a ON s.id = a.standard_id
        WHERE s.is_active = true AND s.status = 'current'
          AND (
            s.code ILIKE $1 OR
            s.title ILIKE $1 OR
            s.keywords ILIKE $1 OR
            a.article_code ILIKE $1 OR
            a.article_content ILIKE $1 OR
            a.keywords ILIKE $1
          )
      `;
      const values: any[] = [searchPattern];
      let paramIndex = 2;

      if (category) {
        query += ` AND s.category = $${paramIndex++}`;
        values.push(category);
      }

      query += ` ORDER BY
        CASE
          WHEN s.code ILIKE $1 THEN 1
          WHEN a.article_code ILIKE $1 THEN 2
          WHEN s.title ILIKE $1 THEN 3
          ELSE 4
        END,
        s.code
      LIMIT $${paramIndex++}`;

      values.push(limit);

      const result = await pool.query(query, values);
      const standards: StandardSearchResult[] = [];

      for (const row of result.rows) {
        const articlesResult = await pool.query(
          `SELECT
            id,
            standard_id,
            article_code,
            article_content,
            section_code,
            section_title,
            keywords,
            requirement_level
          FROM standard_articles
          WHERE standard_id = $1
            AND (
              article_code ILIKE $2 OR
              article_content ILIKE $2 OR
              keywords ILIKE $2
            )
          ORDER BY section_code, article_code
          LIMIT 10`,
          [row.id, searchPattern]
        );

        standards.push({
          ...row,
          articles: articlesResult.rows,
        });
      }

      console.log(`[Standards Library] Search returned ${standards.length} standards for keyword: "${keyword}"`);
      return standards;
    } catch (error) {
      console.error('[Standards Library] Failed to search standards:', error);
      return [];
    }
  }

  /**
   * 为专业评审获取相关的规范参考
   * 这个方法会根据专业和报告摘要，智能检索相关的规范条款
   */
  async getRelevantStandardsForReview(
    profession: string,
    reportSummary: string,
    limit: number = 5
  ): Promise<string> {
    try {
      // 专业相关的关键词
      const professionKeywords: Record<string, string[]> = {
        architecture: ['建筑', '防火', '疏散', '无障碍', '节能', '采光', '通风'],
        structure: ['结构', '抗震', '荷载', '基础', '材料', '混凝土', '钢筋'],
        plumbing: ['给水', '排水', '消防水', '管道', '水泵', '水池'],
        electrical: ['配电', '照明', '电气', '接地', '应急', '消防用电'],
        hvac: ['空调', '通风', '暖通', '制冷', '新风', '排烟'],
        fire: ['消防', '火灾', '报警', '灭火器', '消火栓', '喷淋'],
        landscape: ['景观', '绿化', '植物', '水景', '园林'],
        interior: ['室内', '装修', '材料', '照明', '安全'],
        cost: ['造价', '预算', '估算', '费用', '定额'],
        road: ['道路', '路基', '路面', '交通', '排水'],
      };

      const keywords = professionKeywords[profession] || [];

      // 搜索相关规范
      let relevantArticles: any[] = [];

      for (const keyword of keywords.slice(0, 3)) {
        const standards = await this.searchStandards(keyword, profession, 3);
        for (const standard of standards) {
          relevantArticles.push(...standard.articles.map(article => ({
            code: standard.code,
            title: standard.short_name || standard.title,
            articleCode: article.article_code,
            articleContent: article.article_content.substring(0, 200), // 限制长度
          })));
        }
      }

      // 去重
      const uniqueArticles = relevantArticles.filter((article, index, self) =>
        index === self.findIndex(t => t.code === article.code && t.articleCode === article.articleCode)
      );

      // 生成格式化的规范参考文本
      if (uniqueArticles.length === 0) {
        return '本次评审暂无预设规范资料库参考，请基于专业知识进行评审。';
      }

      const formattedStandards = uniqueArticles
        .slice(0, limit)
        .map(article => {
          return `[${article.code}] ${article.title}\n条款 ${article.articleCode}: ${article.articleContent}...`;
        })
        .join('\n\n');

      return `## 相关规范参考\n\n${formattedStandards}`;
    } catch (error) {
      console.error('[Standards Library] Failed to get relevant standards:', error);
      return '本次评审暂无预设规范资料库参考，请基于专业知识进行评审。';
    }
  }

  /**
   * 获取单个规范的详情
   */
  async getStandardById(id: number): Promise<Standard | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM standards_library WHERE id = $1 AND is_active = true`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const articlesResult = await pool.query(
        `SELECT * FROM standard_articles WHERE standard_id = $1 ORDER BY section_code, article_code`,
        [id]
      );

      return {
        ...result.rows[0],
        articles: articlesResult.rows,
      };
    } catch (error) {
      console.error('[Standards Library] Failed to get standard by id:', error);
      return null;
    }
  }
}

export const standardsLibraryService = new StandardsLibraryService();
