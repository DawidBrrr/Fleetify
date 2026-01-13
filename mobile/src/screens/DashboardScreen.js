import React, { useEffect, useState, useContext } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, TextInput, ProgressBar, Avatar, ActivityIndicator } from 'react-native-paper';
import { driverApi } from '../api/services';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../constants/Config';

// Destrukturyzujemy 'navigation' z propsów, aby móc przechodzić między ekranami
export default function DashboardScreen({ navigation }) {
  const { logout, userData } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newMileage, setNewMileage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await driverApi.getDashboard();
      setData(res.data);
      
      // Jeśli auto istnieje, ustawiamy domyślną wartość w polu edycji przebiegu
      if (res.data?.assignment?.vehicle) {
        setNewMileage(res.data.assignment.vehicle.mileage?.toString() || '0');
      }
    } catch (e) {
      console.error("Błąd pobierania danych dashboardu:", e);
      // Nie wyrzucamy Alertu przy każdym błędzie sieci, żeby nie spamować użytkownika
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdateMileage = async () => {
    if (!newMileage) {
      Alert.alert("Błąd", "Wpisz stan licznika.");
      return;
    }
    try {
      setIsUpdating(true);
      const currentBattery = data.assignment.vehicle.battery || 0;
      await driverApi.updateOdometer(newMileage, currentBattery);
      Alert.alert("Sukces", "Stan licznika został zaktualizowany.");
      loadData(); // Odświeżamy kartę, żeby zobaczyć nową wartość
    } catch (e) {
      Alert.alert("Błąd", "Nie udało się zaktualizować przebiegu.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 1. Widok ładowania (tylko przy pierwszym wejściu)
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} color={CONFIG.COLORS.cyan} size="large" />
        <Text style={{ marginTop: 10, color: CONFIG.COLORS.gray }}>Pobieranie danych floty...</Text>
      </View>
    );
  }

  // 2. Widok, gdy nie ma przydzielonego auta (pusty stan)
  if (!data?.assignment || !data?.assignment?.vehicle) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.whiteText}>Cześć!</Text>
            <Text style={styles.iceText}>{userData?.full_name || 'Kierowco'}</Text>
          </View>
          <Button mode="text" textColor={CONFIG.COLORS.ice} onPress={logout}>Wyloguj</Button>
        </View>
        <View style={styles.centered}>
          <Avatar.Icon size={80} icon="car-off" backgroundColor={CONFIG.COLORS.gray} />
          <Text style={styles.noVehicleText}>Brak przydzielonego auta</Text>
          <Text style={styles.subText}>System nie wykrył aktywnego przypisania dla Twojego konta.</Text>
          <Button 
            mode="contained" 
            onPress={loadData} 
            style={styles.refreshButton}
            buttonColor={CONFIG.COLORS.cyan}
          >
            Sprawdź ponownie
          </Button>
        </View>
      </View>
    );
  }

  // 3. Główny widok kierowcy (Gdy auto jest przypisane)
  const vehicle = data.assignment.vehicle;
  const batteryLevel = (vehicle.battery || 0) / 100;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CONFIG.COLORS.cyan} />}
    >
      {/* Nagłówek aplikacji */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.whiteText}>Twój Pojazd</Text>
          <Text style={styles.iceText}>{userData?.full_name}</Text>
        </View>
        <Button mode="text" textColor={CONFIG.COLORS.ice} onPress={logout}>Wyloguj</Button>
      </View>

      {/* Główna karta pojazdu */}
      <Card style={styles.card}>
        <Card.Title 
          title={vehicle.model} 
          subtitle={`VIN: ${vehicle.vin?.toUpperCase()}`} 
          left={(props) => <Avatar.Icon {...props} icon="car" backgroundColor={CONFIG.COLORS.cyan} />}
        />
        <Card.Content>
          <View style={styles.statsRow}>
            <View>
              <Text variant="labelMedium" style={styles.label}>Aktualny Przebieg</Text>
              <Text variant="headlineMedium" style={styles.mileageText}>{vehicle.mileage} km</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>W TRASIE</Text>
            </View>
          </View>

          {/* Pasek postępu energii/paliwa */}
          <View style={styles.batterySection}>
            <View style={styles.batteryLabels}>
              <Text variant="bodyMedium" style={{color: CONFIG.COLORS.gray}}>Energia / Paliwo</Text>
              <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: CONFIG.COLORS.navy }}>{vehicle.battery}%</Text>
            </View>
            <ProgressBar 
              progress={batteryLevel} 
              color={batteryLevel < 0.2 ? CONFIG.COLORS.danger : CONFIG.COLORS.cyan} 
              style={styles.progressBar} 
            />
          </View>

          <View style={styles.divider} />

          {/* Formularz szybkiej aktualizacji licznika */}
          <Text variant="titleMedium" style={styles.formTitle}>Szybka aktualizacja licznika</Text>
          <TextInput
            label="Stan licznika po trasie (km)"
            value={newMileage}
            onChangeText={setNewMileage}
            keyboardType="numeric"
            mode="outlined"
            activeOutlineColor={CONFIG.COLORS.cyan}
            style={styles.input}
          />
          <Button 
            mode="contained" 
            onPress={handleUpdateMileage}
            loading={isUpdating}
            disabled={isUpdating}
            style={styles.saveButton}
            buttonColor={CONFIG.COLORS.navy}
          >
            Zaktualizuj dane
          </Button>
        </Card.Content>
      </Card>

      {/* Przyciski akcji (NAWIGACJA) */}
      <View style={styles.actions}>
        <Button 
          icon="alert-octagon" 
          mode="outlined" 
          // Nawigacja do ekranu ReportIssue z przekazaniem ID auta
          onPress={() => navigation.navigate('ReportIssue', { vehicleId: vehicle.id })} 
          style={styles.actionButton}
          textColor={CONFIG.COLORS.danger}
        >
          Zgłoś usterkę / problem
        </Button>
        
        <Button 
          icon="map-marker-distance" 
          mode="outlined" 
          onPress={() => Alert.alert("Wkrótce", "Moduł pełnej historii tras w przygotowaniu.")}
          style={styles.actionButton}
          textColor={CONFIG.COLORS.navy}
        >
          Twoje ostatnie trasy
        </Button>
      </View>
      
      {/* Footer dla estetyki */}
      <Text style={styles.footerText}>System Fleetify v1.0 • Device: {vehicle.id}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CONFIG.COLORS.navy },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 25, 
    paddingBottom: 30, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  whiteText: { color: CONFIG.COLORS.white, fontWeight: 'bold' },
  iceText: { color: CONFIG.COLORS.ice, opacity: 0.8 },
  card: { marginHorizontal: 20, borderRadius: 20, backgroundColor: CONFIG.COLORS.white, elevation: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 },
  label: { color: CONFIG.COLORS.gray, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  mileageText: { color: CONFIG.COLORS.navy, fontWeight: 'bold' },
  statusBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { color: '#1976D2', fontWeight: 'bold', fontSize: 10 },
  batterySection: { marginTop: 25 },
  batteryLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressBar: { height: 12, borderRadius: 6 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 25 },
  formTitle: { marginBottom: 15, color: CONFIG.COLORS.navy, fontWeight: 'bold' },
  input: { backgroundColor: CONFIG.COLORS.white, marginBottom: 5 },
  saveButton: { marginTop: 10, borderRadius: 10, paddingVertical: 5 },
  noVehicleText: { fontSize: 20, fontWeight: 'bold', color: CONFIG.COLORS.ice, marginTop: 20 },
  subText: { color: CONFIG.COLORS.ice, textAlign: 'center', opacity: 0.7, marginTop: 10, paddingHorizontal: 30 },
  refreshButton: { marginTop: 25, width: '80%', borderRadius: 10 },
  actions: { padding: 20, gap: 12 },
  actionButton: { borderRadius: 12, borderColor: '#DDD', borderWidth: 1, backgroundColor: '#FFF' },
  footerText: { textAlign: 'center', color: CONFIG.COLORS.gray, fontSize: 10, marginBottom: 30, opacity: 0.5 }
});