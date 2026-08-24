import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { EventDetailPage } from './pages/EventDetailPage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { WaitlistClaimPage } from './pages/WaitlistClaimPage';
import { OrganiserDashboard } from './pages/OrganiserDashboard';
import { AdminVenuesPage } from './pages/AdminVenuesPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/showtimes/:showtimeId/seats" element={<SeatSelectionPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/my-bookings" element={<MyBookingsPage />} />
                <Route path="/waitlist/claim/:claimToken" element={<WaitlistClaimPage />} />
                <Route path="/organiser" element={<OrganiserDashboard />} />
                <Route path="/admin/venues" element={<AdminVenuesPage />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
