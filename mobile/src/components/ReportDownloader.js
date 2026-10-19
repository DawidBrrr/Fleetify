import React, { useEffect, useRef, useState } from 'react';
import { View, Alert, Linking, StyleSheet } from 'react-native';
import { Button, Text, ProgressBar } from 'react-native-paper';
import { driverApi } from '../api/services';
import { CONFIG } from '../constants/Config';

export default function ReportDownloader() {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const pollTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const generatingRef = useRef(false);
  const maxPollAttempts = 60;
  const pollIntervalMs = 2000;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  const startGeneration = async () => {
    if (generatingRef.current) return;

    generatingRef.current = true;
    setStatus('processing');
    setProgress(0.1);

    try {
      const res = await driverApi.requestReport('trips');
      const jobId = res.data?.job_id;
      if (!jobId) {
        throw new Error('Brak identyfikatora zadania raportu.');
      }

      let pollAttempts = 0;
      const poll = async () => {
        if (!mountedRef.current || !generatingRef.current) return;
        pollAttempts += 1;

        try {
          const statusRes = await driverApi.checkReportStatus(jobId);
          if (!mountedRef.current) return;

          const currentStatus = String(statusRes.data?.status || '').toUpperCase();
          const rawProgress = Number(statusRes.data?.progress);
          if (Number.isFinite(rawProgress)) {
            setProgress(Math.min(1, Math.max(0, rawProgress / 100)));
          }

          if (currentStatus === 'COMPLETED') {
            generatingRef.current = false;
            pollTimerRef.current = null;
            setStatus('idle');

            const url = driverApi.getDownloadUrl(jobId);
            Linking.openURL(url).catch(() => {
              if (mountedRef.current) {
                Alert.alert('Błąd', 'Nie udało się otworzyć raportu.');
              }
            });
            return;
          }

          if (currentStatus === 'FAILED') {
            generatingRef.current = false;
            pollTimerRef.current = null;
            setStatus('idle');
            Alert.alert('Błąd', 'Generowanie raportu nie powiodło się.');
            return;
          }

          if (currentStatus === 'NOT_FOUND' || currentStatus === 'ERROR') {
            generatingRef.current = false;
            pollTimerRef.current = null;
            setStatus('idle');
            Alert.alert('Błąd', 'Zadanie raportu nie jest już dostępne.');
            return;
          }

          if (pollAttempts >= maxPollAttempts) {
            generatingRef.current = false;
            pollTimerRef.current = null;
            setStatus('idle');
            Alert.alert('Błąd', 'Generowanie raportu trwa zbyt długo.');
            return;
          }

          pollTimerRef.current = setTimeout(poll, pollIntervalMs);
        } catch (e) {
          generatingRef.current = false;
          pollTimerRef.current = null;
          if (mountedRef.current) {
            setStatus('idle');
            Alert.alert('Błąd', 'Nie udało się sprawdzić statusu raportu.');
          }
        }
      };

      await poll();
    } catch (e) {
      generatingRef.current = false;
      if (mountedRef.current) {
        setStatus('idle');
        Alert.alert('Błąd', 'Serwis raportowy jest nieosiągalny.');
      }
    }
  };

  return (
    <View style={styles.container}>
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
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            Generowanie raportu... {Math.round(progress * 100)}%
          </Text>
          <ProgressBar progress={progress} color={CONFIG.COLORS.cyan} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  progressCard: {
    padding: 10,
    backgroundColor: CONFIG.COLORS.white,
    borderRadius: 10,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 5,
  },
});