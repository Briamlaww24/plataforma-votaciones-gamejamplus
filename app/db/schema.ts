import {
  mysqlTable,
  serial,
  varchar,
  timestamp,
  boolean,
  uniqueIndex,
  int,
} from "drizzle-orm/mysql-core";

// Un voto por participante (voter_name es único, case-insensitive en MySQL)
export const votes = mysqlTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    voterName: varchar("voter_name", { length: 80 }).notNull(),
    teamId: int("team_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("voter_name_unique").on(t.voterName)],
);

// Fila única (id = 1): controla si la pantalla de revelación muestra al ganador
export const revealState = mysqlTable("reveal_state", {
  id: int("id").primaryKey(),
  revealed: boolean("revealed").notNull().default(false),
  revealedAt: timestamp("revealed_at"),
});
