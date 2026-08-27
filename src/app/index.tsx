import { useAuth, useClerk, useUser } from '@clerk/expo';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.152.35.238:3000';

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress ?? 'Signed in';

  const [open, setOpen] = useState(false);
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
          customerEmail: email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message ?? 'Could not post job');
        return;
      }
      setStatus(`Posted. Job ${data.id}`);
      setWhat('');
      setPickup('');
      setDropoff('');
    } catch (e: any) {
      setStatus(e?.message ?? 'Network error. Is mtaa-api running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            Mtaa
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            Everyday errands, done locally
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          {email}
        </ThemedText>

        {open ? (
          <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <Pressable onPress={() => setOpen(false)}>
              <ThemedText type="small">Back</ThemedText>
            </Pressable>
            <ThemedText type="title">Deliver something</ThemedText>
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
              <ThemedText>{busy ? 'Posting…' : 'Post job'}</ThemedText>
            </Pressable>
            {status ? <ThemedText>{status}</ThemedText> : null}
          </ThemedView>
        ) : (
          <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <Pressable onPress={() => setOpen(true)} style={styles.row}>
              <ThemedText>Deliver something</ThemedText>
            </Pressable>
            <ThemedText>Pick something up</ThemedText>
            <ThemedText>Buy something</ThemedText>
            <ThemedText>Run an errand</ThemedText>
            <ThemedText>Move something</ThemedText>
          </ThemedView>
        )}

        <Pressable onPress={() => signOut()} style={styles.signOut}>
          <ThemedText type="small">Sign out</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', flexDirection: 'row' },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', opacity: 0.7 },
  code: { textTransform: 'none' },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  row: { paddingVertical: 8 },
  signOut: { paddingVertical: Spacing.three },
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
