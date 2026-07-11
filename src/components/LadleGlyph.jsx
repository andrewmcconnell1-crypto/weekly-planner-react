// The Ladle mark as a standalone glyph (no wordmark) — the same cupped-bowl,
// hooked-handle silhouette as the app icon and BrandMark. Lets "done" and
// finished states sign off with the app's own motif instead of a generic emoji.
// Matches the lucide icon API (a `size` prop, currentColor stroke) so it drops
// straight into EmptyState and anywhere an icon is expected.
function LadleGlyph({ size = 24, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
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
  );
}

export default LadleGlyph;
