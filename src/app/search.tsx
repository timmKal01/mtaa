import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobCard } from '@/components/job-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip, EmptyState, Notice } from '@/components/ui';
import { Radius, Spacing, TabBarClearance } from '@/constants/theme';
import { useJobs } from '@/context/jobs';
import { useRole } from '@/context/role';
import { useJobActions } from '@/hooks/use-job-actions';
import { useTheme } from '@/hooks/use-theme';
import { JOB_TYPES, matchesQuery, type JobType } from '@/lib/jobs';

export default function SearchScreen() {
  const { jobs, userId, loading, loaded, error, pending, refresh } = useJobs();
  const { role } = useRole();
  const onAction = useJobActions();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<JobType | 'all'>('all');
  const [openOnly, setOpenOnly] = useState(true);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const results = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (type === 'all' || j.type === type) &&
          (!openOnly || j.status !== 'delivered') &&
          matchesQuery(j, query),
      ),
    [jobs, type, openOnly, query],
  );

  const filtering = query.trim() !== '' || type !== 'all';

  const header = (
    <View style={styles.header}>
      <ThemedText style={styles.title} accessibilityRole="header">
        Search
      </ThemedText>

      <View
        style={[
          styles.field,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search" size={18} color={theme.placeholder} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Try Westlands, CBD, parcel, gas…"
          placeholderTextColor={theme.placeholder}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search jobs by item, place or type"
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={12}
            onPress={() => setQuery('')}
          >
            <Ionicons name="close-circle" size={20} color={theme.placeholder} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.chips}>
        <Chip label="All" selected={type === 'all'} onPress={() => setType('all')} />
        {JOB_TYPES.map((t) => (
          <Chip
            key={t.type}
            label={t.short}
            icon={t.icon}
            selected={type === t.type}
            onPress={() => setType(type === t.type ? 'all' : t.type)}
          />
        ))}
        <Chip
          label="Hide completed"
          icon={openOnly ? 'checkbox-outline' : 'square-outline'}
          selected={openOnly}
          onPress={() => setOpenOnly((v) => !v)}
        />
      </View>

      {error ? (
        <Notice
          tone="error"
          title={loaded ? 'Showing the last jobs we loaded' : "Couldn't load jobs"}
          message={error}
          action={{ label: 'Try again', onPress: refresh }}
        />
      ) : null}

      {loaded ? (
        <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
          {results.length} job{results.length === 1 ? '' : 's'}
          {filtering ? ' match' : ''}
        </ThemedText>
      ) : null}
    </View>
  );

  const empty = !loaded ? (
    loading ? (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.primary} />
      </View>
    ) : null
  ) : (
    <EmptyState
      icon="search-outline"
      title={filtering ? 'Nothing matches that' : 'No jobs yet'}
      message={
        filtering
          ? 'Try a different place or item, or clear the filters.'
          : 'Jobs posted across Nairobi will show up here.'
      }
      action={
        filtering
          ? {
              label: 'Clear filters',
              onPress: () => {
                setQuery('');
                setType('all');
              },
            }
          : undefined
      }
    />
  );

  return (
    <ThemedView style={styles.wrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <FlatList
          data={results}
          keyExtractor={(j) => j.id}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              userId={userId}
              role={role}
              pending={pending[item.id]}
              onAction={onAction}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
  wrap: { flex: 1 },
  safe: { flex: 1, width: '100%' },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: TabBarClearance,
  },
  header: { gap: 12, paddingBottom: Spacing.three },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gap: { height: 12 },
  loading: { paddingVertical: Spacing.five, alignItems: 'center' },
});
