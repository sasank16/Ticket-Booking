import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DollarSign, Users, Ticket, TrendingUp } from 'lucide-react';

export const OrganiserDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/organiser/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Error loading organiser stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-slate-500">Loading organiser metrics...</div>;
  }

  const summary = data?.summary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Organiser Analytics & Revenue</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor ticket sales, showtime occupancy, active category waitlists, and revenue performance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            ${summary.totalRevenue?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tickets Sold</span>
            <Ticket className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {summary.totalTicketsSold || 0}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Occupancy Rate</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {summary.overallOccupancy || '0%'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Waitlists</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-300">
            {summary.totalWaitlisted || 0}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-white">Event Performance Breakdown</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Showtimes</th>
                <th className="py-3 px-4">Tickets Sold</th>
                <th className="py-3 px-4">Occupancy</th>
                <th className="py-3 px-4">Waitlist</th>
                <th className="py-3 px-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.events?.map((ev: any) => (
                <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-4 font-bold text-white">{ev.title}</td>
                  <td className="py-4 px-4 text-slate-300">{ev.venueName}</td>
                  <td className="py-4 px-4 text-slate-300">{ev.showtimesCount}</td>
                  <td className="py-4 px-4 text-slate-300">{ev.ticketsSold} / {ev.totalCapacity}</td>
                  <td className="py-4 px-4 font-semibold text-amber-400">{ev.occupancyRate}</td>
                  <td className="py-4 px-4 text-purple-300 font-semibold">{ev.activeWaitlist}</td>
                  <td className="py-4 px-4 text-right font-extrabold text-emerald-400">${ev.revenue?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
