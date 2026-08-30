import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useGlobalSearchParams,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { ClerkProvider, useAuth, useClerk } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { RoleProvider } from '@/context/role';
import SignInScreen from './sign-in';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

function RootNav() {
  const colorScheme = useColorScheme();
  const { isLoaded, isSignedIn } = useAuth();
  const { setActive } = useClerk();
  const params = useGlobalSearchParams<{ created_session_id?: string }>();

  useEffect(() => {
    const sessionId = params.created_session_id;
    if (typeof sessionId === 'string' && sessionId.startsWith('sess_')) {
      setActive({ session: sessionId });
    }
  }, [params.created_session_id, setActive]);

  if (!isLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {isSignedIn ? <AppTabs /> : <SignInScreen />}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RoleProvider>
        <RootNav />
      </RoleProvider>
    </ClerkProvider>
  );
}