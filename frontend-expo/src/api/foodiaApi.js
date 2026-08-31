import { API_BASE_URL, API_TIMEOUT_MS } from '../config/apiConfig';

function formatApiError(payload, status) {
  const detail = payload?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join(', ');
  }
  return `서버 요청에 실패했습니다. (${status})`;
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(formatApiError(payload, response.status));
    }
    return payload;
  } catch (error) {
    const errorMessage = String(error?.message || '').toLowerCase();
    const requestWasCancelled =
      error?.name === 'AbortError' ||
      errorMessage.includes('canceled') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('aborted');

    if (requestWasCancelled) {
      throw new Error(
        'AI 요청이 취소되었거나 처리 시간이 초과되었습니다. 백엔드 실행 상태를 확인한 뒤 다시 시도해 주세요.',
      );
    }
    if (
      error instanceof TypeError ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('network request failed')
    ) {
      throw new Error(`백엔드에 연결할 수 없습니다. 서버 주소: ${API_BASE_URL}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getImageMetadata(asset) {
  const uri = asset?.uri || '';
  const extension = uri.split('.').pop()?.toLowerCase();
  const inferredType =
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

  return {
    name: asset?.fileName || `foodia-${Date.now()}.${extension || 'jpg'}`,
    type: asset?.mimeType || inferredType,
    uri,
  };
}

export async function analyzeIngredientImage(asset) {
  if (!asset?.uri) throw new Error('분석할 이미지가 없습니다.');

  const formData = new FormData();
  formData.append('image', getImageMetadata(asset));

  const result = await request('/api/v1/ingredients/analyze', {
    method: 'POST',
    body: formData,
  });

  return {
    ...result,
    ingredients: (result.ingredients || []).map((ingredient, index) => ({
      id: `detected-${index}-${ingredient.name}`,
      name: ingredient.name,
      status:
        ingredient.needs_review || ingredient.confidence < 0.7
          ? 'uncertain'
          : 'confirmed',
      confidence: ingredient.confidence,
      evidence: ingredient.evidence,
      quantityHint: ingredient.quantity_hint,
    })),
    requiresConfirmation: result.requires_user_confirmation ?? true,
  };
}

function mapRecipe(recipe, index, sources) {
  const sourceUrl = recipe.source_urls?.[0];
  const source = sources.find((item) => item.url === sourceUrl);

  return {
    id: `api-${index}-${recipe.title}`,
    name: recipe.title,
    summary: recipe.summary,
    imageKey: 'bulgogi',
    cookingMinutes: recipe.cooking_time_minutes,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    ingredients: (recipe.ingredients || []).map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount,
      isAvailable: ingredient.is_available,
    })),
    steps: recipe.steps || [],
    matchedIngredients: recipe.matched_ingredients || [],
    missingIngredients: recipe.missing_ingredients || [],
    matchScore: Math.round((recipe.score || 0) * 100),
    safetyNotes: recipe.safety_notes || [],
    source: {
      siteName: '만개의레시피',
      title: source?.title || recipe.title,
      url: sourceUrl,
      isMock: false,
    },
  };
}

export async function searchRecipes({
  ingredients = [],
  excludeIngredients = [],
  excludedSourceUrls = [],
  preferences = [],
  maxResults = 8,
}) {
  const result = await request('/api/v1/recipes/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredients,
      excluded_ingredients: excludeIngredients,
      excluded_source_urls: excludedSourceUrls,
      preferences,
      servings: 2,
      max_results: maxResults,
    }),
  });

  return {
    ...result,
    recipes: (result.recipes || []).map((recipe, index) =>
      mapRecipe(recipe, index, result.sources || []),
    ),
  };
}

export async function recommendFood({
  message,
  availableIngredients = [],
  excludeIngredients = [],
  favoriteFoods = [],
  favoriteRestaurants = [],
  recentMenus = [],
  avoidRecentDays = 3,
  spiceLevel = 'medium',
  maxCookingMinutes = null,
  weatherRecommendations = true,
  seasonalRecommendations = true,
  restaurantHistoryRecommendations = true,
  clientDate,
  latitude,
  longitude,
  maxResults = 5,
}) {
  const result = await request('/api/v1/assistant/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      available_ingredients: availableIngredients,
      excluded_ingredients: excludeIngredients,
      favorite_foods: favoriteFoods,
      favorite_restaurants: favoriteRestaurants.map((record) => ({
        restaurant_name: record.restaurantName,
        menu_name: record.menuName,
        rating: record.rating,
      })),
      recent_menus: recentMenus,
      avoid_recent_days: avoidRecentDays,
      spice_level: spiceLevel,
      max_cooking_minutes: maxCookingMinutes,
      weather_recommendations: weatherRecommendations,
      seasonal_recommendations: seasonalRecommendations,
      restaurant_history_recommendations: restaurantHistoryRecommendations,
      client_date: clientDate,
      latitude,
      longitude,
      max_results: maxResults,
    }),
  });

  return {
    ...result,
    recipes: (result.recipes || []).map((recipe, index) =>
      mapRecipe(recipe, index, result.sources || []),
    ),
  };
}
