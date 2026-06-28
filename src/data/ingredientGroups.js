// Seed catalog of ingredient "groups" — the overarching item a specific variety
// rolls up to (basmati rice -> rice). Used by the matcher so a recipe asking
// for the generic ("rice") is covered by any variety you keep in stock, and a
// recipe asking for a specific variety is covered by the generic — but two
// different varieties in the same group (basmati vs sushi) never cover each
// other. Anything not listed is its own group.
//
// Curation principle: only group a specific under a generic when the specific is
// genuinely "a kind of <generic>" and substitutable for it. Deliberately do NOT
// group things that merely share a word but are different foods:
//   - coconut / almond / soy / oat milk are NOT under "milk" (this is the bug
//     that started all this — coconut milk must not cover dairy milk)
//   - olive / vegetable / sesame oil are NOT grouped (you can't swap them, and
//     each is its own pantry item)
//   - black / kidney / green beans are NOT grouped (distinct foods)
//
// Keys and values are read as plain names and canonicalised by the matcher, so
// quantities/qualifiers don't need to be stripped here. Easy to extend — this
// is the seed; it's meant to grow.
export const INGREDIENT_GROUPS = {
  // Rice varieties -> Rice
  "basmati rice": "rice",
  "jasmine rice": "rice",
  "sushi rice": "rice",
  "arborio rice": "rice",
  "long grain rice": "rice",
  "short grain rice": "rice",

  // Pasta shapes -> Pasta
  spaghetti: "pasta",
  penne: "pasta",
  macaroni: "pasta",
  fusilli: "pasta",
  fettuccine: "pasta",
  linguine: "pasta",
  rigatoni: "pasta",
  farfalle: "pasta",
  lasagne: "pasta",
  lasagna: "pasta",
  tagliatelle: "pasta",

  // Noodle kinds -> Noodles
  "rice noodles": "noodles",
  "egg noodles": "noodles",
  "udon noodles": "noodles",
  "hokkien noodles": "noodles",
  "soba noodles": "noodles",
  vermicelli: "noodles",

  // Stocks / broths -> Stock (broth is canonicalised to stock by the matcher)
  "chicken stock": "stock",
  "beef stock": "stock",
  "vegetable stock": "stock",
  "fish stock": "stock",

  // Soy sauces -> Soy sauce (light soy already reduces to "soy sauce")
  "dark soy sauce": "soy sauce",
  "kecap manis": "soy sauce",

  // Cheeses -> Cheese (specific cheeses never cover each other; generic does)
  "cheddar cheese": "cheese",
  "tasty cheese": "cheese",
  parmesan: "cheese",
  mozzarella: "cheese",
  "shredded cheese": "cheese",
  "grated cheese": "cheese",
};
