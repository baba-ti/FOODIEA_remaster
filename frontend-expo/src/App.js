import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StackNavigator from './navigations/stack';
import { colors } from './constants/theme';
import { FoodPreferencesProvider, useFoodPreferences } from './context/FoodPreferencesContext';

function AppContent() {
  const { isLoading } = useFoodPreferences();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FoodPreferencesProvider>
        <AppContent />
      </FoodPreferencesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
});
