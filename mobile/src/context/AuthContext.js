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
      const error = new Error(
        e.response?.data?.detail || 'Nie udało się zalogować.'
      );
      error.status = e.response?.status;
      error.isNetworkError = !e.response;
      throw error;
    }
  };

  const logout = async () => {
    setUserToken(null);
    setUserData(null);
    await SecureStore.deleteItemAsync('userToken');
  };

  const isLoggedIn = async () => {
    setIsLoading(true);

    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        setUserToken(null);
        setUserData(null);
        return;
      }

      const response = await apiClient.get('/users/me');
      setUserToken(token);
      setUserData(response.data);
    } catch (e) {
      console.log('isLoggedIn error:', e);
      await SecureStore.deleteItemAsync('userToken');
      setUserToken(null);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { isLoggedIn(); }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userData }}>
      {children}
    </AuthContext.Provider>
  );
};