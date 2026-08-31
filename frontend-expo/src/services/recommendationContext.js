import * as Location from 'expo-location';
import {
  listFavoriteRestaurantRecords,
  listRecentRestaurantRecords,
} from '../storage/restaurantDatabase';

export async function buildRecommendationPreferences(preferences = {}) {
  const favoriteFoodPreferences = (preferences.favoriteFoods || [])
    .slice(0, 5)
    .map((food) => `좋아하는 완전한 메뉴명: "${food}"`);

  const favoriteRestaurants = preferences.restaurantHistoryRecommendations === false
    ? []
    : await listFavoriteRestaurantRecords(5);
  const restaurantPreferences = favoriteRestaurants.map(
    (record) =>
      `즐겨찾기 맛집 취향: ${record.restaurantName}의 ${record.menuName} (${record.rating}/5점)`,
  );

  return [...favoriteFoodPreferences, ...restaurantPreferences].slice(0, 10);
}

function localDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getWeatherCoordinates(enabled) {
  if (!enabled) return {};
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return {};
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
  } catch (error) {
    return {};
  }
}

export async function buildAssistantRequestContext(preferences = {}) {
  const avoidRecentDays = preferences.avoidRecentDays || 3;
  const [favoriteRestaurants, recentRestaurantRecords] = await Promise.all([
    preferences.restaurantHistoryRecommendations === false
      ? Promise.resolve([])
      : listFavoriteRestaurantRecords(5),
    listRecentRestaurantRecords(avoidRecentDays, 10),
  ]);
  const coordinates = await getWeatherCoordinates(preferences.weatherRecommendations !== false);

  return {
    favoriteFoods: (preferences.favoriteFoods || []).slice(0, 10),
    favoriteRestaurants: favoriteRestaurants.map((record) => ({
      restaurantName: record.restaurantName,
      menuName: record.menuName,
      rating: record.rating,
    })),
    recentMenus: [...new Set(recentRestaurantRecords.map((record) => record.menuName))],
    avoidRecentDays,
    spiceLevel: preferences.spiceLevel || 'medium',
    maxCookingMinutes: preferences.maxCookingMinutes || null,
    weatherRecommendations: preferences.weatherRecommendations !== false,
    seasonalRecommendations: preferences.seasonalRecommendations !== false,
    restaurantHistoryRecommendations:
      preferences.restaurantHistoryRecommendations !== false,
    clientDate: localDateString(),
    ...coordinates,
  };
}
