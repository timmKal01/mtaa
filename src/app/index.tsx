import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { AlertsPanel } from '@/components/home/alerts-panel';
import { PostForm } from '@/components/home/post-form';
import { ProfilePanel } from '@/components/home/profile-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, IconBadge, Notice, PressableRow, RoleSwitch } from '@/components/ui';
import { Radius, Spacing, TabBarClearance } from '@/constants/theme';
import { useJobs } from '@/context/jobs';
import { useRole } from '@/context/role';
import { useAvatar } from '@/hooks/use-avatar';
import { useJobActions } from '@/hooks/use-job-actions';
import { useTheme } from '@/hooks/use-theme';
import {
  formatKes,
  isCustomer,
  isPaid,
  isProvider,
  JOB_TYPES,
  jobEvents,
  statusLabel,
  type Job,
  type JobType,
} from '@/lib/jobs';

type Panel = 'none' | 'profile' | 'alerts';
const SEEN_KEY = 'mtaa_alerts_seen_at';

function PostedCard({ job, onView, onDismiss }: { job: Job; onView: () => void; onDismiss: () => void }) {
  const theme = useTheme();
  const { pending } = useJobs();
  const onAction = useJobActions();
  const paid = isPaid(job);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.cardTop}>
        <Ionicons name="checkmark-circle" size={22} color={theme.success} />
        <ThemedText style={styles.cardTitle}>Job posted</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={12}
          onPress={onDismiss}
        >
          <Ionicons name="close" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>
      <ThemedText numberOfLines={2}>{job.what}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {job.when} · {formatKes(job.budgetKes)}
      </ThemedText>
      {paid ? (
        <Notice
          tone="success"
          message={`Paid (test) · ${job.mpesaReceipt ?? ''}. Providers can now see it and accept.`}
        />
      ) : (
        <>
          <Notice
            tone="warning"
            title="One last step"
            message="Pay now so providers can accept your job. It stays hidden from them until it's paid."
          />
          <Button
            label={`Pay ${formatKes(job.budgetKes)} with M-Pesa (test)`}
            icon="phone-portrait-outline"
            loading={pending[job.id] === 'pay'}
            onPress={() => onAction(job, 'pay')}
          />
        </>
      )}
      <Button label="View in Jobs" variant="secondary" icon="briefcase-outline" onPress={onView} />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { role } = useRole();
  const { jobs, userId, loaded, loading, error, refresh } = useJobs();
  const avatar = useAvatar();
  const scrollRef = useRef<ScrollView>(null);

  const [panel, setPanel] = useState<Panel>('none');
  const [formType, setFormType] = useState<JobType | null>(null);
  const [justPostedId, setJustPostedId] = useState<string | null>(null);
  const [seenAt, setSeenAt] = useState<number | null>(null);
  const [seenBefore, setSeenBefore] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    SecureStore.getItemAsync(SEEN_KEY)
      .then((v) => setSeenAt(Number(v) || 0))
      .catch(() => setSeenAt(0));
  }, []);

  const events = useMemo(() => jobEvents(jobs, userId), [jobs, userId]);
  const unread =
    seenAt === null ? 0 : events.filter((e) => e.fromOthers && e.at > seenAt).length;

  const show = (next: Panel) => {
    setPanel(next);
    setFormType(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const openAlerts = () => {
    const now = Date.now();
    setSeenBefore(seenAt ?? 0);
    setSeenAt(now);
    SecureStore.setItemAsync(SEEN_KEY, String(now)).catch(() => {});
    show('alerts');
    refresh();
  };

  const onPosted = (job: Job) => {
    setFormType(null);
    setJustPostedId(job.id);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    AccessibilityInfo.announceForAccessibility('Job posted. Pay now so providers can accept it.');
  };

  const showChrome = panel === 'none' && formType === null;
  const justPosted = justPostedId ? jobs.find((j) => j.id === justPostedId) : undefined;
  const mine = jobs.filter((j) => isCustomer(j, userId));
  const activeMine = mine.filter((j) => j.status !== 'delivered' && j.id !== justPostedId);
  const unpaidMine = activeMine.filter((j) => !isPaid(j)).length;
  const ready = jobs.filter((j) => j.status === 'posted' && isPaid(j) && !isCustomer(j, userId));
  const working = jobs.filter(
    (j) => isProvider(j, userId) && (j.status === 'accepted' || j.status === 'picked_up'),
  );

  return (
    <ThemedView style={styles.wrap}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={loading && loaded}
                onRefresh={refresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
          >
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Your profile"
                onPress={() => show('profile')}
                hitSlop={6}
                style={styles.headerButton}
              >
                <Avatar uri={avatar.uri} initial={avatar.initial} size={36} />
              </Pressable>
              <View style={styles.brand}>
                <View style={[styles.logoMark, { backgroundColor: theme.primary }]}>
                  <Ionicons name="caret-up" size={14} color={theme.onPrimary} />
                </View>
                <ThemedText style={styles.brandText}>Mtaa</ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  unread > 0 ? `Notifications, ${unread} new` : 'Notifications'
                }
                onPress={openAlerts}
                hitSlop={6}
                style={[styles.headerButton, styles.bell, { backgroundColor: theme.iconButton }]}
              >
                <Ionicons name="notifications-outline" size={22} color={theme.text} />
                {unread > 0 ? (
                  <View
                    style={[styles.dot, { backgroundColor: theme.dangerButton, borderColor: theme.background }]}
                  />
                ) : null}
              </Pressable>
            </View>

            {showChrome ? (
              <>
                <Pressable
                  accessibilityRole="search"
                  accessibilityLabel="Search jobs"
                  onPress={() => router.navigate('/search')}
                  style={[styles.search, { backgroundColor: theme.backgroundElement }]}
                >
                  <Ionicons name="search" size={18} color={theme.placeholder} />
                  <ThemedText style={{ color: theme.placeholder }}>
                    Search for a service or errand
                  </ThemedText>
                </Pressable>

                <RoleSwitch />

                {error && !loaded ? (
                  <Notice
                    tone="error"
                    title="Can't load jobs"
                    message={error}
                    action={{ label: 'Try again', onPress: refresh }}
                  />
                ) : null}

                <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText style={styles.cardTitle}>Everyday errands, done locally.</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Get parcels delivered, shopping bought and errands run across Nairobi by
                    people nearby, and follow every step until it&apos;s done.
                  </ThemedText>
                </View>
              </>
            ) : null}

            {panel === 'profile' ? (
              <ProfilePanel avatar={avatar} onBack={() => show('none')} />
            ) : null}

            {panel === 'alerts' ? (
              <AlertsPanel
                events={events}
                seenBefore={seenBefore}
                error={error}
                loaded={loaded}
                onBack={() => show('none')}
                onOpenJob={() => router.navigate('/explore')}
                onRetry={refresh}
              />
            ) : null}

            {panel === 'none' && formType && role === 'customer' ? (
              <PostForm type={formType} onClose={() => setFormType(null)} onPosted={onPosted} />
            ) : null}

            {showChrome && role === 'customer' ? (
              <>
                {justPosted ? (
                  <PostedCard
                    job={justPosted}
                    onView={() => router.navigate('/explore')}
                    onDismiss={() => setJustPostedId(null)}
                  />
                ) : null}

                {activeMine.length > 0 ? (
                  <PressableRow
                    onPress={() => router.navigate('/explore')}
                    accessibilityLabel={`${activeMine.length} jobs in progress. Open Jobs`}
                    style={[styles.row, { backgroundColor: theme.backgroundElement }]}
                  >
                    <View style={styles.rowLeft}>
                      <IconBadge icon="time-outline" />
                      <View style={styles.flex}>
                        <ThemedText>
                          {activeMine.length} job{activeMine.length === 1 ? '' : 's'} in progress
                        </ThemedText>
                        <ThemedText type="small" themeColor={unpaidMine ? 'warning' : 'textSecondary'}>
                          {unpaidMine
                            ? `${unpaidMine} waiting for your payment`
                            : `Latest: ${statusLabel(activeMine[0].status)}`}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                  </PressableRow>
                ) : null}

                <ThemedText style={styles.sectionLabel} accessibilityRole="header">
                  What do you need done?
                </ThemedText>
                {JOB_TYPES.map((item) => (
                  <PressableRow
                    key={item.type}
                    accessibilityLabel={item.label}
                    onPress={() => {
                      setFormType(item.type);
                      setPanel('none');
                      scrollRef.current?.scrollTo({ y: 0, animated: false });
                    }}
                    style={[styles.row, { backgroundColor: theme.backgroundElement }]}
                  >
                    <View style={styles.rowLeft}>
                      <IconBadge icon={item.icon} />
                      <ThemedText>{item.label}</ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                  </PressableRow>
                ))}
              </>
            ) : null}

            {showChrome && role === 'provider' ? (
              <>
                <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText style={styles.cardTitle}>Ready to earn?</ThemedText>
                  <View style={styles.stats}>
                    <View style={styles.stat}>
                      <ThemedText style={styles.statValue}>{loaded ? ready.length : '–'}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        paid jobs ready to accept
                      </ThemedText>
                    </View>
                    <View style={styles.stat}>
                      <ThemedText style={styles.statValue}>{loaded ? working.length : '–'}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        jobs you are doing now
                      </ThemedText>
                    </View>
                  </View>
                  <Button
                    label="Browse jobs"
                    icon="briefcase-outline"
                    onPress={() => router.navigate('/explore')}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    Jobs open up for providers once the customer has paid. You can&apos;t take jobs you
                    posted yourself.
                  </ThemedText>
                </View>

                {working.map((j) => (
                  <PressableRow
                    key={j.id}
                    onPress={() => router.navigate('/explore')}
                    accessibilityLabel={`${j.what}. Next: ${j.status === 'accepted' ? 'pick up' : 'deliver'}`}
                    style={[styles.row, { backgroundColor: theme.backgroundElement }]}
                  >
                    <View style={styles.rowLeft}>
                      <IconBadge icon={j.status === 'accepted' ? 'cube-outline' : 'bicycle-outline'} />
                      <View style={styles.flex}>
                        <ThemedText numberOfLines={1}>{j.what}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                          {j.status === 'accepted'
                            ? `Next: pick up at ${j.pickup}`
                            : `Next: deliver to ${j.dropoff}`}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                  </PressableRow>
                ))}
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: TabBarClearance,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: { borderRadius: 22 },
  dot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 18, fontWeight: '700' },
  search: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: Spacing.three,
  },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  sectionLabel: { fontSize: 18, fontWeight: '700' },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
  },
  rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stats: { flexDirection: 'row', gap: Spacing.three },
  stat: { flex: 1, gap: 2 },
  statValue: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
});
