import { normaliseItemName } from "./itemUtils";
import { categories } from "../data/categories";

// A catalog item's status relative to the user's stock, by normalised name:
//   "in"  — activated and in stock
//   "out" — activated but out of stock (on the shopping list as a restock)
//   "off" — not activated (not in the stock list at all)
export function catalogItemStatus(name, inventory) {
  const key = normaliseItemName(name);
  const match = inventory.find((item) => normaliseItemName(item.name) === key);
  if (!match) return "off";
  return match.active === false ? "out" : "in";
}

// Group catalog items into aisle sections following the canonical category
// order, with any unknown aisle sorted to the end. Items within an aisle keep
// their given order. Empty aisles are dropped.
export function groupCatalogByAisle(items) {
  const byAisle = new Map();
  for (const item of items) {
    const aisle = item.category || "Other";
    if (!byAisle.has(aisle)) byAisle.set(aisle, []);
    byAisle.get(aisle).push(item);
  }

  const rank = (aisle) => {
    const index = categories.indexOf(aisle);
    return index === -1 ? categories.length : index;
  };

  return [...byAisle.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([aisle, aisleItems]) => ({ aisle, items: aisleItems }));
}
