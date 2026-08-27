import { useClerk } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function HostedAuthCallback() {
  const { setActive } = useClerk();
  const { created_session_id } = useLocalSearchParams<{
    created_session_id?: string;
  }>();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (created_session_id) {
        await setActive({ session: created_session_id });
      }
      if (!cancelled) router.replace('/');
    })();

    return () => {
      cancelled = true;
    };
  }, [created_session_id]);

  return (
    <View
      style={{ flex: 1, backgroundColor: '#0b0b0b', justifyContent: 'center' }}
    >
      <ActivityIndicator color="#22c55e" />
    </View>
  );
}
