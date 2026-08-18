import detectedIngredients from '../data/mockDetectedIngredients.json';
import recipes from '../data/mockRecipes.json';

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const normalize = (value) => value.trim().toLowerCase();

export async function getFeaturedRecipes() {
  await wait(250);
  return recipes.slice(0, 4);
}

export async function analyzeIngredientImage() {
  await wait(900);
  return {
    ingredients: detectedIngredients,
    requiresConfirmation: true,
    mock: true,
  };
}

export async function searchMockRecipes({ ingredients = [], excludeIngredients = [] }) {
  await wait(700);

  const selected = ingredients.map(normalize).filter(Boolean);
  const excluded = excludeIngredients.map(normalize).filter(Boolean);

  const ranked = recipes
    .filter((recipe) => {
      const names = recipe.ingredients.map((item) => normalize(item.name));
      return !excluded.some((excludedName) => names.includes(excludedName));
    })
    .map((recipe) => {
      const recipeIngredientNames = recipe.ingredients.map((item) => normalize(item.name));
      const matchedIngredients = ingredients.filter((ingredient) =>
        recipeIngredientNames.includes(normalize(ingredient))
      );
      const missingIngredients = recipe.ingredients
        .map((item) => item.name)
        .filter((name) => !selected.includes(normalize(name)));

      return {
        ...recipe,
        matchedIngredients,
        missingIngredients,
        matchScore: selected.length
          ? Math.round((matchedIngredients.length / selected.length) * 100)
          : 0,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.cookingMinutes - b.cookingMinutes);

  return {
    recipes: ranked,
    query: { ingredients, excludeIngredients },
    mock: true,
  };
}
