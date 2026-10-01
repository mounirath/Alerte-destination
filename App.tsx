import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './context/AppContext';
import MapScreen from './screens/MapScreen';
import PlacesScreen from './screens/PlacesScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function Tabs() {
  const { colors, isDark, tracking } = useApp();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.tabBar,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarIcon: ({ color, size, focused }) => {
            let name: keyof typeof Ionicons.glyphMap = 'map';
            if (route.name === 'Carte') name = focused ? 'map' : 'map-outline';
            if (route.name === 'Lieux') name = focused ? 'bookmark' : 'bookmark-outline';
            if (route.name === 'Réglages') name = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Carte"
          component={MapScreen}
          options={{
            tabBarBadge: tracking ? '' : undefined,
            tabBarBadgeStyle: {
              backgroundColor: colors.accent,
              minWidth: 8,
              height: 8,
              borderRadius: 4,
            },
          }}
        />
        <Tab.Screen name="Lieux" component={PlacesScreen} />
        <Tab.Screen name="Réglages" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#3DDC97" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <Tabs />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: '#070B12',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
