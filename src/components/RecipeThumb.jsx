import { useState } from "react";

// Recipe imagery tile: a real photo when one is set, otherwise a generated
// gradient + dish emoji. A photo that fails to load falls back to the
// placeholder. `size` is "sm" (card thumbnail) or "lg" (detail hero).
function RecipeThumb({ imagery, name = "", size = "sm" }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = imagery.type === "photo" && !failed;

  if (showPhoto) {
    return (
      <span className={`recipe-thumb recipe-thumb-${size}`}>
        <img
          src={imagery.url}
          alt={name ? `${name}` : ""}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={`recipe-thumb recipe-thumb-${size} recipe-thumb-placeholder`}
      style={{ background: imagery.gradient }}
      aria-hidden="true"
    >
      <span className="recipe-thumb-emoji">{imagery.emoji}</span>
    </span>
  );
}

export default RecipeThumb;
