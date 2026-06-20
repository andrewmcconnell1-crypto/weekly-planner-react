import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

// Swipe a row left to reveal a Delete action (iOS-style). Pointer-events based
// so it works for touch and mouse; `touch-action: pan-y` on the content lets
// vertical scrolling pass straight through while we own the horizontal drag.
const ACTION_WIDTH = 88;
const OPEN_AT = 44; // past this on release, the row snaps open
const AXIS_LOCK = 8; // movement before we commit to a horizontal/vertical drag

function SwipeRow({ onDelete, itemName = "item", children }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, y: 0, base: 0 });
  const axis = useRef(null); // "h" | "v" | null

  const isOpen = offset <= -OPEN_AT;

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY, base: offset };
    axis.current = null;
    setDragging(true);
  }

  function onPointerMove(event) {
    if (!dragging) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;

    if (axis.current === null) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (axis.current === "h") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }

    if (axis.current !== "h") return; // vertical: let the list scroll
    const next = Math.max(-ACTION_WIDTH, Math.min(0, start.current.base + dx));
    setOffset(next);
  }

  function onPointerUp() {
    setDragging(false);
    if (axis.current === "h") {
      setOffset((value) => (value <= -OPEN_AT ? -ACTION_WIDTH : 0));
    }
    axis.current = null;
  }

  // When the row is open, a tap anywhere on it just closes it (and is swallowed
  // so it doesn't also toggle the checkbox / editor underneath).
  function onContentClickCapture(event) {
    if (offset !== 0) {
      event.preventDefault();
      event.stopPropagation();
      setOffset(0);
    }
  }

  return (
    <div className="swipe-row">
      <button
        type="button"
        className="swipe-row-action"
        aria-label={`Delete ${itemName}`}
        tabIndex={isOpen ? 0 : -1}
        aria-hidden={!isOpen}
        onClick={() => {
          setOffset(0);
          onDelete();
        }}
      >
        <Trash2 size={18} aria-hidden="true" />
        <span>Delete</span>
      </button>

      <div
        className={`swipe-row-content ${dragging ? "dragging" : ""}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onContentClickCapture}
      >
        {children}
      </div>
    </div>
  );
}

export default SwipeRow;
