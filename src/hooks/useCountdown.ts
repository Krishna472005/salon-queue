import { useState, useEffect } from 'react';

interface CountdownResult {
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
  totalSecondsRemaining: number;
}

export const useCountdown = (
  calledAt: string | null | undefined,
  durationMinutes: number = 8
): CountdownResult => {
  const calculateRemaining = (): number => {
    if (!calledAt) return 0;
    const startTime = new Date(calledAt).getTime();
    const endTime = startTime + durationMinutes * 60 * 1000;
    const now = Date.now();
    return Math.max(0, Math.floor((endTime - now) / 1000));
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemaining);

  useEffect(() => {
    setRemainingSeconds(calculateRemaining());

    if (!calledAt) return;

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calledAt, durationMinutes]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isExpired = remainingSeconds <= 0;

  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    minutes,
    seconds,
    isExpired,
    formatted,
    totalSecondsRemaining: remainingSeconds,
  };
};
