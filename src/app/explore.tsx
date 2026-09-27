import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobCard } from '@/components/job-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState, Notice, RoleSwitch } from '@/components/ui';
import { Spacing, TabBarClearance } from '@/constants/theme';
import { useJobs } from '@/context/jobs';
import { useRole } from '@/context/role';
import { useJobActions } from '@/hooks/use-job-actions';
import { useTheme } from '@/hooks/use-theme';
import { isCustomer, isPaid, isProvider, type Job } from '@/lib/jobs';

type Section = { key: string; title: string; hint?: string; data: Job[] };

export default function JobsScreen() {
  const { jobs, userId, loading, loaded, error, pending, refresh } = useJobs();
  const { role } = useRole();
  const onAction = useJobActions();
  const router = useRouter();
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const { sections, hiddenOwn } = useMemo(() => {
    const mine = jobs.filter((j) => isCustomer(j, userId));
    if (role === 'customer') {
      return {
        hiddenOwn: 0,
        sections: [
          {
            key: 'active',
            title: 'In progress',
            data: mine.filter((j) => j.status !== 'delivered'),
          },
          {
            key: 'done',
            title: 'Completed',
            data: mine.filter((j) => j.status === 'delivered'),
          },
        ].filter((s) => s.data.length > 0) as Section[],
      };
    }

    const assigned = jobs.filter((j) => isProvider(j, userId));
    const open = jobs.filter((j) => j.status === 'posted' && !isCustomer(j, userId));
    return {
      hiddenOwn: mine.length,
      sections: [
        {
          key: 'working',
          title: 'Your active jobs',
          data: assigned.filter((j) => j.status === 'accepted' || j.status === 'picked_up'),
        },
        {
          key: 'ready',
          title: 'Ready to accept',
          hint: 'Paid by the customer',
          data: open.filter(isPaid),
        },
        {
          key: 'waiting',
          title: 'Waiting for payment',
          hint: 'You can accept these once the customer pays',
          data: open.filter((j) => !isPaid(j)),
        },
        {
          key: 'done',
          title: 'Completed by you',
          data: assigned.filter((j) => j.status === 'delivered'),
        },
      ].filter((s) => s.data.length > 0),
    };
  }, [jobs, role, userId]);

  const header = (
    <View style={styles.header}>
      <ThemedText style={styles.title} accessibilityRole="header">
        Jobs
      </ThemedText>
      <RoleSwitch compact />
      <ThemedText type="small" themeColor="textSecondary">
        {role === 'customer'
          ? 'Jobs you have posted. Pay for a job so providers can take it.'
          : 'Paid jobs across Nairobi that you can take, and the ones you are doing.'}
      </ThemedText>
      {error ? (
        <Notice
          tone="error"
          title={loaded ? 'Showing the last jobs we loaded' : "Couldn't load jobs"}
          message={error}
          action={{ label: 'Try again', onPress: refresh }}
        />
      ) : null}
      {hiddenOwn > 0 ? (
        <Notice
          icon="eye-off-outline"
          message={`${hiddenOwn} job${hiddenOwn === 1 ? '' : 's'} you posted ${hiddenOwn === 1 ? 'is' : 'are'} hidden here. Switch to Customer to manage ${hiddenOwn === 1 ? 'it' : 'them'}.`}
        />
      ) : null}
    </View>
  );

  const empty = !loaded ? (
    loading ? (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.primary} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading jobs…
        </ThemedText>
      </View>
    ) : null
  ) : role === 'customer' ? (
    <EmptyState
      icon="cube-outline"
      title="No jobs posted yet"
      message="Tell us what you need picked up, delivered, bought or moved, and a local provider can do it."
      action={{ label: 'Post a job', onPress: () => router.navigate('/') }}
    />
  ) : (
    <EmptyState
      icon="briefcase-outline"
      title="No open jobs right now"
      message="New jobs appear here as soon as customers post them. Pull down to check again."
    />
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <SectionList
          sections={sections}
          keyExtractor={(job) => job.id}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              userId={userId}
              role={role}
              pending={pending[item.id]}
              onAction={onAction}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle} accessibilityRole="header">
                {section.title} · {section.data.length}
              </ThemedText>
              {section.hint ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {section.hint}
                </ThemedText>
              ) : null}
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading && loaded}
              onRefresh={refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          initialNumToRender={6}
          windowSize={7}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, width: '100%' },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: TabBarClearance,
  },
  header: { gap: 12, paddingBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  sectionHeader: { paddingTop: Spacing.four, paddingBottom: 12, gap: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  gap: { height: 12 },
  loading: { alignItems: 'center', gap: 8, paddingVertical: Spacing.five },
});
