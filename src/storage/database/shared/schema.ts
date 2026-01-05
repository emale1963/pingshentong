import { pgTable, check, serial, integer, jsonb, text, varchar, bigint, timestamp, index, unique, boolean, numeric, foreignKey, uniqueIndex, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from 'drizzle-zod'
import { z } from 'zod'



export const reports = pgTable("reports", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	professions: jsonb().default([]).notNull(),
	fileUrl: text("file_url"),
	fileName: varchar("file_name", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }),
	status: varchar({ length: 20 }).default('submitted'),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	check("reports_status_check", sql`(status)::text = ANY ((ARRAY['submitted'::character varying, 'reviewing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])`),
]);

export const reviewConfigs = pgTable("review_configs", {
	configId: serial("config_id").primaryKey().notNull(),
	profession: varchar({ length: 50 }).notNull(),
	configName: varchar("config_name", { length: 200 }).notNull(),
	configContent: jsonb("config_content").default({}).notNull(),
	reviewDepth: varchar("review_depth", { length: 20 }).default('medium'),
	minOpinionLength: integer("min_opinion_length").default(100),
	maxOpinionLength: integer("max_opinion_length").default(500),
	ruleTemplate: text("rule_template"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_review_configs_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_review_configs_profession").using("btree", table.profession.asc().nullsLast().op("text_ops")),
	unique("review_configs_profession_key").on(table.profession),
]);

export const performanceMetrics = pgTable("performance_metrics", {
	metricId: serial("metric_id").primaryKey().notNull(),
	metricType: varchar("metric_type", { length: 50 }).notNull(),
	metricName: varchar("metric_name", { length: 100 }).notNull(),
	metricValue: numeric("metric_value", { precision: 10, scale:  2 }),
	unit: varchar({ length: 20 }),
	metadata: jsonb(),
	collectedAt: timestamp("collected_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_performance_metrics_name").using("btree", table.metricName.asc().nullsLast().op("text_ops")),
	index("idx_performance_metrics_time").using("btree", table.collectedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_performance_metrics_type").using("btree", table.metricType.asc().nullsLast().op("text_ops")),
]);

export const systemAlerts = pgTable("system_alerts", {
	alertId: serial("alert_id").primaryKey().notNull(),
	alertType: varchar("alert_type", { length: 50 }).notNull(),
	alertLevel: varchar("alert_level", { length: 20 }).default('warning'),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	thresholdValue: numeric("threshold_value", { precision: 10, scale:  2 }),
	currentValue: numeric("current_value", { precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('pending'),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	resolvedBy: integer("resolved_by"),
	resolutionNote: text("resolution_note"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_system_alerts_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_system_alerts_time").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_system_alerts_type").using("btree", table.alertType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [users.userId],
			name: "system_alerts_resolved_by_fkey"
		}),
]);

export const reviewKeywords = pgTable("review_keywords", {
	keywordId: serial("keyword_id").primaryKey().notNull(),
	profession: varchar({ length: 50 }).notNull(),
	keyword: varchar({ length: 200 }).notNull(),
	category: varchar({ length: 50 }).default('general'),
	weight: numeric({ precision: 3, scale:  2 }).default('1.00'),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdBy: varchar("created_by", { length: 100 }),
}, (table) => [
	index("idx_review_keywords_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_review_keywords_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_review_keywords_profession").using("btree", table.profession.asc().nullsLast().op("text_ops")),
]);

export const modelUsageStats = pgTable("model_usage_stats", {
	statId: serial("stat_id").primaryKey().notNull(),
	modelId: varchar("model_id", { length: 50 }).notNull(),
	modelName: varchar("model_name", { length: 100 }),
	callCount: integer("call_count").default(0),
	successCount: integer("success_count").default(0),
	failureCount: integer("failure_count").default(0),
	totalResponseTime: integer("total_response_time").default(0),
	avgResponseTime: numeric("avg_response_time", { precision: 10, scale:  2 }),
	totalTokens: integer("total_tokens").default(0),
	totalCost: numeric("total_cost", { precision: 10, scale:  4 }).default('0.00'),
	profession: varchar({ length: 50 }),
	statDate: date("stat_date").notNull(),
	statHour: integer("stat_hour"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_model_usage_stats_date").using("btree", table.statDate.asc().nullsLast().op("date_ops")),
	index("idx_model_usage_stats_model").using("btree", table.modelId.asc().nullsLast().op("text_ops")),
	index("idx_model_usage_stats_profession").using("btree", table.profession.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_model_usage_stats_unique").using("btree", sql`model_id`, sql`stat_date`, sql`stat_hour`, sql`COALESCE(profession, ''::character varying)`),
	check("model_usage_stats_stat_hour_check", sql`(stat_hour >= 0) AND (stat_hour <= 23)`),
]);

export const users = pgTable("users", {
	userId: serial("user_id").primaryKey().notNull(),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 200 }),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	fullName: varchar("full_name", { length: 100 }),
	role: varchar({ length: 20 }).default('user'),
	status: varchar({ length: 20 }).default('active'),
	isAdmin: boolean("is_admin").default(false),
	dailyUploadLimit: integer("daily_upload_limit").default(10),
	maxFileSizeMb: integer("max_file_size_mb").default(20),
	availableModels: text("available_models").array(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	lastLoginIp: varchar("last_login_ip", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("idx_users_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_users_username").using("btree", table.username.asc().nullsLast().op("text_ops")),
	unique("users_username_key").on(table.username),
	unique("users_email_key").on(table.email),
]);

export const adminOperations = pgTable("admin_operations", {
	operationId: serial("operation_id").primaryKey().notNull(),
	adminId: integer("admin_id").notNull(),
	operationType: varchar("operation_type", { length: 50 }).notNull(),
	operationModule: varchar("operation_module", { length: 50 }),
	operationDetail: text("operation_detail"),
	operationData: jsonb("operation_data"),
	ipAddress: varchar("ip_address", { length: 50 }),
	userAgent: text("user_agent"),
	result: varchar({ length: 20 }).default('success'),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_admin_operations_admin").using("btree", table.adminId.asc().nullsLast().op("int4_ops")),
	index("idx_admin_operations_result").using("btree", table.result.asc().nullsLast().op("text_ops")),
	index("idx_admin_operations_time").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_admin_operations_type").using("btree", table.operationType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [users.userId],
			name: "admin_operations_admin_id_fkey"
		}),
]);

export const systemLogs = pgTable("system_logs", {
	logId: serial("log_id").primaryKey().notNull(),
	logLevel: varchar("log_level", { length: 20 }).notNull(),
	logType: varchar("log_type", { length: 50 }),
	message: text().notNull(),
	module: varchar({ length: 50 }),
	functionName: varchar("function_name", { length: 100 }),
	errorDetails: text("error_details"),
	requestData: jsonb("request_data"),
	userId: integer("user_id"),
	ipAddress: varchar("ip_address", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_system_logs_level").using("btree", table.logLevel.asc().nullsLast().op("text_ops")),
	index("idx_system_logs_time").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_system_logs_type").using("btree", table.logType.asc().nullsLast().op("text_ops")),
	index("idx_system_logs_user").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "system_logs_user_id_fkey"
		}),
]);

// AI评审系统提示词表
export const professionSystemPrompts = pgTable("profession_system_prompts", {
	id: serial("id").primaryKey().notNull(),
	profession: varchar({ length: 50 }).notNull().unique(),
	promptContent: text("prompt_content").notNull(),
	promptVersion: varchar({ length: 20 }).default("1.0"),
	isActive: boolean("is_active").default(true),
	createdBy: varchar("created_by", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_profession_prompts_profession").using("btree", table.profession.asc().nullsLast().op("text_ops")),
	index("idx_profession_prompts_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
]);

// 降级评审要点表
export const professionFallbackReviews = pgTable("profession_fallback_reviews", {
	id: serial("id").primaryKey().notNull(),
	profession: varchar({ length: 50 }).notNull(),
	description: text("description").notNull(),
	standard: text("standard").notNull(),
	suggestion: text("suggestion").notNull(),
	displayOrder: integer("display_order").default(1),
	isActive: boolean("is_active").default(true),
	createdBy: varchar("created_by", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_fallback_reviews_profession").using("btree", table.profession.asc().nullsLast().op("text_ops")),
	index("idx_fallback_reviews_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_fallback_reviews_order").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
]);

// 创建验证 schema
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// 系统提示词的验证 schema
export const insertProfessionSystemPromptSchema = createCoercedInsertSchema(professionSystemPrompts)
  .pick({
    profession: true,
    promptContent: true,
    promptVersion: true,
    isActive: true,
    createdBy: true,
  });

export const updateProfessionSystemPromptSchema = createCoercedInsertSchema(professionSystemPrompts)
  .pick({
    promptContent: true,
    promptVersion: true,
    isActive: true,
  })
  .partial();

// 降级评审要点的验证 schema
export const insertProfessionFallbackReviewSchema = createCoercedInsertSchema(professionFallbackReviews)
  .pick({
    profession: true,
    description: true,
    standard: true,
    suggestion: true,
    displayOrder: true,
    isActive: true,
    createdBy: true,
  });

export const updateProfessionFallbackReviewSchema = createCoercedInsertSchema(professionFallbackReviews)
  .pick({
    description: true,
    standard: true,
    suggestion: true,
    displayOrder: true,
    isActive: true,
  })
  .partial();

// TypeScript 类型导出
export type ProfessionSystemPrompt = typeof professionSystemPrompts.$inferSelect;
export type InsertProfessionSystemPrompt = z.infer<typeof insertProfessionSystemPromptSchema>;
export type UpdateProfessionSystemPrompt = z.infer<typeof updateProfessionSystemPromptSchema>;

export type ProfessionFallbackReview = typeof professionFallbackReviews.$inferSelect;
export type InsertProfessionFallbackReview = z.infer<typeof insertProfessionFallbackReviewSchema>;
export type UpdateProfessionFallbackReview = z.infer<typeof updateProfessionFallbackReviewSchema>;
