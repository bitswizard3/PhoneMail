import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { theme } from './src/styles/theme';
import LanguageSelect from './src/screens/LanguageSelect';
import TermsConditions from './src/screens/TermsConditions';
import PhoneVerification from './src/screens/PhoneVerification';
import OTPVerification from './src/screens/OTPVerification';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import Conversation from './src/screens/Conversation';
import Compose from './src/screens/Compose';
import TraditionalView from './src/screens/TraditionalView';
import Settings from './src/screens/Settings';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('phonemail_token');
      setIsAuthenticated(!!token);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'MainApp' : 'LanguageSelect'}
        screenOptions={{ headerShown: false }}
      >
        {/* Onboarding Screens */}
        <Stack.Screen name="LanguageSelect" component={LanguageSelect} />
        <Stack.Screen name="TermsConditions" component={TermsConditions} />
        <Stack.Screen name="PhoneVerification" component={PhoneVerification} />
        <Stack.Screen name="OTPVerification" component={OTPVerification} />

        {/* Main App (Drawer) */}
        <Stack.Screen name="MainApp" component={DrawerNavigator} />

        {/* Modal Screens */}
        <Stack.Screen
          name="Conversation"
          component={Conversation}
          options={{ gestureEnabled: true }}
        />
        <Stack.Screen
          name="Compose"
          component={Compose}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="TraditionalView"
          component={TraditionalView}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
