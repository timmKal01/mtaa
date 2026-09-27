import type { Ionicons } from '@expo/vector-icons';

export type JobType = 'deliver' | 'pickup' | 'buy' | 'errand' | 'move';
export type JobStatus = 'posted' | 'accepted' | 'picked_up' | 'delivered';
export type JobAction = 'accept' | 'pickup' | 'deliver' | 'pay';
type IconName = keyof typeof Ionicons.glyphMap;

export type Job = {
  id: string;
  type: JobType | string;
  what: string;
  pickup: string;
  dropoff: string;
  when: string;
  budgetKes: number | null;
  customerClerkId: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  providerClerkId: string | null;
  providerEmail: string | null;
  status: JobStatus;
  paymentStatus: string;
  mpesaReceipt: string | null;
  createdAt: string;
  paidAt: string | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
};

export type NewJob = {
  type: JobType;
  what: string;
  pickup: string;
  dropoff: string;
  when: string;
  budgetKes: number;
  customerPhone?: string;
};

export const JOB_TYPES: {
  type: JobType;
  label: string;
  short: string;
  icon: IconName;
  whatHint: string;
  from: string;
  to: string;
  fromHint: string;
  toHint: string;
}[] = [
  {
    type: 'deliver',
    label: 'Deliver something',
    short: 'Delivery',
    icon: 'cube-outline',
    whatHint: 'e.g. Parcel of documents to my office',
    from: 'Pick up from',
    to: 'Deliver to',
    fromHint: 'e.g. Sarit Centre, Westlands',
    toHint: 'e.g. Upper Hill, near Kenyatta Hospital',
  },
  {
    type: 'pickup',
    label: 'Pick something up',
    short: 'Pickup',
    icon: 'bag-handle-outline',
    whatHint: 'e.g. Collect my laptop from the repair shop',
    from: 'Collect from',
    to: 'Bring to',
    fromHint: 'e.g. Luthuli Avenue, CBD',
    toHint: 'e.g. Kilimani, off Argwings Kodhek',
  },
  {
    type: 'buy',
    label: 'Buy something',
    short: 'Shopping',
    icon: 'cart-outline',
    whatHint: 'e.g. 2kg sukuma, tomatoes and a loaf of bread',
    from: 'Buy from',
    to: 'Deliver to',
    fromHint: 'e.g. Wakulima Market or any Naivas',
    toHint: 'e.g. South B, Mariakani estate',
  },
  {
    type: 'errand',
    label: 'Run an errand',
    short: 'Errand',
    icon: 'walk-outline',
    whatHint: 'e.g. Queue at Huduma Centre and collect my ID',
    from: 'Start at',
    to: 'Finish at',
    fromHint: 'e.g. Huduma Centre, GPO',
    toHint: 'e.g. Ngong Road, Prestige Plaza',
  },
  {
    type: 'move',
    label: 'Move something',
    short: 'Moving',
    icon: 'car-outline',
    whatHint: 'e.g. Move a small fridge and 3 boxes',
    from: 'Move from',
    to: 'Move to',
    fromHint: 'e.g. Roysambu, near TRM',
    toHint: 'e.g. Kasarani, Mwiki',
  },
];

export function typeMeta(type: string) {
  return JOB_TYPES.find((t) => t.type === type) ?? JOB_TYPES[0];
}

export const STATUS_STEPS: { status: JobStatus; label: string }[] = [
  { status: 'posted', label: 'Posted' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'picked_up', label: 'Picked up' },
  { status: 'delivered', label: 'Delivered' },
];

export function statusIndex(status: string) {
  return Math.max(0, STATUS_STEPS.findIndex((s) => s.status === status));
}

export function statusLabel(status: string) {
  return STATUS_STEPS[statusIndex(status)].label;
}

export const isPaid = (job: Job) => job.paymentStatus === 'paid';

// user.id can be undefined while Clerk loads: never let undefined === null/undefined count as "mine".
export function isCustomer(job: Job, userId: string | undefined) {
  return Boolean(userId) && job.customerClerkId === userId;
}

export function isProvider(job: Job, userId: string | undefined) {
  return Boolean(userId) && job.providerClerkId === userId;
}

export function formatKes(amount: number | null | undefined) {
  if (amount == null) return 'No budget';
  return `KES ${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function displayName(email: string | null | undefined) {
  if (!email) return 'Someone';
  return email;
}

// ---------- Dates and time slots (device local time, i.e. EAT for Nairobi phones) ----------

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDay(d: Date) {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const TIME_SLOTS = [
  '07:00–09:30',
  '09:30–12:00',
  '12:00–14:00',
  '14:00–16:30',
  '16:30–19:00',
  '19:00–21:00',
];

export type DayChoice = 'Today' | 'Tomorrow';

export function dayDate(choice: DayChoice, now = new Date()) {
  const d = new Date(now);
  if (choice === 'Tomorrow') d.setDate(d.getDate() + 1);
  return d;
}

// A slot for today is unavailable once its end time has passed.
export function slotHasPassed(slot: string, choice: DayChoice, now = new Date()) {
  if (choice !== 'Today') return false;
  const end = slot.split('–')[1] ?? '';
  const [h, m] = end.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + (m || 0);
}

// Stored as an absolute day so "Tomorrow" doesn't go stale: "Sun 28 Sep · 09:30–12:00".
export function whenString(choice: DayChoice, slot: string, now = new Date()) {
  return `${formatDay(dayDate(choice, now))} · ${slot}`;
}

export function relativeTime(iso: string | number | null | undefined, now = Date.now()) {
  if (iso == null) return '';
  const t = typeof iso === 'number' ? iso : new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.round((now - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return 'yesterday';
  return formatDay(new Date(t));
}

// ---------- Phone ----------

// Accepts 0712345678, 712345678, +254712345678, 254712345678 (also 01xx numbers).
// Returns 2547XXXXXXXX / 2541XXXXXXXX, '' for empty input, or null if invalid.
export function normalizeKenyanPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, '').replace(/^\+/, '');
  if (!digits) return '';
  let local = digits;
  if (local.startsWith('254')) local = local.slice(3);
  else if (local.startsWith('0')) local = local.slice(1);
  return /^[17]\d{8}$/.test(local) ? `254${local}` : null;
}

export function prettyPhone(phone: string) {
  const local = `0${phone.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

// ---------- Notifications derived from job history ----------

export type JobEvent = {
  key: string;
  jobId: string;
  at: number;
  icon: IconName;
  tone: 'primary' | 'success' | 'warning';
  title: string;
  body: string;
  // True when someone else caused it (e.g. a provider accepted your job); drives the unread dot.
  fromOthers: boolean;
};

function ts(iso: string | null | undefined) {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? null : t;
}

// Jobs paid before paidAt existed still carry the time in their stub receipt (STUB-<ms>).
function paidTime(job: Job) {
  return ts(job.paidAt) ?? (Number(job.mpesaReceipt?.replace('STUB-', '')) || null);
}

export function jobEvents(jobs: Job[], userId: string | undefined): JobEvent[] {
  if (!userId) return [];
  const events: JobEvent[] = [];
  const reached = (job: Job, s: JobStatus) => statusIndex(job.status) >= statusIndex(s);

  for (const job of jobs) {
    const mineAsCustomer = isCustomer(job, userId);
    const mineAsProvider = isProvider(job, userId);
    if (!mineAsCustomer && !mineAsProvider) continue;

    const created = ts(job.createdAt) ?? 0;
    const provider = displayName(job.providerEmail);
    const push = (
      kind: string,
      at: number | null,
      e: Omit<JobEvent, 'key' | 'jobId' | 'at' | 'fromOthers'>,
    ) =>
      events.push({
        key: `${job.id}:${kind}`,
        jobId: job.id,
        at: at ?? created,
        fromOthers: mineAsCustomer && ['accepted', 'picked_up', 'delivered'].includes(kind),
        ...e,
      });

    if (mineAsCustomer) {
      push('posted', created, {
        icon: 'create-outline',
        tone: 'primary',
        title: 'You posted a job',
        body: job.what,
      });
      if (isPaid(job)) {
        push('paid', paidTime(job), {
          icon: 'card-outline',
          tone: 'success',
          title: 'Payment received (test)',
          body: `${job.what} is now open for providers to accept.`,
        });
      } else if (job.status === 'posted') {
        push('unpaid', created + 1, {
          icon: 'alert-circle-outline',
          tone: 'warning',
          title: 'Waiting for your payment',
          body: `Pay for "${job.what}" so a provider can take it.`,
        });
      }
      if (reached(job, 'accepted')) {
        push('accepted', ts(job.acceptedAt), {
          icon: 'person-add-outline',
          tone: 'primary',
          title: `${provider} accepted your job`,
          body: job.what,
        });
      }
      if (reached(job, 'picked_up')) {
        push('picked_up', ts(job.pickedUpAt), {
          icon: 'bicycle-outline',
          tone: 'primary',
          title: 'Picked up and on the way',
          body: `${job.what} → ${job.dropoff}`,
        });
      }
      if (reached(job, 'delivered')) {
        push('delivered', ts(job.deliveredAt), {
          icon: 'checkmark-circle-outline',
          tone: 'success',
          title: 'Delivered',
          body: `${job.what} reached ${job.dropoff}.`,
        });
      }
    } else {
      push('accepted', ts(job.acceptedAt), {
        icon: 'briefcase-outline',
        tone: 'primary',
        title: 'You accepted a job',
        body: `${job.what} · ${formatKes(job.budgetKes)}`,
      });
      if (reached(job, 'picked_up')) {
        push('picked_up', ts(job.pickedUpAt), {
          icon: 'bicycle-outline',
          tone: 'primary',
          title: 'You marked it picked up',
          body: `Drop off at ${job.dropoff}`,
        });
      }
      if (reached(job, 'delivered')) {
        push('delivered', ts(job.deliveredAt), {
          icon: 'checkmark-circle-outline',
          tone: 'success',
          title: 'Job completed',
          body: `${job.what} · ${formatKes(job.budgetKes)}`,
        });
      }
    }
  }

  return events.sort((a, b) => b.at - a.at);
}

// ---------- Search ----------

export function matchesQuery(job: Job, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const meta = typeMeta(job.type);
  return [job.what, job.pickup, job.dropoff, job.type, meta.short, meta.label]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Nairobi`)}`;
}
