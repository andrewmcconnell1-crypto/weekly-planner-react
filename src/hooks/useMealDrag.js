import { useCallback, useEffect, useRef, useState } from "react";

// Touch/mouse drag-to-rearrange for the meal grid. Press-and-hold a day to lift
// it, drag over another day, release to swap the two. Built on Pointer Events so
// it works the same for touch and mouse, with no dependencies.
//
// Draggable/droppable elements are marked with a `data-drag-day="<Day>"`
// attribute; the hook resolves the day under the pointer via elementFromPoint.
// A long-press initiates the drag so ordinary taps (open the editor) and
// vertical scrolling still work — any movement before the hold completes cancels
// it as a scroll/tap.
const LONG_PRESS_MS = 200;
const MOVE_CANCEL_PX = 10;
const EDGE_PX = 90; // auto-scroll zone at the top/bottom of the viewport
const EDGE_SPEED = 14;

export function useMealDrag(onSwap) {
  // { sourceDay, overDay } while a drag is active; null otherwise.
  const [drag, setDrag] = useState(null);
  const ref = useRef({});

  const cleanup = useCallback(() => {
    const s = ref.current;
    clearTimeout(s.timer);
    if (s.raf) cancelAnimationFrame(s.raf);
    window.removeEventListener("pointermove", s.onPreMove);
    window.removeEventListener("pointermove", s.onMove);
    window.removeEventListener("pointerup", s.onUp);
    window.removeEventListener("pointerup", s.onPreUp);
    window.removeEventListener("pointercancel", s.onCancel);
    window.removeEventListener("touchmove", s.onTouchMove);
    if (s.clone && s.clone.parentNode) s.clone.parentNode.removeChild(s.clone);
    if (s.sourceEl) s.sourceEl.classList.remove("meal-drag-source");
    document.body.classList.remove("meal-dragging");
    ref.current = {};
    setDrag(null);
  }, []);

  // Clean up if the component unmounts mid-drag.
  useEffect(() => cleanup, [cleanup]);

  function dayAtPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    const dayEl = el && el.closest ? el.closest("[data-drag-day]") : null;
    return dayEl ? dayEl.getAttribute("data-drag-day") : null;
  }

  function autoScroll() {
    const s = ref.current;
    if (!s.dragging) return;
    if (s.y < EDGE_PX) window.scrollBy(0, -EDGE_SPEED);
    else if (s.y > window.innerHeight - EDGE_PX) window.scrollBy(0, EDGE_SPEED);
    s.raf = requestAnimationFrame(autoScroll);
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target.closest?.("[data-drag-day]");
    if (!target) return;

    const s = ref.current;
    s.sourceDay = target.getAttribute("data-drag-day");
    s.sourceEl = target;
    s.startX = event.clientX;
    s.startY = event.clientY;
    s.x = event.clientX;
    s.y = event.clientY;
    s.dragging = false;

    // Cancel the pending drag if the finger moves first (that's a scroll/tap).
    s.onPreMove = (moveEvent) => {
      if (
        Math.hypot(moveEvent.clientX - s.startX, moveEvent.clientY - s.startY) >
        MOVE_CANCEL_PX
      ) {
        cleanup();
      }
    };
    s.onPreUp = cleanup;
    s.onCancel = cleanup;

    s.timer = window.setTimeout(() => {
      window.removeEventListener("pointermove", s.onPreMove);
      window.removeEventListener("pointerup", s.onPreUp);
      beginDrag();
    }, LONG_PRESS_MS);

    window.addEventListener("pointermove", s.onPreMove);
    window.addEventListener("pointerup", s.onPreUp);
    window.addEventListener("pointercancel", s.onCancel);
  }

  function beginDrag() {
    const s = ref.current;
    if (!s.sourceEl) return;

    const rect = s.sourceEl.getBoundingClientRect();
    const clone = s.sourceEl.cloneNode(true);
    clone.classList.add("meal-drag-clone");
    clone.style.width = `${rect.width}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    document.body.appendChild(clone);

    s.clone = clone;
    s.sourceEl.classList.add("meal-drag-source");
    document.body.classList.add("meal-dragging");
    s.dragging = true;
    setDrag({ sourceDay: s.sourceDay, overDay: s.sourceDay });
    s.raf = requestAnimationFrame(autoScroll);

    // Once lifted, swallow native touch scrolling for the rest of the gesture.
    // Without this the browser claims the touch as a scroll on the first move
    // and fires pointercancel, killing the drag before it can do anything. A
    // non-passive touchmove listener (preventDefault) is the only reliable way
    // to keep the pointer stream alive on touch — toggling touch-action
    // mid-gesture is ignored once the browser has started scrolling.
    s.onTouchMove = (touchEvent) => {
      if (touchEvent.cancelable) touchEvent.preventDefault();
    };
    window.addEventListener("touchmove", s.onTouchMove, { passive: false });

    s.onMove = (moveEvent) => {
      moveEvent.preventDefault();
      s.x = moveEvent.clientX;
      s.y = moveEvent.clientY;
      s.clone.style.transform = `translate(${moveEvent.clientX - s.startX}px, ${
        moveEvent.clientY - s.startY
      }px) scale(1.03)`;
      const over = dayAtPoint(moveEvent.clientX, moveEvent.clientY);
      setDrag((prev) =>
        prev && prev.overDay === over ? prev : { ...prev, overDay: over }
      );
    };

    s.onUp = () => {
      const over = dayAtPoint(s.x, s.y);
      const source = s.sourceDay;
      cleanup();
      if (over && over !== source) onSwap(source, over);
      // Swallow the click that follows the release so the editor doesn't open.
      const swallow = (clickEvent) => {
        clickEvent.stopPropagation();
        clickEvent.preventDefault();
        window.removeEventListener("click", swallow, true);
      };
      window.addEventListener("click", swallow, true);
      window.setTimeout(
        () => window.removeEventListener("click", swallow, true),
        350
      );
    };

    window.addEventListener("pointermove", s.onMove, { passive: false });
    window.addEventListener("pointerup", s.onUp);
  }

  return { onPointerDown, drag };
}
