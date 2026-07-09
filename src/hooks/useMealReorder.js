import { useCallback, useEffect, useRef, useState } from "react";

import { days } from "../utils/mealUtils";

// Keyboard-accessible counterpart to the pointer drag (useMealDrag). Meals move
// as blocks — a cook plus its trailing leftovers — so this navigates block by
// block, mirroring swapMealDays exactly: focus a day's move handle, press
// Enter/Space to pick it up, then Arrow keys to move it past the previous/next
// block. Focus follows the meal to its new day and each step is announced.

function isCook(meal) {
  return (
    (meal?.mealType || "cook") === "cook" &&
    ((meal?.name || "").trim() !== "" ||
      meal?.recipeId ||
      (Array.isArray(meal?.ingredients) && meal.ingredients.length > 0))
  );
}

// The ordered blocks: a cook and its contiguous leftovers, or any single day.
function computeBlocks(meals) {
  const blocks = [];
  for (let i = 0; i < days.length; ) {
    const day = days[i];
    let length = 1;
    if (isCook(meals[day])) {
      for (let j = i + 1; j < days.length; j += 1) {
        const following = meals[days[j]];
        if (following?.mealType === "repeat" && following.repeatFromDay === day) {
          length += 1;
        } else {
          break;
        }
      }
    }
    blocks.push({ leadDay: day, start: i, length });
    i += length;
  }
  return blocks;
}

export function useMealReorder(meals, swapMealDays) {
  const [grabbedDay, setGrabbedDay] = useState(null);
  const [message, setMessage] = useState("");
  // Set when a move should pull focus to the meal's new day on the next render.
  const followFocus = useRef(false);

  useEffect(() => {
    if (grabbedDay && followFocus.current) {
      followFocus.current = false;
      const handle = document.querySelector(
        `[data-reorder-handle="${grabbedDay}"]`
      );
      if (handle) handle.focus();
    }
  }, [grabbedDay, meals]);

  const describe = useCallback(
    (day) => {
      const name = (meals[day]?.name || "").trim();
      return name ? `${day}, ${name}` : day;
    },
    [meals]
  );

  const toggle = useCallback(
    (day) => {
      setGrabbedDay((current) => {
        if (current === day) {
          setMessage(`Dropped ${describe(day)}.`);
          return null;
        }
        setMessage(
          `Grabbed ${describe(day)}. Use the up and down arrow keys to move it, then Enter to drop.`
        );
        return day;
      });
    },
    [describe]
  );

  const move = useCallback(
    (direction) => {
      if (!grabbedDay) return;
      const blocks = computeBlocks(meals);
      const index = blocks.findIndex((block) => block.leadDay === grabbedDay);
      if (index < 0) return;

      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= blocks.length) {
        setMessage(
          `${describe(grabbedDay)} is already ${direction < 0 ? "first" : "last"}.`
        );
        return;
      }

      const grabbedBlock = blocks[index];
      const targetBlock = blocks[targetIndex];
      // Where the grabbed block lands after swapMealDays re-lays the two blocks:
      // moving later it sits after the target; moving earlier it takes the
      // target's start.
      const newStart =
        direction > 0
          ? grabbedBlock.start + targetBlock.length
          : targetBlock.start;
      const newDay = days[newStart];

      followFocus.current = true;
      swapMealDays(grabbedDay, targetBlock.leadDay);
      setGrabbedDay(newDay);
      setMessage(`Moved to ${newDay}.`);
    },
    [grabbedDay, meals, swapMealDays, describe]
  );

  const cancel = useCallback(() => {
    setGrabbedDay((current) => {
      if (!current) return current;
      setMessage("Move cancelled.");
      return null;
    });
  }, []);

  const onHandleKeyDown = useCallback(
    (day, event) => {
      const { key } = event;
      if (key === "Enter" || key === " " || key === "Spacebar") {
        event.preventDefault();
        toggle(day);
      } else if (key === "ArrowUp" || key === "ArrowLeft") {
        if (grabbedDay === day) {
          event.preventDefault();
          move(-1);
        }
      } else if (key === "ArrowDown" || key === "ArrowRight") {
        if (grabbedDay === day) {
          event.preventDefault();
          move(1);
        }
      } else if (key === "Escape" && grabbedDay) {
        event.preventDefault();
        cancel();
      }
    },
    [grabbedDay, toggle, move, cancel]
  );

  return { grabbedDay, message, onHandleKeyDown, onHandleClick: toggle };
}
