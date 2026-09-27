import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useRole } from '@/context/role';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const theme = useTheme();
  const bg = {
    primary: theme.primary,
    secondary: theme.primarySoft,
    danger: theme.dangerButton,
    ghost: 'transparent',
  }[variant];
  const fg = {
    primary: theme.onPrimary,
    secondary: theme.primaryText,
    danger: '#ffffff',
    ghost: theme.primaryText,
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        variant === 'ghost' && styles.ghost,
        disabled && !loading && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <ThemedText style={[styles.buttonText, { color: fg }]}>{label}</ThemedText>
        </>
      )}
    </Pressable>
  );
}

export function BackRow({ onPress, label = 'Back' }: { onPress: () => void; label?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={20} color={theme.primaryText} />
      <ThemedText style={{ color: theme.primaryText }}>{label}</ThemedText>
    </Pressable>
  );
}

const TONES = {
  info: { fg: 'primaryText', bg: 'primarySoft', icon: 'information-circle-outline' },
  success: { fg: 'success', bg: 'successSoft', icon: 'checkmark-circle-outline' },
  warning: { fg: 'warning', bg: 'warningSoft', icon: 'time-outline' },
  error: { fg: 'danger', bg: 'dangerSoft', icon: 'alert-circle-outline' },
} as const;

export function Notice({
  tone = 'info',
  icon,
  title,
  message,
  action,
  style,
}: {
  tone?: keyof typeof TONES;
  icon?: IconName;
  title?: string;
  message: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const t = TONES[tone];
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={[styles.notice, { backgroundColor: theme[t.bg] }, style]}
    >
      <Ionicons name={icon ?? t.icon} size={20} color={theme[t.fg]} style={styles.noticeIcon} />
      <View style={styles.noticeBody}>
        {title ? <ThemedText type="smallBold">{title}</ThemedText> : null}
        <ThemedText type="small" themeColor={title ? 'textSecondary' : 'text'}>
          {message}
        </ThemedText>
        {action ? (
          <Pressable
            accessibilityRole="button"
            onPress={action.onPress}
            hitSlop={10}
            style={({ pressed }) => [styles.noticeAction, pressed && styles.pressed]}
          >
            <ThemedText type="smallBold" style={{ color: theme[t.fg] }}>
              {action.label}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  disabled,
  icon,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const fg = selected ? theme.onPrimary : disabled ? theme.placeholder : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
        },
        disabled && styles.chipDisabled,
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <ThemedText
        type="small"
        style={[{ color: fg }, disabled && styles.strike]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function RoleSwitch({ onChange, compact }: { onChange?: () => void; compact?: boolean }) {
  const { role, setRole } = useRole();
  const theme = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      style={[styles.toggle, { backgroundColor: theme.backgroundElement }]}
    >
      {(['customer', 'provider'] as const).map((r) => {
        const on = role === r;
        return (
          <Pressable
            key={r}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={r === 'customer' ? 'Customer mode' : 'Provider mode'}
            onPress={() => {
              setRole(r);
              onChange?.();
            }}
            style={[
              styles.pill,
              compact && styles.pillCompact,
              on && { backgroundColor: theme.primary },
            ]}
          >
            <ThemedText
              type={compact ? 'small' : 'default'}
              style={
                on
                  ? { color: theme.onPrimary, fontWeight: '700' }
                  : { color: theme.textSecondary, fontWeight: '500' }
              }
            >
              {r === 'customer' ? 'Customer' : 'Provider'}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}) {
  const theme = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={24} color={theme.primaryText} />
      </View>
      <ThemedText type="smallBold" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {message}
      </ThemedText>
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="secondary" style={styles.emptyButton} />
      ) : null}
    </View>
  );
}

export function IconBadge({ icon, size = 36 }: { icon: IconName; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.iconBadge,
        { width: size, height: size, backgroundColor: theme.primarySoft },
      ]}
    >
      <Ionicons name={icon} size={size / 2} color={theme.primaryText} />
    </View>
  );
}

export function Label({ children, required }: { children: string; required?: boolean }) {
  const theme = useTheme();
  return (
    <ThemedText type="smallBold">
      {children}
      {required ? <ThemedText type="smallBold" style={{ color: theme.danger }}> *</ThemedText> : null}
    </ThemedText>
  );
}

export function FieldError({ message }: { message?: string }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <View style={styles.fieldError} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={14} color={theme.danger} />
      <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
        {message}
      </ThemedText>
    </View>
  );
}

export function PressableRow({ style, ...props }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  ghost: { minHeight: 44 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  back: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingRight: Spacing.three,
  },
  notice: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: 12,
    borderRadius: Radius.md,
  },
  noticeIcon: { marginTop: 1 },
  noticeBody: { flex: 1, gap: 2 },
  noticeAction: { alignSelf: 'flex-start', paddingVertical: 6 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipDisabled: { opacity: 0.5 },
  strike: { textDecorationLine: 'line-through' },
  toggle: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
  },
  pill: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  pillCompact: { minHeight: 38 },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.lg,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyButton: { alignSelf: 'stretch', marginTop: Spacing.two },
  center: { textAlign: 'center' },
  iconBadge: {
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
