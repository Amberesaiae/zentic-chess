import { Chessboard } from "react-chessboard";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Props = {
  fen: string;
  highlight?: { from: string; to: string };
  label: string;
};

/** A read-only board used for the landing demonstration. It shares the match board palette so the
 *  product a visitor sees here is the product they get after starting a game. */
export function DemoBoard({ fen, highlight, label }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(420);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setBoardWidth(Math.floor(frame.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const squareStyles: Record<string, CSSProperties> = {};
  if (highlight) {
    squareStyles[highlight.from] = { boxShadow: "inset 0 0 0 3px var(--accent)" };
    squareStyles[highlight.to] = { boxShadow: "inset 0 0 0 3px var(--accent)", background: "repeating-linear-gradient(135deg, rgba(189,60,50,.34) 0 5px, rgba(189,60,50,.12) 5px 10px)" };
  }

  return <div className="demo-board" ref={frameRef} role="img" aria-label={label}>
    <Chessboard options={{
      position: fen,
      boardOrientation: "white",
      allowDragging: false,
      squareStyles,
      darkSquareStyle: { backgroundColor: "#8793b1" },
      lightSquareStyle: { backgroundColor: "#eff1f6" },
      animationDurationInMs: 260,
      boardStyle: { width: `${boardWidth}px`, maxWidth: "100%" },
      showNotation: true,
    }} />
  </div>;
}
