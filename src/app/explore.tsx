import { useUser } from '@clerk/expo';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.152.35.238:3000';

type Job = {
  id: string;
  type: string;
  what: string;
  pickup: string;
  dropoff: string;
  when: string;
  budgetKes: number | null;
  customerEmail?: string;
  providerEmail?: string;
  status: string;
  createdAt: string;
};

export default function ExploreScreen() {
  const { user } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/jobs`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Could not load jobs');
        return;
      }
      setJobs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Network error. Is mtaa-api running?');
    } finally {
      setLoading(false);
    }
  };

  const accept = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/jobs/${id}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerClerkId: user?.id,
          providerEmail: user?.primaryEmailAddress?.emailAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Could not accept');
        return;
      }
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Network error');
    }
  };

  useFocusEffect(
      useCallback(() => {
        load();
      }, []),
  );

  return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <ThemedText type="title">Jobs</ThemedText>
          <Pressable onPress={load}>
            <ThemedText type="small">
              {loading ? 'Loading…' : 'Refresh'}
            </ThemedText>
          </Pressable>

          {error ? <ThemedText>{error}</ThemedText> : null}

          <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={loading} onRefresh={load} />
              }
          >
            {jobs.length === 0 && !loading ? (
                <ThemedText type="small">
                  No jobs yet. Post one from Home.
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
                        {job.pickup} → {job.dropoff}
                      </ThemedText>
                      <ThemedText type="small">
                        {job.when} ·{' '}
                        {job.budgetKes != null ? `KES ${job.budgetKes}` : 'No budget'}{' '}
                        · {job.status}
                      </ThemedText>
                      {job.status === 'posted' ? (
                          <Pressable onPress={() => accept(job.id)} style={styles.row}>
                            <ThemedText>Accept</ThemedText>
                          </Pressable>
                      ) : (
                          <ThemedText type="small">
                            Accepted by {job.providerEmail ?? 'provider'}
                          </ThemedText>
                      )}
                    </ThemedView>
                ))
            )}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  list: { flex: 1, alignSelf: 'stretch' },
  listContent: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    gap: 8,
  },
  row: { paddingVertical: 8 },
});