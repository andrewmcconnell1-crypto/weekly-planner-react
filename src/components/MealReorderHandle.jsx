import { GripVertical } from "lucide-react";

// The keyboard-accessible "move" affordance on a meal card. Quiet at rest
// (revealed on hover/focus) so it doesn't clutter the grid, but always in the
// tab order and announced to assistive tech. `reorder` comes from
// useMealReorder; when it's absent (e.g. the Home list) nothing renders.
function MealReorderHandle({ day, name, reorder }) {
  if (!reorder) return null;

  const grabbed = reorder.grabbedDay === day;
  const label = name ? `${day}, ${name}` : day;

  return (
    <button
      type="button"
      className={`meal-reorder-handle ${grabbed ? "grabbed" : ""}`}
      data-reorder-handle={day}
      aria-pressed={grabbed}
      aria-label={`Move ${label}`}
      title="Move — or press Enter, then the arrow keys"
      onKeyDown={(event) => reorder.onHandleKeyDown(day, event)}
      onClick={() => reorder.onHandleClick(day)}
    >
      <GripVertical size={16} aria-hidden="true" />
    </button>
  );
}

export default MealReorderHandle;
