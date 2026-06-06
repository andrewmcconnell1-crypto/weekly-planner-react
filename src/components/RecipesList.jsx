import { useState } from "react";

function RecipesList({
    recipes,
    newRecipeName,
    setNewRecipeName,
    addRecipe,
    deleteRecipe,
    addIngredientToRecipe,
    deleteIngredientFromRecipe,
}) {
    const [ingredientTextByRecipe, setIngredientTextByRecipe] = useState({});

    function updateIngredientText(recipeId, value) {
        setIngredientTextByRecipe({
            ...ingredientTextByRecipe,
            [recipeId]: value,
        });
    }

    function handleAddIngredient(recipeId) {
        const ingredient = ingredientTextByRecipe[recipeId] || "";

        addIngredientToRecipe(recipeId, ingredient);

        setIngredientTextByRecipe({
            ...ingredientTextByRecipe,
            [recipeId]: "",
        });
    }

    return (
        <section className="section">
            <div className="section-header">
                <h2>Recipes</h2>
            </div>

            <p className="small-text">
                Saved meals you can reuse in your weekly plan.
            </p>

            <div className="add-item-row">
                <input
                    type="text"
                    placeholder="Add recipe..."
                    value={newRecipeName}
                    onChange={(event) => setNewRecipeName(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") addRecipe();
                    }}
                />

                <button type="button" onClick={addRecipe}>
                    Add
                </button>
            </div>

            {recipes.length === 0 ? (
                <p className="empty-state">No recipes yet.</p>
            ) : (
                <ul className="clean-list">
                    {recipes.map((recipe) => (
                        <li className="card" key={recipe.id}>
                            <div className="section-header">
                                <div>
                                    <strong>{recipe.name}</strong>
                                    <p className="small-text">
                                        {recipe.ingredients.length} ingredient
                                        {recipe.ingredients.length === 1 ? "" : "s"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="delete-button"
                                    onClick={() => deleteRecipe(recipe.id)}
                                >
                                    Delete
                                </button>
                            </div>

                            <div className="add-item-row">
                                <input
                                    type="text"
                                    placeholder="Add ingredient..."
                                    value={ingredientTextByRecipe[recipe.id] || ""}
                                    onChange={(event) =>
                                        updateIngredientText(recipe.id, event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            handleAddIngredient(recipe.id);
                                        }
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() => handleAddIngredient(recipe.id)}
                                >
                                    Add
                                </button>
                            </div>

                            {recipe.ingredients.length > 0 && (
                                <ul className="ingredient-list">
                                    {recipe.ingredients.map((ingredient, index) => (
                                        <li className="ingredient-row" key={index}>
                                            <span>{ingredient}</span>

                                            <button
                                                type="button"
                                                className="delete-button"
                                                onClick={() =>
                                                    deleteIngredientFromRecipe(recipe.id, index)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default RecipesList;