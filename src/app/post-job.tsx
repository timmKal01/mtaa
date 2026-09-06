import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.152.35.238:3000';

type JobType = 'deliver' | 'pickup' | 'buy' | 'errand' | 'move';

const titles: Record<JobType, string> = {
  deliver: 'Deliver something',
  pickup: 'Pick something up',
  buy: 'Buy something',
  errand: 'Run an errand',
  move: 'Move something',
};

const TIME_SLOTS = [
  '07:00–09:30',
  '09:30–12:00',
  '12:00–14:00',
  '14:00–16:30',
  '16:30–19:00',
  '19:00–21:00',
];

const DATES = ['Today', 'Tomorrow'] as const;
type JobDate = (typeof DATES)[number];

export default function PostJobScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { getToken } = useAuth();

  const initialType = (
      ['deliver', 'pickup', 'buy', 'errand', 'move'] as JobType[]
  ).includes(params.type as JobType)
      ? (params.type as JobType)
      : 'deliver';

  const [jobType] = useState<JobType>(initialType);
  const [jobDate, setJobDate] = useState<JobDate>('Today');
  const [slotOpen, setSlotOpen] = useState(false);
  const [what, setWhat] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [when, setWhen] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const postJob = async () => {
    setStatus('');
    if (!what.trim() || !pickup.trim() || !dropoff.trim() || !when) {
      setStatus('What, pickup, dropoff and time slot are required');
      return;
    }

    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: jobType,
          what: what.trim(),
          pickup: pickup.trim(),
          dropoff: dropoff.trim(),
          when: `${jobDate} · ${when}`,
          budgetKes: Number(budget) || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message ?? 'Could not post job');
        return;
      }

      setStatus(`Posted. Job ${data.id}`);
    } catch (e: any) {
      setStatus(e?.message ?? 'Network error. Is mtaa-api running?');
    } finally {
      setBusy(false);
    }
  };

  return (
      <ThemedView style={styles.wrap}>
        <SafeAreaView style={styles.safe}>
          <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
          >
            <Pressable onPress={() => router.back()}>
              <ThemedText type="small">Back</ThemedText>
            </Pressable>

            <ThemedText type="title">{titles[jobType]}</ThemedText>

            <TextInput
                style={styles.input}
                placeholder="What?"
                placeholderTextColor="#888"
                value={what}
                onChangeText={setWhat}
            />
            <TextInput
                style={styles.input}
                placeholder="Pickup"
                placeholderTextColor="#888"
                value={pickup}
                onChangeText={setPickup}
            />
            <TextInput
                style={styles.input}
                placeholder="Dropoff"
                placeholderTextColor="#888"
                value={dropoff}
                onChangeText={setDropoff}
            />

            <ThemedText type="small">Day</ThemedText>
            <ThemedView style={styles.rowLine}>
              {DATES.map((d) => (
                  <Pressable key={d} onPress={() => setJobDate(d)}>
                    <ThemedText>{jobDate === d ? `• ${d}` : d}</ThemedText>
                  </Pressable>
              ))}
            </ThemedView>

            <ThemedText type="small">Time slot</ThemedText>
            <Pressable
                style={styles.input}
                onPress={() => setSlotOpen((v) => !v)}
            >
              <ThemedText>{when || 'Choose time slot'}</ThemedText>
            </Pressable>
            {slotOpen
                ? TIME_SLOTS.map((slot) => (
                    <Pressable
                        key={slot}
                        onPress={() => {
                          setWhen(slot);
                          setSlotOpen(false);
                        }}
                        style={styles.row}
                    >
                      <ThemedText>{slot}</ThemedText>
                    </Pressable>
                ))
                : null}

            <TextInput
                style={styles.input}
                placeholder="Budget KES"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                value={budget}
                onChangeText={setBudget}
            />

            <Pressable style={styles.btn} onPress={postJob} disabled={busy}>
              <ThemedText>{busy ? 'Posting…' : 'Post job'}</ThemedText>
            </Pressable>

            {status ? <ThemedText>{status}</ThemedText> : null}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  safe: { flex: 1, width: '100%' },
  scroll: { flex: 1, width: '100%' },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  rowLine: { flexDirection: 'row', gap: 16 },
  row: { paddingVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    width: '100%',
  },
  btn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
});
