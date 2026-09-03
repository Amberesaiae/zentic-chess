import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { AgentProposal, LegalMove, MoveRecord } from "../domain/chess/types";

type Props = {
  fen: string;
  legalMoves: LegalMove[];
  lastMove?: MoveRecord;
  proposal?: AgentProposal;
  orientation: "white" | "black";
  canMove: boolean;
  onMove: (from: Square, to: Square) => void;
};

export function LiveBoard({ fen, legalMoves, lastMove, proposal, orientation, canMove, onMove }: Props) {
  const frameRef = useRef<HTMLElement>(null);
  const [boardWidth, setBoardWidth] = useState(620);
  const [selected, setSelected] = useState<Square>();
  const selectedMoves = selected ? legalMoves.filter((move) => move.from === selected) : [];
  const styles: Record<string, CSSProperties> = {};

  if (lastMove) {
    styles[lastMove.from] = { background: "rgba(73, 92, 201, .18)" };
    styles[lastMove.to] = { background: "rgba(73, 92, 201, .34)" };
  }
  if (proposal) {
    styles[proposal.move.from] = { ...styles[proposal.move.from], boxShadow: "inset 0 0 0 3px #495cc9" };
    styles[proposal.move.to] = { ...styles[proposal.move.to], boxShadow: "inset 0 0 0 3px #495cc9", background: "repeating-linear-gradient(135deg, rgba(73,92,201,.36) 0 5px, rgba(73,92,201,.12) 5px 10px)" };
  }
  if (selected) styles[selected] = { ...styles[selected], boxShadow: "inset 0 0 0 3px #fdfdff" };
  selectedMoves.forEach((move) => {
    styles[move.to] = { ...styles[move.to], background: "radial-gradient(circle, rgba(44,57,88,.62) 0 15%, transparent 17%)" };
  });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setBoardWidth(Math.min(704, Math.floor(frame.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  function selectSquare(square: Square) {
    if (!canMove) return;
    if (selected) {
      const move = selectedMoves.find((candidate) => candidate.to === square);
      if (move) {
        onMove(move.from, move.to);
        setSelected(undefined);
        return;
      }
    }
    setSelected(legalMoves.some((move) => move.from === square) ? square : undefined);
  }

  return <section className="board-field" ref={frameRef} aria-label="Chess board">
    <div className="board-key"><span>LIVE POSITION</span><span>{canMove ? "SELECT OR DRAG A PIECE" : proposal ? "AGENT MOVE AWAITING REVIEW" : "BOARD LOCKED"}</span></div>
    <Chessboard options={{
      position: fen,
      boardOrientation: orientation,
      onPieceDrop: ({ sourceSquare, targetSquare }) => {
        if (!canMove || !targetSquare) return false;
        try { onMove(sourceSquare as Square, targetSquare as Square); setSelected(undefined); return true; } catch { return false; }
      },
      onSquareClick: ({ square }) => selectSquare(square as Square),
      canDragPiece: ({ square }) => canMove && legalMoves.some((move) => move.from === square),
      squareStyles: styles,
      darkSquareStyle: { backgroundColor: "#8793b1" },
      lightSquareStyle: { backgroundColor: "#eff1f6" },
      animationDurationInMs: 180,
      boardStyle: { width: `${boardWidth}px`, maxWidth: "100%" },
      showNotation: true,
    }} />
    <p className="board-instruction" aria-live="polite">{selected ? `Selected ${selected}. Choose a highlighted legal destination.` : canMove ? "Your turn as White." : proposal ? `The agent proposed ${proposal.move.san}.` : "The agent can inspect this live position through WebMCP."}</p>
  </section>;
}
