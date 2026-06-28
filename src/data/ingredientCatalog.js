import { commonInventoryItems } from "./commonInventory";

// The fresh / chilled / bakery / meat / frozen and extra shelf-stable items the
// commonInventory list (Pantry / Household / Toiletries only) doesn't cover.
// Together with commonInventory these make up the activatable Stock catalog the
// picker browses. Names are clean canonical items — no quantities — and grouping
// is handled separately by the matcher seed (data/ingredientGroups), so nothing
// here needs a group.
const additionalCatalogItems = [
  // Fruit & Veg
  { name: "Apples", category: "Fruit & Veg" },
  { name: "Bananas", category: "Fruit & Veg" },
  { name: "Oranges", category: "Fruit & Veg" },
  { name: "Lemons", category: "Fruit & Veg" },
  { name: "Limes", category: "Fruit & Veg" },
  { name: "Avocado", category: "Fruit & Veg" },
  { name: "Strawberries", category: "Fruit & Veg" },
  { name: "Blueberries", category: "Fruit & Veg" },
  { name: "Grapes", category: "Fruit & Veg" },
  { name: "Tomatoes", category: "Fruit & Veg" },
  { name: "Cherry Tomatoes", category: "Fruit & Veg" },
  { name: "Brown Onion", category: "Fruit & Veg" },
  { name: "Red Onion", category: "Fruit & Veg" },
  { name: "Spring Onion", category: "Fruit & Veg" },
  { name: "Garlic", category: "Fruit & Veg" },
  { name: "Ginger", category: "Fruit & Veg" },
  { name: "Potatoes", category: "Fruit & Veg" },
  { name: "Sweet Potato", category: "Fruit & Veg" },
  { name: "Carrots", category: "Fruit & Veg" },
  { name: "Celery", category: "Fruit & Veg" },
  { name: "Broccoli", category: "Fruit & Veg" },
  { name: "Cauliflower", category: "Fruit & Veg" },
  { name: "Capsicum", category: "Fruit & Veg" },
  { name: "Cucumber", category: "Fruit & Veg" },
  { name: "Zucchini", category: "Fruit & Veg" },
  { name: "Eggplant", category: "Fruit & Veg" },
  { name: "Mushrooms", category: "Fruit & Veg" },
  { name: "Baby Spinach", category: "Fruit & Veg" },
  { name: "Mixed Salad Leaves", category: "Fruit & Veg" },
  { name: "Lettuce", category: "Fruit & Veg" },
  { name: "Green Beans", category: "Fruit & Veg" },
  { name: "Snow Peas", category: "Fruit & Veg" },
  { name: "Corn", category: "Fruit & Veg" },
  { name: "Pumpkin", category: "Fruit & Veg" },
  { name: "Cabbage", category: "Fruit & Veg" },
  { name: "Leek", category: "Fruit & Veg" },
  { name: "Coriander", category: "Fruit & Veg" },
  { name: "Parsley", category: "Fruit & Veg" },
  { name: "Basil", category: "Fruit & Veg" },
  { name: "Mint", category: "Fruit & Veg" },
  { name: "Chilli", category: "Fruit & Veg" },

  // Dairy
  { name: "Milk", category: "Dairy" },
  { name: "Lite Milk", category: "Dairy" },
  { name: "Butter", category: "Dairy" },
  { name: "Margarine", category: "Dairy" },
  { name: "Cheese", category: "Dairy" },
  { name: "Cheddar Cheese", category: "Dairy" },
  { name: "Tasty Cheese", category: "Dairy" },
  { name: "Parmesan", category: "Dairy" },
  { name: "Mozzarella", category: "Dairy" },
  { name: "Feta", category: "Dairy" },
  { name: "Halloumi", category: "Dairy" },
  { name: "Cream Cheese", category: "Dairy" },
  { name: "Sour Cream", category: "Dairy" },
  { name: "Thickened Cream", category: "Dairy" },
  { name: "Yoghurt", category: "Dairy" },
  { name: "Greek Yoghurt", category: "Dairy" },
  { name: "Eggs", category: "Dairy" },

  // Bakery
  { name: "Bread", category: "Bakery" },
  { name: "Wholemeal Bread", category: "Bakery" },
  { name: "Sourdough", category: "Bakery" },
  { name: "Bread Rolls", category: "Bakery" },
  { name: "Wraps", category: "Bakery" },
  { name: "Tortillas", category: "Bakery" },
  { name: "Pita Bread", category: "Bakery" },
  { name: "Bagels", category: "Bakery" },
  { name: "English Muffins", category: "Bakery" },
  { name: "Naan", category: "Bakery" },

  // Meat
  { name: "Chicken Breast", category: "Meat" },
  { name: "Chicken Thigh", category: "Meat" },
  { name: "Chicken Drumsticks", category: "Meat" },
  { name: "Whole Chicken", category: "Meat" },
  { name: "Beef Mince", category: "Meat" },
  { name: "Beef Steak", category: "Meat" },
  { name: "Diced Beef", category: "Meat" },
  { name: "Pork Chops", category: "Meat" },
  { name: "Pork Mince", category: "Meat" },
  { name: "Lamb Chops", category: "Meat" },
  { name: "Lamb Mince", category: "Meat" },
  { name: "Bacon", category: "Meat" },
  { name: "Ham", category: "Meat" },
  { name: "Sausages", category: "Meat" },
  { name: "Salmon", category: "Meat" },
  { name: "White Fish", category: "Meat" },
  { name: "Prawns", category: "Meat" },

  // Pantry (extras beyond commonInventory)
  { name: "Brown Sugar", category: "Pantry" },
  { name: "Icing Sugar", category: "Pantry" },
  { name: "Cornflour", category: "Pantry" },
  { name: "Baking Soda", category: "Pantry" },
  { name: "Vanilla Extract", category: "Pantry" },
  { name: "Coconut Cream", category: "Pantry" },
  { name: "Lentils", category: "Pantry" },
  { name: "Kidney Beans", category: "Pantry" },
  { name: "Black Beans", category: "Pantry" },
  { name: "Cannellini Beans", category: "Pantry" },
  { name: "Corn Kernels", category: "Pantry" },
  { name: "Olives", category: "Pantry" },
  { name: "Passata", category: "Pantry" },
  { name: "Chicken Stock", category: "Pantry" },
  { name: "Beef Stock", category: "Pantry" },
  { name: "Vegetable Stock", category: "Pantry" },
  { name: "Oyster Sauce", category: "Pantry" },
  { name: "Hoisin Sauce", category: "Pantry" },
  { name: "Worcestershire Sauce", category: "Pantry" },
  { name: "Dijon Mustard", category: "Pantry" },
  { name: "Balsamic Vinegar", category: "Pantry" },
  { name: "Maple Syrup", category: "Pantry" },
  { name: "Couscous", category: "Pantry" },
  { name: "Quinoa", category: "Pantry" },
  { name: "Tea", category: "Pantry" },
  { name: "Coffee", category: "Pantry" },

  // Snacks
  { name: "Chips", category: "Snacks" },
  { name: "Crackers", category: "Snacks" },
  { name: "Biscuits", category: "Snacks" },
  { name: "Chocolate", category: "Snacks" },
  { name: "Muesli Bars", category: "Snacks" },
  { name: "Popcorn", category: "Snacks" },
  { name: "Nuts", category: "Snacks" },
  { name: "Dried Fruit", category: "Snacks" },

  // Frozen
  { name: "Frozen Peas", category: "Frozen" },
  { name: "Frozen Corn", category: "Frozen" },
  { name: "Frozen Mixed Vegetables", category: "Frozen" },
  { name: "Frozen Berries", category: "Frozen" },
  { name: "Ice Cream", category: "Frozen" },
  { name: "Frozen Chips", category: "Frozen" },
  { name: "Frozen Fish Fillets", category: "Frozen" },
  { name: "Puff Pastry", category: "Frozen" },

  // Household (extras)
  { name: "Tissues", category: "Household" },
  { name: "Garbage Bags", category: "Household" },
  { name: "Fabric Softener", category: "Household" },
  { name: "Bleach", category: "Household" },
  { name: "Light Bulbs", category: "Household" },

  // Toiletries (extras)
  { name: "Toothbrush", category: "Toiletries" },
  { name: "Dental Floss", category: "Toiletries" },
  { name: "Cotton Buds", category: "Toiletries" },
  { name: "Moisturiser", category: "Toiletries" },
  { name: "Hand Sanitiser", category: "Toiletries" },
];

// The full activatable catalog: shelf-stable commonInventory first, then the
// rest, deduped by name (case-insensitive) so nothing appears twice.
export const ingredientCatalog = (() => {
  const seen = new Set();
  const out = [];
  for (const item of [...commonInventoryItems, ...additionalCatalogItems]) {
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
})();
