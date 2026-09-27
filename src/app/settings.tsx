import { useClerk, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, RoleSwitch } from '@/components/ui';
import { Radius, Spacing, TabBarClearance } from '@/constants/theme';
import { useRole } from '@/context/role';
import { useTheme } from '@/hooks/use-theme';
import { api, API_URL, errorMessage, useApiHealth } from '@/lib/api';
import { relativeTime } from '@/lib/jobs';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" accessibilityRole="header">
        {title.toUpperCase()}
      </ThemedText>
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.rowValue} selectable>
        {value}
      </ThemedText>
    </View>
  );
}

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { role } = useRole();
  const health = useApiHealth();
  const theme = useTheme();
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const check = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      await api('/health');
      setCheckResult('Server answered. You are connected.');
    } catch (e) {
      setCheckResult(errorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  const connected = health.lastOkAt !== null && health.lastError === null;
  const statusColor = connected ? theme.success : health.lastError ? theme.danger : theme.textSecondary;
  const statusText = connected
    ? `Connected · last synced ${relativeTime(health.lastOkAt)}`
    : health.lastError
      ? "Can't reach the server"
      : 'Not checked yet';

  return (
    <ThemedView style={styles.wrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText style={styles.title} accessibilityRole="header">
            Settings
          </ThemedText>

          <Section title="Mode">
            <RoleSwitch />
            <ThemedText type="small" themeColor="textSecondary">
              {role === 'customer'
                ? 'Customer: post errands and pay for them.'
                : 'Provider: take paid jobs and earn. You cannot accept jobs you posted.'}{' '}
              Saved on this phone.
            </ThemedText>
          </Section>

          <Section title="Connection">
            <View style={styles.status}>
              <Ionicons
                name={connected ? 'cloud-done-outline' : 'cloud-offline-outline'}
                size={20}
                color={statusColor}
              />
              <ThemedText style={{ color: statusColor, flex: 1 }}>{statusText}</ThemedText>
            </View>
            {health.lastError && !connected ? (
              <ThemedText type="small" themeColor="textSecondary">
                {health.lastError}
              </ThemedText>
            ) : null}
            <Row label="Server" value={API_URL || 'Not set (EXPO_PUBLIC_API_URL)'} />
            <Button
              label="Check connection"
              icon="refresh-outline"
              variant="secondary"
              loading={checking}
              onPress={check}
            />
            {checkResult ? (
              <ThemedText type="small" accessibilityLiveRegion="polite">
                {checkResult}
              </ThemedText>
            ) : null}
          </Section>

          <Section title="Payments">
            <View style={styles.status}>
              <Ionicons name="phone-portrait-outline" size={20} color={theme.warning} />
              <ThemedText style={{ flex: 1 }}>M-Pesa (test mode)</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Payments are simulated and you get a STUB receipt. No money moves. Live M-Pesa is
              coming later.
            </ThemedText>
          </Section>

          <Section title="About">
            <Row label="App version" value={Constants.expoConfig?.version ?? '1.0.0'} />
            <Row label="Service area" value="Nairobi" />
          </Section>

          <Section title="Account">
            <Row label="Signed in as" value={user?.primaryEmailAddress?.emailAddress ?? '—'} />
            <Button
              label="Sign out"
              icon="log-out-outline"
              variant="danger"
              onPress={() =>
                Alert.alert('Sign out?', 'You will need to sign in again to post or take jobs.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
                ])
              }
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  safe: { flex: 1, width: '100%' },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: TabBarClearance,
    gap: Spacing.four,
  },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  section: { gap: Spacing.two },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { gap: 2 },
  rowValue: { fontSize: 15 },
});
