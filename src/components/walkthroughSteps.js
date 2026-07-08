import {
  SceneMeals,
  SceneStock,
  SceneList,
  SceneShop,
  SceneBaskets,
} from "./WalkthroughScenes";

// The ordered steps for the getting-started walkthrough. Each pairs a scene with
// its copy; the sheet renders one at a time. Kept apart from WalkthroughScenes
// so that file stays components-only (react-refresh).
export const WALKTHROUGH_STEPS = [
  {
    id: "plan",
    kicker: "Step 1",
    title: "Plan your week",
    body: "Pick a recipe for each night on the Meals page. Cook once and reuse leftovers across the week — no more nightly “what's for dinner?”.",
    Scene: SceneMeals,
  },
  {
    id: "stock",
    kicker: "Step 2",
    title: "Stock your kitchen",
    body: "Tell the app what you keep at home — oils, spices, tins — and add your recurring buys like milk and bread. You set this up once and tweak it over time.",
    Scene: SceneStock,
  },
  {
    id: "list",
    kicker: "Step 3",
    title: "Your list builds itself",
    body: "The shopping list is built from your meals and recurring buys, skips anything already in stock, and sorts it by when you'll need it. No manual list-making.",
    Scene: SceneList,
  },
  {
    id: "shop",
    kicker: "Step 4",
    title: "Shop and tick off",
    body: "Walk the shop by aisle or by priority, ticking things off as you go, and watch the list empty out.",
    Scene: SceneShop,
  },
  {
    id: "baskets",
    kicker: "Or plan in reverse",
    title: "Cook from your shop",
    body: "Save your regular shops as baskets in the Kitchen tab. Pick one and Ladle shows which recipes you can already make from it — drop them straight onto a night.",
    Scene: SceneBaskets,
  },
];
