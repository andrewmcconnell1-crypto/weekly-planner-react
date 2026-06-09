# Meal Planner

A mobile-first weekly meal planner and shopping-list generator for a household.
Plan meals for a week, keep a list of recurring buys and pantry stock, then
generate a shopping list that automatically folds in meal ingredients and skips
anything you already have. All data is stored locally in the browser
(`localStorage`) — there is no backend.

## Getting started

```bash
npm install
npm run dev      # start the dev server (Vite)
npm run build    # production build to dist/
npm run lint     # eslint
npm run preview  # preview the production build
```

## How it works

The app has four tabs:

- **Home** – overview of the shopping week: meals planned, due recurring buys,
  and additions to buy. The primary button generates / refreshes the list.
- **Plan** – set a meal for each day. Each day can be a saved **recipe**, a
  **custom** meal with its own ingredients, a **repeat** of another day,
  **takeaway**, or **eating out**.
- **Shop** – the generated shopping list, grouped by category, plus a list of
  recurring buys to remove because they're already in stock.
- **More** – manage recipes, household basics (recurring buys + pantry stock),
  and settings.

A "shopping week" and a "planning week" are tracked independently and default to
next week.

## Project structure

```
src/
  App.jsx              # top-level state + screen layout
  components/          # presentational components (one per screen / list)
  hooks/
    useLocalStorageState.js  # useState that persists to localStorage
  utils/
    dateUtils.js       # week start / formatting / week keys
    itemUtils.js       # name normalisation + id generation
    mealUtils.js       # day list + empty-meal factories
    mealPlanning.js    # createMealHelpers(recipes) — meal summary logic (pure)
    shoppingPlan.js    # buildShoppingPlan(...) — list generation (pure)
    stapleUtils.js     # recurring-buy scheduling
    recipeUtils.js     # recipe grouping / colour tones
    dataLoaders.js     # localStorage migration / starter-data merging
  data/                # bundled starter recipes, staples, inventory, categories
```

The business logic (meal summaries, shopping-list generation, scheduling) lives
in pure functions under `utils/` so it can be reasoned about and tested
independently of React.
