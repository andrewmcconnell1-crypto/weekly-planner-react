import { Star } from "lucide-react";

const STARS = [1, 2, 3, 4, 5];

// A 1–5 star rating. Interactive by default (click a star to set it, click the
// same star again to clear); pass `readOnly` for a static display. `size` sets
// the star px. Half values round to the nearest whole star for display.
function StarRating({ value = 0, onRate, readOnly = false, size = 22, label }) {
  const rating = Math.round(value) || 0;

  if (readOnly) {
    return (
      <span
        className="star-rating star-rating-readonly"
        role="img"
        aria-label={label || `Rated ${rating} out of 5`}
      >
        {STARS.map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rating ? "star-on" : "star-off"}
            fill={star <= rating ? "currentColor" : "none"}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  }

  return (
    <span className="star-rating" role="group" aria-label={label || "Your rating"}>
      {STARS.map((star) => {
        const on = star <= rating;
        return (
          <button
            key={star}
            type="button"
            className={`star-button ${on ? "star-on" : "star-off"}`}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={on}
            onClick={() => onRate(star)}
          >
            <Star
              size={size}
              fill={on ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </span>
  );
}

export default StarRating;
