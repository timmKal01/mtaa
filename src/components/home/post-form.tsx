import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BackRow, Button, Chip, FieldError, Label, Notice } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useJobs } from '@/context/jobs';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/lib/api';
import {
  dayDate,
  formatDay,
  normalizeKenyanPhone,
  slotHasPassed,
  TIME_SLOTS,
  typeMeta,
  whenString,
  type DayChoice,
  type Job,
  type JobType,
} from '@/lib/jobs';

const PHONE_KEY = 'mtaa_last_phone';
type Field = 'what' | 'pickup' | 'dropoff' | 'slot' | 'budget' | 'phone';

function Input({ invalid, ...props }: TextInputProps & { invalid?: boolean }) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.placeholder}
      {...props}
      style={[
        styles.input,
        {
          color: theme.text,
          backgroundColor: theme.background,
          borderColor: invalid ? theme.danger : theme.border,
        },
        props.style,
      ]}
    />
  );
}

export function PostForm({
  type,
  onClose,
  onPosted,
}: {
  type: JobType;
  onClose: () => void;
  onPosted: (job: Job) => void;
}) {
  const { create } = useJobs();
  const theme = useTheme();
  const meta = typeMeta(type);
  const todayFull = TIME_SLOTS.every((s) => slotHasPassed(s, 'Today'));

  const [what, setWhat] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [day, setDay] = useState<DayChoice>(todayFull ? 'Tomorrow' : 'Today');
  const [slot, setSlot] = useState('');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  // Don't make people retype their M-Pesa number every time.
  useEffect(() => {
    SecureStore.getItemAsync(PHONE_KEY)
      .then((v) => v && setPhone(v))
      .catch(() => {});
  }, []);

  const clear = (f: Field) => setErrors((e) => (e[f] ? { ...e, [f]: undefined } : e));

  const pickDay = (d: DayChoice) => {
    setDay(d);
    if (slot && slotHasPassed(slot, d)) setSlot('');
    clear('slot');
  };

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (what.trim().length < 2) next.what = 'Say what needs doing.';
    if (pickup.trim().length < 2) next.pickup = `Add where to ${meta.from.toLowerCase()}.`;
    if (dropoff.trim().length < 2) next.dropoff = `Add where to ${meta.to.toLowerCase()}.`;
    if (!slot) next.slot = 'Choose a time slot.';
    else if (slotHasPassed(slot, day)) next.slot = 'That slot has already passed. Pick another.';
    const kes = Number(budget);
    if (!budget.trim()) next.budget = 'Add your budget in KES.';
    else if (!Number.isInteger(kes) || kes < 50) next.budget = 'Budget must be at least KES 50.';
    else if (kes > 100000) next.budget = 'Budget cannot be more than KES 100,000.';
    if (normalizeKenyanPhone(phone) === null)
      next.phone = 'Use a Kenyan mobile number like 0712 345 678, or leave it empty.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setSubmitError('');
    if (!validate()) return;
    const normalizedPhone = normalizeKenyanPhone(phone) || undefined;
    setBusy(true);
    try {
      const job = await create({
        type,
        what: what.trim(),
        pickup: pickup.trim(),
        dropoff: dropoff.trim(),
        when: whenString(day, slot),
        budgetKes: Number(budget),
        customerPhone: normalizedPhone,
      });
      if (normalizedPhone) SecureStore.setItemAsync(PHONE_KEY, phone.trim()).catch(() => {});
      onPosted(job);
    } catch (e) {
      setSubmitError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.form, { backgroundColor: theme.backgroundElement }]}>
      <BackRow onPress={onClose} label="Cancel" />
      <ThemedText style={styles.title} accessibilityRole="header">
        {meta.label}
      </ThemedText>

      <View style={styles.field}>
        <Label required>What needs doing?</Label>
        <Input
          value={what}
          onChangeText={(v) => {
            setWhat(v);
            clear('what');
          }}
          placeholder={meta.whatHint}
          multiline
          maxLength={300}
          invalid={!!errors.what}
          style={styles.multiline}
          accessibilityLabel="What needs doing"
        />
        <FieldError message={errors.what} />
      </View>

      <View style={styles.field}>
        <Label required>{meta.from}</Label>
        <Input
          value={pickup}
          onChangeText={(v) => {
            setPickup(v);
            clear('pickup');
          }}
          placeholder={meta.fromHint}
          maxLength={200}
          invalid={!!errors.pickup}
          accessibilityLabel={meta.from}
        />
        <FieldError message={errors.pickup} />
      </View>

      <View style={styles.field}>
        <Label required>{meta.to}</Label>
        <Input
          value={dropoff}
          onChangeText={(v) => {
            setDropoff(v);
            clear('dropoff');
          }}
          placeholder={meta.toHint}
          maxLength={200}
          invalid={!!errors.dropoff}
          accessibilityLabel={meta.to}
        />
        <FieldError message={errors.dropoff} />
      </View>

      <View style={styles.field}>
        <Label required>Day</Label>
        <View style={styles.row}>
          {(['Today', 'Tomorrow'] as const).map((d) => (
            <Chip
              key={d}
              label={`${d} · ${formatDay(dayDate(d))}`}
              selected={day === d}
              disabled={d === 'Today' && todayFull}
              onPress={() => pickDay(d)}
            />
          ))}
        </View>
        {todayFull ? (
          <ThemedText type="small" themeColor="textSecondary">
            All of today&apos;s slots have passed, so this will be for tomorrow.
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.field}>
        <Label required>Time slot</Label>
        <View style={styles.row}>
          {TIME_SLOTS.map((s) => {
            const passed = slotHasPassed(s, day);
            return (
              <Chip
                key={s}
                label={s}
                selected={slot === s}
                disabled={passed}
                accessibilityLabel={passed ? `${s}, already passed` : s}
                onPress={() => {
                  setSlot(s);
                  clear('slot');
                }}
              />
            );
          })}
        </View>
        <FieldError message={errors.slot} />
      </View>

      <View style={styles.field}>
        <Label required>Budget (KES)</Label>
        <View
          style={[
            styles.money,
            {
              backgroundColor: theme.background,
              borderColor: errors.budget ? theme.danger : theme.border,
            },
          ]}
        >
          <ThemedText themeColor="textSecondary">KES</ThemedText>
          <TextInput
            value={budget}
            onChangeText={(v) => {
              setBudget(v.replace(/[^0-9]/g, ''));
              clear('budget');
            }}
            placeholder="500"
            placeholderTextColor={theme.placeholder}
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.moneyInput, { color: theme.text }]}
            accessibilityLabel="Budget in Kenya shillings"
          />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          What you will pay the provider. You pay after posting (test M-Pesa for now).
        </ThemedText>
        <FieldError message={errors.budget} />
      </View>

      <View style={styles.field}>
        <Label>M-Pesa number (optional)</Label>
        <Input
          value={phone}
          onChangeText={(v) => {
            setPhone(v);
            clear('phone');
          }}
          placeholder="0712 345 678"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={16}
          invalid={!!errors.phone}
          accessibilityLabel="M-Pesa phone number, optional"
        />
        <ThemedText type="small" themeColor="textSecondary">
          Only the provider who takes your job can see it, so they can call you.
        </ThemedText>
        <FieldError message={errors.phone} />
      </View>

      {submitError ? <Notice tone="error" title="Job not posted" message={submitError} /> : null}

      <Button label="Post job" icon="send-outline" loading={busy} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  field: { gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  money: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  moneyInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
});
