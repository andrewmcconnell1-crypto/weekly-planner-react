// A time-of-day greeting for the Home header, so it feels alive rather than a
// static "Home". Uses the device's local hour, and adds the person's first name
// when we know it (from their account display name).
export function greeting(date = new Date(), name = "") {
  const hour = date.getHours();

  let base;
  if (hour < 5) base = "Good night";
  else if (hour < 12) base = "Good morning";
  else if (hour < 17) base = "Good afternoon";
  else if (hour < 22) base = "Good evening";
  else base = "Good night";

  const first = String(name || "").trim().split(/\s+/)[0];
  return first ? `${base}, ${first}` : base;
}
