import React, { useState } from 'react';
import { View, Alert, Linking } from 'react-native';
import { Button, Text, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { driverApi } from '../api/services';
import { CONFIG } from '../constants/Config';

export default function ReportDownloader() {
  const [status, setStatus] = useState('idle'); // idle, processing, ready
  const [progress, setProgress] = useState(0);

  const startGeneration = async () => {
    try {
      setStatus('processing');
      setProgress(0.1);
      
      // Krok 1: Żądanie raportu
      const res = await driverApi.requestReport('trips');
      const jobId = res.data.job_id;

      // Krok 2: Polling (sprawdzanie co 2 sekundy)
      const interval = setInterval(async () => {
        const statusRes = await driverApi.checkReportStatus(jobId);
        const currentStatus = statusRes.data.status;
        const currentProgress = statusRes.data.progress / 100;

        setProgress(currentProgress);

        if (currentStatus === 'COMPLETED') {
          clearInterval(interval);
          setStatus('ready');
          const url = driverApi.getDownloadUrl(jobId);
          Linking.openURL(url); // Otwiera PDF w przeglądarce telefonu
          setStatus('idle');
        } else if (currentStatus === 'FAILED') {
          clearInterval(interval);
          setStatus('idle');
          Alert.alert("Błąd", "Generowanie raportu nie powiodło się.");
        }
      }, 2000);

    } catch (e) {
      setStatus('idle');
      Alert.alert("Błąd", "Serwis raportowy jest nieosiągalny.");
    }
  };

  return (
    <View style={{ marginTop: 10 }}>
      {status === 'idle' ? (
        <Button 
          icon="file-pdf-box" 
          mode="contained" 
          onPress={startGeneration}
          buttonColor={CONFIG.COLORS.navy}
        >
          Pobierz raport moich tras (PDF)
        </Button>
      ) : (
        <View style={{ padding: 10, backgroundColor: '#fff', borderRadius: 10 }}>
          <Text style={{ textAlign: 'center', marginBottom: 5 }}>
            Generowanie raportu... {Math.round(progress * 100)}%
          </Text>
          <ProgressBar progress={progress} color={CONFIG.COLORS.cyan} />
        </View>
      )}
    </View>
  );
}