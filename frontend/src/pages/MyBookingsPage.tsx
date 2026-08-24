import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking } from '../types';
import { QRModal } from '../components/QRModal';
import { Ticket, QrCode, Calendar, MapPin } from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data.bookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Cancel this booking? Seats will be immediately offered to the waitlist queue.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      await fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Tickets & Bookings</h1>
        <p className="text-xs text-slate-400 mt-1">
          View your confirmed passes, download QR codes for gate check-in, or manage cancellations.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No bookings yet</h3>
          <p className="text-xs text-slate-500">Explore events and book your seats!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => {
            const isCancelled = booking.status === 'CANCELLED';

            return (
              <div
                key={booking.id}
                className={`bg-slate-900 border rounded-3xl p-6 space-y-5 shadow-xl transition ${
                  isCancelled ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Ref: {booking.bookingRef}
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {booking.showtime?.event?.title || 'Event Booking'}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isCancelled ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{new Date(booking.showtime?.startTime || Date.now()).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{booking.showtime?.event?.venue?.name}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>Seats: <strong className="text-white">{booking.seats?.map((s) => s.seatNumber).join(', ')}</strong></span>
                    <span className="font-bold text-indigo-400 text-sm">${booking.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {!isCancelled && (
                    <>
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition"
                      >
                        <QrCode className="w-4 h-4" /> View QR Pass
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-4 py-2.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 font-medium text-xs transition"
                      >
                        {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBooking && (
        <QRModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};
