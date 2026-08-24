import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Venue } from '../types';
import { Plus } from 'lucide-react';

export const AdminVenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [totalRows, setTotalRows] = useState(6);
  const [totalCols, setTotalCols] = useState(10);
  const [creating, setCreating] = useState(false);

  const fetchVenues = async () => {
    try {
      const res = await api.get('/venues');
      setVenues(res.data.venues);
    } catch (err) {
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/venues', {
        name,
        city,
        address,
        totalRows,
        totalCols,
      });
      setName('');
      setCity('');
      setAddress('');
      await fetchVenues();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create venue');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Venues & Seat Layout Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure stadium, theatre, and concert hall seat layouts with tier categories (VIP, Premium, Standard).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 h-fit">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" /> Create New Venue
          </h3>

          <form onSubmit={handleCreateVenue} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Venue Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Dolby Cinema Palace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">City</label>
              <input
                type="text"
                required
                placeholder="e.g. Los Angeles"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Address</label>
              <input
                type="text"
                required
                placeholder="e.g. 6801 Hollywood Blvd"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Rows (A-Z)</label>
                <input
                  type="number"
                  min="2"
                  max="15"
                  required
                  value={totalRows}
                  onChange={(e) => setTotalRows(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Columns / Row</label>
                <input
                  type="number"
                  min="4"
                  max="20"
                  required
                  value={totalCols}
                  onChange={(e) => setTotalCols(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {creating ? 'Generating Venue Layout...' : 'Create & Auto-Generate Seats'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading venues...</div>
          ) : (
            <div className="space-y-4">
              {venues.map((venue) => (
                <div key={venue.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{venue.name}</h3>
                      <p className="text-xs text-slate-400">{venue.address}, {venue.city}</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                      {venue.seats?.length || 0} Total Seats
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>Layout: {venue.totalRows} Rows ? {venue.totalCols} Columns</span>
                    <span className="text-indigo-400 font-semibold">Tier auto-categorized (VIP / Premium / Standard)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
