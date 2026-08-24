import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HoldCountdownTimer } from '../components/HoldCountdownTimer';
import { QRModal } from '../components/QRModal';
import { Booking } from '../types';
import { Sparkles, CheckCircle2, Ticket, MapPin, Calendar, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WaitlistClaimPage: React.FC = () => {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await api.get(`/waitlist/offer/${claimToken}`);
        setOffer(res.data.offer);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load waitlist offer');
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [claimToken]);

  const handleClaimBooking = async () => {
    if (!user) {
      alert('Please sign in to claim this waitlist offer');
      return;
    }
    setError(null);
    setClaiming(true);
    try {
      const res = await api.post('/waitlist/claim', {
        claimToken,
        customerName: user.name,
        customerEmail: user.email,
      });

      setConfirmedBooking(res.data.booking);
      setShowQRModal(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to claim offer');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <div className="max-w-xl mx-auto py-20 text-center text-slate-500">Checking waitlist offer status...</div>;
  }

  if (error || !offer) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Waitlist Offer Unavailable</h2>
        <p className="text-xs text-slate-400">{error || 'This offer may have expired or already been claimed.'}</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white">
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5" /> Priority Seat Reallocation
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Claim Your Waitlisted Seat</h1>
        <p className="text-xs text-slate-400">
          A seat in category <strong>{offer.category}</strong> has opened up and is reserved for you.
        </p>
      </div>

      {offer.offerExpiresAt && (
        <HoldCountdownTimer
          expiresAt={offer.offerExpiresAt}
          onExpire={() => {
            alert('Offer time limit reached. Seat will be passed to next person in queue.');
            navigate('/');
          }}
          seatCount={1}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="space-y-4">
          <div className="text-lg font-bold text-white">
            {offer.showtime?.event?.title}
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Ticket className="w-4 h-4 text-emerald-400" /> Allocated Seat:
              </span>
              <span className="font-extrabold text-white text-base">{offer.seat?.seatNumber || 'Category Seat'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-4 h-4 text-emerald-400" /> Showtime:
              </span>
              <span className="font-semibold">{new Date(offer.showtime?.startTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-400" /> Venue:
              </span>
              <span className="font-semibold">{offer.showtime?.event?.venue?.name}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400">Category Price:</span>
              <span className="text-lg font-bold text-emerald-400">${offer.seat?.price || 25}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleClaimBooking}
          disabled={claiming}
          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          {claiming ? 'Confirming Ticket...' : 'Claim & Book Seat Now'}
        </button>
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
