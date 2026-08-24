import { prisma } from '../config/prisma';
import { holdSeats } from '../services/seatHoldService';
import { reallocateSeatToWaitlist } from '../services/waitlistService';
import { generateQRCodeDataUrl } from '../services/qrEmailService';
import { v4 as uuidv4 } from 'uuid';

async function runFullFlowTest() {
  console.log('===========================================================');
  console.log('RUNNING FULL SYSTEM END-TO-END VERIFICATION SUITE');
  console.log('===========================================================');

  // 1. Fetch Showtime & Seats
  const showtime = await prisma.showtime.findFirst({
    include: { event: { include: { venue: true } }, seats: true },
  });

  if (!showtime) {
    console.error('No showtime found. Run prisma:seed first.');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  if (!user) {
    console.error('No customer user found.');
    process.exit(1);
  }

  console.log('1. Target Event: ' + showtime.event.title);
  console.log('   Venue: ' + showtime.event.venue.name + ' (' + showtime.seats.length + ' seats total)');

  const testSeat = showtime.seats[1];
  console.log('2. Testing Seat Hold for Seat ' + testSeat.seatNumber + '...');

  // Reset seat
  await prisma.showSeat.update({
    where: { id: testSeat.id },
    data: { status: 'AVAILABLE', heldByUserId: null, holdExpiresAt: null },
  });

  // Hold Seat
  const holdRes = await holdSeats(showtime.id, [testSeat.id], user.id);
  if (!holdRes.success) {
    console.error('Seat hold failed: ' + holdRes.message);
    process.exit(1);
  }
  console.log('   Seat held successfully. Hold TTL Expires at: ' + holdRes.expiresAt?.toISOString());

  // 3. Confirm Booking & Generate QR Code
  console.log('3. Creating Confirmed Booking & Generating QR Code...');
  const bookingRef = 'BK-TEST-' + uuidv4().substring(0, 6).toUpperCase();
  const qrPayload = {
    bookingRef,
    showtimeId: showtime.id,
    event: showtime.event.title,
    seats: [testSeat.seatNumber],
    customer: user.email,
  };
  const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

  const booking = await prisma.booking.create({
    data: {
      bookingRef,
      userId: user.id,
      showtimeId: showtime.id,
      totalAmount: testSeat.price,
      status: 'CONFIRMED',
      qrCode: qrCodeDataUrl,
      customerName: user.name,
      customerEmail: user.email,
      seats: {
        create: [
          {
            showSeatId: testSeat.id,
            seatPrice: testSeat.price,
            seatNumber: testSeat.seatNumber,
            category: testSeat.category,
          },
        ],
      },
    },
    include: { seats: true },
  });

  await prisma.showSeat.update({
    where: { id: testSeat.id },
    data: { status: 'BOOKED', heldByUserId: null, holdExpiresAt: null },
  });

  console.log('   Booking Confirmed! Ref: ' + booking.bookingRef + ' (QR Data URL length: ' + booking.qrCode.length + ' chars)');

  // 4. Test Waitlist Auto-Assignment on Cancellation
  console.log('4. Simulating Waitlist Queue and Cancellation Auto-Assignment...');
  
  const waitlistUser = await prisma.user.upsert({
    where: { email: 'sarah@seatswift.com' },
    update: {},
    create: {
      name: 'Sarah Miller',
      email: 'sarah@seatswift.com',
      password: 'password123',
      role: 'CUSTOMER',
    },
  });

  // Clean prior entries
  await prisma.waitlistEntry.deleteMany({
    where: { showtimeId: showtime.id, userId: waitlistUser.id },
  });

  const waitlistEntry = await prisma.waitlistEntry.create({
    data: {
      showtimeId: showtime.id,
      userId: waitlistUser.id,
      category: testSeat.category,
      status: 'WAITING',
    },
  });
  console.log('   Customer ' + waitlistUser.email + ' joined waitlist for category ' + testSeat.category);

  // Cancel First Booking
  console.log('   Cancelling Booking ' + booking.bookingRef + ' to trigger waitlist reallocation...');
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  const reallocResult = await reallocateSeatToWaitlist(showtime.id, testSeat.id, testSeat.category);
  console.log('   Reallocation result: ', reallocResult);

  const updatedEntry = await prisma.waitlistEntry.findUnique({
    where: { id: waitlistEntry.id },
  });
  console.log('   Waitlist Entry Status: ' + updatedEntry?.status + ' (Claim Token: ' + updatedEntry?.claimToken + ')');

  const reallocatedSeat = await prisma.showSeat.findUnique({
    where: { id: testSeat.id },
  });
  console.log('   Seat Status: ' + reallocatedSeat?.status + ' (Held by: ' + reallocatedSeat?.heldByUserId + ', Expires: ' + reallocatedSeat?.holdExpiresAt?.toISOString() + ')');

  if (updatedEntry?.status === 'OFFERED' && reallocatedSeat?.status === 'HELD' && reallocatedSeat.heldByUserId === waitlistUser.id) {
    console.log('ALL END-TO-END FLOWS VERIFIED SUCCESSFULLY!');
  } else {
    console.error('Waitlist auto-assignment mismatch!');
    process.exit(1);
  }

  await prisma.$disconnect();
}

runFullFlowTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
