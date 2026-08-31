import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { colors } from '../constants/theme';
import AssistantHome from '../screens/AssistantHome';
import RestaurantDiaryScreen from '../screens/RestaurantDiaryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Assistant: '✦',
  Diary: '▣',
  Settings: '⚙',
};

export default function MainTabs() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: isTablet ? styles.tabletBar : styles.bottomBar,
        tabBarPosition: isTablet ? 'left' : 'bottom',
        tabBarIcon: ({ color }) => (
          <Text style={[styles.icon, { color }]}>{TAB_ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Assistant" component={AssistantHome} options={{ title: 'AI 비서' }} />
      <Tab.Screen name="Diary" component={RestaurantDiaryScreen} options={{ title: '맛집 기록' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: '설정' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bottomBar: { height: 70, paddingTop: 7, paddingBottom: 8, borderTopColor: colors.border, backgroundColor: colors.surface },
  tabletBar: { width: 112, paddingTop: 18, borderRightColor: colors.border, backgroundColor: colors.surface },
  label: { fontSize: 11, fontWeight: '800' },
  icon: { fontSize: 22, fontWeight: '900' },
});
