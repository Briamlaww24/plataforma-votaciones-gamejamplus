import { useMemo } from "react";

export function DotGridBackdrop() {
  return (
    <div
      aria-hidden
      className="dot-grid pointer-events-none fixed inset-0 z-0"
    />
  );
}

export function Marquee({ text, className = "" }: { text: string; className?: string }) {
  const items = useMemo(() => Array(8).fill(text) as string[], [text]);
  return (
    <div
      aria-hidden
      className={`overflow-hidden whitespace-nowrap border-y border-[var(--line)] ${className}`}
    >
      <div className="anim-marquee inline-flex">
        {[0, 1].map((half) => (
          <span key={half} className="flex">
            {items.map((t, i) => (
              <span
                key={i}
                className="font-arcade-mono px-6 py-2 text-xs uppercase tracking-[0.3em] text-[var(--paper)]/60"
              >
                {t} <span className="text-[var(--lime)]">★</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#3834FF", "#C6D32D", "#FF624D", "#FFA7F0", "#3ECF6B", "#F3F3F3"];

export function Confetti({ count = 90 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.6 + Math.random() * 2.8,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: Math.random() > 0.6,
      })),
    [count],
  );
  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.id}
          aria-hidden
          className="confetti-piece"
          style={{
            left: `${p.left}vw`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.round ? "50%" : "1px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </>
  );
}

export function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 1l2.6 6.9L22 9.2l-5.4 4.8 1.6 7.3L12 17.7 5.8 21.3l1.6-7.3L2 9.2l7.4-1.3L12 1z" />
    </svg>
  );
}
