import { eq } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { users } from "./shared/schema";
import bcrypt from "bcrypt";

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export class UserManager {
  /**
   * 创建用户
   */
  async createUser(data: InsertUser): Promise<User> {
    const db = await getDb();
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  /**
   * 根据用户名查询用户
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  /**
   * 根据用户ID查询用户
   */
  async getUserById(userId: number): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    return user || null;
  }

  /**
   * 验证用户登录
   */
  async verifyLogin(username: string, password: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    if (user.status !== 'active') {
      return null;
    }

    return user;
  }

  /**
   * 更新用户最后登录信息
   */
  async updateLastLogin(userId: number, ip: string): Promise<void> {
    const db = await getDb();
    await db
      .update(users)
      .set({
        lastLoginAt: new Date().toISOString(),
        lastLoginIp: ip,
      })
      .where(eq(users.userId, userId));
  }

  /**
   * 初始化默认管理员账号
   */
  async initDefaultAdmin(): Promise<User | null> {
    const existingAdmin = await this.getUserByUsername('admin');

    if (existingAdmin) {
      console.log('[UserManager] Default admin already exists');
      return existingAdmin;
    }

    const passwordHash = await bcrypt.hash('111111', 10);
    const [admin] = await this.createUser({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      fullName: '系统管理员',
      role: 'admin',
      status: 'active',
      isAdmin: true,
      dailyUploadLimit: 1000,
      maxFileSizeMb: 100,
    });

    console.log('[UserManager] Default admin created:', admin.username);
    return admin;
  }
}

export const userManager = new UserManager();
