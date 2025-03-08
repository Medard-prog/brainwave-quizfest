import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for polling data at regular intervals
 * @param callback Function to call on each interval
 * @param delay Delay between polls in milliseconds
 * @param immediate Whether to run immediately on mount
 * @returns Object with polling controls
 */
export const usePolling = (
  callback: () => Promise<void> | void,
  delay = 1000,
  immediate = true
) => {
  const savedCallback = useRef<typeof callback>();
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const [lastPolled, setLastPolled] = useState<Date | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (!isPolling) return;
    
    const tick = async () => {
      try {
        if (savedCallback.current) {
          await savedCallback.current();
        }
        setLastPolled(new Date());
        setError(null);
      } catch (err) {
        console.error('Polling error:', err);
        setError(err as Error);
      }
    };

    // Run immediately if requested
    if (immediate) {
      tick();
    }

    // Start polling
    intervalId.current = setInterval(tick, delay);

    // Clean up on unmount
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
    };
  }, [delay, isPolling, immediate]);

  // Control functions
  const startPolling = () => setIsPolling(true);
  const stopPolling = () => setIsPolling(false);
  const pollNow = async () => {
    try {
      if (savedCallback.current) {
        await savedCallback.current();
      }
      setLastPolled(new Date());
      setError(null);
    } catch (err) {
      console.error('Polling error:', err);
      setError(err as Error);
    }
  };

  return {
    isPolling,
    startPolling,
    stopPolling,
    pollNow,
    error,
    lastPolled
  };
}; 