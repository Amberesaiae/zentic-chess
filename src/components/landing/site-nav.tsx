export function SiteNav() {
  return <header className="site-nav">
    <a className="wordmark" href="#top" aria-label="Zentic, home"><span aria-hidden="true">Z</span><b translate="no">ENTIC</b></a>
    <nav aria-label="Primary">
      <a href="#how-a-move-happens">How a move happens</a>
      <a href="#agent-limits">Agent limits</a>
      <a href="#honest-scope">What this is not</a>
    </nav>
    <a className="nav-start" href="#game-setup">Start a game</a>
  </header>;
}
