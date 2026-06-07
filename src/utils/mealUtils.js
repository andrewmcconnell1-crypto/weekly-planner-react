export function createEmptyMeals() {
  return {
    Sunday: createEmptyMeal(),
    Monday: createEmptyMeal(),
    Tuesday: createEmptyMeal(),
    Wednesday: createEmptyMeal(),
    Thursday: createEmptyMeal(),
    Friday: createEmptyMeal(),
    Saturday: createEmptyMeal(),
  };
}

export function createEmptyMeal() {
  return {
    name: "",
    recipeId: "",
    mealType: "cook",
    repeatFromDay: "",
    ingredients: [],
  };
}

export const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
