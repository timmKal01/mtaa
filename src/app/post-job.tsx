import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.152.35.238:3000';

export default function PostJobScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [what, setWhat] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [when, setWhen] = useState('Now');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const postJob = async () => {
    setStatus('');
    if (!what.trim() || !pickup.trim() || !dropoff.trim()) {
      setStatus('What, pickup and dropoff are required');
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
          type: 'deliver',
          what: what.trim(),
          pickup: pickup.trim(),
          dropoff: dropoff.trim(),
          when: when.trim(),
          budgetKes: Number(budget) || null,
          customerClerkId: user?.id,
          customerEmail: user?.primaryEmailAddress?.emailAddress,
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
        <Pressable onPress={() => router.back()}>
          <ThemedText type="small">Back</ThemedText>
        </Pressable>

        <ThemedText type="title">Deliver something</ThemedText>

        <TextInput
          style={styles.input}
          placeholder="What? e.g. documents"
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
        <TextInput
          style={styles.input}
          placeholder="When"
          placeholderTextColor="#888"
          value={when}
          onChangeText={setWhen}
        />
        <TextInput
          style={styles.input}
          placeholder="Budget KES"
          placeholderTextColor="#888"
          keyboardType="number-pad"
          value={budget}
          onChangeText={setBudget}
        />

        <Pressable style={styles.btn} onPress={postJob} disabled={busy}>
          <ThemedText type="small">{busy ? 'Posting…' : 'Post job'}</ThemedText>
        </Pressable>

        {status ? <ThemedText>{status}</ThemedText> : null}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  safe: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  btn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
});
