import { useAuth, useUser } from '@clerk/expo';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { api, ApiError, errorMessage } from '@/lib/api';
import type { Job, JobAction, NewJob } from '@/lib/jobs';

type JobsContextValue = {
  jobs: Job[];
  userId: string | undefined;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  pending: Record<string, JobAction | undefined>;
  refresh: () => Promise<void>;
  create: (input: NewJob) => Promise<Job>;
  act: (id: string, action: JobAction) => Promise<Job>;
};

const JobsContext = createContext<JobsContextValue | null>(null);

// One shared copy of GET /jobs so Home, Jobs, Search, alerts and Profile stay in sync
// (a job posted on Home shows up in Jobs straight away, no app restart).
export function JobsProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, JobAction | undefined>>({});
  const inflight = useRef<Promise<void> | null>(null);
  // Keep callbacks stable even if Clerk hands back a new getToken each render.
  const tokenRef = useRef(getToken);
  useEffect(() => {
    tokenRef.current = getToken;
  }, [getToken]);
  const token = () => tokenRef.current();

  const refresh = useCallback(() => {
    if (inflight.current) return inflight.current;
    const run = (async () => {
      setLoading(true);
      try {
        const data = await api<Job[]>('/jobs', { token: await token() });
        setJobs(Array.isArray(data) ? data : []);
        setError(null);
        setLoaded(true);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
        inflight.current = null;
      }
    })();
    inflight.current = run;
    return run;
  }, []);

  const upsert = (job: Job) =>
    setJobs((list) =>
      list.some((j) => j.id === job.id)
        ? list.map((j) => (j.id === job.id ? job : j))
        : [job, ...list],
    );

  const create = useCallback(
    async (input: NewJob) => {
      const job = await api<Job>('/jobs', {
        method: 'POST',
        body: input,
        token: await token(),
      });
      upsert(job);
      return job;
    },
    [],
  );

  const act = useCallback(
    async (id: string, action: JobAction) => {
      setPending((p) => ({ ...p, [id]: action }));
      try {
        const job = await api<Job>(`/jobs/${id}/${action}`, {
          method: 'PATCH',
          token: await token(),
        });
        upsert(job);
        return job;
      } catch (e) {
        // Someone else changed the job first (e.g. another provider accepted): show the latest.
        if (e instanceof ApiError && e.status === 409) refresh();
        throw e;
      } finally {
        setPending((p) => ({ ...p, [id]: undefined }));
      }
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      jobs,
      userId: user?.id,
      loading,
      loaded,
      error,
      pending,
      refresh,
      create,
      act,
    }),
    [jobs, user?.id, loading, loaded, error, pending, refresh, create, act],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used inside JobsProvider');
  return ctx;
}
