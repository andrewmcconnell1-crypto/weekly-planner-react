// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import MealCard from "./MealCard";

const meal = { mealType: "cook", batches: 1 };

describe("MealCard", () => {
  it("prompts to add a meal on an empty day, and opens on tap", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<MealCard day="Monday" meal={meal} hasMeal={false} onOpen={onOpen} />);

    expect(screen.getByText("Add a meal")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("shows the planned meal and opens the editor on tap", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <MealCard
        day="Monday"
        meal={meal}
        displayName="Beef Tacos"
        mealLabel="Beef"
        hasMeal
        onOpen={onOpen}
      />
    );

    expect(screen.getByText("Beef Tacos")).toBeInTheDocument();
    expect(screen.getByText("Monday")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("renders the add tile when the day has no meal object at all", () => {
    // An unplanned day in a week that was never seeded (or restored/partial
    // data) passes meal={undefined} — it must render, not crash on meal.mealType.
    render(
      <MealCard day="Monday" meal={undefined} hasMeal={false} onOpen={() => {}} />
    );
    expect(screen.getByText("Add a meal")).toBeInTheDocument();
  });

  it("badges a leftovers day", () => {
    render(
      <MealCard
        day="Tuesday"
        meal={{ mealType: "repeat" }}
        displayName="Beef Tacos"
        hasMeal
        onOpen={() => {}}
      />
    );
    expect(screen.getByText("Leftovers")).toBeInTheDocument();
  });
});
