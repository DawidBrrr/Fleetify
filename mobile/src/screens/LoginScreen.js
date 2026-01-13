import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../constants/Config';

export default function LoginScreen() {
  const [email, setEmail] = useState('kowalski@firma.pl');
  const [password, setPassword] = useState('Kowalski');
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('Błąd', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>FLEETIFY</Text>
      <Text style={styles.subtitle}>Panel Kierowcy</Text>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        outlineColor={CONFIG.COLORS.gray}
        activeOutlineColor={CONFIG.COLORS.cyan}
      />
      <TextInput
        label="Hasło"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        outlineColor={CONFIG.COLORS.gray}
        activeOutlineColor={CONFIG.COLORS.cyan}
      />
      
      <Button 
        mode="contained" 
        onPress={handleLogin} 
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
  logoText: { fontSize: 32, fontWeight: 'bold', color: CONFIG.COLORS.cyan, textAlign: 'center' },
  subtitle: { color: CONFIG.COLORS.ice, textAlign: 'center', marginBottom: 30 },
  input: { marginBottom: 15, backgroundColor: CONFIG.COLORS.white },
  button: { marginTop: 10, paddingVertical: 5 }
});