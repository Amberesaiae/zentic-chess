import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { Chess, type Square } from "chess.js";
import { ChessBoard, type BoardArrow, type BoardMove, type MoveSound, type ValidMovesMap } from "react-shahmat";
import { useEffect, useRef, useState } from "react";
import type { AgentProposal, LegalMove, MoveRecord } from "../domain/chess/types";

type Props = {
  fen: string;
  legalMoves: LegalMove[];
  lastMove?: MoveRecord;
  proposal?: AgentProposal;
  orientation: "white" | "black";
  humanColor: "w" | "b";
  canMove: boolean;
  onMove: (from: Square, to: Square) => void;
};

let soundContext: AudioContext | undefined;

export function LiveBoard({ fen, legalMoves, lastMove, proposal, orientation, humanColor, canMove, onMove }: Props) {
  const [arrows, setArrows] = useState<BoardArrow[]>([]);
  const [premove, setPremove] = useState<BoardMove>();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const submittingMove = useRef(false);
  const heardMove = useRef<string | undefined>(undefined);
  const validMoves = legalMoves.reduce<ValidMovesMap>((moves, move) => {
    moves.set(move.from, [...(moves.get(move.from) ?? []), move.to]);
    return moves;
  }, new Map());
  const highlights = proposal ? [proposal.move.from, proposal.move.to] : [];
  const game = new Chess(fen);
  const gameEndOverlay = stateToOverlay(game);
  const turnColor = fen.split(" ")[1] === "b" ? "black" : "white";
  const check = game.isCheck() ? game.board().flat().find((piece) => piece?.type === "k" && piece.color === game.turn())?.square : undefined;
  const displayedLastMove = lastMove ? { from: lastMove.from, to: lastMove.to, promotion: ({ q: "queen", r: "rook", b: "bishop", n: "knight" } as const)[lastMove.promotion ?? ""] } : undefined;
  const displayedArrows = proposal ? [...arrows, { from: proposal.move.from, to: proposal.move.to }] : arrows;

  useEffect(() => {
    submittingMove.current = false;
  }, [fen]);

  useEffect(() => {
    if (!lastMove || lastMove.id === heardMove.current || !soundEnabled) return;
    heardMove.current = lastMove.id;
    playSound(lastMove.captured ? "capture" : lastMove.san.includes("+") ? "check" : "move");
  }, [lastMove, soundEnabled]);

  function stateToOverlay(currentGame: Chess) {
    if (!currentGame.isGameOver()) return undefined;
    return currentGame.isCheckmate() ? { type: "checkmate" as const, winner: currentGame.turn() === "w" ? "black" as const : "white" as const } : { type: currentGame.isStalemate() ? "stalemate" as const : "draw" as const };
  }

  function submit(move: BoardMove) {
    const isHumanTurn = turnColor === (humanColor === "w" ? "white" : "black");
    if (!canMove || !isHumanTurn || submittingMove.current) {
      setPremove(move);
      return;
    }
    const legal = legalMoves.find((candidate) => candidate.from === move.from && candidate.to === move.to);
    if (legal) {
      setPremove(undefined);
      void wakeAudio();
      submittingMove.current = true;
      onMove(legal.from, legal.to);
    }
  }

  function playSound(sound: MoveSound) {
    if (!soundEnabled || typeof window === "undefined") return;
    const frequencies: Record<MoveSound, number> = { move: 392, capture: 185, check: 622, checkmate: 117, promotion: 784, draw: 262, premove: 330, error: 146, gamestart: 523 };
    const context = soundContext ?? new window.AudioContext();
    soundContext = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequencies[sound];
    oscillator.type = sound === "capture" || sound === "error" ? "sawtooth" : "sine";
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.19);
  }

  async function wakeAudio() {
    if (typeof window === "undefined") return;
    const context = soundContext ?? new window.AudioContext();
    soundContext = context;
    if (context.state === "suspended") await context.resume();
  }

  return <section className="board-field" aria-label="Chess board">
    <div className="board-key"><span>The board</span><div><span>{canMove ? "MAKE YOUR MOVE" : proposal ? "MOVE AWAITS APPROVAL" : gameEndOverlay ? "MATCH COMPLETE" : "ZENTIC IS READING"}</span><button className="sound-toggle" type="button" onClick={() => { void wakeAudio(); setSoundEnabled((enabled) => !enabled); }} aria-pressed={soundEnabled} aria-label={soundEnabled ? "Mute board sounds" : "Enable board sounds"}>{soundEnabled ? <SpeakerHigh size={16} weight="fill" /> : <SpeakerSlash size={16} weight="fill" />}</button></div></div>
    <div className="shahmat-frame"><ChessBoard position={fen} orientation={orientation} turnColor={turnColor} validMoves={validMoves} lastMove={displayedLastMove} check={check} gameEndOverlay={gameEndOverlay} onMove={submit} onPremove={setPremove} whiteMovable={humanColor === "w"} blackMovable={humanColor === "b"} enablePremoves enableAnimations animationDuration={260} enableArrows arrows={displayedArrows} onArrowsChange={setArrows} highlights={highlights} enableHighlights showMoveIndicators showCoordinates highlightDropTarget className="zentic-shahmat" /></div>
    <p className="board-instruction" aria-live="polite">{premove ? `Premove queued: ${premove.from} to ${premove.to}.` : canMove ? "Choose a piece, then choose its square." : proposal ? `Agent proposes ${proposal.move.san}.` : gameEndOverlay ? "The final position is locked." : "The board is synchronized for the next move."}</p>
  </section>;
}
