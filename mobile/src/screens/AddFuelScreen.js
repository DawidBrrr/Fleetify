import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { driverApi } from '../api/services';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../constants/Config';

export default function AddFuelScreen({ route, navigation }) {
  const { vehicleId, vehicleLabel } = route.params;
  const { userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ liters: '', total_cost: '', station: '', odometer: '' });

  const handleSave = async () => {
    if (!form.liters || !form.total_cost) {
      Alert.alert("Błąd", "Podaj ilość litrów i koszt.");
      return;
    }
    try {
      setLoading(true);
      await driverApi.createFuelLog({
        user_id: userData.id,
        vehicle_id: vehicleId.toString(),
        vehicle_label: vehicleLabel,
        liters: parseFloat(form.liters),
        total_cost: parseFloat(form.total_cost),
        station: form.station,
        odometer: parseInt(form.odometer) || 0,
      });
      Alert.alert("Sukces", "Tankowanie zapisane.");
      navigation.goBack();
    } catch (e) { Alert.alert("Błąd", "Nie udało się zapisać."); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.label}>Dane z dystrybutora</Text>
      <TextInput label="Ilość litrów (L)" value={form.liters} onChangeText={v => setForm({...form, liters: v})} keyboardType="numeric" mode="outlined" style={styles.input} />
      <TextInput label="Koszt całkowity (PLN)" value={form.total_cost} onChangeText={v => setForm({...form, total_cost: v})} keyboardType="numeric" mode="outlined" style={styles.input} />
      <TextInput label="Stan licznika (km)" value={form.odometer} onChangeText={v => setForm({...form, odometer: v})} keyboardType="numeric" mode="outlined" style={styles.input} />
      <TextInput label="Stacja / Notatki" value={form.station} onChangeText={v => setForm({...form, station: v})} mode="outlined" style={styles.input} />
      <Button mode="contained" onPress={handleSave} loading={loading} buttonColor={CONFIG.COLORS.cyan} style={styles.btn}>Zapisz tankowanie</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: CONFIG.COLORS.ice },
  label: { marginBottom: 15, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', marginBottom: 10 },
  btn: { marginTop: 10, borderRadius: 10 }
});