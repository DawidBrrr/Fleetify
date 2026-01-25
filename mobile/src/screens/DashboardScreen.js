import React, { useEffect, useState, useContext } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, ProgressBar, Avatar, ActivityIndicator, IconButton } from 'react-native-paper';
import { driverApi } from '../api/services';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../constants/Config';

export default function DashboardScreen({ navigation }) {
  const { logout, userData } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pobieranie danych z Dashboard Service (BFF)
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await driverApi.getDashboard();
      setData(res.data);
    } catch (e) {
      console.error("Dashboard load error:", e);
      if (e.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Odświeżanie danych przy każdym wejściu na ekran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Funkcja zwrotu pojazdu (Workflow z Twojego backendu)
  const handleReturn = () => {
    Alert.alert(
      "Zwrot pojazdu",
      "Czy na pewno chcesz zakończyć przydział i zwrócić auto do bazy?",
      [
        { text: "Anuluj", style: "cancel" },
        { 
          text: "Tak, zwróć", 
          onPress: async () => {
            try {
              await driverApi.returnVehicle();
              Alert.alert("Sukces", "Pojazd jest teraz dostępny dla innych.");
              loadData(); // Odświeży widok na "Brak auta"
            } catch (e) {
              Alert.alert("Błąd", "Nie udało się zwrócić pojazdu.");
            }
          } 
        }
      ]
    );
  };

  // 1. Ekran ładowania
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} color={CONFIG.COLORS.cyan} size="large" />
        <Text style={{ marginTop: 10, color: CONFIG.COLORS.gray }}>Ładowanie danych...</Text>
      </View>
    );
  }

  // 2. Ekran, gdy kierowca nie ma przydzielonego auta
  if (!data?.assignment || !data?.assignment?.vehicle) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.whiteText}>Witaj, {userData?.full_name?.split(' ')[0]}</Text>
          <IconButton icon="logout" iconColor="white" onPress={logout} />
        </View>
        <View style={styles.centered}>
          <Avatar.Icon size={80} icon="car-off" backgroundColor={CONFIG.COLORS.gray} />
          <Text style={styles.noVehicleText}>Brak przydzielonego auta</Text>
          <Text style={styles.subText}>Czekaj na decyzję administratora w panelu Web.</Text>
          <Button 
            mode="contained" 
            onPress={loadData} 
            style={styles.refreshButton}
            buttonColor={CONFIG.COLORS.cyan}
          >
            Odśwież stan
          </Button>
        </View>
      </View>
    );
  }

  // 3. Główny pulpit z pojazdem i akcjami
  const { vehicle } = data.assignment;
  const fuelLevel = (vehicle.battery || vehicle.fuel_level || 0) / 100;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CONFIG.COLORS.cyan} />}
    >
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.whiteText}>Pulpit Kierowcy</Text>
          <Text style={styles.iceText}>{userData?.full_name}</Text>
        </View>
        <Avatar.Text 
          size={50} 
          label={userData?.full_name?.substring(0,2).toUpperCase()} 
          backgroundColor={CONFIG.COLORS.cyan} 
        />
      </View>

      {/* KARTA POJAZDU */}
      <Card style={styles.card}>
        <Card.Title 
          title={vehicle.model} 
          subtitle={`Tablice: ${vehicle.license_plate || 'Brak'}`} 
          left={(props) => <Avatar.Icon {...props} icon="car-side" backgroundColor={CONFIG.COLORS.navy} />}
        />
        <Card.Content>
          <View style={styles.statsRow}>
            <View>
              <Text variant="labelMedium" style={styles.label}>Przebieg całkowity</Text>
              <Text variant="headlineMedium" style={styles.mileageText}>{vehicle.mileage} km</Text>
            </View>
          </View>

          <View style={styles.fuelSection}>
            <View style={styles.fuelLabels}>
              <Text variant="bodyMedium">Energia / Paliwo</Text>
              <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{Math.round(fuelLevel * 100)}%</Text>
            </View>
            <ProgressBar 
              progress={fuelLevel} 
              color={fuelLevel < 0.15 ? CONFIG.COLORS.danger : CONFIG.COLORS.cyan} 
              style={styles.progressBar} 
            />
          </View>
        </Card.Content>
      </Card>

      {/* SEKCJA AKCJI */}
      <View style={styles.actionGrid}>
        
        <Button 
          icon="map-marker-path" 
          mode="contained" 
          onPress={() => navigation.navigate('AddTrip', { vehicleId: vehicle.id, vehicleLabel: vehicle.model })}
          style={styles.mainBtn}
          buttonColor={CONFIG.COLORS.cyan}
        >
          Zapisz Trasę / Przejazd
        </Button>

        <Button 
          icon="gas-station" 
          mode="contained" 
          onPress={() => navigation.navigate('AddFuel', { vehicleId: vehicle.id, vehicleLabel: vehicle.model })}
          style={styles.mainBtn}
          buttonColor="#FF9800"
        >
          Zgłoś Tankowanie
        </Button>

        <View style={styles.row}>
          <Button 
            icon="alert-octagon" 
            mode="outlined" 
            onPress={() => navigation.navigate('ReportIssue', { vehicleId: vehicle.id })} 
            style={styles.halfBtn}
            textColor={CONFIG.COLORS.danger}
          >
            Usterka
          </Button>

          <Button 
            icon="history" 
            mode="outlined" 
            onPress={() => navigation.navigate('TripLog')} 
            style={styles.halfBtn}
            textColor={CONFIG.COLORS.navy}
          >
            Historia
          </Button>
        </View>

        <View style={styles.footerActions}>
          <Button 
            icon="car-arrow-left" 
            mode="text" 
            onPress={handleReturn} 
            textColor={CONFIG.COLORS.gray}
          >
            Zwróć pojazd do bazy
          </Button>
          
          <Button mode="text" onPress={logout} textColor="gray">
            Wyloguj się
          </Button>
        </View>
      </View>

      <Text style={styles.footerVersion}>Fleetify Mobile v1.5 • Connected to Gateway</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CONFIG.COLORS.navy },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: CONFIG.COLORS.ice },
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 25, 
    paddingBottom: 25, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  whiteText: { color: '#FFFFFF', fontWeight: 'bold' },
  iceText: { color: CONFIG.COLORS.ice, opacity: 0.7 },
  card: { marginHorizontal: 20, borderRadius: 20, backgroundColor: '#FFFFFF', elevation: 10 },
  statsRow: { marginTop: 10 },
  label: { color: 'gray', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  mileageText: { color: CONFIG.COLORS.navy, fontWeight: 'bold' },
  fuelSection: { marginTop: 20 },
  fuelLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressBar: { height: 12, borderRadius: 6 },
  actionGrid: { padding: 20, gap: 12 },
  mainBtn: { paddingVertical: 8, borderRadius: 15, elevation: 4 },
  row: { flexDirection: 'row', gap: 10 },
  halfBtn: { flex: 1, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD' },
  footerActions: { marginTop: 10, alignItems: 'center' },
  noVehicleText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  subText: { color: '#FFFFFF', opacity: 0.6, textAlign: 'center', marginTop: 5 },
  refreshButton: { marginTop: 25, width: '80%', borderRadius: 10 },
  footerVersion: { textAlign: 'center', color: 'gray', fontSize: 10, marginVertical: 20, opacity: 0.5 }
});