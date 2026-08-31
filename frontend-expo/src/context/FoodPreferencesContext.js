import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = '@foodia/food-preferences/v1';
const FoodPreferencesContext = createContext(null);

const DEFAULT_PREFERENCES = {
  allergies: [],
  dislikedIngredients: [],
  favoriteFoods: [],
  spiceLevel: 'medium',
  maxCookingMinutes: 60,
  weatherRecommendations: true,
  seasonalRecommendations: true,
  avoidRecentDays: 3,
  restaurantHistoryRecommendations: true,
};

function uniqueIngredients(items = []) {
  const seen = new Set();
  return items
    .map((item) => String(item).trim())
    .filter((item) => {
      const key = item.toLocaleLowerCase('ko-KR');
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function FoodPreferencesProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [allergies, setAllergies] = useState([]);
  const [dislikedIngredients, setDislikedIngredients] = useState([]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedValue) => {
        if (!storedValue) return;
        const storedPreferences = JSON.parse(storedValue);
        const { defaultServings: _legacyDefaultServings, ...preferences } = storedPreferences;
        setAllergies(uniqueIngredients(preferences.allergies));
        setDislikedIngredients(uniqueIngredients(preferences.dislikedIngredients));
        setPreferences({ ...DEFAULT_PREFERENCES, ...preferences });
        setHasCompletedOnboarding(preferences.hasCompletedOnboarding === true);
      })
      .catch(() => setHasCompletedOnboarding(false))
      .finally(() => setIsLoading(false));
  }, []);

  const saveFoodPreferences = async (nextPreferences) => {
    const mergedPreferencesWithLegacyValues = { ...preferences, ...nextPreferences };
    const { defaultServings: _legacyDefaultServings, ...mergedPreferences } =
      mergedPreferencesWithLegacyValues;
    const nextAllergies = uniqueIngredients(mergedPreferences.allergies);
    const nextDislikedIngredients = uniqueIngredients(mergedPreferences.dislikedIngredients);
    const storedValue = {
      ...mergedPreferences,
      allergies: nextAllergies,
      dislikedIngredients: nextDislikedIngredients,
      favoriteFoods: uniqueIngredients(mergedPreferences.favoriteFoods),
      hasCompletedOnboarding: true,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(storedValue));
    setAllergies(nextAllergies);
    setDislikedIngredients(nextDislikedIngredients);
    setPreferences(storedValue);
    setHasCompletedOnboarding(true);
  };

  const value = useMemo(
    () => ({
      allergies,
      defaultExcludedIngredients: uniqueIngredients([...allergies, ...dislikedIngredients]),
      dislikedIngredients,
      preferences,
      hasCompletedOnboarding,
      isLoading,
      saveFoodPreferences,
    }),
    [allergies, dislikedIngredients, preferences, hasCompletedOnboarding, isLoading],
  );

  return (
    <FoodPreferencesContext.Provider value={value}>
      {children}
    </FoodPreferencesContext.Provider>
  );
}

export function useFoodPreferences() {
  const context = useContext(FoodPreferencesContext);
  if (!context) throw new Error('FoodPreferencesProvider is missing.');
  return context;
}
