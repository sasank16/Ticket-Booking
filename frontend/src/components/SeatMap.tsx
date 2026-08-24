import React from 'react';
import { ShowSeat } from '../types';
import { Sparkles, Star, ShieldCheck } from 'lucide-react';

interface SeatMapProps {
  seats: ShowSeat[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: ShowSeat) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({ seats, selectedSeatIds, onToggleSeat }) => {
  const rowsMap = new Map<string, ShowSeat[]>();
  for (const seat of seats) {
    if (!rowsMap.has(seat.row)) {
      rowsMap.set(seat.row, []);
    }
    rowsMap.get(seat.row)!.push(seat);
  }

  const sortedRows = Array.from(rowsMap.keys()).sort();

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* Curved Screen */}
      <div className="w-full max-w-2xl mb-12 text-center perspective-screen">
        <div className="h-4 bg-gradient-to-r from-indigo-500/20 via-indigo-400 to-indigo-500/20 rounded-full screen-curve mx-auto mb-3" />
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
          STAGE / SCREEN
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-xs font-medium bg-slate-900/60 border border-slate-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-slate-700/60 border border-slate-600" />
          <span className="text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-indigo-600 border border-indigo-400 shadow-md shadow-indigo-500/30" />
          <span className="text-slate-300">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/40" />
          <span className="text-amber-400">Held (TTL Active)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-slate-900 border border-slate-800 opacity-40" />
          <span className="text-slate-500">Booked</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-4 mb-6 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" /> VIP
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Star className="w-3.5 h-3.5" /> Premium
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <ShieldCheck className="w-3.5 h-3.5" /> Standard
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-3.5 overflow-x-auto max-w-full pb-4 px-2">
        {sortedRows.map((rowLetter) => {
          const rowSeats = rowsMap.get(rowLetter)!.sort((a, b) => a.col - b.col);

          return (
            <div key={rowLetter} className="flex items-center justify-center gap-2.5">
              <div className="w-6 text-xs font-bold text-slate-500 text-center">{rowLetter}</div>

              <div className="flex items-center gap-2">
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isBooked = seat.status === 'BOOKED';
                  const isHeldByOther = seat.status === 'HELD' && !seat.isHeldByMe;
                  const isHeldByMe = seat.isHeldByMe;

                  let seatStyle = 'bg-slate-800 border-slate-700 hover:border-indigo-400 hover:bg-slate-700 text-slate-300';
                  
                  if (seat.category === 'VIP') {
                    seatStyle = 'bg-amber-950/30 border-amber-600/40 text-amber-200 hover:border-amber-400';
                  } else if (seat.category === 'PREMIUM') {
                    seatStyle = 'bg-purple-950/30 border-purple-600/40 text-purple-200 hover:border-purple-400';
                  }

                  if (isSelected || isHeldByMe) {
                    seatStyle = 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 scale-105';
                  } else if (isHeldByOther) {
                    seatStyle = 'bg-amber-500/10 border-amber-500/30 text-amber-500/60 cursor-not-allowed';
                  } else if (isBooked) {
                    seatStyle = 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed opacity-40 line-through';
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={isBooked || isHeldByOther}
                      onClick={() => onToggleSeat(seat)}
                      title={`${seat.seatNumber} (${seat.category}) - $${seat.price} | Status: ${seat.status}`}
                      className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl border text-[11px] font-bold flex items-center justify-center transition-all duration-150 ${seatStyle}`}
                    >
                      {seat.col}
                      {seat.category === 'VIP' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="w-6 text-xs font-bold text-slate-500 text-center">{rowLetter}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
