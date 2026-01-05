import { relations } from "drizzle-orm/relations";
import { users, systemAlerts, adminOperations, systemLogs } from "./schema";

export const systemAlertsRelations = relations(systemAlerts, ({one}) => ({
	user: one(users, {
		fields: [systemAlerts.resolvedBy],
		references: [users.userId]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	systemAlerts: many(systemAlerts),
	adminOperations: many(adminOperations),
	systemLogs: many(systemLogs),
}));

export const adminOperationsRelations = relations(adminOperations, ({one}) => ({
	user: one(users, {
		fields: [adminOperations.adminId],
		references: [users.userId]
	}),
}));

export const systemLogsRelations = relations(systemLogs, ({one}) => ({
	user: one(users, {
		fields: [systemLogs.userId],
		references: [users.userId]
	}),
}));