import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor="#2563eb"
      indicatorColor="#2563eb"
      iconColor={{ default: colors.textSecondary, selected: '#2563eb' }}
      labelStyle={{ default: { color: colors.textSecondary }, selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{
            default: require('@/assets/images/tabIcons/home-default.png'),
            selected: require('@/assets/images/tabIcons/home-selected.png'),
          }}
          renderingMode="original"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Jobs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{
            default: require('@/assets/images/tabIcons/briefcase-2-default.png'),
            selected: require('@/assets/images/tabIcons/briefcase-2-selected.png'),
          }}
          renderingMode="original"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{
            default: require('@/assets/images/tabIcons/search-default.png'),
            selected: require('@/assets/images/tabIcons/search-selected.png'),
          }}
          renderingMode="original"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{
            default: require('@/assets/images/tabIcons/settings-default.png'),
            selected: require('@/assets/images/tabIcons/settings-selected.png'),
          }}
          renderingMode="original"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{
            default: require('@/assets/images/tabIcons/user-default.png'),
            selected: require('@/assets/images/tabIcons/user-selected.png'),
          }}
          renderingMode="original"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
