import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ShowSeat, Showtime } from '../types';
import { SeatMap } from '../components/SeatMap';
import { HoldCountdownTimer } from '../components/HoldCountdownTimer';
import { WaitlistModal } from '../components/WaitlistModal';
import { ArrowRight, Sparkles, UserPlus, AlertCircle } from 'lucide-react';

export const SeatSelectionPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinShowtime, leaveShowtime } = useSocket();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<ShowSeat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [categoryStats, setCategoryStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistSuccessMsg, setWaitlistSuccessMsg] = useState<string | null>(null);

  const fetchSeats = async () => {
    if (!showtimeId) return;
    try {
      const res = await api.get(`/showtimes/${showtimeId}/seats`);
      setShowtime(res.data.showtime);
      setSeats(res.data.seats);
      setCategoryStats(res.data.categoryStats);

      // Check if user already holds any seats
      const heldByMe = res.data.seats.filter((s: ShowSeat) => s.isHeldByMe);
      if (heldByMe.length > 0) {
        setSelectedSeatIds(heldByMe.map((s: ShowSeat) => s.id));
        setHoldExpiresAt(heldByMe[0].holdExpiresAt || null);
      }
    } catch (err) {
      console.error('Error fetching seats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
    if (showtimeId) {
      joinShowtime(showtimeId);
    }

    return () => {
      if (showtimeId) leaveShowtime(showtimeId);
    };
  }, [showtimeId]);

  // Listen for real-time WebSocket seat updates
  useEffect(() => {
    if (!socket) return;

    const handleSeatsUpdated = (data: { showtimeId: string; seats: any[] }) => {
      if (data.showtimeId === showtimeId) {
        console.log('? Real-time seat update received via WebSocket');
        fetchSeats();
      }
    };

    socket.on('seats:updated', handleSeatsUpdated);
    return () => {
      socket.off('seats:updated', handleSeatsUpdated);
    };
  }, [socket, showtimeId]);

  const handleToggleSeat = (seat: ShowSeat) => {
    setError(null);
    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 6) {
        setError('Maximum 6 seats can be selected per booking');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
    }
  };

  const handleHoldAndProceed = async () => {
    if (!user) {
      setError('Please sign in to place a seat hold and checkout');
      return;
    }
    if (selectedSeatIds.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    setError(null);
    setHolding(true);
    try {
      const res = await api.post('/seats/hold', {
        showtimeId,
        seatIds: selectedSeatIds,
      });

      setHoldExpiresAt(res.data.expiresAt);
      // Navigate to checkout with held seats
      navigate('/checkout', {
        state: {
          showtimeId,
          seatIds: selectedSeatIds,
          expiresAt: res.data.expiresAt,
          event: showtime?.event,
          startTime: showtime?.startTime,
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to hold selected seats.');
      fetchSeats(); // Refresh seats to show updated status
    } finally {
      setHolding(false);
    }
  };

  const handleHoldExpired = () => {
    setHoldExpiresAt(null);
    setSelectedSeatIds([]);
    setError('Your seat hold has expired and seats were released. Please select again.');
    fetchSeats();
  };

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  // Check if sold out
  const availableSeatsCount = seats.filter((s) => s.status === 'AVAILABLE').length;
  const isSoldOut = !loading && availableSeatsCount === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {showtime?.event?.title || 'Visual Seat Selection'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(showtime?.startTime || Date.now()).toLocaleString()} ? {showtime?.event?.venue?.name}
          </p>
        </div>

        {/* Sold out waitlist banner */}
        {isSoldOut && (
          <button
            onClick={() => setShowWaitlistModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            <UserPlus className="w-4 h-4" /> Join Waitlist (Sold Out)
          </button>
        )}
      </div>

      {waitlistSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-center justify-between">
          <span>{waitlistSuccessMsg}</span>
          <button onClick={() => setWaitlistSuccessMsg(null)} className="text-slate-400 hover:text-white">?</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Hold Timer */}
      {holdExpiresAt && (
        <HoldCountdownTimer
          expiresAt={holdExpiresAt}
          onExpire={handleHoldExpired}
          seatCount={selectedSeatIds.length}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Seat Map Area */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center">
          {loading ? (
            <div className="h-96 flex items-center justify-center text-slate-500">Loading seat layout...</div>
          ) : (
            <SeatMap
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={handleToggleSeat}
            />
          )}
        </div>

        {/* Booking Summary Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Selection Summary
            </h3>

            {selectedSeats.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Click on available seats on the map to select.</p>
            ) : (
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="font-bold text-white">{seat.seatNumber}</span>
                        <span className="text-slate-500 ml-1.5 font-medium">({seat.category})</span>
                      </div>
                      <span className="font-bold text-indigo-400">${seat.price}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Price:</span>
                  <span className="text-xl font-extrabold text-white">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleHoldAndProceed}
              disabled={selectedSeatIds.length === 0 || holding}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-40"
            >
              {holding ? 'Placing Atomic Hold...' : 'Hold Seats & Checkout'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Waitlist Category Options */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Waitlist Support</span>
              <button
                onClick={() => setShowWaitlistModal(true)}
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                Join Waitlist
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              If your preferred category runs out of seats, join the priority waitlist to be auto-assigned upon cancellations.
            </p>
          </div>
        </div>
      </div>

      {showWaitlistModal && showtimeId && (
        <WaitlistModal
          showtimeId={showtimeId}
          eventTitle={showtime?.event?.title || 'Event'}
          onClose={() => setShowWaitlistModal(false)}
          onSuccess={(pos) => {
            setShowWaitlistModal(false);
            setWaitlistSuccessMsg(`You joined the waitlist at Position #${pos}. We will email you immediately if a seat opens up!`);
          }}
        />
      )}
    </div>
  );
};
