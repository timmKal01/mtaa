import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function Avatar({
  uri,
  initial,
  size = 36,
}: {
  uri: string | null;
  initial?: string;
  size?: number;
}) {
  const theme = useTheme();
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[box, { backgroundColor: theme.iconButton }]}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.fallback, box, { backgroundColor: theme.primary }]}>
      {initial ? (
        <ThemedText style={{ color: theme.onPrimary, fontWeight: '700', fontSize: size * 0.42 }}>
          {initial}
        </ThemedText>
      ) : (
        <Ionicons name="person" size={size * 0.5} color={theme.onPrimary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
