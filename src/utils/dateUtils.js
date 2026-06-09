export function getSunday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();

  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);

  return d;
}

export function getNextSunday(date = new Date()) {
  const thisSunday = getSunday(date);
  const nextSunday = new Date(thisSunday);

  nextSunday.setDate(thisSunday.getDate() + 7);

  return nextSunday;
}

export function formatDate(date) {
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function getWeekKey(date) {
  // NOTE: toISOString() converts to UTC, so in timezones ahead of UTC (e.g.
  // Australia) this key is the day before the local Sunday. The value is only
  // ever used as an opaque, stable identifier for a week and to measure whole
  // weeks between dates, so the constant offset is harmless. Kept as-is so
  // existing saved data (keyed this way) is preserved. See isStapleDueThisWeek,
  // which rounds week differences so it stays correct despite this offset.
  return date.toISOString().slice(0, 10);
}