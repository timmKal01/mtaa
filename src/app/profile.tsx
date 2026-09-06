import { useClerk, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <ThemedView style={styles.wrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="small">Back</ThemedText>
        </Pressable>
        <ThemedText type="title">Profile</ThemedText>
        <ThemedText>{email}</ThemedText>
        <Pressable
          style={styles.btn}
          onPress={async () => {
            await signOut();
          }}
        >
          <ThemedText>Sign out</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  safe: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  btn: {
    marginTop: 24,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
});
