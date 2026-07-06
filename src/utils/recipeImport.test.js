import { describe, expect, it } from "vitest";

import {
  findRecipeNode,
  normaliseImportedRecipe,
  parseImportedRecipe,
  parseIsoDurationMins,
  tidyIngredient,
} from "./recipeImport";

// A WordPress-style block: everything nested under @graph, HowToStep
// instructions, string yield — the shape RecipeTin Eats-alikes publish.
const graphBlock = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", name: "Some page" },
    {
      "@type": "Recipe",
      name: "Lemon Chicken &amp; Rice",
      recipeIngredient: ["500 g chicken", "1 lemon", "2 cups rice"],
      recipeInstructions: [
        { "@type": "HowToStep", text: "Brown the <b>chicken</b> well." },
        { "@type": "HowToStep", text: "2. Add the rice and stock." },
        {
          "@type": "HowToSection",
          name: "To serve",
          itemListElement: [{ "@type": "HowToStep", text: "Rest and serve." }],
        },
      ],
      recipeYield: "4 servings",
      totalTime: "PT1H30M",
      publisher: { "@type": "Organization", name: "Some Blog" },
    },
  ],
});

describe("tidyIngredient", () => {
  it("strips prices, parentheticals and footnote marks", () => {
    expect(tidyIngredient("1 yellow onion, diced ($0.32)")).toBe("1 yellow onion");
    expect(tidyIngredient("1 (15 oz.) can black beans, rinsed and drained")).toBe(
      "1 can black beans"
    );
    expect(tidyIngredient("3 cloves garlic, minced*")).toBe("3 cloves garlic");
  });

  it("converts unicode fractions and compacts spoon units", () => {
    expect(tidyIngredient("½ cup shredded mozzarella, plus more for serving")).toBe(
      "1/2 cup shredded mozzarella"
    );
    expect(tidyIngredient("1½ Tablespoons soy sauce")).toBe("1 1/2 tbsp soy sauce");
    expect(tidyIngredient("2 Teaspoons sesame oil, divided")).toBe(
      "2 tsp sesame oil"
    );
  });

  it("drops prep clauses but keeps meaningful ones", () => {
    expect(tidyIngredient("500 g chicken breast, cut into strips")).toBe(
      "500 g chicken breast"
    );
    expect(tidyIngredient("4 chicken thighs, skin on")).toBe(
      "4 chicken thighs, skin on"
    );
    expect(tidyIngredient("salt and pepper, to taste")).toBe("salt and pepper");
  });
});

describe("parseIsoDurationMins", () => {
  it("parses hours and minutes", () => {
    expect(parseIsoDurationMins("PT1H30M")).toBe(90);
    expect(parseIsoDurationMins("PT45M")).toBe(45);
    expect(parseIsoDurationMins("PT2H")).toBe(120);
  });

  it("rejects junk", () => {
    expect(parseIsoDurationMins("90 minutes")).toBeNull();
    expect(parseIsoDurationMins("")).toBeNull();
    expect(parseIsoDurationMins(undefined)).toBeNull();
  });
});

describe("findRecipeNode", () => {
  it("finds a recipe inside @graph", () => {
    expect(findRecipeNode([graphBlock])?.name).toContain("Lemon Chicken");
  });

  it("finds a bare recipe and array-wrapped recipes", () => {
    const bare = JSON.stringify({ "@type": "Recipe", name: "Bare" });
    const arr = JSON.stringify([{ "@type": ["Recipe"], name: "Arr" }]);
    expect(findRecipeNode([bare])?.name).toBe("Bare");
    expect(findRecipeNode([arr])?.name).toBe("Arr");
  });

  it("skips malformed blocks and returns null when nothing matches", () => {
    expect(findRecipeNode(["{not json", JSON.stringify({ "@type": "Article" })])).toBeNull();
    expect(findRecipeNode([])).toBeNull();
  });
});

describe("parseImportedRecipe", () => {
  const parsed = parseImportedRecipe({
    jsonLd: [graphBlock],
    url: "https://www.someblog.com/lemon-chicken/",
    siteName: "",
  });

  it("maps name, ingredients and a numbered method", () => {
    expect(parsed.name).toBe('Lemon Chicken & Rice');
    expect(parsed.ingredients).toEqual(["500 g chicken", "1 lemon", "2 cups rice"]);
    // Steps renumbered (no double "2. 2."), tags stripped, sections flattened.
    expect(parsed.method).toBe(
      "1. Brown the chicken well.\n2. Add the rice and stock.\n3. Rest and serve."
    );
  });

  it("maps serves, time and source", () => {
    expect(parsed.serves).toBe(4);
    expect(parsed.timeMins).toBe(90);
    expect(parsed.source).toBe("Some Blog");
    expect(parsed.sourceUrl).toBe("https://www.someblog.com/lemon-chicken/");
  });

  it("falls back to the hostname when no site name or publisher exists", () => {
    const block = JSON.stringify({
      "@type": "Recipe",
      name: "Plain",
      recipeIngredient: ["1 thing"],
    });
    const result = parseImportedRecipe({
      jsonLd: [block],
      url: "https://www.example.com/x",
    });
    expect(result.source).toBe("example.com");
  });

  it("sums prep and cook time when totalTime is missing", () => {
    const node = {
      "@type": "Recipe",
      name: "Timed",
      recipeIngredient: ["1 thing"],
      prepTime: "PT10M",
      cookTime: "PT20M",
    };
    expect(normaliseImportedRecipe(node).timeMins).toBe(30);
  });

  it("handles instructions given as plain strings", () => {
    const node = {
      "@type": "Recipe",
      name: "Stringy",
      recipeIngredient: ["1 thing"],
      recipeInstructions: ["Do this.", "Then this."],
    };
    expect(normaliseImportedRecipe(node).method).toBe("1. Do this.\n2. Then this.");
  });

  it("returns null when the page has no usable recipe", () => {
    expect(parseImportedRecipe({ jsonLd: [] })).toBeNull();
    const nameless = JSON.stringify({ "@type": "Recipe", recipeIngredient: ["x"] });
    expect(parseImportedRecipe({ jsonLd: [nameless] })).toBeNull();
  });
});
