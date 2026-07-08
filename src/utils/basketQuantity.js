// Baskets are plain lines of text, but a line can carry an optional count so
// the app knows you buy more than one — "Beef mince x2", "3x eggs", "Milk (x2)".
// A line with no count is treated as an always-available standing buy (you
// rebuy it every week); a count means it can cover that many meals before it
// runs out. Parsing lives here so the basket text stays the single source of
// truth and every consumer reads counts the same way.

function clampQuantity(raw) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(99, Math.max(1, n));
}

// Split a basket line into its clean item name and an optional count.
// `quantity` is null when the line has no explicit count (always available).
export function parseBasketQuantity(rawLine) {
  const line = String(rawLine || "").trim();
  if (!line) return { name: "", quantity: null };

  // Trailing count: "Beef mince x2", "Milk ×3", "Eggs (x6)". The count must be
  // set off by a space or "(" so a word ending in x isn't mistaken for one.
  const trailing = line.match(/[\s(]+[x×]\s*(\d+)\s*\)?\s*$/i);
  if (trailing) {
    return {
      name: line.slice(0, trailing.index).trim(),
      quantity: clampQuantity(trailing[1]),
    };
  }

  // Leading count: "2x Beef mince", "3 × eggs".
  const leading = line.match(/^(\d+)\s*[x×]\s+(.+)$/i);
  if (leading) {
    return { name: leading[2].trim(), quantity: clampQuantity(leading[1]) };
  }

  return { name: line, quantity: null };
}

// Just the clean item name, for the systems that don't care about counts
// (the shopping list, coverage matching).
export function basketItemName(rawLine) {
  return parseBasketQuantity(rawLine).name;
}
