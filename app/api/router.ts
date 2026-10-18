import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import { createHmac } from "node:crypto";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { votes, revealState, voterLocks } from "@db/schema";
import { TEAMS, TEAM_IDS } from "@contracts/teams";
import { env } from "./lib/env";

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
  const ranked = counts
    .filter((team) => team.votes > 0)
    .sort((a, b) => b.votes - a.votes);
  let previousVotes: number | undefined;
  let place = 0;
  const podiumTeams = ranked.flatMap((team, index) => {
    if (team.votes !== previousVotes) place = index + 1;
    previousVotes = team.votes;
    return place <= 3 ? [{ ...team, place }] : [];
  });
  const podium = Array.from(new Set(podiumTeams.map((team) => team.place)),
    (place) => ({
      place,
      teams: podiumTeams.filter((team) => team.place === place),
    }));
  return { counts, total, winners, podium };
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
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        const clientIp =
          process.env.IP_BLOCK_ENABLED === "false" ? "" : ctx.clientIp;
        const ipIdentity = clientIp
          ? `ip:${clientIp}`
          : `name:${input.voterName.toLowerCase()}`;
        const ipHash = createHmac(
          "sha256",
          env.appSecret || "local-development-ip-hash-secret",
        )
          .update(ipIdentity)
          .digest("hex");
        try {
          const votesUsed = await db.transaction(async (tx) => {
            try {
              await tx.insert(voterLocks).values({
                voterName: input.voterName,
                ipHash: clientIp ? ipHash : null,
              });
            } catch (err: unknown) {
              if (!isDuplicateError(err)) throw err;
              const [existingVoter] = await tx
                .select()
                .from(voterLocks)
                .where(eq(voterLocks.voterName, input.voterName))
                .for("update");
              if (!existingVoter) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message:
                    "Ya se registraron votos desde esta dirección IP con otro nombre",
                });
              }
              if (clientIp && existingVoter.ipHash === null) {
                try {
                  await tx
                    .update(voterLocks)
                    .set({ ipHash })
                    .where(eq(voterLocks.voterName, input.voterName));
                } catch (updateError: unknown) {
                  if (isDuplicateError(updateError)) {
                    throw new TRPCError({
                      code: "CONFLICT",
                      message:
                        "Ya se registraron votos desde esta dirección IP con otro nombre",
                    });
                  }
                  throw updateError;
                }
              }
            }

            // El upsert/insert anterior mantiene bloqueada la fila de este participante.
            await tx
              .select({ voterName: voterLocks.voterName })
              .from(voterLocks)
              .where(eq(voterLocks.voterName, input.voterName))
              .for("update");

            const [{ count }] = await tx
              .select({ count: sql<number>`count(*)` })
              .from(votes)
              .where(eq(votes.voterName, input.voterName));
            if (Number(count) >= 5) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Ya usaste tus 5 votos permitidos",
              });
            }

            await tx.insert(votes).values({
              voterName: input.voterName,
              teamId: input.teamId,
            });
            return Number(count) + 1;
          });
          return { ok: true as const, votesUsed };
        } catch (err: unknown) {
          if (isDuplicateError(err)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Ya registraste un voto para ese equipo",
            });
          }
          throw err;
        }
      }),
  }),

  reveal: createRouter({
    // La pantalla de revelación consulta esto cada 2s.
    // Solo expone el podio cuando el admin activó la revelación.
    status: publicQuery.query(async () => {
      const revealed = await getRevealed();
      if (!revealed) return { revealed: false as const };
      const { podium, total } = await getCounts();
      return { revealed: true as const, podium, total };
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
      const { counts, total, winners, podium } = await getCounts();
      const revealed = await getRevealed();
      const recent = await db
        .select()
        .from(votes)
        .orderBy(desc(votes.createdAt))
        .limit(12);
      return { counts, total, winners, podium, revealed, recent };
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
      await db.delete(voterLocks);
      await setRevealed(false);
      return { ok: true as const };
    }),
  }),
});

export type AppRouter = typeof appRouter;
