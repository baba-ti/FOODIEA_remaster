import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CameraScreen from '../screens/CameraScreen';
import Home from '../screens/Home';
import IngredientConfirmScreen from '../screens/IngredientConfirmScreen';
import RecipeDetail from '../screens/RecipeDetail';
import RecipeListScreen from '../screens/RecipeListScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: '뒤로',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 16, fontWeight: '800' },
      }}
    >
      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
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
