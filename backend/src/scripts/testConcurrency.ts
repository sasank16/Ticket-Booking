import { prisma } from '../config/prisma';
import { holdSeats } from '../services/seatHoldService';
import bcrypt from 'bcryptjs';

async function runConcurrencyTest() {
  console.log('====================================================');
  console.log('RUNNING ATOMIC SEAT CONCURRENCY RACE CONDITION TEST');
  console.log('====================================================');

  const showtime = await prisma.showtime.findFirst({
    include: { seats: true },
  });

  if (!showtime || showtime.seats.length === 0) {
    console.error('No showtime with seats found. Run prisma:seed first.');
    process.exit(1);
  }

  const targetSeat = showtime.seats[0];
  console.log('Target Seat to contest: ' + targetSeat.seatNumber + ' (ID: ' + targetSeat.id + ') on Showtime ' + showtime.id);

  // Ensure seat is available initially
  await prisma.showSeat.update({
    where: { id: targetSeat.id },
    data: { status: 'AVAILABLE', heldByUserId: null, holdExpiresAt: null },
  });

  // Create 10 real test users in database
  const passwordHash = await bcrypt.hash('testpass', 5);
  const simulatedUsers = [];
  for (let i = 1; i <= 10; i++) {
    const email = 'concurrency_tester_' + i + '@test.com';
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: 'Tester ' + i,
        email,
        password: passwordHash,
        role: 'CUSTOMER',
      },
    });
    simulatedUsers.push(user);
  }

  console.log('Dispatching ' + simulatedUsers.length + ' simultaneous hold requests in parallel...');

  const results = await Promise.all(
    simulatedUsers.map((user) =>
      holdSeats(showtime.id, [targetSeat.id], user.id).catch((err) => ({
        success: false,
        message: err.message,
      }))
    )
  );

  const successfulHolds = results.filter((r) => r.success);
  const failedHolds = results.filter((r) => !r.success);

  console.log('RESULTS:');
  console.log('  Successful Holds: ' + successfulHolds.length);
  console.log('  Rejected Conflicts: ' + failedHolds.length);

  if (successfulHolds.length === 1 && failedHolds.length === simulatedUsers.length - 1) {
    console.log('CONCURRENCY PROTECTION PASSED: Exactly 1 customer won the hold lock, ' + (simulatedUsers.length - 1) + ' were prevented from double-booking!');
  } else {
    console.error('CONCURRENCY FAILED: Race condition detected!');
    process.exit(1);
  }

  await prisma.$disconnect();
}

runConcurrencyTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
