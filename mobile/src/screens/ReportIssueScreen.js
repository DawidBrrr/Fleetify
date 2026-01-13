import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { driverApi } from '../api/services';
import { CONFIG } from '../constants/Config';

export default function ReportIssueScreen({ route, navigation }) {
  // Pobieramy ID pojazdu przekazane z Dashboardu
  const { vehicleId } = route.params;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert("Błąd", "Wypełnij tytuł i opis usterki.");
      return;
    }

    try {
      setLoading(true);
      await driverApi.reportIssue(vehicleId, {
        title,
        description,
        severity,
        status: 'open'
      });
      
      Alert.alert("Wysłano", "Zgłoszenie zostało zarejestrowane w systemie.");
      navigation.goBack(); // Powrót do dashboardu
    } catch (e) {
      Alert.alert("Błąd", "Nie udało się wysłać zgłoszenia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.label}>Co się stało?</Text>
      <TextInput
        label="Krótki tytuł (np. Wyciek oleju)"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />

      <Text variant="titleMedium" style={styles.label}>Opis problemu</Text>
      <TextInput
        label="Opisz szczegóły usterki..."
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={5}
        style={styles.input}
      />

      <Text variant="titleMedium" style={styles.label}>Priorytet</Text>
      <SegmentedButtons
        value={severity}
        onValueChange={setSeverity}
        buttons={[
          { value: 'low', label: 'Niski' },
          { value: 'medium', label: 'Średni' },
          { value: 'high', label: 'Wysoki' },
        ]}
        style={styles.segmented}
      />

      <Button 
        mode="contained" 
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        buttonColor={CONFIG.COLORS.danger}
        style={styles.button}
      >
        Wyślij zgłoszenie
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: CONFIG.COLORS.ice },
  label: { marginBottom: 10, marginTop: 15, color: CONFIG.COLORS.navy, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', marginBottom: 10 },
  segmented: { marginBottom: 30 },
  button: { paddingVertical: 8, borderRadius: 10 }
});