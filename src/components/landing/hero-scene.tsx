import { CommandSidebar, type LandingView } from "./command-sidebar";

export function HeroScene({ onPlay, onNavigate }: { onPlay: () => void; onNavigate: (view: LandingView) => void }) {
  return <div className="home-deck" aria-label="Zentic chess command deck">
    <img className="home-deck-art" src="/assets/zentic-command-hero-no-sidebar.png" alt="Chess board with a player hand and Zentic agent analysis." />
    <div className="home-deck-vignette" aria-hidden="true" />
    <CommandSidebar activeView="home" onNavigate={onNavigate} onPlay={onPlay} />
  </div>;
}
