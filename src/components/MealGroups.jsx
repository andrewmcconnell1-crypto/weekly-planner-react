import MealCard from "./MealCard";
import MealLeftoverCluster from "./MealLeftoverCluster";

// Group an ordered list of days into render groups: each cook day plus the run
// of leftover (repeat) days that immediately follow it. Used by both the Meals
// tab and the Home "coming up" list so they render identically.
function buildMealGroups(dayList, mealsObj, getSummary) {
  const groups = [];

  for (let i = 0; i < dayList.length; ) {
    const day = dayList[i];
    const leadSummary = getSummary(day, mealsObj[day], mealsObj);
    const repeatDays = [];

    if (leadSummary.hasMeal && (mealsObj[day]?.mealType || "cook") === "cook") {
      for (let j = i + 1; j < dayList.length; j += 1) {
        const nextMeal = mealsObj[dayList[j]];

        if (nextMeal?.mealType === "repeat" && nextMeal.repeatFromDay === day) {
          repeatDays.push(dayList[j]);
        } else {
          break;
        }
      }
    }

    groups.push({ leadDay: day, leadSummary, repeatDays });
    i += 1 + repeatDays.length;
  }

  return groups;
}

// Render a list of days as MealCards / leftover clusters (shared by the Meals
// tab and the Home "coming up" list so the styling matches).
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

  return buildMealGroups(dayList, meals, getMealSummary).map((group) =>
    group.repeatDays.length === 0 ? (
      <MealCard
        key={group.leadDay}
        day={group.leadDay}
        date={getDate(group.leadDay)}
        meal={meals[group.leadDay]}
        displayName={group.leadSummary.name}
        mealLabel={group.leadSummary.label}
        mealTone={group.leadSummary.tone}
        hasMeal={group.leadSummary.hasMeal}
        isToday={group.leadDay === todayDayName}
        onOpen={() => onOpenDay(group.leadDay)}
      />
    ) : (
      <MealLeftoverCluster
        key={group.leadDay}
        leadDay={group.leadDay}
        leadSummary={group.leadSummary}
        repeatDays={group.repeatDays}
        onOpenDay={onOpenDay}
        todayDayName={todayDayName}
        getDate={getDate}
      />
    )
  );
}
