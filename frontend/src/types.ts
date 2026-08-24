export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ORGANISER' | 'ADMIN';
}

export interface VenueSeat {
  id: string;
  venueId: string;
  row: string;
  col: number;
  seatNumber: string;
  category: 'VIP' | 'PREMIUM' | 'STANDARD';
  isActive: boolean;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
  totalRows: number;
  totalCols: number;
  seats: VenueSeat[];
}

export interface ShowSeat {
  id: string;
  seatNumber: string;
  row: string;
  col: number;
  category: 'VIP' | 'PREMIUM' | 'STANDARD';
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  isHeldByMe?: boolean;
  holdExpiresAt?: string | null;
}

export interface Showtime {
  id: string;
  eventId: string;
  startTime: string;
  endTime: string;
  holdTtlMinutes: number;
  pricing?: string;
  seats?: ShowSeat[];
  event?: Event;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: 'MOVIE' | 'CONCERT' | 'THEATRE';
  bannerUrl: string;
  durationMinutes: number;
  venueId: string;
  venue: Venue;
  showtimes: Showtime[];
}

export interface BookingSeat {
  id: string;
  seatNumber: string;
  category: string;
  seatPrice: number;
}

export interface Booking {
  id: string;
  bookingRef: string;
  userId: string;
  showtimeId: string;
  totalAmount: number;
  status: 'CONFIRMED' | 'CANCELLED';
  qrCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  cancelledAt?: string;
  seats: BookingSeat[];
  showtime: Showtime;
}

export interface WaitlistEntry {
  id: string;
  showtimeId: string;
  userId: string;
  category: string;
  status: 'WAITING' | 'OFFERED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  claimToken?: string;
  offerExpiresAt?: string;
  createdAt: string;
  showtime: Showtime;
}
