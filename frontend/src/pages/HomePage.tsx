import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Event } from '../types';
import { Search, Calendar, MapPin, Film, Music, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (category !== 'ALL') params.category = category;
        if (search) params.search = search;
        const res = await api.get('/events', { params });
        setEvents(res.data.events);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [category, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> High-Demand Concurrency Engine Active
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Book Live Events with Zero Race Conditions.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Real-time visual seat selection, 10-minute hold TTL auto-release, and automated FIFO waitlist reallocation on cancellations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Shows', icon: Sparkles },
            { id: 'MOVIE', label: 'Movies & IMAX', icon: Film },
            { id: 'CONCERT', label: 'Concerts & Live', icon: Music },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search events, movies, artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-slate-900/60 rounded-3xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No events found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting filters or searching for another title.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition flex flex-col shadow-xl"
            >
              {/* Event Image */}
              <div className="relative h-48 overflow-hidden bg-slate-950">
                <img
                  src={event.bannerUrl}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-indigo-300 border border-indigo-500/30 uppercase">
                  {event.category}
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{event.venue.name} ? {event.venue.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{event.showtimes?.length || 0} Showtimes Available</span>
                  </div>
                </div>

                <Link
                  to={`/events/${event.id}`}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold text-center shadow-md shadow-indigo-600/30 transition"
                >
                  Select Showtime & Seats ?
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
