import { useState } from "react";

// Recipe imagery tile. The gradient + dish emoji is always the base layer; a
// real photo (when set) or a generated AI image (from the recipe name) loads
// over it. While the image loads, or if it fails, the emoji tile shows through.
// `size` is "sm" (card thumbnail) or "lg" (detail hero).
function RecipeThumb({ imagery, name = "", size = "sm" }) {
  const [failed, setFailed] = useState(false);

  const src =
    imagery.type === "photo"
      ? imagery.url
      : imagery.type === "ai"
        ? imagery.aiUrl
        : "";
  const showImage = src && !failed;

  return (
    <span
      className={`recipe-thumb recipe-thumb-${size} recipe-thumb-placeholder`}
      style={{ background: imagery.gradient }}
    >
      <span className="recipe-thumb-emoji" aria-hidden="true">
        {imagery.emoji}
      </span>

      {showImage && (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export default RecipeThumb;
