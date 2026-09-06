import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.wrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText>Notifications</ThemedText>
        <ThemedText type="small">Coming next</ThemedText>
        <ThemedText>Language</ThemedText>
        <ThemedText type="small">English</ThemedText>
        <ThemedText>Payments</ThemedText>
        <ThemedText type="small">M-Pesa stub</ThemedText>
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
});
