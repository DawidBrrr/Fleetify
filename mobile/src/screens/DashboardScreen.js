import React, { useEffect, useState, useContext } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, TextInput, ProgressBar, Avatar, ActivityIndicator } from 'react-native-paper';
import { driverApi } from '../api/services';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../constants/Config';
import ReportDownloader from '../components/ReportDownloader';

export default function DashboardScreen({ navigation }) {
  const { logout, userData } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [userStats, setUserStats] = useState({ totalKm: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newMileage, setNewMileage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      // 1. Pobierz dane o przydzielonym aucie
      const dashboardRes = await driverApi.getDashboard();
      setData(dashboardRes.data);
      
      if (dashboardRes.data?.assignment?.vehicle) {
        setNewMileage(dashboardRes.data.assignment.vehicle.mileage?.toString() || '0');
      }

      // 2. Pobierz trasy i wylicz statystyki lokalnie (bezpieczniejsze niż admin stats)
      const tripsRes = await driverApi.getMyTrips();
      const trips = tripsRes.data || [];
      const total = trips.reduce((sum, t) => sum + (parseFloat(t.distance_km) || 0), 0);
      setUserStats({ totalKm: total, count: trips.length });

    } catch (e) {
      console.error("Sync error:", e);
      if (e.response?.status === 403) logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Odświeżaj dane za każdym razem, gdy użytkownik wraca na ten ekran (np. po dodaniu trasy)
    const unsubscribe = navigation.addListener('focus', () => {
      loadAllData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const handleUpdateMileage = async () => {
    if (!newMileage) return;
    try {
      setIsUpdating(true);
      await driverApi.updateOdometer(newMileage, data.assignment.vehicle.battery || 0);
      Alert.alert("Sukces", "Zaktualizowano stan licznika.");
      loadAllData();
    } catch (e) {
      Alert.alert("Błąd", "Nie udało się połączyć z bazą.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} color={CONFIG.COLORS.cyan} size="large" />
      </View>
    );
  }

  if (!data?.assignment?.vehicle) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Avatar.Icon size={80} icon="car-off" backgroundColor={CONFIG.COLORS.gray} />
          <Text style={styles.noVehicleText}>Brak przydzielonego auta</Text>
          <Button mode="contained" onPress={loadAllData} style={styles.refreshButton} buttonColor={CONFIG.COLORS.cyan}>
            Odśwież
          </Button>
          <Button mode="text" textColor={CONFIG.COLORS.ice} onPress={logout} style={{marginTop: 20}}>Wyloguj</Button>
        </View>
      </View>
    );
  }

  const vehicle = data.assignment.vehicle;
  const batteryLevel = (vehicle.battery || 0) / 100;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CONFIG.COLORS.cyan} />}
    >
      {/* Profil Kierowcy */}
      <View style={styles.header}>
        <View>
          <Text variant="labelLarge" style={styles.iceText}>Dzień dobry,</Text>
          <Text variant="headlineSmall" style={styles.whiteText}>{userData?.full_name}</Text>
        </View>
        <Avatar.Text size={50} label={userData?.full_name?.substring(0,2).toUpperCase()} backgroundColor={CONFIG.COLORS.cyan} />
      </View>

      {/* Karta Pojazdu */}
      <Card style={styles.card}>
        <Card.Title 
          title={vehicle.model} 
          subtitle={`Rejestracja: ${vehicle.vin?.substring(0,3)}...${vehicle.vin?.slice(-4)}`} 
          left={(props) => <Avatar.Icon {...props} icon="car-electric" backgroundColor={CONFIG.COLORS.navy} />}
        />
        <Card.Content>
          <Text variant="labelMedium" style={styles.label}>Przebieg całkowity</Text>
          <Text variant="headlineMedium" style={styles.mileageText}>{vehicle.mileage} km</Text>

          <View style={styles.batterySection}>
            <View style={styles.batteryLabels}>
              <Text variant="bodyMedium">Poziom energii</Text>
              <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{vehicle.battery}%</Text>
            </View>
            <ProgressBar progress={batteryLevel} color={CONFIG.COLORS.cyan} style={styles.progressBar} />
          </View>

          <View style={styles.divider} />

          <TextInput
            label="Szybka korekta licznika"
            value={newMileage}
            onChangeText={setNewMileage}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleUpdateMileage} loading={isUpdating} buttonColor={CONFIG.COLORS.navy} style={styles.saveButton}>
            Zapisz stan
          </Button>
        </Card.Content>
      </Card>

      {/* Statystyki Kierowcy */}
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="labelSmall" style={{color: 'gray'}}>DYSTANS (SUMA)</Text>
            <Text variant="titleLarge" style={{fontWeight: 'bold'}}>{userStats.totalKm.toFixed(0)} km</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="labelSmall" style={{color: 'gray'}}>TRASY</Text>
            <Text variant="titleLarge" style={{fontWeight: 'bold'}}>{userStats.count}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Raporty PDF */}
      <View style={{ paddingHorizontal: 20 }}>
        <ReportDownloader />
      </View>

      {/* Główne Akcje */}
      <View style={styles.actions}>
        <Button 
          icon="plus-circle" 
          mode="contained" 
          onPress={() => navigation.navigate('AddTrip', { vehicleId: vehicle.id, vehicleLabel: vehicle.model })} 
          style={styles.mainActionButton}
          buttonColor={CONFIG.COLORS.cyan}
        >
          Zapisz nową trasę
        </Button>

        <View style={styles.secondaryActions}>
          <Button 
            icon="alert-octagon" 
            mode="outlined" 
            onPress={() => navigation.navigate('ReportIssue', { vehicleId: vehicle.id })} 
            style={styles.halfButton}
            textColor={CONFIG.COLORS.danger}
          >
            Usterka
          </Button>
          <Button 
            icon="history" 
            mode="outlined" 
            onPress={() => navigation.navigate('TripLog')} 
            style={styles.halfButton}
            textColor={CONFIG.COLORS.navy}
          >
            Historia
          </Button>
        </View>
        
        <Button mode="text" onPress={logout} textColor="gray" style={{marginTop: 10}}>Wyloguj się</Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CONFIG.COLORS.navy },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { paddingTop: 60, paddingHorizontal: 25, paddingBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  whiteText: { color: '#FFF', fontWeight: 'bold' },
  iceText: { color: CONFIG.COLORS.ice, opacity: 0.7 },
  card: { marginHorizontal: 20, borderRadius: 20, backgroundColor: '#FFF', elevation: 10 },
  label: { color: 'gray', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  mileageText: { color: CONFIG.COLORS.navy, fontWeight: 'bold', marginBottom: 15 },
  batterySection: { marginTop: 5 },
  batteryLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressBar: { height: 10, borderRadius: 5 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },
  input: { backgroundColor: '#FFF', height: 45 },
  saveButton: { marginTop: 10, borderRadius: 10 },
  statsContainer: { flexDirection: 'row', padding: 20, gap: 10 },
  statsCard: { flex: 1, borderRadius: 15, backgroundColor: '#FFF' },
  actions: { padding: 20, paddingBottom: 40 },
  mainActionButton: { paddingVertical: 8, borderRadius: 15, elevation: 4 },
  secondaryActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  halfButton: { flex: 1, borderRadius: 12, backgroundColor: '#FFF' },
  noVehicleText: { color: '#FFF', fontSize: 18, marginVertical: 20 },
  refreshButton: { width: '80%', borderRadius: 10 }
});