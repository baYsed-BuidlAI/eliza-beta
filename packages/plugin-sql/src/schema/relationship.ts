import { sql } from "drizzle-orm";
import {
	foreignKey,
	index,
	jsonb,
	pgTable,
	text,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { agentTable } from "./agent";
import { entityTable } from "./entity";
import { numberTimestamp } from "./types";

export const relationshipTable = pgTable(
	"relationships",
	{
		id: uuid("id").notNull().primaryKey().default(sql`gen_random_uuid()`),
		createdAt: numberTimestamp("createdAt").default(sql`now()`).notNull(),
		sourceEntityId: uuid("sourceEntityId")
			.notNull()
			.references(() => entityTable.id, { onDelete: "cascade" }),
		targetEntityId: uuid("targetEntityId")
			.notNull()
			.references(() => entityTable.id, { onDelete: "cascade" }),
		agentId: uuid("agentId")
			.notNull()
			.references(() => agentTable.id, { onDelete: "cascade" }),
		tags: text("tags").array(),
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("idx_relationships_users").on(
			table.sourceEntityId,
			table.targetEntityId,
		),
		unique("unique_relationship").on(
			table.sourceEntityId,
			table.targetEntityId,
			table.agentId,
		),
		foreignKey({
			name: "fk_user_a",
			columns: [table.sourceEntityId],
			foreignColumns: [entityTable.id],
		}).onDelete("cascade"),
		foreignKey({
			name: "fk_user_b",
			columns: [table.targetEntityId],
			foreignColumns: [entityTable.id],
		}).onDelete("cascade"),
	],
);
