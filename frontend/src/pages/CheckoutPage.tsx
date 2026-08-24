import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HoldCountdownTimer } from '../components/HoldCountdownTimer';
import { QRModal } from '../components/QRModal';
import { Booking } from '../types';
import { CreditCard, CheckCircle2, ShieldCheck, Mail, User, Phone, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = location.state as {
    showtimeId: string;
    seatIds: string[];
    expiresAt: string;
    event: any;
    startTime: string;
  } | null;

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  if (!state || !state.seatIds || state.seatIds.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">No active seat hold found</h2>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white">
          Back to Events
        </button>
      </div>
    );
  }

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/bookings', {
        showtimeId: state.showtimeId,
        seatIds: state.seatIds,
        customerName,
        customerEmail,
        customerPhone,
      });

      setConfirmedBooking(res.data.booking);
      setShowQRModal(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm booking');
    } finally {
      setLoading(false);
    }
  };

  const handleExpire = () => {
    alert('Your seat hold timer expired. Seats have been returned to available.');
    navigate(`/showtimes/${state.showtimeId}/seats`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Change Seat Selection
      </button>

      <HoldCountdownTimer
        expiresAt={state.expiresAt}
        onExpire={handleExpire}
        seatCount={state.seatIds.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white">Attendee & Payment Details</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your tickets and entry QR code will be dispatched to your email.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex items-center justify-between text-xs text-indigo-300">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Instant Payment Gateway (Simulated)</span>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading ? 'Confirming Booking & QR...' : 'Complete Booking & Generate QR Ticket'}
              </button>
            </div>
          </form>
        </div>

        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 h-fit">
          <h3 className="text-sm font-bold text-white">Event Summary</h3>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="font-bold text-white text-sm">{state.event?.title || 'Selected Event'}</div>
            <div>{new Date(state.startTime).toLocaleString()}</div>
            <div>{state.event?.venue?.name}</div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Seats Selected:</span>
              <span className="font-bold text-white">{state.seatIds.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Status:</span>
              <span className="font-bold text-emerald-400">HELD (Exclusive)</span>
            </div>
          </div>
        </div>
      </div>

      {showQRModal && confirmedBooking && (
        <QRModal
          booking={confirmedBooking}
          onClose={() => {
            setShowQRModal(false);
            navigate('/my-bookings');
          }}
        />
      )}
    </div>
  );
};
