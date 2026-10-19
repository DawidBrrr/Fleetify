import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../constants/Config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const inputTheme = {
    colors: {
      background: CONFIG.COLORS.white,
    },
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      Alert.alert('Błąd logowania', 'Podaj adres email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert('Błąd logowania', 'Podaj poprawny adres email.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Błąd logowania', 'Podaj hasło.');
      return;
    }

    try {
      setLoading(true);
      await login(normalizedEmail, password);
    } catch (e) {
      let message = 'Nie udało się zalogować. Spróbuj ponownie.';

      if (e.status === 401) {
        message = 'Nieprawidłowy adres email lub hasło.';
      } else if (e.status === 429) {
        message = e.message || 'Konto jest tymczasowo zablokowane. Spróbuj później.';
      } else if (e.isNetworkError) {
        message = 'Brak połączenia z serwerem. Sprawdź połączenie internetowe.';
      }

      Alert.alert('Błąd logowania', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        accessibilityLabel="Fleetify"
        style={styles.logoImage}
      />
      <Text style={styles.logoText}>FLEETIFY</Text>
      <Text style={styles.subtitle}>Panel Kierowcy</Text>
      
      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        mode="outlined"
        style={styles.input}
        theme={inputTheme}
        outlineColor={CONFIG.COLORS.gray}
        activeOutlineColor={CONFIG.COLORS.cyan}
      />
      <Text style={styles.inputLabel}>Hasło</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        theme={inputTheme}
        outlineColor={CONFIG.COLORS.gray}
        activeOutlineColor={CONFIG.COLORS.cyan}
      />
      
      <Button 
        mode="contained" 
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor={CONFIG.COLORS.cyan}
      >
        Zaloguj się
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: CONFIG.COLORS.navy },
  logoImage: { width: 72, height: 72, borderRadius: 18, alignSelf: 'center', marginBottom: 12 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: CONFIG.COLORS.cyan, textAlign: 'center' },
  subtitle: { color: CONFIG.COLORS.ice, textAlign: 'center', marginBottom: 30 },
  inputLabel: {
    color: CONFIG.COLORS.ice,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: { marginBottom: 15, backgroundColor: CONFIG.COLORS.white },
  button: { marginTop: 10, paddingVertical: 5 }
});