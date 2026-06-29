// A time-of-day greeting for the Home header, so it feels alive rather than a
// static "Home". Uses the device's local hour.
export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}
