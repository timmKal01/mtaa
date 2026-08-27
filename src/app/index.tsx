import { useClerk, useUser } from '@clerk/expo';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress ?? 'Signed in';

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

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <ThemedText>Deliver something</ThemedText>
          <ThemedText>Pick something up</ThemedText>
          <ThemedText>Buy something</ThemedText>
          <ThemedText>Run an errand</ThemedText>
          <ThemedText>Move something</ThemedText>
        </ThemedView>

        <Pressable onPress={() => signOut()} style={styles.signOut}>
          <ThemedText type="small">Sign out</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
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
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  code: {
    textTransform: 'none',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  signOut: {
    paddingVertical: Spacing.three,
  },
});
