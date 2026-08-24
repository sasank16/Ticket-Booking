import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Event, Showtime } from '../types';
import { Calendar, Clock, MapPin, Sparkles, ShieldCheck, Ticket } from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data.event);
      } catch (err) {
        console.error('Error fetching event detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-slate-500">Loading event details...</div>;
  }

  if (!event) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-rose-400">Event not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Event Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-hidden">
        <div className="lg:col-span-1 h-72 lg:h-full rounded-2xl overflow-hidden bg-slate-950">
          <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
        </div>
        <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase">
              {event.category}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{event.title}</h1>
            <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-slate-500">Venue</div>
                <div className="font-semibold">{event.venue.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-slate-500">Duration</div>
                <div className="font-semibold">{event.durationMinutes} Minutes</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-slate-500">Concurrency</div>
                <div className="font-semibold text-emerald-400">Lock Protected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Showtimes */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Select Showtime</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {event.showtimes?.map((show: Showtime) => {
            const startDate = new Date(show.startTime);
            return (
              <div
                key={show.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-4 transition group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white">
                    {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-mono font-bold">
                    {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span>Hold Window: {show.holdTtlMinutes || 10} Mins TTL</span>
                  <span className="text-indigo-400 font-semibold">Live Seat Map</span>
                </div>

                <Link
                  to={`/showtimes/${show.id}/seats`}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition"
                >
                  <Ticket className="w-3.5 h-3.5" /> Open Visual Seat Map
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
