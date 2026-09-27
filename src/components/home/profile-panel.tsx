import { useClerk, useUser } from '@clerk/expo';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { BackRow, Button, Notice } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useJobs } from '@/context/jobs';
import { useRole } from '@/context/role';
import type { useAvatar } from '@/hooks/use-avatar';
import { useTheme } from '@/hooks/use-theme';
import { isCustomer, isProvider } from '@/lib/jobs';

function Stat({ value, label }: { value: number; label: string }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.stat, { backgroundColor: theme.background }]}
    >
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {label}
      </ThemedText>
    </View>
  );
}

export function ProfilePanel({
  avatar,
  onBack,
}: {
  avatar: ReturnType<typeof useAvatar>;
  onBack: () => void;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { role } = useRole();
  const { jobs, userId, loaded } = useJobs();
  const theme = useTheme();

  const posted = jobs.filter((j) => isCustomer(j, userId)).length;
  const taken = jobs.filter((j) => isProvider(j, userId));
  const delivered = taken.filter((j) => j.status === 'delivered').length;
  const email = user?.primaryEmailAddress?.emailAddress ?? 'Signed in';
  const name = user?.fullName || user?.firstName;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.backgroundElement }]}>
      <BackRow onPress={onBack} />

      <View style={styles.identity}>
        <Avatar uri={avatar.uri} initial={avatar.initial} size={72} />
        <View style={styles.identityText}>
          {name ? <ThemedText style={styles.name}>{name}</ThemedText> : null}
          <ThemedText type={name ? 'small' : 'default'} themeColor={name ? 'textSecondary' : 'text'}>
            {email}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Using Mtaa as a {role === 'customer' ? 'Customer' : 'Provider'}
          </ThemedText>
        </View>
      </View>

      <Button
        label={avatar.uri ? 'Change photo' : 'Add a photo'}
        icon="camera-outline"
        variant="secondary"
        loading={avatar.uploading}
        onPress={avatar.pick}
        accessibilityHint="Opens your photo gallery"
      />
      {avatar.message ? <Notice tone={avatar.message.tone} message={avatar.message.text} /> : null}
      <ThemedText type="small" themeColor="textSecondary">
        A clear photo helps customers and providers trust who they are dealing with.
      </ThemedText>

      <View style={styles.stats}>
        <Stat value={posted} label="Jobs posted" />
        <Stat value={taken.length} label="Jobs accepted" />
        <Stat value={delivered} label="Jobs delivered" />
      </View>
      {!loaded ? (
        <ThemedText type="small" themeColor="textSecondary">
          Counts update once your jobs load.
        </ThemedText>
      ) : null}

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  identityText: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
  },
  statValue: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  center: { textAlign: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.one },
});
