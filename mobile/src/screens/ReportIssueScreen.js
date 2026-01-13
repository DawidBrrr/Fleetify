import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { driverApi } from '../api/services';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../constants/Config';

export default function ReportIssueScreen({ route, navigation }) {
  const { vehicleId } = route.params;
  const { userData } = useContext(AuthContext);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert("Błąd", "Wypełnij wszystkie pola.");
      return;
    }

    try {
      setLoading(true);
      await driverApi.reportIssue(vehicleId, {
        title,
        description,
        severity, // Wysyła low, medium, high lub critical
        reporter_id: userData.id
      });
      
      Alert.alert("Sukces", "Zgłoszenie zostało wysłane.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Błąd", "Serwer odrzucił zgłoszenie. Sprawdź połączenie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.label}>Co się dzieje?</Text>
      <TextInput label="Tytuł usterki" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} />
      <TextInput label="Opis problemu" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={4} style={styles.input} />

      <Text style={styles.label}>Ważność (Severity):</Text>
      <SegmentedButtons
        value={severity}
        onValueChange={setSeverity}
        buttons={[
          { value: 'low', label: 'Info', icon: 'check' },
          { value: 'medium', label: 'Średnia', icon: 'alert-circle' },
          { value: 'high', label: 'Wysoka', icon: 'alert' },
          { value: 'critical', label: 'PILNE', icon: 'fire' },
        ]}
        style={styles.segmented}
      />

      <Button mode="contained" onPress={handleSubmit} loading={loading} buttonColor={CONFIG.COLORS.danger} style={styles.button}>
        Zgłoś awarię
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: CONFIG.COLORS.ice },
  label: { marginVertical: 10, fontWeight: 'bold', color: CONFIG.COLORS.navy },
  input: { backgroundColor: '#fff', marginBottom: 15 },
  segmented: { marginBottom: 30 },
  button: { borderRadius: 10, paddingVertical: 5 }
});