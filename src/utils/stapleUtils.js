const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Whether a recurring buy ("staple") should appear on the shopping list for the
// week identified by weekKey (a "YYYY-MM-DD" Sunday key from getWeekKey).
export function isStapleDueThisWeek(staple, weekKey) {
  if (staple.frequency === "ad-hoc") return false;
  if (!staple.frequency) return true;
  if (!staple.startDate) return true;

  const start = new Date(staple.startDate);
  const current = new Date(weekKey);

  if (Number.isNaN(start.getTime())) return true;

  // Round (rather than floor) to the nearest whole week so the result stays a
  // clean integer count even when startDate and weekKey sit on grids offset by
  // a sub-week amount (e.g. a startDate stored as a true Sunday vs a weekKey
  // that getWeekKey shifts by a day). Without this, fortnightly/four-weekly
  // parity could be computed wrong.
  const weeksSinceStart = Math.round((current - start) / WEEK_MS);

  if (weeksSinceStart < 0) return false;

  if (staple.frequency === "weekly") return true;
  if (staple.frequency === "fortnightly") return weeksSinceStart % 2 === 0;
  if (staple.frequency === "four-weekly") return weeksSinceStart % 4 === 0;

  return true;
}
