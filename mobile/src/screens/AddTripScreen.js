import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { driverApi } from '../api/services';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../constants/Config';

export default function AddTripScreen({ route, navigation }) {
  const { vehicleId, vehicleLabel } = route.params;
  const { userData } = useContext(AuthContext);

  const [form, setForm] = useState({
    route_label: '',
    distance_km: '',
    fuel_cost: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.route_label || !form.distance_km) {
      Alert.alert("Błąd", "Podaj trasę i dystans.");
      return;
    }

    try {
      setLoading(true);
      await driverApi.createTrip({
        user_id: userData.id,
        vehicle_id: vehicleId.toString(),
        vehicle_label: vehicleLabel,
        route_label: form.route_label,
        distance_km: parseFloat(form.distance_km),
        fuel_cost: parseFloat(form.fuel_cost || 0),
        notes: form.notes
      });
      Alert.alert("Sukces", "Trasa została zapisana.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Błąd", "Nie udało się zapisać trasy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.label}>Szczegóły przejazdu</Text>
      <TextInput label="Trasa (np. Warszawa - Łódź)" value={form.route_label} onChangeText={v => setForm({...form, route_label: v})} mode="outlined" style={styles.input} />
      <TextInput label="Dystans (km)" value={form.distance_km} onChangeText={v => setForm({...form, distance_km: v})} keyboardType="numeric" mode="outlined" style={styles.input} />
      <TextInput label="Koszt paliwa (zł)" value={form.fuel_cost} onChangeText={v => setForm({...form, fuel_cost: v})} keyboardType="numeric" mode="outlined" style={styles.input} />
      <TextInput label="Notatki" value={form.notes} onChangeText={v => setForm({...form, notes: v})} mode="outlined" multiline numberOfLines={3} style={styles.input} />

      <Button mode="contained" onPress={handleSave} loading={loading} buttonColor={CONFIG.COLORS.cyan} style={styles.button}>
        Zakończ i zapisz trasę
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: CONFIG.COLORS.ice },
  label: { marginBottom: 15, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', marginBottom: 15 },
  button: { marginTop: 10, borderRadius: 10 }
});