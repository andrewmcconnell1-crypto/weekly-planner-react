# Ladle

A mobile-first weekly meal planner and shopping-list generator for a household.
Plan meals for a week, keep a list of recurring buys and pantry stock, then
generate a shopping list that automatically folds in meal ingredients and skips
anything you already have.

Data is stored per-user in **Supabase** (Postgres) when cloud sync is configured,
so it syncs across devices and each signed-in user has their own private copy.
If Supabase isn't configured, the app falls back to local-only mode
(`localStorage`, no sign-in) and still works.

## Getting started

```bash
npm install
npm run dev      # start the dev server (Vite)
npm run build    # production build to dist/
npm run lint     # eslint
npm run preview  # preview the production build
```

## Cloud sync (Supabase + Google sign-in)

The app reads two Vite env vars (both safe to expose — data is protected by
row-level security, not by hiding the key):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

For local dev, copy `.env.example` to `.env.local` and fill these in. For the
deployed site (GitHub Pages), they're set as repo **Actions Variables** and read
by `.github/workflows/deploy.yml` at build time.

### Supabase setup

1. Create a Supabase project; copy the API URL + anon public key into the vars
   above.
2. Run this SQL (one private row per user, readable/writable only by them):

   ```sql
   create table if not exists public.app_data (
     user_id uuid primary key references auth.users (id) on delete cascade,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz not null default now()
   );

   alter table public.app_data enable row level security;

   create policy "own data select" on public.app_data
     for select using (auth.uid() = user_id);
   create policy "own data insert" on public.app_data
     for insert with check (auth.uid() = user_id);
   create policy "own data update" on public.app_data
     for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

   -- Enables live cross-device updates (realtime). Without it, the app still
   -- refreshes data when you return to the tab.
   alter publication supabase_realtime add table public.app_data;
   ```

3. **Authentication → Providers → Google:** enable it and add a Google OAuth
   client's ID/secret (the client's redirect URI must be Supabase's
   `…/auth/v1/callback`).
4. **Authentication → URL Configuration:** add the app's URL(s) (deployed URL and
   `http://localhost:5199/` for dev) to Site URL + Redirect URLs.

New accounts are seeded with the bundled starter recipes/staples; signing in for
the first time on a device with existing local data migrates that data into the
account.

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
  App.jsx              # top-level state, auth/loading gates, screen layout
  components/          # presentational components (one per screen / list)
  lib/
    supabase.js        # Supabase client (null when unconfigured)
    plannerData.js     # load/save/normalise data (local + cloud)
  hooks/
    useAuth.js         # session + Google sign-in / sign-out
    usePlannerStore.js # single data store: cloud sync w/ local fallback
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
