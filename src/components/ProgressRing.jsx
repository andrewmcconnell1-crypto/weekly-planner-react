// A small circular progress indicator (SVG). The fill animates via a CSS
// transition on stroke-dashoffset. Shows "value/max" in the centre.
function ProgressRing({ value, max, size = 58, stroke = 6, className = "" }) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(1, Math.max(0, value / safeMax));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const centre = size / 2;
  const complete = max > 0 && value >= max;

  return (
    <svg
      className={`progress-ring ${complete ? "complete" : ""} ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${value} of ${max}`}
    >
      <circle
        className="progress-ring-track"
        cx={centre}
        cy={centre}
        r={radius}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        className="progress-ring-fill"
        cx={centre}
        cy={centre}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${centre} ${centre})`}
      />
      <text
        className="progress-ring-text"
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
      >
        {value}/{max}
      </text>
    </svg>
  );
}

export default ProgressRing;
