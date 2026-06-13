// Best-effort scaling of a free-text ingredient line by a whole-number factor,
// for "cook a double batch". We parse the leading quantity (integer, decimal,
// simple or mixed fraction, or a unicode fraction), multiply it, and re-format
// it, leaving the rest of the line untouched. Ranges ("2-3 cups") scale both
// ends. Lines with no leading number are returned unchanged — we'd rather leave
// one line for you to eyeball than guess wrong.

const UNICODE_FRACTIONS = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const COMMON_FRACTIONS = [
  [1 / 8, "1/8"],
  [1 / 4, "1/4"],
  [1 / 3, "1/3"],
  [3 / 8, "3/8"],
  [1 / 2, "1/2"],
  [5 / 8, "5/8"],
  [2 / 3, "2/3"],
  [3 / 4, "3/4"],
  [7 / 8, "7/8"],
];

function parseQuantity(token) {
  const trimmed = token.trim();

  // "1 1/2" mixed fraction
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }

  // "1/2" simple fraction
  const fraction = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2]);
  }

  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function formatQuantity(value) {
  const rounded = Math.round(value * 1000) / 1000;
  const whole = Math.floor(rounded + 1e-9);
  const rest = rounded - whole;

  if (rest < 0.02) return String(whole);

  const fraction = COMMON_FRACTIONS.find(
    ([fractionValue]) => Math.abs(fractionValue - rest) < 0.03
  );

  if (fraction) {
    return whole > 0 ? `${whole} ${fraction[1]}` : fraction[1];
  }

  return String(Math.round(rounded * 100) / 100);
}

export function scaleIngredient(text, factor) {
  if (!Number.isFinite(factor) || factor === 1) return text;

  let rest = String(text);
  const leadingSpace = rest.match(/^\s*/)[0];
  rest = rest.slice(leadingSpace.length);

  // Leading unicode fraction (e.g. "½ cup")
  if (UNICODE_FRACTIONS[rest[0]] !== undefined) {
    const scaled = formatQuantity(UNICODE_FRACTIONS[rest[0]] * factor);
    return `${leadingSpace}${scaled}${rest.slice(1)}`;
  }

  // Leading numeric quantity: integer, decimal, simple or mixed fraction.
  const match = rest.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/);
  if (!match) return text;

  const value = parseQuantity(match[1]);
  if (value === null) return text;

  let remainder = rest.slice(match[1].length);

  // Range ("2-3 cups", "2 to 3"): scale the second endpoint too.
  const range = remainder.match(/^(\s*(?:-|–|—|to)\s*)(\d+(?:\.\d+)?|\d+\/\d+)/i);
  if (range) {
    const endValue = parseQuantity(range[2]);
    if (endValue !== null) {
      remainder =
        range[1] +
        formatQuantity(endValue * factor) +
        remainder.slice(range[0].length);
    }
  }

  return `${leadingSpace}${formatQuantity(value * factor)}${remainder}`;
}
