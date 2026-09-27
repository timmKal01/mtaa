import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useJobs } from '@/context/jobs';
import { errorMessage } from '@/lib/api';
import { formatKes, type Job, type JobAction } from '@/lib/jobs';

const FAIL_TITLE: Record<JobAction, string> = {
  accept: "Couldn't accept job",
  pickup: "Couldn't update job",
  deliver: "Couldn't update job",
  pay: "Payment didn't go through",
};

// Wraps job actions with confirmations for the irreversible ones and readable errors.
export function useJobActions() {
  const { act } = useJobs();

  return useCallback(
    (job: Job, action: JobAction) => {
      const run = async () => {
        try {
          await act(job.id, action);
        } catch (e) {
          Alert.alert(FAIL_TITLE[action], errorMessage(e));
        }
      };

      if (action === 'pay') {
        Alert.alert(
          'Pay with M-Pesa (test)?',
          `${formatKes(job.budgetKes)} for "${job.what}".\n\nThis is a test payment. No money moves until live M-Pesa is switched on.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Pay (test)', onPress: run },
          ],
        );
      } else if (action === 'accept') {
        Alert.alert(
          'Take this job?',
          `${job.when}\n${job.pickup} → ${job.dropoff}\nYou'll earn ${formatKes(job.budgetKes)}.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Accept', onPress: run },
          ],
        );
      } else if (action === 'deliver') {
        Alert.alert(
          'Mark as delivered?',
          `Only do this once "${job.what}" is at ${job.dropoff}.`,
          [
            { text: 'Not yet', style: 'cancel' },
            { text: 'Delivered', onPress: run },
          ],
        );
      } else {
        run();
      }
    },
    [act],
  );
}
