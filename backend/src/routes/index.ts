import { Router } from 'express';
import * as authCtrl from '../controllers/authController';
import * as venueCtrl from '../controllers/venueController';
import * as eventCtrl from '../controllers/eventController';
import * as showCtrl from '../controllers/showtimeController';
import * as seatCtrl from '../controllers/seatController';
import * as bookingCtrl from '../controllers/bookingController';
import * as waitlistCtrl from '../controllers/waitlistController';
import * as organiserCtrl from '../controllers/organiserController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);

// Venue Routes
router.get('/venues', venueCtrl.listVenues);
router.get('/venues/:id', venueCtrl.getVenue);
router.post('/venues', authenticate, requireRole(['ADMIN']), venueCtrl.createVenue);

// Event Routes
router.get('/events', eventCtrl.listEvents);
router.get('/events/:id', eventCtrl.getEvent);
router.post('/events', authenticate, requireRole(['ORGANISER', 'ADMIN']), eventCtrl.createEvent);

// Showtime & Seat Layout Routes
router.post('/showtimes', authenticate, requireRole(['ORGANISER', 'ADMIN']), showCtrl.createShowtime);
router.get('/showtimes/:id/seats', showCtrl.getShowtimeSeats);

// Seat Hold / Release (Customer)
router.post('/seats/hold', authenticate, seatCtrl.holdSeatController);
router.post('/seats/release', authenticate, seatCtrl.releaseSeatController);

// Booking Routes
router.post('/bookings', authenticate, bookingCtrl.createBooking);
router.get('/bookings/my', authenticate, bookingCtrl.getMyBookings);
router.get('/bookings/ref/:ref', bookingCtrl.getBookingByRef);
router.post('/bookings/:id/cancel', authenticate, bookingCtrl.cancelBooking);

// Waitlist Routes
router.post('/waitlist/join', authenticate, waitlistCtrl.joinWaitlist);
router.get('/waitlist/my', authenticate, waitlistCtrl.getMyWaitlistEntries);
router.get('/waitlist/offer/:claimToken', waitlistCtrl.getWaitlistOffer);
router.post('/waitlist/claim', authenticate, waitlistCtrl.claimWaitlistOffer);

// Organiser Dashboard
router.get('/organiser/dashboard', authenticate, requireRole(['ORGANISER', 'ADMIN']), organiserCtrl.getOrganiserDashboard);

export default router;
