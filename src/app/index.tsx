import { useAuth, useClerk, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRole } from '@/context/role';
import { Spacing } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.123.172.238:3000';

type JobType = 'deliver' | 'pickup' | 'buy' | 'errand' | 'move';
type Panel = 'none' | 'profile' | 'alerts';

type Job = {
  id: string;
  what: string;
  status: string;
  paymentStatus?: string;
  customerClerkId?: string;
};

const titles: Record<JobType, string> = {
  deliver: 'Deliver something',
  pickup: 'Pick something up',
  buy: 'Buy something',
  errand: 'Run an errand',
  move: 'Move something',
};

const ACTIONS: {
  type: JobType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: 'deliver', label: 'Deliver something', icon: 'cube-outline' },
  { type: 'pickup', label: 'Pick something up', icon: 'bag-handle-outline' },
  { type: 'buy', label: 'Buy something', icon: 'cart-outline' },
  { type: 'errand', label: 'Run an errand', icon: 'walk-outline' },
  { type: 'move', label: 'Move something', icon: 'car-outline' },
];

const TIME_SLOTS = [
  '07:00–09:30',
  '09:30–12:00',
  '12:00–14:00',
  '14:00–16:30',
  '16:30–19:00',
  '19:00–21:00',
];

const DATES = ['Today', 'Tomorrow'] as const;
type JobDate = (typeof DATES)[number];

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { role, setRole } = useRole();
  const router = useRouter();
  const email = user?.primaryEmailAddress?.emailAddress ?? 'Signed in';

  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<Panel>('none');
  const [alerts, setAlerts] = useState<Job[]>([]);
  const [open, setOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [jobType, setJobType] = useState<JobType>('deliver');
  const [jobDate, setJobDate] = useState<JobDate>('Today');
  const [what, setWhat] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [when, setWhen] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const start = (type: JobType) => {
    setJobType(type);
    setOpen(true);
    setPanel('none');
    setStatus('');
    setWhen('');
    setJobDate('Today');
    setSlotOpen(false);
  };

  const openAlerts = async () => {
    setPanel('alerts');
    setOpen(false);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/jobs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAlerts(
          list.filter(
              (j: Job) =>
                  j.customerClerkId === user?.id ||
                  j.status === 'accepted' ||
                  j.status === 'picked_up' ||
                  j.status === 'delivered' ||
                  j.paymentStatus === 'paid',
          ),
      );
    } catch {
      setAlerts([]);
    }
  };

  const postJob = async () => {
    setStatus('');
    if (!what.trim() || !pickup.trim() || !dropoff.trim() || !when) {
      setStatus('What, pickup, dropoff and time slot are required');
      return;
    }
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: jobType,
          what: what.trim(),
          pickup: pickup.trim(),
          dropoff: dropoff.trim(),
          when: `${jobDate} · ${when}`,
          budgetKes: Number(budget) || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message ?? 'Could not post job');
        return;
      }
      setStatus(`Posted. Job ${data.id}`);
      setWhat('');
      setPickup('');
      setDropoff('');
      setWhen('');
      setSlotOpen(false);
    } catch (e: any) {
      setStatus(e?.message ?? 'Network error. Is mtaa-api running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.wrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <ThemedView style={styles.header}>
            <Pressable
              onPress={() => {
                setOpen(false);
                setPanel('profile');
              }}
              style={styles.avatar}
            >
              <Ionicons name="person" size={18} color="#fff" />
            </Pressable>
            <ThemedView style={styles.brand}>
              <ThemedView style={styles.logoMark}>
                <Ionicons name="caret-up" size={14} color="#fff" />
              </ThemedView>
              <ThemedText style={styles.brandText}>Mtaa</ThemedText>
            </ThemedView>
            <Pressable style={styles.bell} onPress={openAlerts}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </Pressable>
          </ThemedView>

          {panel === 'none' && !open ? (
            <>
              <ThemedView style={styles.search}>
                <Ionicons name="search" size={18} color="#888" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for a service or errand"
                  placeholderTextColor="#888"
                  value={query}
                  onChangeText={setQuery}
                />
              </ThemedView>

              <ThemedView style={styles.toggle}>
                <Pressable
                  onPress={() => {
                    setRole('customer');
                    setOpen(false);
                    setPanel('none');
                  }}
                  style={[styles.pill, role === 'customer' && styles.pillOn]}
                >
                  <ThemedText
                    style={role === 'customer' ? styles.pillTextOn : styles.pillTextOff}
                  >
                    Customer
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setRole('provider');
                    setOpen(false);
                    setPanel('none');
                  }}
                  style={[styles.pill, role === 'provider' && styles.pillOn]}
                >
                  <ThemedText
                    style={role === 'provider' ? styles.pillTextOn : styles.pillTextOff}
                  >
                    Provider
                  </ThemedText>
                </Pressable>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.intro}>
                <ThemedText style={styles.cardHeading}>
                  Everyday errands, done locally.
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardSubtext}>
                  Connect with reliable helpers right in your neighborhood to
                  save time. Fast, secure, and nearby.
                </ThemedText>
              </ThemedView>
            </>
          ) : null}

          {panel === 'profile' ? (
            <ThemedView type="backgroundElement" style={styles.form}>
              <Pressable onPress={() => setPanel('none')}>
                <ThemedText type="small">Back</ThemedText>
              </Pressable>
              <ThemedText type="subtitle">Profile</ThemedText>
              <ThemedText>{email}</ThemedText>
              <ThemedText type="small">
                Change photo is the next step.
              </ThemedText>
              <Pressable style={styles.signOut} onPress={() => signOut()}>
                <ThemedText>Sign out</ThemedText>
              </Pressable>
            </ThemedView>
          ) : null}

          {panel === 'alerts' ? (
            <ThemedView type="backgroundElement" style={styles.form}>
              <Pressable onPress={() => setPanel('none')}>
                <ThemedText type="small">Back</ThemedText>
              </Pressable>
              <ThemedText type="subtitle">Notifications</ThemedText>
              {alerts.length === 0 ? (
                <ThemedText type="small">No updates yet.</ThemedText>
              ) : (
                alerts.map((job) => (
                  <ThemedText key={job.id} type="small">
                    {job.what} · {job.status}
                    {job.paymentStatus === 'paid' ? ' · paid' : ''}
                  </ThemedText>
                ))
              )}
            </ThemedView>
          ) : null}

          {panel === 'none' && open && role === 'customer' ? (
            <ThemedView type="backgroundElement" style={styles.form}>
              <Pressable onPress={() => setOpen(false)}>
                <ThemedText type="small">Back</ThemedText>
              </Pressable>
              <ThemedText type="subtitle">{titles[jobType]}</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="What?"
                placeholderTextColor="#888"
                value={what}
                onChangeText={setWhat}
              />
              <TextInput
                style={styles.input}
                placeholder="Pickup"
                placeholderTextColor="#888"
                value={pickup}
                onChangeText={setPickup}
              />
              <TextInput
                style={styles.input}
                placeholder="Dropoff"
                placeholderTextColor="#888"
                value={dropoff}
                onChangeText={setDropoff}
              />
              <ThemedText type="small">Day</ThemedText>
              <ThemedView style={styles.dates}>
                {DATES.map((d) => (
                  <Pressable key={d} onPress={() => setJobDate(d)}>
                    <ThemedText>{jobDate === d ? `• ${d}` : d}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
              <ThemedText type="small">Time slot</ThemedText>
              <Pressable
                style={styles.input}
                onPress={() => setSlotOpen((v) => !v)}
              >
                <ThemedText>{when || 'Choose time slot'}</ThemedText>
              </Pressable>
              {slotOpen
                ? TIME_SLOTS.map((slot) => (
                    <Pressable
                      key={slot}
                      onPress={() => {
                        setWhen(slot);
                        setSlotOpen(false);
                      }}
                      style={styles.slot}
                    >
                      <ThemedText>{slot}</ThemedText>
                    </Pressable>
                  ))
                : null}
              <TextInput
                style={styles.input}
                placeholder="Budget KES"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                value={budget}
                onChangeText={setBudget}
              />
              <Pressable style={styles.btn} onPress={postJob} disabled={busy}>
                <ThemedText>{busy ? 'Posting…' : 'Post job'}</ThemedText>
              </Pressable>
              {status ? <ThemedText>{status}</ThemedText> : null}
            </ThemedView>
          ) : null}

          {panel === 'none' && !open && role === 'customer' ? (
            <>
              <ThemedText style={styles.sectionLabel}>What do you need done?</ThemedText>
              {ACTIONS.map((item) => (
                <Pressable
                  key={item.type}
                  style={styles.row}
                  onPress={() => start(item.type)}
                >
                  <ThemedView style={styles.rowLeft}>
                    <ThemedView style={styles.iconWrap}>
                      <Ionicons name={item.icon} size={18} color="#3b82f6" />
                    </ThemedView>
                    <ThemedText>{item.label}</ThemedText>
                  </ThemedView>
                  <Ionicons name="chevron-forward" size={18} color="#888" />
                </Pressable>
              ))}
            </>
          ) : null}

          {panel === 'none' && role === 'provider' ? (
            <Pressable
              style={styles.btn}
              onPress={() => router.push('/explore')}
            >
              <ThemedText>Open Jobs</ThemedText>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 200,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 18, fontWeight: '700' },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 4,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  pillOn: { backgroundColor: '#2563eb' },
  pillTextOn: { color: '#fff', fontWeight: '700' },
  pillTextOff: { color: '#888', fontWeight: '500' },
  intro: { borderRadius: 16, padding: 16, gap: 8 },
  cardHeading: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  cardSubtext: { lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { fontSize: 18, fontWeight: '700' },
  form: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  dates: { flexDirection: 'row', gap: 16 },
  slot: { paddingVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  btn: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  signOut: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
});