import { HeroScene } from "./hero-scene";
import type { LandingView } from "./command-sidebar";

export function Hero({ onPlay, onNavigate }: { onPlay: () => void; onNavigate: (view: LandingView) => void }) {
  return <section className="hero" aria-label="Zentic interactive chess home">
    <HeroScene onPlay={onPlay} onNavigate={onNavigate} />
  </section>;
}
