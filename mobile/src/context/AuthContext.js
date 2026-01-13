import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/login', { email, password });
      const { token, user } = response.data;
      
      await SecureStore.setItemAsync('userToken', token);
      setUserToken(token);
      setUserData(user);
    } catch (e) {
      throw new Error(e.response?.data?.detail || 'Błąd logowania');
    }
  };

  const logout = async () => {
    setUserToken(null);
    setUserData(null);
    await SecureStore.deleteItemAsync('userToken');
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        setUserToken(token);
        // Opcjonalnie: pobierz dane o użytkowniku z /users/me
      }
      setIsLoading(false);
    } catch (e) {
      console.log('isLoggedIn error:', e);
    }
  };

  useEffect(() => { isLoggedIn(); }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userData }}>
      {children}
    </AuthContext.Provider>
  );
};