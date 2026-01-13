import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </PaperProvider>
    </AuthProvider>
  );
}