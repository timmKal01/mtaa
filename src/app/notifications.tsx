import { useAuth, useUser } from '@clerk/expo';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.123.172.238:3000';

type Job = {
  id: string;
  what: string;
  status: string;
  paymentStatus?: string;
  customerClerkId?: string;
  providerEmail?: string;
};

export default function NotificationsScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/jobs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Could not load');
        return;
      }
      const mine = (Array.isArray(data) ? data : []).filter(
        (j: Job) =>
          j.customerClerkId === user?.id ||
          j.status === 'accepted' ||
          j.status === 'picked_up' ||
          j.status === 'delivered' ||
          j.paymentStatus === 'paid',
      );
      setJobs(mine.slice(0, 20));
    } catch (e: any) {
      setError(e?.message ?? 'Network error');
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [user?.id]),
  );

  return (
    <ThemedView style={styles.wrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ThemedText type="title">Notifications</ThemedText>
        <Pressable onPress={load}>
          <ThemedText type="small">Refresh</ThemedText>
        </Pressable>
        {error ? <ThemedText>{error}</ThemedText> : null}
        <ScrollView contentContainerStyle={styles.list}>
          {jobs.length === 0 ? (
            <ThemedText type="small">
              No updates yet. Posted, paid, and accepted jobs will show here.
            </ThemedText>
          ) : (
            jobs.map((job) => (
              <ThemedView
                key={job.id}
                type="backgroundElement"
                style={styles.card}
              >
                <ThemedText>{job.what}</ThemedText>
                <ThemedText type="small">
                  {job.status}
                  {job.paymentStatus === 'paid' ? ' · paid' : ''}
                </ThemedText>
              </ThemedView>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  list: { gap: 12, paddingBottom: 200 },
  card: { padding: 16, borderRadius: 16, gap: 6 },
});
