import MealCard from "./MealCard";

// Render each day of the week as its own equally-sized MealCard. Leftover
// nights show the dish they reuse with a "Leftovers from X" label and the
// repeat icon, so every day reads as a full card at the same size and spacing.
export default function MealGroups({
  dayList,
  meals,
  getMealSummary,
  onOpenDay,
  todayDayName,
  weekStart,
}) {
  // Map a day name to its calendar date for the active week. dayList is anchored
  // to the same weekday as weekStart, so the index is the day offset.
  const getDate = (day) => {
    if (!weekStart) return null;
    const index = dayList.indexOf(day);
    if (index < 0) return null;
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  };

  return dayList.map((day) => {
    const summary = getMealSummary(day, meals[day], meals);
    return (
      <MealCard
        key={day}
        day={day}
        date={getDate(day)}
        meal={meals[day]}
        displayName={summary.name}
        mealLabel={summary.label}
        mealTone={summary.tone}
        hasMeal={summary.hasMeal}
        isToday={day === todayDayName}
        onOpen={() => onOpenDay(day)}
      />
    );
  });
}
