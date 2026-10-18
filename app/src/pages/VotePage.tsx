import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { DotGridBackdrop, Marquee, StarIcon } from "@/components/arcade";

export default function VotePage() {
  const teamsQuery = trpc.vote.teams.useQuery();
  const castVote = trpc.vote.cast.useMutation();

  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teams = teamsQuery.data ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Escribe tu nombre (mínimo 2 caracteres)");
      return;
    }
    if (teamId === null) {
      setError("Elige un equipo para votar");
      return;
    }
    try {
      await castVote.mutateAsync({ voterName: name.trim(), teamId });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el voto");
    }
  };

  if (done) {
    const team = teams.find((t) => t.id === teamId);
    return (
      <main className="relative flex min-h-dvh flex-col">
        <DotGridBackdrop />
        <Marquee text="Voto registrado" />
        <div className="relative z-10 flex flex-1 items-center justify-center px-5">
          <div className="anim-pop max-w-md text-center">
            <StarIcon className="anim-spin-slow mx-auto mb-6 h-12 w-12 text-[var(--lime)]" />
            <h1 className="font-pixel text-xl leading-relaxed text-[var(--lime)] sm:text-2xl">
              ¡VOTO REGISTRADO!
            </h1>
            <p className="font-arcade-mono mt-6 text-sm text-[var(--paper)]/70">
              {name.trim()} votó por
            </p>
            <p
              className="font-pixel mt-3 text-base leading-relaxed sm:text-lg"
              style={{ color: team?.color ?? "#F3F3F3" }}
            >
              {team?.name ?? "tu equipo"}
            </p>
            <p className="font-arcade-mono mt-8 text-xs uppercase tracking-[0.25em] text-[var(--paper)]/40">
              Los resultados se revelarán en la gran pantalla
            </p>
          </div>
        </div>
        <Marquee text="Gracias por participar" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col">
      <DotGridBackdrop />
      <Marquee text="Game Jam 2026 — Vota por tu equipo favorito" />

      <div className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:py-14">
        <header className="anim-pop-soft mb-10 text-center">
          <p className="font-arcade-mono mb-4 text-xs uppercase tracking-[0.35em] text-[var(--coral)]">
            13 equipos · 1 ganador
          </p>
          <h1 className="font-pixel text-2xl leading-relaxed text-[var(--paper)] sm:text-4xl sm:leading-relaxed">
            VOTA<span className="text-[var(--electric)]">_</span>AHORA
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--paper)]/65">
            Escribe tu nombre, elige al equipo que más te gustó y pulsa enviar.
            Un solo voto por participante.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-8">
          <div className="anim-pop-soft" style={{ animationDelay: "60ms" }}>
            <label
              htmlFor="voter-name"
              className="font-arcade-mono mb-2 block text-xs uppercase tracking-[0.25em] text-[var(--paper)]/60"
            >
              Tu nombre
            </label>
            <input
              id="voter-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
              placeholder="PLAYER 1"
              className="font-arcade-mono w-full border-2 border-[var(--line)] bg-[var(--ink-2)] px-4 py-3.5 text-lg text-[var(--paper)] placeholder:text-[var(--paper)]/25 focus:border-[var(--lime)] focus:outline-none"
            />
          </div>

          <fieldset className="anim-pop-soft" style={{ animationDelay: "120ms" }}>
            <legend className="font-arcade-mono mb-3 text-xs uppercase tracking-[0.25em] text-[var(--paper)]/60">
              Elige un equipo
            </legend>
            {teamsQuery.isLoading ? (
              <p className="font-arcade-mono py-10 text-center text-sm text-[var(--paper)]/50">
                Cargando equipos<span className="anim-blink">_</span>
              </p>
            ) : teamsQuery.isError ? (
              <p className="font-arcade-mono py-10 text-center text-sm text-[var(--coral)]">
                No se pudieron cargar los equipos. Recarga la página.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team, i) => {
                  const selected = teamId === team.id;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setTeamId(team.id)}
                      aria-pressed={selected}
                      className={`group flex min-h-16 items-center gap-3 border-2 px-4 py-3 text-left transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lime)] active:scale-[0.98] ${
                        selected
                          ? "anim-pop-soft border-transparent"
                          : "border-[var(--line)] bg-[var(--ink-2)] hover:-translate-y-0.5 hover:border-[var(--paper)]/40"
                      }`}
                      style={
                        selected
                          ? { background: team.color, animationDelay: "0ms" }
                          : { animationDelay: `${i * 30}ms` }
                      }
                    >
                      <span
                        className="h-4 w-4 shrink-0 border"
                        style={{
                          background: selected ? "rgba(0,0,0,0.85)" : team.color,
                          borderColor: selected ? "rgba(0,0,0,0.4)" : "transparent",
                        }}
                        aria-hidden
                      />
                      <span
                        className={`font-pixel text-[11px] leading-relaxed ${
                          selected ? "text-black" : "text-[var(--paper)]"
                        }`}
                      >
                        {team.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          {error && (
            <p
              role="alert"
              className="anim-pop-soft font-arcade-mono border-2 border-[var(--coral)] bg-[var(--coral)]/10 px-4 py-3 text-sm text-[var(--coral)]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={castVote.isPending}
            className="pixel-shadow font-pixel w-full border-2 border-[var(--electric)] bg-[var(--electric)] px-6 py-5 text-sm text-[var(--paper)] transition-transform duration-150 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lime)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
          >
            {castVote.isPending ? "ENVIANDO…" : "▶ ENVIAR VOTO"}
          </button>
        </form>
      </div>

      <Marquee text="Un voto por participante" />
    </main>
  );
}
