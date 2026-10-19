import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { DotGridBackdrop, Marquee } from "@/components/arcade";

export default function VotePage() {
  const teamsQuery = trpc.vote.teams.useQuery();
  const castVote = trpc.vote.cast.useMutation();

  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [voterName, setVoterName] = useState<string | null>(null);
  const [votesUsed, setVotesUsed] = useState(0);
  const [votedTeamIds, setVotedTeamIds] = useState<number[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teams = teamsQuery.data ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (name.trim().length < 2) {
      setError("Escribe tu nombre (mínimo 2 caracteres)");
      return;
    }
    if (teamId === null) {
      setError("Elige un equipo para votar");
      return;
    }
    try {
      const result = await castVote.mutateAsync({
        voterName: voterName ?? name.trim(),
        teamId,
      });
      const team = teams.find((item) => item.id === teamId);
      setVoterName(voterName ?? name.trim());
      setVotesUsed(result.votesUsed);
      setVotedTeamIds((ids) => [...ids, teamId]);
      setSuccess(`Voto registrado para ${team?.name ?? "el equipo"}.`);
      setTeamId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el voto");
    }
  };

  return (
    <main className="relative flex min-h-dvh flex-col">
      <DotGridBackdrop />
      <Marquee text="Game Jam 2026 — Vota por tu equipo favorito" />

      <div className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:py-14">
        <header className="anim-pop-soft mb-10 text-center">
          <p className="font-arcade-mono mb-4 text-xs uppercase tracking-[0.35em] text-[var(--coral)]">
            {teams.length} equipos · 1 ganador
          </p>
          <h1 className="font-pixel text-2xl leading-relaxed text-[var(--paper)] sm:text-4xl sm:leading-relaxed">
            VOTA<span className="text-[var(--electric)]">_</span>AHORA
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--paper)]/65">
            Escribe tu nombre y elige hasta cinco equipos distintos. Usa el mismo
            nombre para registrar todos tus votos.
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
              disabled={voterName !== null}
              maxLength={80}
              autoComplete="name"
              placeholder="PLAYER 1"
              className="font-arcade-mono w-full border-2 border-[var(--line)] bg-[var(--ink-2)] px-4 py-3.5 text-lg text-[var(--paper)] placeholder:text-[var(--paper)]/25 focus:border-[var(--lime)] focus:outline-none"
            />
            {voterName !== null && (
              <p className="font-arcade-mono mt-2 text-xs text-[var(--paper)]/45">
                Nombre registrado para tus votos
              </p>
            )}
          </div>

          <fieldset className="anim-pop-soft" style={{ animationDelay: "120ms" }}>
            <legend className="font-arcade-mono mb-3 text-xs uppercase tracking-[0.25em] text-[var(--paper)]/60">
              Elige un equipo · {5 - votesUsed} votos restantes
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
                  const alreadyVoted = votedTeamIds.includes(team.id);
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setTeamId(team.id)}
                      aria-pressed={selected}
                      disabled={alreadyVoted || votesUsed >= 5}
                      className={`group flex min-h-16 items-center gap-3 border-2 px-4 py-3 text-left transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lime)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                        selected
                          ? "anim-pop-soft border-transparent"
                          : alreadyVoted
                            ? "border-[var(--lime)] bg-[var(--ink-2)]"
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
                        {alreadyVoted && " · VOTADO"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          {success && (
            <p
              role="status"
              className="anim-pop-soft font-arcade-mono border-2 border-[var(--lime)] bg-[var(--lime)]/10 px-4 py-3 text-sm text-[var(--lime)]"
            >
              {success} Te quedan {5 - votesUsed} {5 - votesUsed === 1 ? "voto" : "votos"}.
            </p>
          )}

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
            disabled={castVote.isPending || votesUsed >= 5}
            className="pixel-shadow font-pixel w-full border-2 border-[var(--electric)] bg-[var(--electric)] px-6 py-5 text-sm text-[var(--paper)] transition-transform duration-150 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lime)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
          >
            {castVote.isPending
              ? "ENVIANDO…"
              : votesUsed >= 5
                ? "✓ YA USASTE TUS 5 VOTOS"
                : "▶ ENVIAR VOTO"}
          </button>
        </form>
      </div>

      <Marquee text="Hasta 5 votos por participante · un voto por equipo" />
    </main>
  );
}
