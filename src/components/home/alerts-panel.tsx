import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BackRow, EmptyState, Notice, PressableRow } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { relativeTime, type JobEvent } from '@/lib/jobs';

const TONE = {
  primary: ['primarySoft', 'primaryText'],
  success: ['successSoft', 'success'],
  warning: ['warningSoft', 'warning'],
} as const;

export function AlertsPanel({
  events,
  seenBefore,
  error,
  loaded,
  onBack,
  onOpenJob,
  onRetry,
}: {
  events: JobEvent[];
  seenBefore: number;
  error: string | null;
  loaded: boolean;
  onBack: () => void;
  onOpenJob: () => void;
  onRetry: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <BackRow onPress={onBack} />
      <ThemedText style={styles.title} accessibilityRole="header">
        Notifications
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Updates on jobs you posted or took. Pull down to refresh.
      </ThemedText>

      {error ? (
        <Notice
          tone="error"
          title="Couldn't check for updates"
          message={error}
          action={{ label: 'Try again', onPress: onRetry }}
        />
      ) : null}

      {loaded && events.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="Nothing yet"
          message="When you post a job, pay for it, or a provider picks it up, you'll see it here."
        />
      ) : null}

      {events.map((e) => {
        const [bg, fg] = TONE[e.tone];
        const fresh = e.fromOthers && e.at > seenBefore;
        return (
          <PressableRow
            key={e.key}
            onPress={onOpenJob}
            accessibilityLabel={`${fresh ? 'New. ' : ''}${e.title}. ${e.body}. ${relativeTime(e.at)}`}
            accessibilityHint="Opens Jobs"
            style={[styles.item, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={[styles.icon, { backgroundColor: theme[bg] }]}>
              <Ionicons name={e.icon} size={18} color={theme[fg]} />
            </View>
            <View style={styles.text}>
              <ThemedText type="smallBold">{e.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {e.body}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {relativeTime(e.at)}
              </ThemedText>
            </View>
            {fresh ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
          </PressableRow>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: Spacing.one },
});
