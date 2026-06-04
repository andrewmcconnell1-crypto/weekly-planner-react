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
  return date.toISOString().slice(0, 10);
}