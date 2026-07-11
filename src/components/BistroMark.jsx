// The Bistro mark — a serif “B” in an oval plaque, the same monogram as the app
// icon. Used to sign off the app's finished states. Matches the lucide icon API
// (a `size` prop, currentColor) so it drops straight into EmptyState and
// anywhere an icon is expected; the ground it sits on sets the colour.
function BistroMark({ size = 24, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="24" cy="24" rx="16.5" ry="19" stroke="currentColor" strokeWidth="2.6" />
      <text
        x="24"
        y="24.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="600"
        fontSize="23"
        fill="currentColor"
      >
        B
      </text>
    </svg>
  );
}

export default BistroMark;
