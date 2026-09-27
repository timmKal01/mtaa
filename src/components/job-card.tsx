import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, IconBadge, Notice } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import type { Role } from '@/context/role';
import { useTheme } from '@/hooks/use-theme';
import {
  displayName,
  formatKes,
  isCustomer,
  isPaid,
  isProvider,
  mapsUrl,
  prettyPhone,
  relativeTime,
  STATUS_STEPS,
  statusIndex,
  statusLabel,
  typeMeta,
  type Job,
  type JobAction,
} from '@/lib/jobs';

type Props = {
  job: Job;
  userId: string | undefined;
  role: Role;
  pending?: JobAction;
  onAction: (job: Job, action: JobAction) => void;
};

function Place({ kind, address }: { kind: 'pickup' | 'dropoff'; address: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${kind === 'pickup' ? 'Pickup' : 'Dropoff'}: ${address}. Open in Maps`}
      onPress={() => Linking.openURL(mapsUrl(address))}
      style={({ pressed }) => [styles.place, pressed && styles.pressed]}
    >
      <Ionicons
        name={kind === 'pickup' ? 'radio-button-on-outline' : 'location-outline'}
        size={18}
        color={kind === 'pickup' ? theme.primaryText : theme.success}
      />
      <View style={styles.placeText}>
        <ThemedText type="small" themeColor="textSecondary">
          {kind === 'pickup' ? 'Pickup' : 'Dropoff'}
        </ThemedText>
        <ThemedText>{address}</ThemedText>
      </View>
      <Ionicons name="map-outline" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

function Progress({ status }: { status: string }) {
  const theme = useTheme();
  const current = statusIndex(status);
  return (
    <View
      accessible
      accessibilityLabel={`Status: ${statusLabel(status)}, step ${current + 1} of ${STATUS_STEPS.length}`}
      style={styles.progress}
    >
      {STATUS_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <View key={step.status} style={styles.step}>
            <View
              style={[
                styles.stepBar,
                { backgroundColor: done ? theme.primary : theme.border },
              ]}
            />
            <ThemedText
              style={[
                styles.stepLabel,
                { color: i === current ? theme.text : theme.textSecondary },
                i === current && styles.stepCurrent,
              ]}
            >
              {step.label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function PaymentBadge({ job }: { job: Job }) {
  const theme = useTheme();
  const paid = isPaid(job);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: paid ? theme.successSoft : theme.warningSoft },
      ]}
    >
      <Ionicons
        name={paid ? 'checkmark-circle' : 'time-outline'}
        size={16}
        color={paid ? theme.success : theme.warning}
      />
      <ThemedText type="small" style={{ color: paid ? theme.success : theme.warning }}>
        {paid ? `Paid (test) · ${job.mpesaReceipt ?? ''}` : 'Not paid yet'}
      </ThemedText>
    </View>
  );
}

function Actions({ job, userId, role, pending, onAction }: Props) {
  const mine = isCustomer(job, userId);
  const assignedToMe = isProvider(job, userId);
  const paid = isPaid(job);
  const busy = (a: JobAction) => pending === a;

  if (job.status === 'delivered') {
    const when = relativeTime(job.deliveredAt);
    return (
      <Notice
        tone="success"
        icon="checkmark-done-outline"
        message={
          assignedToMe
            ? `Done. You delivered this${when ? ` ${when}` : ''}.`
            : 'Delivered. This job is complete.'
        }
      />
    );
  }

  if (mine) {
    if (role === 'provider') {
      return (
        <Notice
          icon="person-outline"
          message="This is your job. Switch to Customer to pay for it or track it."
        />
      );
    }
    if (!paid) {
      return (
        <View style={styles.actions}>
          <Button
            label={`Pay ${formatKes(job.budgetKes)} with M-Pesa (test)`}
            icon="phone-portrait-outline"
            loading={busy('pay')}
            onPress={() => onAction(job, 'pay')}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Providers can only accept once you have paid.
          </ThemedText>
        </View>
      );
    }
    if (job.status === 'posted') {
      return <Notice tone="info" icon="hourglass-outline" message="Paid. Waiting for a provider to accept." />;
    }
    return (
      <Notice
        tone="info"
        icon="bicycle-outline"
        message={
          job.status === 'accepted'
            ? `${displayName(job.providerEmail)} is on the way to pick it up.`
            : `${displayName(job.providerEmail)} has it and is heading to the dropoff.`
        }
      />
    );
  }

  if (assignedToMe) {
    return (
      <View style={styles.actions}>
        {job.customerPhone ? (
          <Button
            label={`Call customer · ${prettyPhone(job.customerPhone)}`}
            icon="call-outline"
            variant="secondary"
            onPress={() => Linking.openURL(`tel:+${job.customerPhone}`)}
          />
        ) : null}
        {job.status === 'accepted' ? (
          <Button
            label="Mark picked up"
            icon="cube-outline"
            loading={busy('pickup')}
            onPress={() => onAction(job, 'pickup')}
          />
        ) : (
          <Button
            label="Mark delivered"
            icon="checkmark-circle-outline"
            loading={busy('deliver')}
            onPress={() => onAction(job, 'deliver')}
          />
        )}
      </View>
    );
  }

  if (job.status !== 'posted') {
    return <Notice icon="lock-closed-outline" message="Another provider is doing this job." />;
  }

  if (role === 'customer') {
    return (
      <Notice
        icon="swap-horizontal-outline"
        message="Want to do this job? Switch to Provider mode to accept it."
      />
    );
  }

  if (!paid) {
    return (
      <Notice
        tone="warning"
        icon="time-outline"
        message="Waiting for the customer to pay. You can accept once it's paid."
      />
    );
  }

  return (
    <Button
      label={`Accept · earn ${formatKes(job.budgetKes)}`}
      icon="checkmark-outline"
      loading={busy('accept')}
      onPress={() => onAction(job, 'accept')}
    />
  );
}

function JobCardInner(props: Props) {
  const { job, userId } = props;
  const theme = useTheme();
  const meta = typeMeta(job.type);
  const mine = isCustomer(job, userId);
  const assignedToMe = isProvider(job, userId);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.top}>
        <IconBadge icon={meta.icon} />
        <View style={styles.topText}>
          <ThemedText type="smallBold">{meta.short}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Posted {relativeTime(job.createdAt)}
          </ThemedText>
        </View>
        <ThemedText style={styles.price}>{formatKes(job.budgetKes)}</ThemedText>
      </View>

      <ThemedText style={styles.what} numberOfLines={3}>
        {job.what}
      </ThemedText>

      {mine || assignedToMe ? (
        <View style={[styles.tag, { backgroundColor: theme.primarySoft }]}>
          <ThemedText type="small" style={{ color: theme.primaryText }}>
            {mine ? 'Your job' : 'You are doing this job'}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.route}>
        <Place kind="pickup" address={job.pickup} />
        <View style={[styles.routeLine, { backgroundColor: theme.border }]} />
        <Place kind="dropoff" address={job.dropoff} />
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
        <ThemedText type="small">{job.when}</ThemedText>
      </View>

      <Progress status={job.status} />
      <PaymentBadge job={job} />

      <View style={styles.people}>
        <ThemedText type="small" themeColor="textSecondary">
          Posted by {mine ? 'you' : displayName(job.customerEmail)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {job.providerClerkId
            ? `Provider: ${assignedToMe ? 'you' : displayName(job.providerEmail)}`
            : 'No provider yet'}
        </ThemedText>
      </View>

      <Actions {...props} />
    </View>
  );
}

export const JobCard = memo(JobCardInner);

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: 12,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topText: { flex: 1 },
  price: { fontSize: 17, fontWeight: '700' },
  what: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  route: { gap: 0 },
  routeLine: { width: 2, height: 10, marginLeft: 8 },
  place: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeText: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progress: { flexDirection: 'row', gap: 4 },
  step: { flex: 1, gap: 4 },
  stepBar: { height: 4, borderRadius: 2 },
  stepLabel: { fontSize: 12, lineHeight: 16 },
  stepCurrent: { fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  people: { gap: 2 },
  actions: { gap: Spacing.two },
  pressed: { opacity: 0.7 },
});
