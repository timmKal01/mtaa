import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  return (
    <ThemedView style={styles.wrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ThemedText type="title">Search</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Search jobs and services"
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
        />
        <ThemedText type="small">
          {query.trim()
            ? `No results yet for “${query.trim()}”`
            : 'Search will filter jobs in a later slice.'}
        </ThemedText>
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
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
});
