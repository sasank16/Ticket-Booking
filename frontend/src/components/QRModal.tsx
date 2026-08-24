import React from 'react';
import { Booking } from '../types';
import { X, Download, CheckCircle2, Ticket, MapPin, Calendar } from 'lucide-react';

export const QRModal: React.FC<{ booking: Booking; onClose: () => void }> = ({ booking, onClose }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `ticket-${booking.bookingRef}.png`;
    link.href = booking.qrCode;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition">
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Confirmed Ticket
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">
            {booking.showtime?.event?.title || 'Event Booking'}
          </h3>
          <p className="text-xs text-indigo-200 mt-1">
            Ref: <span className="font-mono font-bold text-white">{booking.bookingRef}</span>
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner mx-auto w-56 h-56">
            <img src={booking.qrCode} alt="Ticket QR Code" className="w-48 h-48 rounded-lg" />
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Ticket className="w-4 h-4 text-indigo-400" /> Seats:</span>
              <span className="font-bold text-white text-sm">
                {booking.seats?.map((s) => s.seatNumber).join(', ') || 'Seats Reserved'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-indigo-400" /> Showtime:</span>
              <span className="font-semibold text-slate-200">
                {new Date(booking.showtime?.startTime || Date.now()).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-400" /> Venue:</span>
              <span className="font-semibold text-slate-200">
                {booking.showtime?.event?.venue?.name || 'Grand Arena'}
              </span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
          >
            <Download className="w-4 h-4" /> Download QR Pass
          </button>
        </div>
      </div>
    </div>
  );
};
