import { Routes, Route, Link } from "react-router";
import VotePage from "./pages/VotePage";
import RevealPage from "./pages/RevealPage";
import AdminPage from "./pages/AdminPage";

function NotFound() {
  return (
    <main className="dot-grid flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
      <h1 className="font-pixel text-2xl text-[var(--coral)]">404</h1>
      <p className="font-arcade-mono text-sm text-[var(--paper)]/60">
        Esta pantalla no existe
      </p>
      <Link
        to="/"
        className="font-pixel border-2 border-[var(--electric)] bg-[var(--electric)] px-6 py-4 text-xs text-[var(--paper)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lime)]"
      >
        IR A VOTAR
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<VotePage />} />
      <Route path="/revelacion" element={<RevealPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
