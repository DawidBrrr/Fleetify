import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CONFIG.COLORS.ice }}>
        <ActivityIndicator size="large" color={CONFIG.COLORS.cyan} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerStyle: { backgroundColor: CONFIG.COLORS.navy },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {userToken == null ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Fleetify Driver' }} />
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