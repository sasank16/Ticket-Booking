import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface HoldCountdownTimerProps {
  expiresAt: string | Date;
  onExpire: () => void;
  seatCount: number;
}

export const HoldCountdownTimer: React.FC<HoldCountdownTimerProps> = ({ expiresAt, onExpire, seatCount }) => {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; totalSeconds: number }>({
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, totalSeconds: 0 });
        onExpire();
      } else {
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setTimeLeft({ minutes, seconds, totalSeconds: diff });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const isUrgent = timeLeft.totalSeconds < 120;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isUrgent
        ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 animate-pulse'
        : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-100'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
            {isUrgent ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wide uppercase opacity-80">
              {isUrgent ? 'Hurry! Hold Expiring Soon' : 'Seats Reserved For You'}
            </div>
            <div className="text-sm font-medium">
              Holding <strong>{seatCount} seat{seatCount > 1 ? 's' : ''}</strong> exclusively
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-2xl font-extrabold tracking-wider">
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-[11px] opacity-70">Hold TTL Timer</div>
        </div>
      </div>
    </div>
  );
};
