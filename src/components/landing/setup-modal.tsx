import { X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import type { MatchConfig } from "../../domain/chess/types";
import { SetupPanel } from "./setup-panel";

export function SetupModal({ open, onClose, onStart }: { open: boolean; onClose: () => void; onStart: (config: MatchConfig) => void }) {
  const dialog = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => dialog.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !dialog.current) return;
      const focusable = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); returnFocus.current?.focus(); };
  }, [open, onClose]);

  if (!open) return null;
  return <div className="setup-modal-layer" role="presentation">
    <button className="setup-modal-backdrop" type="button" aria-label="Close game setup" onClick={onClose} />
    <section ref={dialog} className="setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title" tabIndex={-1}>
      <header className="setup-modal-header">
        <div className="setup-modal-copy"><h2 id="setup-title">Play your way.</h2><p>Three choices. One clear game.</p></div>
        <button className="setup-modal-close" type="button" aria-label="Close game setup" onClick={onClose}><X size={20} weight="bold" /></button>
      </header>
      <SetupPanel onStart={onStart} />
    </section>
  </div>;
}
