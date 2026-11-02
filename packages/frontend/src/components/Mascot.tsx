import NoteGlyph from "./NoteGlyph";
import "./Mascot.css";

export default function Mascot() {
  return (
    <div className="mascot" aria-hidden="true">
      <svg className="mascot-face" viewBox="0 0 120 108">
        <g stroke="var(--ink)" strokeWidth="5" strokeLinejoin="round">
          <path d="M22 40 26 8l26 20" fill="var(--mascot)" />
          <path d="M98 40 94 8 68 28" fill="var(--mascot)" />
          <ellipse cx="60" cy="62" rx="50" ry="40" fill="var(--mascot)" />
        </g>
        <path
          d="m29 22 2-6 8 7m52-1-2-6-8 7"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".55"
        />
        <circle cx="45" cy="60" r="5" fill="var(--ink)" />
        <circle cx="75" cy="60" r="5" fill="var(--ink)" />
        <path
          d="M53 74q7 6 14 0"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <NoteGlyph className="mascot-note" />
    </div>
  );
}
