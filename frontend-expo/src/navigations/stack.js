import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CameraScreen from '../screens/CameraScreen';
import IngredientConfirmScreen from '../screens/IngredientConfirmScreen';
import RecipeDetail from '../screens/RecipeDetail';
import RecipeListScreen from '../screens/RecipeListScreen';
import FoodPreferencesOnboardingScreen from '../screens/FoodPreferencesOnboardingScreen';
import RestaurantEntryScreen from '../screens/RestaurantEntryScreen';
import { colors } from '../constants/theme';
import { useFoodPreferences } from '../context/FoodPreferencesContext';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const { hasCompletedOnboarding } = useFoodPreferences();

  return (
    <Stack.Navigator
      initialRouteName={hasCompletedOnboarding ? 'Home' : 'FoodPreferencesOnboarding'}
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: '뒤로',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 16, fontWeight: '800' },
      }}
    >
      <Stack.Screen
        name="FoodPreferencesOnboarding"
        component={FoodPreferencesOnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="RestaurantEntry"
        component={RestaurantEntryScreen}
        options={{ title: '맛집 기록 추가' }}
      />
      <Stack.Screen name="Camera" component={CameraScreen} options={{ title: '사진으로 찾기' }} />
      <Stack.Screen
        name="IngredientConfirm"
        component={IngredientConfirmScreen}
        options={{ title: '재료 확인' }}
      />
      <Stack.Screen
        name="RecipeList"
        component={RecipeListScreen}
        options={{ title: '검색 결과' }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetail}
        options={{ title: '레시피 상세' }}
      />
    </Stack.Navigator>
  );
}
