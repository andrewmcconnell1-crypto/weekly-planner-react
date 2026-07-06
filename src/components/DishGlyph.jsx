// Ladle's hand-drawn glyph family — one consistent line-icon style (1.7
// stroke, round caps) instead of platform emoji, so every tile and chip looks
// like it belongs to this app. The dish glyphs' keys match what recipeImagery
// resolves; the pantry glyphs (bottle, salt, onion, garlic, tin) and the
// sparkle dress the walkthrough scenes. Dots and fills use the current
// colour; everything scales with the svg box.

const GLYPHS = {
  pot: (
    <>
      <path d="M4.5 11.5h15" />
      <path d="M6 11.5v3.5a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-3.5" />
      <path d="M2.5 11.5h2M19.5 11.5h2" />
      <path d="M7 11.5a5 3.4 0 0 1 10 0" />
      <path d="M12 6.6v-1" />
    </>
  ),
  bowlSteam: (
    <>
      <path d="M4 12.5h16a8 8 0 0 1-16 0Z" />
      <path d="M9.5 9c-.9-1.1.9-2.1 0-3.2M14.5 9c-.9-1.1.9-2.1 0-3.2" />
    </>
  ),
  noodles: (
    <>
      <path d="M4 13h16a8 8 0 0 1-16 0Z" />
      <path d="M9 9.5 7.5 2.5M13.5 9.5 15 2.5" />
      <path d="M7.5 16c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0" />
    </>
  ),
  pastaFork: (
    <>
      <path d="M9.6 2.5v4.6M12 2.5v5M14.4 2.5v4.6" />
      <circle cx="12" cy="11" r="3.5" />
      <path d="M12 14.5v7" />
    </>
  ),
  fish: (
    <>
      <path d="M2.5 12q4-5 7.5-5t7 5q-3.5 5-7 5t-7.5-5Z" />
      <path d="M17 12l4.5-3.5v7Z" />
      <circle cx="6.4" cy="11" r="0.4" fill="currentColor" stroke="none" />
    </>
  ),
  drumstick: (
    <>
      <path d="M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23" />
      <path d="m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59" />
    </>
  ),
  steak: (
    <>
      <path d="M12 5.5c4.6 0 8.5 1.9 8.5 5 0 2.3-2 3.3-4.2 4.2-1.9.8-2.7 1.5-3.3 3.3-.5 1.6-1.9 2.5-3.8 2.5-3.4 0-5.7-2.4-5.7-5.5s3.1-9.5 8.5-9.5Z" />
      <circle cx="14.8" cy="9.8" r="1.9" />
    </>
  ),
  taco: (
    <>
      <path d="M3 16.5a9 9 0 0 1 18 0" />
      <path d="M6.8 16.5a5.2 5.2 0 0 1 10.4 0" />
      <path d="M3 16.5h18" />
      <circle cx="9.2" cy="12.6" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.6" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="12.6" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  pizza: (
    <>
      <path d="M12 21.5 3.8 6.2a16.8 16.8 0 0 1 16.4 0Z" />
      <path d="M5 8.4a14 14 0 0 1 14 0" />
      <circle cx="9.8" cy="11" r="1.1" />
      <circle cx="13.4" cy="14.4" r="1.1" />
    </>
  ),
  burger: (
    <>
      <path d="M4 10.5a8 8 0 0 1 16 0v.5H4Z" />
      <path d="M4 14c1.3 1.2 2.7-1.2 4 0s2.7-1.2 4 0 2.7-1.2 4 0 2.7-1.2 4 0" />
      <path d="M4.5 17h15v.5a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3Z" />
      <circle cx="9" cy="7.3" r="0.45" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6.6" r="0.45" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7.3" r="0.45" fill="currentColor" stroke="none" />
    </>
  ),
  leaf: (
    <>
      <path d="M12 21.5C11.5 15 13 8.5 19.5 4.5" />
      <path d="M19.5 4.5c.3 5-2.2 8.3-7.3 8.6-.5-5 2.3-8.2 7.3-8.6Z" />
      <path d="M7 8.5c3.2.4 4.9 2.2 5 5.3-3.3-.3-4.9-2.1-5-5.3Z" />
    </>
  ),
  rice: (
    <>
      <path d="M4 13h16a8 8 0 0 1-16 0Z" />
      <path d="M7.2 13a4.8 4.8 0 0 1 9.6 0" />
      <path d="M10 10.4l.6-1.1M14 10.4l-.6-1.1M12 9.4V8.2" />
    </>
  ),
  eggPan: (
    <>
      <circle cx="10.5" cy="13" r="6.5" />
      <path d="M17 13h5" />
      <circle cx="10" cy="12.5" r="2" />
    </>
  ),
  wrap: (
    <>
      <path d="M5 14 13 6a4.4 4.4 0 0 1 6.2 6.2L11 20.4a4.4 4.4 0 0 1-6-6.4Z" />
      <path d="M10.8 8.2l5 5M8.4 10.6l5 5" />
    </>
  ),
  pie: (
    <>
      <path d="M4.5 13a7.5 7.5 0 0 1 15 0" />
      <path d="M3 13h18l-1.2 3.2A4 4 0 0 1 16 19H8a4 4 0 0 1-3.8-2.8Z" />
      <path d="M9.3 9.5l1.2-1.6M13.5 7.9l1.2 1.6" />
    </>
  ),
  plate: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="4.4" />
    </>
  ),
  bottle: (
    <>
      <path d="M10.5 3h3v3c0 1.1 2.5 1.6 2.5 3.6v9.1a1.8 1.8 0 0 1-1.8 1.8h-4.4A1.8 1.8 0 0 1 8 18.7V9.6c0-2 2.5-2.5 2.5-3.6Z" />
      <path d="M8 14.5h8" />
    </>
  ),
  salt: (
    <>
      <path d="M8.5 9.5h7l1 9.9a1.8 1.8 0 0 1-1.8 2.1H9.3a1.8 1.8 0 0 1-1.8-2.1Z" />
      <path d="M9.2 9.5V8a2.8 2.8 0 0 1 5.6 0v1.5" />
      <circle cx="11" cy="7.2" r="0.45" fill="currentColor" stroke="none" />
      <circle cx="13" cy="7.2" r="0.45" fill="currentColor" stroke="none" />
      <circle cx="12" cy="5.9" r="0.45" fill="currentColor" stroke="none" />
    </>
  ),
  onion: (
    <>
      <path d="M12 7.2c3.7 0 6.4 2.7 6.4 6.1s-2.9 7.2-6.4 7.2-6.4-3.8-6.4-7.2S8.3 7.2 12 7.2Z" />
      <path d="M9.6 8.2c-1 3.4-.9 7.4.4 11.3M14.4 8.2c1 3.4.9 7.4-.4 11.3" />
      <path d="M11.2 7.1c-.5-1.7-.2-2.9.9-4.3M12.8 7.1c.4-1.5 1.1-2.5 2.6-3.2" />
    </>
  ),
  garlic: (
    <>
      <path d="M12 4.5c-.9 2-3.4 2.6-4.7 4.6-1.6 2.4-1 6.1.9 8 2 2.1 5.6 2.1 7.6 0 1.9-1.9 2.5-5.6.9-8-1.3-2-3.8-2.6-4.7-4.6Z" />
      <path d="M12 8.4v9M9.4 9.7c-.4 2.4 0 4.8.9 6.5M14.6 9.7c.4 2.4 0 4.8-.9 6.5" />
    </>
  ),
  tin: (
    <>
      <ellipse cx="12" cy="6.3" rx="6.5" ry="2.4" />
      <path d="M5.5 6.3v11.2c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V6.3" />
      <path d="M5.5 12.8c1.5 1 4 1.5 6.5 1.5s5-.5 6.5-1.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 4.5l1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5Z" />
      <path d="M18 4.2l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z" />
    </>
  ),
};

function DishGlyph({ glyph, className = "" }) {
  const art = GLYPHS[glyph] || GLYPHS.plate;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {art}
    </svg>
  );
}

export default DishGlyph;
