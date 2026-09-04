import { BookOpenText, ChartBar, House, List, Play, X } from "@phosphor-icons/react";
import { useState } from "react";

export type LandingView = "home" | "how" | "reviews";

const navigation: { id: LandingView; label: string; icon: typeof House }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "how", label: "How it works", icon: BookOpenText },
  { id: "reviews", label: "Reviews", icon: ChartBar },
];

export function CommandSidebar({ activeView, onNavigate, onPlay }: { activeView: LandingView; onNavigate: (view: LandingView) => void; onPlay: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const choose = (view: LandingView) => { onNavigate(view); setMenuOpen(false); };

  return <>
    <button className="home-menu-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="zentic-navigation" onClick={() => setMenuOpen((open) => !open)}>
      {menuOpen ? <X size={23} weight="bold" /> : <List size={24} weight="bold" />}
    </button>
    {menuOpen && <button className="home-menu-backdrop" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`home-sidebar ${menuOpen ? "is-open" : ""}`} id="zentic-navigation" aria-label="Zentic navigation">
      <button className="home-rail-brand" type="button" onClick={() => choose("home")} aria-label="Zentic home"><span>Z</span><b>ENTIC</b></button>
      <nav className="home-sidebar-nav" aria-label="Page navigation">
        {navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={activeView === id ? "is-active" : ""} aria-current={activeView === id ? "page" : undefined} onClick={() => choose(id)}>
          <Icon size={19} weight={activeView === id ? "fill" : "regular"} aria-hidden="true" /><span>{label}</span>
        </button>)}
      </nav>
      <button type="button" className="home-sidebar-play" onClick={onPlay}><Play size={17} weight="fill" aria-hidden="true" /><span>Play</span></button>
    </aside>
  </>;
}
