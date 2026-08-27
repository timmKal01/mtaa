import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function SignInScreen() {
  const { startHostedAuth } = useHostedAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = async (mode: 'sign-in' | 'sign-up') => {
    setError('');
    setBusy(true);
    try {
      await startHostedAuth({ mode });
    } catch (e: any) {
      setError(e?.message ?? 'Sign in cancelled');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Mtaa</Text>
      <Text style={styles.sub}>Sign in to continue</Text>

      <Pressable
        style={styles.btn}
        onPress={() => open('sign-in')}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Sign in</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.btnGhost}
        onPress={() => open('sign-up')}
        disabled={busy}
      >
        <Text style={styles.ghostText}>Create account</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#0b0b0b',
  },
  title: { fontSize: 32, fontWeight: '700', color: '#fff' },
  sub: { fontSize: 16, color: '#aaa', marginBottom: 12 },
  btn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  btnText: { color: '#06110a', fontWeight: '700', fontSize: 16 },
  btnGhost: { padding: 14, alignItems: 'center' },
  ghostText: { color: '#86efac', fontSize: 16 },
  error: { color: '#fca5a5' },
});
