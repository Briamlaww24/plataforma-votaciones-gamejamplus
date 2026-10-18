import {
  mysqlTable,
  serial,
  varchar,
  timestamp,
  boolean,
  uniqueIndex,
  int,
} from "drizzle-orm/mysql-core";

// Cada participante puede votar una vez por equipo (máximo aplicado en la API).
export const votes = mysqlTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    voterName: varchar("voter_name", { length: 80 }).notNull(),
    teamId: int("team_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("voter_team_unique").on(t.voterName, t.teamId)],
);

// Fila usada para serializar votos simultáneos del mismo participante.
export const voterLocks = mysqlTable("voter_locks", {
  voterName: varchar("voter_name", { length: 80 }).primaryKey(),
});

// Fila única (id = 1): controla si la pantalla de revelación muestra al ganador
export const revealState = mysqlTable("reveal_state", {
  id: int("id").primaryKey(),
  revealed: boolean("revealed").notNull().default(false),
  revealedAt: timestamp("revealed_at"),
});
