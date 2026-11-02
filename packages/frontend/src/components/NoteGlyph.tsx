interface NoteGlyphProps {
  className?: string;
}

// A single eighth note, used for the mascot and the background decoration.
export default function NoteGlyph({ className }: NoteGlyphProps) {
  return (
    <svg className={className} viewBox="0 0 40 56" aria-hidden="true">
      <ellipse cx="13" cy="44" rx="12" ry="9" transform="rotate(-20 13 44)" />
      <path d="M21 43V4c4 6 8 8 12 10 5 3 6 9 3 14 0-6-5-9-11-10v25z" />
    </svg>
  );
}
