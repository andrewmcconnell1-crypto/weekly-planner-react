// A branded splash shown while auth + the plan load. Keeps the calm look of the
// rest of the app: the app icon, the name, and a slim indeterminate progress
// bar. Motion is decorative and disabled under prefers-reduced-motion.
import BrandMark from "./BrandMark";

export default function LoadingScreen({ message = "Loading…" }) {
  return (
    <main className="loading-screen">
      <div className="loading-inner">
        <div className="loading-mark">
          <img
            src={`${import.meta.env.BASE_URL}icon-192.png`}
            alt=""
            width="88"
            height="88"
          />
        </div>

        <div className="loading-brand">
          <p className="eyebrow"><BrandMark /></p>
          <h1>Weekly meal planner</h1>
        </div>

        <div
          className="loading-bar"
          role="progressbar"
          aria-label={message}
          aria-busy="true"
        />

        <p className="loading-message small-text">{message}</p>
      </div>
    </main>
  );
}
