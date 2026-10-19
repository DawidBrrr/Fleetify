import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import TripLogScreen from '../screens/TripLogScreen';
import AddTripScreen from '../screens/AddTripScreen'; // Nowy import
import AddFuelScreen from '../screens/AddFuelScreen';
import { CONFIG } from '../constants/Config';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CONFIG.COLORS.cyan} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerStyle: styles.header,
          headerTintColor: CONFIG.COLORS.white,
          headerTitleStyle: styles.headerTitle,
        }}
      >
        {userToken == null ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ReportIssue" component={ReportIssueScreen} options={{ title: 'Zgłoś usterkę' }} />
            <Stack.Screen name="TripLog" component={TripLogScreen} options={{ title: 'Historia tras' }} />
            <Stack.Screen name="AddTrip" component={AddTripScreen} options={{ title: 'Nowa trasa' }} />
            <Stack.Screen name="AddFuel" component={AddFuelScreen} options={{title: "Nowe tankowanie"}} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.ice,
  },
  header: {
    backgroundColor: CONFIG.COLORS.navy,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
});