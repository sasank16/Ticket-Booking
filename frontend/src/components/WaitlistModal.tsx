import React, { useState } from 'react';
import { api } from '../services/api';
import { X, UserPlus, Clock, Sparkles } from 'lucide-react';

export const WaitlistModal: React.FC<{
  showtimeId: string;
  eventTitle: string;
  onClose: () => void;
  onSuccess: (queuePosition: number) => void;
}> = ({ showtimeId, eventTitle, onClose, onSuccess }) => {
  const [category, setCategory] = useState<string>('ANY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/waitlist/join', { showtimeId, category });
      onSuccess(res.data.queuePosition);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
          <UserPlus className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Join Event Waitlist</h3>
        <p className="text-sm text-slate-400 mb-5">
          Get automatically allocated tickets for <strong>{eventTitle}</strong> as soon as a cancellation occurs.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Preferred Seat Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ANY">Any Available Category (Fastest)</option>
              <option value="VIP">VIP Seats Only</option>
              <option value="PREMIUM">Premium Seats Only</option>
              <option value="STANDARD">Standard Seats Only</option>
            </select>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-400">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>10-Min Priority Window:</strong> You will receive an instant email with a time-limited claim link upon cancellation.</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span><strong>FIFO Reallocation:</strong> Seats are assigned in strict first-come-first-served queue order.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition">
            Cancel
          </button>
          <button onClick={handleJoin} disabled={loading} className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50">
            {loading ? 'Joining...' : 'Confirm Waitlist'}
          </button>
        </div>
      </div>
    </div>
  );
};
