import { useEffect, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Confetti, DotGridBackdrop, Marquee, StarIcon } from "@/components/arcade";
import { TEAMS } from "@contracts/teams";

type Phase = "standby" | "scan" | "winner";

export default function RevealPage() {
  const status = trpc.reveal.status.useQuery(undefined, {
    refetchInterval: 2000,
  });

  const [phase, setPhase] = useState<Phase>("standby");
  const [scanIndex, setScanIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = status.data;
  const revealed = data?.revealed === true;
  const podium = revealed ? data.podium : [];
  const total = revealed ? data.total : 0;

  // Arranca la secuencia cuando el admin pulsa "Mostrar resultados"
  const wasRevealed = useRef(false);
  useEffect(() => {
    if (revealed && !wasRevealed.current) {
      wasRevealed.current = true;
      setPhase("scan");
      timerRef.current = setTimeout(() => setPhase("winner"), 3400);
    }
    if (!revealed && wasRevealed.current) {
      wasRevealed.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("standby");
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [revealed]);

  // Efecto "máquina tragamonedas" mientras se cuentan los votos
  useEffect(() => {
    if (phase !== "scan") return;
    const iv = setInterval(
      () => setScanIndex((i) => (i + 1) % TEAMS.length),
      90,
    );
    return () => clearInterval(iv);
  }, [phase]);

  const scanningTeam = TEAMS[scanIndex];

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <DotGridBackdrop />
      {phase === "winner" && <Confetti />}

      <Marquee
        text={
          phase === "winner"
            ? "Resultados oficiales del Game Jam"
            : "Resultados en vivo"
        }
      />

      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-12">
        {phase === "standby" && (
          <div className="anim-pop-soft text-center">
            <StarIcon className="anim-spin-slow mx-auto mb-8 h-14 w-14 text-[var(--electric)]" />
            <h1 className="font-pixel text-xl leading-relaxed text-[var(--paper)] sm:text-3xl sm:leading-relaxed">
              RESULTADOS
              <br />
              EN CAMINO
              <span className="anim-blink text-[var(--lime)]">_</span>
            </h1>
            <p className="font-arcade-mono mt-8 text-sm uppercase tracking-[0.3em] text-[var(--paper)]/45">
              La votación sigue abierta
            </p>
          </div>
        )}

        {phase === "scan" && (
          <div className="text-center">
            <p className="font-arcade-mono mb-6 text-sm uppercase tracking-[0.35em] text-[var(--coral)]">
              Contando votos…
            </p>
            <p
              className="font-pixel text-2xl leading-relaxed sm:text-4xl sm:leading-relaxed"
              style={{ color: scanningTeam.color }}
            >
              {scanningTeam.name}
            </p>
          </div>
        )}

        {phase === "winner" && podium.length > 0 && (
          <div className="anim-pop w-full max-w-5xl text-center">
            <StarIcon className="anim-spin-slow mx-auto mb-6 h-16 w-16 text-[var(--lime)]" />
            <p className="font-arcade-mono mb-4 text-sm uppercase tracking-[0.4em] text-[var(--paper)]/60">
              Podio oficial
            </p>
            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
              {podium.map((place) => {
                const firstPlace = place.place === 1;
                const accent = firstPlace ? "var(--lime)" : "var(--paper)";
                return (
                  <section
                    key={place.place}
                    className={`anim-pop border-2 bg-[var(--ink-2)] p-5 sm:p-6 ${
                      firstPlace
                        ? "sm:order-2 sm:py-10"
                        : place.place === 2
                          ? "sm:order-1"
                          : "sm:order-3"
                    }`}
                    style={{
                      borderColor: accent,
                      animationDelay: `${150 + (place.place - 1) * 220}ms`,
                    }}
                  >
                    <p
                      className="font-arcade-mono mb-4 text-xs uppercase tracking-[0.25em]"
                      style={{ color: accent }}
                    >
                      {place.place === 1
                        ? "1.er lugar"
                        : place.place === 2
                          ? "2.º lugar"
                          : "3.er lugar"}
                    </p>
                    <div className="space-y-4">
                      {place.teams.map((team) => (
                        <div key={team.id}>
                          <h1
                            className="font-pixel text-base leading-relaxed sm:text-lg"
                            style={{
                              color: team.color,
                              textShadow: `0 0 24px ${team.color}66`,
                            }}
                          >
                            {team.name}
                          </h1>
                          <p className="font-arcade-mono mt-3 text-sm text-[var(--paper)]/70">
                            {team.votes} {team.votes === 1 ? "voto" : "votos"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
            <p
              className="anim-pop-soft font-arcade-mono mt-8 text-base text-[var(--paper)]/70"
              style={{ animationDelay: "450ms" }}
            >
              {total} {total === 1 ? "voto emitido" : "votos emitidos"}
            </p>
            <div
              className="anim-pop-soft pixel-shadow-lime mx-auto mt-10 inline-block border-2 border-[var(--lime)] bg-[var(--lime)] px-8 py-4"
              style={{ animationDelay: "600ms" }}
            >
              <span className="font-pixel text-sm text-black sm:text-base">
                ★ FELICIDADES ★
              </span>
            </div>
          </div>
        )}

        {phase === "winner" && podium.length === 0 && (
          <div className="anim-pop text-center">
            <h1 className="font-pixel text-xl leading-relaxed text-[var(--paper)] sm:text-2xl">
              SIN VOTOS
              <br />
              REGISTRADOS
            </h1>
            <p className="font-arcade-mono mt-6 text-sm text-[var(--paper)]/50">
              Aún no hay votos para mostrar
            </p>
          </div>
        )}
      </div>

      <Marquee text="Game Jam 2026" />
    </main>
  );
}
