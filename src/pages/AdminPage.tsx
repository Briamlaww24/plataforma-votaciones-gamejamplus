import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { DotGridBackdrop, Marquee } from "@/components/arcade";

const PIN_KEY = "gj_admin_pin";

export default function AdminPage() {
  const [pin, setPin] = useState(() => sessionStorage.getItem(PIN_KEY) ?? "");
  const [pinDraft, setPinDraft] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const login = trpc.admin.login.useMutation();
  const authed = pin.length > 0;

  const results = trpc.admin.results.useQuery(
    { pin },
    { enabled: authed, refetchInterval: 2000, retry: false },
  );
  const revealMut = trpc.admin.reveal.useMutation();
  const hideMut = trpc.admin.hide.useMutation();
  const resetMut = trpc.admin.resetVotes.useMutation();

  const utils = trpc.useUtils();
  const refresh = () => utils.admin.results.invalidate();

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    try {
      await login.mutateAsync({ pin: pinDraft });
      sessionStorage.setItem(PIN_KEY, pinDraft);
      setPin(pinDraft);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "PIN incorrecto");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(PIN_KEY);
    setPin("");
    setPinDraft("");
  };

  /* ————— Pantalla de acceso ————— */
  if (!authed) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center px-5">
        <DotGridBackdrop />
        <form
          onSubmit={submitPin}
          className="anim-pop-soft relative z-10 w-full max-w-sm border-2 border-[var(--line)] bg-[var(--ink-2)] p-8"
        >
          <p className="font-arcade-mono mb-2 text-xs uppercase tracking-[0.3em] text-[var(--coral)]">
            Acceso restringido
          </p>
          <h1 className="font-pixel mb-8 text-lg leading-relaxed text-[var(--paper)]">
            PANEL ADMIN
          </h1>
          <label
            htmlFor="admin-pin"
            className="font-arcade-mono mb-2 block text-xs uppercase tracking-[0.25em] text-[var(--paper)]/60"
          >
            PIN de administrador
          </label>
          <input
            id="admin-pin"
            type="password"
            value={pinDraft}
            onChange={(e) => setPinDraft(e.target.value)}
            autoFocus
            className="font-arcade-mono mb-4 w-full border-2 border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-lg text-[var(--paper)] focus:border-[var(--lime)] focus:outline-none"
          />
          {pinError && (
            <p role="alert" className="font-arcade-mono mb-4 text-sm text-[var(--coral)]">
              {pinError}
            </p>
          )}
          <button
            type="submit"
            disabled={login.isPending || pinDraft.length === 0}
            className="pixel-shadow font-pixel w-full border-2 border-[var(--electric)] bg-[var(--electric)] px-4 py-4 text-xs text-[var(--paper)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lime)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {login.isPending ? "VERIFICANDO…" : "ENTRAR"}
          </button>
        </form>
      </main>
    );
  }

  /* ————— Panel ————— */
  if (results.error) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center px-5">
        <DotGridBackdrop />
        <div className="relative z-10 text-center">
          <p className="font-arcade-mono mb-6 text-[var(--coral)]">
            {results.error.message}
          </p>
          <button
            onClick={logout}
            className="font-pixel border-2 border-[var(--line)] px-6 py-4 text-xs text-[var(--paper)] hover:border-[var(--paper)]/50 focus-visible:outline-2 focus-visible:outline-[var(--lime)]"
          >
            VOLVER
          </button>
        </div>
      </main>
    );
  }

  const data = results.data;
  const counts = data ? [...data.counts].sort((a, b) => b.votes - a.votes) : [];
  const maxVotes = Math.max(1, ...counts.map((c) => c.votes));
  const winnerIds = new Set((data?.winners ?? []).map((w) => w.id));

  return (
    <main className="relative min-h-dvh">
      <DotGridBackdrop />
      <Marquee text="Panel de administración — Game Jam" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-10">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-arcade-mono mb-2 text-xs uppercase tracking-[0.3em] text-[var(--coral)]">
              Game Jam 2026
            </p>
            <h1 className="font-pixel text-xl leading-relaxed text-[var(--paper)] sm:text-2xl">
              RESULTADOS
              <span className="anim-blink text-[var(--lime)]">_</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/revelacion"
              target="_blank"
              rel="noreferrer"
              className="font-arcade-mono border-2 border-[var(--line)] px-4 py-2.5 text-xs uppercase tracking-widest text-[var(--paper)]/70 transition-colors hover:border-[var(--lime)] hover:text-[var(--lime)] focus-visible:outline-2 focus-visible:outline-[var(--lime)]"
            >
              Abrir pantalla ↗
            </a>
            <button
              onClick={logout}
              className="font-arcade-mono border-2 border-[var(--line)] px-4 py-2.5 text-xs uppercase tracking-widest text-[var(--paper)]/70 transition-colors hover:border-[var(--coral)] hover:text-[var(--coral)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
            >
              Salir
            </button>
          </div>
        </header>

        {/* Control de revelación */}
        <section className="mb-10 border-2 border-[var(--line)] bg-[var(--ink-2)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="font-arcade-mono text-xs uppercase tracking-[0.25em] text-[var(--paper)]/60">
                Estado de la pantalla
              </p>
              <p
                className={`font-pixel mt-3 text-sm leading-relaxed ${
                  data?.revealed ? "text-[var(--lime)]" : "text-[var(--paper)]/50"
                }`}
              >
                {data?.revealed ? "● RESULTADOS VISIBLES" : "○ RESULTADOS OCULTOS"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  await revealMut.mutateAsync({ pin });
                  refresh();
                }}
                disabled={revealMut.isPending || data?.revealed}
                className="pixel-shadow-coral font-pixel border-2 border-[var(--coral)] bg-[var(--coral)] px-6 py-4 text-xs text-black transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lime)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {revealMut.isPending ? "ACTIVANDO…" : "▶ MOSTRAR RESULTADOS"}
              </button>
              <button
                onClick={async () => {
                  await hideMut.mutateAsync({ pin });
                  refresh();
                }}
                disabled={hideMut.isPending || !data?.revealed}
                className="font-arcade-mono border-2 border-[var(--line)] px-5 py-4 text-xs uppercase tracking-widest text-[var(--paper)]/70 transition-colors hover:border-[var(--paper)]/50 focus-visible:outline-2 focus-visible:outline-[var(--lime)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ocultar
              </button>
            </div>
          </div>
        </section>

        {/* Totales */}
        <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="border-2 border-[var(--line)] bg-[var(--ink-2)] p-5">
            <p className="font-arcade-mono text-xs uppercase tracking-[0.25em] text-[var(--paper)]/50">
              Votos totales
            </p>
            <p className="font-pixel mt-3 text-2xl text-[var(--lime)]">
              {data?.total ?? "—"}
            </p>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--ink-2)] p-5">
            <p className="font-arcade-mono text-xs uppercase tracking-[0.25em] text-[var(--paper)]/50">
              Equipos
            </p>
            <p className="font-pixel mt-3 text-2xl text-[var(--paper)]">
              {data?.counts.length ?? "—"}
            </p>
          </div>
          <div className="col-span-2 border-2 border-[var(--line)] bg-[var(--ink-2)] p-5 sm:col-span-1">
            <p className="font-arcade-mono text-xs uppercase tracking-[0.25em] text-[var(--paper)]/50">
              Líder actual
            </p>
            <p
              className="font-pixel mt-3 text-sm leading-relaxed"
              style={{ color: counts[0]?.votes ? counts[0].color : "var(--paper)" }}
            >
              {counts[0]?.votes ? counts[0].name : "SIN VOTOS"}
            </p>
          </div>
        </section>

        {/* Podio calculado por el backend, incluyendo empates */}
        <section className="mb-10">
          <h2 className="font-arcade-mono mb-4 text-xs uppercase tracking-[0.3em] text-[var(--paper)]/60">
            Podio actual
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((place) => {
              const entry = data?.podium.find((rank) => rank.place === place);
              return (
                <article
                  key={place}
                  className="border-2 border-[var(--line)] bg-[var(--ink-2)] p-4"
                  style={{
                    borderColor: place === 1 ? "var(--lime)" : undefined,
                  }}
                >
                  <p className="font-arcade-mono mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--paper)]/50">
                    {place === 1
                      ? "1.er lugar"
                      : place === 2
                        ? "2.º lugar"
                        : "3.er lugar"}
                  </p>
                  {entry ? (
                    <div className="space-y-2">
                      {entry.teams.map((team) => (
                        <div key={team.id}>
                          <p
                            className="font-pixel text-[10px] leading-relaxed"
                            style={{ color: team.color }}
                          >
                            {team.name}
                          </p>
                          <p className="font-arcade-mono mt-1 text-xs text-[var(--paper)]/60">
                            {team.votes} {team.votes === 1 ? "voto" : "votos"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-arcade-mono text-xs text-[var(--paper)]/35">
                      —
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Barras de resultados */}
        <section className="mb-10">
          <h2 className="font-arcade-mono mb-4 text-xs uppercase tracking-[0.3em] text-[var(--paper)]/60">
            Votos por equipo
          </h2>
          {results.isLoading ? (
            <p className="font-arcade-mono py-8 text-sm text-[var(--paper)]/50">
              Cargando resultados<span className="anim-blink">_</span>
            </p>
          ) : (
            <ol className="space-y-2.5">
              {counts.map((team, i) => (
                <li
                  key={team.id}
                  className="flex items-center gap-3 border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2.5 sm:gap-4 sm:px-4"
                >
                  <span className="font-arcade-mono w-7 shrink-0 text-xs text-[var(--paper)]/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="font-pixel w-32 shrink-0 truncate text-[10px] leading-relaxed sm:w-48 sm:text-[11px]"
                    style={{ color: team.color }}
                  >
                    {team.name}
                    {winnerIds.has(team.id) && team.votes > 0 && (
                      <span className="ml-2 text-[var(--lime)]">★</span>
                    )}
                  </span>
                  <div className="h-5 min-w-0 flex-1 bg-[var(--ink)]">
                    <div
                      className="h-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${(team.votes / maxVotes) * 100}%`,
                        background: team.color,
                        minWidth: team.votes > 0 ? 6 : 0,
                      }}
                    />
                  </div>
                  <span className="font-arcade-mono w-16 shrink-0 text-right text-sm text-[var(--paper)]/80">
                    {team.votes}
                    <span className="ml-1 text-[var(--paper)]/35">
                      {data && data.total > 0
                        ? `${Math.round((team.votes / data.total) * 100)}%`
                        : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Votos recientes */}
        <section className="mb-10">
          <h2 className="font-arcade-mono mb-4 text-xs uppercase tracking-[0.3em] text-[var(--paper)]/60">
            Últimos votos
          </h2>
          {data && data.recent.length > 0 ? (
            <ul className="divide-y divide-[var(--line)] border-2 border-[var(--line)] bg-[var(--ink-2)]">
              {data.recent.map((v) => {
                const team = data.counts.find((c) => c.id === v.teamId);
                return (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <span className="font-arcade-mono truncate text-sm text-[var(--paper)]/85">
                      {v.voterName}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span
                        className="font-pixel text-[9px]"
                        style={{ color: team?.color ?? "var(--paper)" }}
                      >
                        {team?.name ?? `#${v.teamId}`}
                      </span>
                      <span className="font-arcade-mono text-xs text-[var(--paper)]/35">
                        {new Date(v.createdAt).toLocaleTimeString("es", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="font-arcade-mono border-2 border-[var(--line)] bg-[var(--ink-2)] px-4 py-8 text-center text-sm text-[var(--paper)]/40">
              Todavía no hay votos registrados
            </p>
          )}
        </section>

        {/* Zona de peligro */}
        <section className="border-2 border-[var(--coral)]/50 bg-[var(--coral)]/5 p-6">
          <h2 className="font-arcade-mono mb-2 text-xs uppercase tracking-[0.3em] text-[var(--coral)]">
            Zona de peligro
          </h2>
          <p className="mb-5 text-sm text-[var(--paper)]/60">
            Elimina todos los votos y oculta los resultados. No se puede deshacer.
          </p>
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-arcade-mono text-sm text-[var(--coral)]">
                ¿Confirmar borrado total?
              </span>
              <button
                onClick={async () => {
                  await resetMut.mutateAsync({ pin });
                  setConfirmReset(false);
                  refresh();
                }}
                disabled={resetMut.isPending}
                className="font-pixel border-2 border-[var(--coral)] bg-[var(--coral)] px-5 py-3 text-[10px] text-black transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lime)] disabled:opacity-50"
              >
                {resetMut.isPending ? "BORRANDO…" : "SÍ, BORRAR TODO"}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="font-arcade-mono border-2 border-[var(--line)] px-5 py-3 text-xs uppercase tracking-widest text-[var(--paper)]/70 hover:border-[var(--paper)]/50 focus-visible:outline-2 focus-visible:outline-[var(--lime)]"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="font-arcade-mono border-2 border-[var(--coral)]/60 px-5 py-3 text-xs uppercase tracking-widest text-[var(--coral)] transition-colors hover:bg-[var(--coral)]/10 focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
            >
              Reiniciar votación
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
