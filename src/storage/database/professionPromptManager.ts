import { eq, and, SQL, inArray, desc } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  professionSystemPrompts,
  professionFallbackReviews,
  insertProfessionSystemPromptSchema,
  updateProfessionSystemPromptSchema,
  insertProfessionFallbackReviewSchema,
  updateProfessionFallbackReviewSchema,
  type ProfessionSystemPrompt,
  type InsertProfessionSystemPrompt,
  type UpdateProfessionSystemPrompt,
  type ProfessionFallbackReview,
  type InsertProfessionFallbackReview,
  type UpdateProfessionFallbackReview,
} from "./shared/schema";

/**
 * 系统提示词管理器
 */
export class ProfessionPromptManager {
  /**
   * 获取所有专业的系统提示词
   */
  async getAllPrompts(): Promise<ProfessionSystemPrompt[]> {
    const db = await getDb();
    return db
      .select()
      .from(professionSystemPrompts)
      .orderBy(professionSystemPrompts.profession);
  }

  /**
   * 根据专业获取系统提示词
   */
  async getPromptByProfession(profession: string): Promise<ProfessionSystemPrompt | null> {
    const db = await getDb();
    const [prompt] = await db
      .select()
      .from(professionSystemPrompts)
      .where(eq(professionSystemPrompts.profession, profession));
    return prompt || null;
  }

  /**
   * 创建系统提示词
   */
  async createPrompt(data: InsertProfessionSystemPrompt): Promise<ProfessionSystemPrompt> {
    const db = await getDb();
    const validated = insertProfessionSystemPromptSchema.parse(data);
    const [prompt] = await db
      .insert(professionSystemPrompts)
      .values(validated)
      .returning();
    return prompt;
  }

  /**
   * 更新系统提示词
   */
  async updatePrompt(
    id: number,
    data: UpdateProfessionSystemPrompt
  ): Promise<ProfessionSystemPrompt | null> {
    const db = await getDb();
    const validated = updateProfessionSystemPromptSchema.parse(data);
    const [prompt] = await db
      .update(professionSystemPrompts)
      .set({
        ...validated,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(professionSystemPrompts.id, id))
      .returning();
    return prompt || null;
  }

  /**
   * 删除系统提示词
   */
  async deletePrompt(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(professionSystemPrompts)
      .where(eq(professionSystemPrompts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 获取多个专业的系统提示词（用于批量查询）
   */
  async getPromptsByProfessions(professions: string[]): Promise<ProfessionSystemPrompt[]> {
    if (professions.length === 0) return [];
    const db = await getDb();
    return db
      .select()
      .from(professionSystemPrompts)
      .where(inArray(professionSystemPrompts.profession, professions));
  }
}

/**
 * 降级评审要点管理器
 */
export class ProfessionFallbackReviewManager {
  /**
   * 获取所有专业的降级评审要点
   */
  async getAllReviews(profession?: string): Promise<ProfessionFallbackReview[]> {
    const db = await getDb();
    
    if (profession) {
      return db
        .select()
        .from(professionFallbackReviews)
        .where(
          and(
            eq(professionFallbackReviews.profession, profession),
            eq(professionFallbackReviews.isActive, true)
          )
        )
        .orderBy(professionFallbackReviews.displayOrder);
    }
    
    return db
      .select()
      .from(professionFallbackReviews)
      .where(eq(professionFallbackReviews.isActive, true))
      .orderBy(professionFallbackReviews.profession, professionFallbackReviews.displayOrder);
  }

  /**
   * 获取指定专业的降级评审要点
   */
  async getReviewsByProfession(profession: string): Promise<ProfessionFallbackReview[]> {
    const db = await getDb();
    return db
      .select()
      .from(professionFallbackReviews)
      .where(
        and(
          eq(professionFallbackReviews.profession, profession),
          eq(professionFallbackReviews.isActive, true)
        )
      )
      .orderBy(professionFallbackReviews.displayOrder);
  }

  /**
   * 创建降级评审要点
   */
  async createReview(data: InsertProfessionFallbackReview): Promise<ProfessionFallbackReview> {
    const db = await getDb();
    const validated = insertProfessionFallbackReviewSchema.parse(data);
    const [review] = await db
      .insert(professionFallbackReviews)
      .values(validated)
      .returning();
    return review;
  }

  /**
   * 批量创建降级评审要点
   */
  async createReviewsBatch(
    reviews: InsertProfessionFallbackReview[]
  ): Promise<ProfessionFallbackReview[]> {
    const db = await getDb();
    const validated = reviews.map(review =>
      insertProfessionFallbackReviewSchema.parse(review)
    );
    return db
      .insert(professionFallbackReviews)
      .values(validated)
      .returning();
  }

  /**
   * 更新降级评审要点
   */
  async updateReview(
    id: number,
    data: UpdateProfessionFallbackReview
  ): Promise<ProfessionFallbackReview | null> {
    const db = await getDb();
    const validated = updateProfessionFallbackReviewSchema.parse(data);
    const [review] = await db
      .update(professionFallbackReviews)
      .set({
        ...validated,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(professionFallbackReviews.id, id))
      .returning();
    return review || null;
  }

  /**
   * 删除降级评审要点
   */
  async deleteReview(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(professionFallbackReviews)
      .where(eq(professionFallbackReviews.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 批量删除专业的所有评审要点
   */
  async deleteReviewsByProfession(profession: string): Promise<number> {
    const db = await getDb();
    const result = await db
      .delete(professionFallbackReviews)
      .where(eq(professionFallbackReviews.profession, profession));
    return result.rowCount ?? 0;
  }

  /**
   * 更新评审要点显示顺序
   */
  async updateReviewOrder(id: number, displayOrder: number): Promise<ProfessionFallbackReview | null> {
    const db = await getDb();
    const [review] = await db
      .update(professionFallbackReviews)
      .set({
        displayOrder,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(professionFallbackReviews.id, id))
      .returning();
    return review || null;
  }
}

// 导出单例
export const professionPromptManager = new ProfessionPromptManager();
export const professionFallbackReviewManager = new ProfessionFallbackReviewManager();
