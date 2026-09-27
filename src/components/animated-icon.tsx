import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

// Branded hand-off from the native splash: the Mtaa mark, then a quick fade into the app.
export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity }]}
      onLayout={() => {
        SplashScreen.hideAsync()
          .catch(() => {})
          .finally(() => {
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              delay: 250,
              useNativeDriver: true,
            }).start(() => setVisible(false));
          });
      }}
    >
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Ionicons name="caret-up" size={28} color="#ffffff" />
        </View>
        <Text style={styles.name}>Mtaa</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: '#ffffff', fontSize: 32, fontWeight: '700' },
});
