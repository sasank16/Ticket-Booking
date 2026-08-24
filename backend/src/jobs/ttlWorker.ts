import { checkAndExpireHolds } from '../services/seatHoldService';
import { checkAndExpireWaitlistOffers } from '../services/waitlistService';

let intervalId: NodeJS.Timeout | null = null;

export const startTtlWorker = (intervalMs: number = 10000) => {
  console.log(`[TTL Worker] Background job initialized (Running every ${intervalMs / 1000}s)`);

  const runSweep = async () => {
    try {
      await checkAndExpireHolds();
      await checkAndExpireWaitlistOffers();
    } catch (err) {
      console.error('[TTL Worker Error]:', err);
    }
  };

  // Run once immediately
  runSweep();

  intervalId = setInterval(runSweep, intervalMs);
};

export const stopTtlWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[TTL Worker] Stopped');
  }
};
