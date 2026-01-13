import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, Card, Avatar, ActivityIndicator } from 'react-native-paper';
import { driverApi } from '../api/services';
import { CONFIG } from '../constants/Config';

export default function TripLogScreen() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    try {
      const res = await driverApi.getMyTrips();
      setTrips(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrips(); }, []);

  if (loading) return <ActivityIndicator style={{flex:1}} color={CONFIG.COLORS.cyan}/>;

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <List.Item
              title={item.route_label || "Trasa nieopisana"}
              description={`${item.distance_km} km • ${item.fuel_cost || 0} zł paliwo`}
              left={props => <List.Icon {...props} icon="map-marker-distance" color={CONFIG.COLORS.cyan} />}
              right={() => <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>}
            />
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Brak zarejestrowanych tras.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CONFIG.COLORS.ice, padding: 10 },
  card: { marginBottom: 10, backgroundColor: '#fff' },
  date: { fontSize: 12, color: 'gray', alignSelf: 'center', marginRight: 10 },
  empty: { textAlign: 'center', marginTop: 50, color: 'gray' }
});