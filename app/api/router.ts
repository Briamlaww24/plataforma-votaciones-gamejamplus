import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { votes, revealState } from "@db/schema";
import { TEAMS, TEAM_IDS } from "@contracts/teams";

const ADMIN_PIN = process.env.ADMIN_PIN ?? "jam2026";

function assertAdmin(pin: string) {
  if (pin !== ADMIN_PIN) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN incorrecto" });
  }
}

function isDuplicateError(err: unknown): boolean {
  let cur: unknown = err;
  while (cur && typeof cur === "object") {
    const e = cur as { code?: unknown; errno?: unknown; message?: unknown };
    if (e.code === "ER_DUP_ENTRY" || e.errno === 1062) return true;
    if (typeof e.message === "string" && /duplicate entry/i.test(e.message))
      return true;
    cur = (cur as { cause?: unknown }).cause;
  }
  return false;
}

async function getCounts() {
  const db = getDb();
  const rows = await db
    .select({ teamId: votes.teamId, count: sql<number>`count(*)` })
    .from(votes)
    .groupBy(votes.teamId);
  const map = new Map(rows.map((r) => [r.teamId, Number(r.count)]));
  const counts = TEAMS.map((t) => ({ ...t, votes: map.get(t.id) ?? 0 }));
  const total = counts.reduce((acc, c) => acc + c.votes, 0);
  const max = Math.max(0, ...counts.map((c) => c.votes));
  const winners = max > 0 ? counts.filter((c) => c.votes === max) : [];
  return { counts, total, winners };
}

async function getRevealed(): Promise<boolean> {
  const db = getDb();
  const rows = await db.select().from(revealState);
  if (rows.length === 0) {
    await db.insert(revealState).values({ id: 1, revealed: false });
    return false;
  }
  return rows[0].revealed;
}

async function setRevealed(revealed: boolean) {
  const db = getDb();
  const rows = await db.select().from(revealState);
  if (rows.length === 0) {
    await db
      .insert(revealState)
      .values({ id: 1, revealed, revealedAt: revealed ? new Date() : null });
  } else {
    await db
      .update(revealState)
      .set({ revealed, revealedAt: revealed ? new Date() : null });
  }
}

const pinInput = z.object({ pin: z.string().min(1) });

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  vote: createRouter({
    teams: publicQuery.query(() =>
      TEAMS.map(({ id, name, color }) => ({ id, name, color })),
    ),

    cast: publicQuery
      .input(
        z.object({
          voterName: z
            .string()
            .trim()
            .min(2, "Escribe tu nombre (mínimo 2 caracteres)")
            .max(80, "Nombre demasiado largo"),
          teamId: z
            .number()
            .int()
            .refine((id) => TEAM_IDS.includes(id), "Equipo inválido"),
        }),
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        try {
          await db.insert(votes).values({
            voterName: input.voterName,
            teamId: input.teamId,
          });
        } catch (err: unknown) {
          if (isDuplicateError(err)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Este nombre ya registró un voto",
            });
          }
          throw err;
        }
        return { ok: true as const };
      }),
  }),

  reveal: createRouter({
    // La pantalla de revelación consulta esto cada 2s.
    // Solo expone el ganador cuando el admin activó la revelación.
    status: publicQuery.query(async () => {
      const revealed = await getRevealed();
      if (!revealed) return { revealed: false as const };
      const { winners, total } = await getCounts();
      return { revealed: true as const, winners, total };
    }),
  }),

  admin: createRouter({
    login: publicQuery.input(pinInput).mutation(({ input }) => {
      assertAdmin(input.pin);
      return { ok: true as const };
    }),

    results: publicQuery.input(pinInput).query(async ({ input }) => {
      assertAdmin(input.pin);
      const db = getDb();
      const { counts, total, winners } = await getCounts();
      const revealed = await getRevealed();
      const recent = await db
        .select()
        .from(votes)
        .orderBy(desc(votes.createdAt))
        .limit(12);
      return { counts, total, winners, revealed, recent };
    }),

    reveal: publicQuery.input(pinInput).mutation(async ({ input }) => {
      assertAdmin(input.pin);
      await setRevealed(true);
      return { ok: true as const };
    }),

    hide: publicQuery.input(pinInput).mutation(async ({ input }) => {
      assertAdmin(input.pin);
      await setRevealed(false);
      return { ok: true as const };
    }),

    resetVotes: publicQuery.input(pinInput).mutation(async ({ input }) => {
      assertAdmin(input.pin);
      const db = getDb();
      await db.delete(votes);
      await setRevealed(false);
      return { ok: true as const };
    }),
  }),
});

export type AppRouter = typeof appRouter;
