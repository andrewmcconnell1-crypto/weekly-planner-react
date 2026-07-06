// The app's logotype: a small hand-drawn ladle beside the wordmark, set in the
// display serif. Sits where a screen's eyebrow label would — one quiet, human
// signature instead of a generic product label.
function BrandMark() {
  return (
    <span className="brand-mark">
      <svg
        className="brand-mark-glyph"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3.5 13.5h10a5 5 0 0 1-10 0Z" />
        <path d="M13.5 13.5V6a2.6 2.6 0 0 1 5.2 0v.8" />
      </svg>
      <span className="brand-mark-word">Ladle</span>
    </span>
  );
}

export default BrandMark;
