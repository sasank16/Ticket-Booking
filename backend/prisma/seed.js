"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('?? Seeding database with realistic movie & concert data...');
    // 1. Create Users
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@seatswift.com' },
        update: {},
        create: {
            name: 'System Admin',
            email: 'admin@seatswift.com',
            password: passwordHash,
            role: 'ADMIN',
        },
    });
    const organiser = await prisma.user.upsert({
        where: { email: 'organiser@seatswift.com' },
        update: {},
        create: {
            name: 'Grand Arena Events',
            email: 'organiser@seatswift.com',
            password: passwordHash,
            role: 'ORGANISER',
        },
    });
    const customer1 = await prisma.user.upsert({
        where: { email: 'customer@seatswift.com' },
        update: {},
        create: {
            name: 'Alex Johnson',
            email: 'customer@seatswift.com',
            password: passwordHash,
            role: 'CUSTOMER',
        },
    });
    const customer2 = await prisma.user.upsert({
        where: { email: 'sarah@seatswift.com' },
        update: {},
        create: {
            name: 'Sarah Miller',
            email: 'sarah@seatswift.com',
            password: passwordHash,
            role: 'CUSTOMER',
        },
    });
    console.log('? Users seeded: admin@seatswift.com, organiser@seatswift.com, customer@seatswift.com (Password: password123)');
    // 2. Create Venues
    const venue1 = await prisma.venue.create({
        data: {
            name: 'IMAX Grand Dolby Theatre',
            city: 'San Francisco',
            address: '780 Mission St, San Francisco, CA',
            totalRows: 6,
            totalCols: 10,
        },
    });
    // Create 60 seats for Venue 1
    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const venue1SeatsData = [];
    for (let r = 0; r < 6; r++) {
        const row = rowLetters[r];
        let category = 'STANDARD';
        if (r === 0 || r === 1)
            category = 'VIP';
        else if (r === 2 || r === 3)
            category = 'PREMIUM';
        for (let c = 1; c <= 10; c++) {
            venue1SeatsData.push({
                venueId: venue1.id,
                row,
                col: c,
                seatNumber: `${row}${c}`,
                category,
                isActive: true,
            });
        }
    }
    await prisma.venueSeat.createMany({ data: venue1SeatsData });
    const venue2 = await prisma.venue.create({
        data: {
            name: 'Skyline Arena Concert Hall',
            city: 'New York',
            address: '4 Pennsylvania Plaza, New York, NY',
            totalRows: 5,
            totalCols: 8,
        },
    });
    const venue2SeatsData = [];
    for (let r = 0; r < 5; r++) {
        const row = rowLetters[r];
        let category = r < 2 ? 'VIP' : (r === 2 ? 'PREMIUM' : 'STANDARD');
        for (let c = 1; c <= 8; c++) {
            venue2SeatsData.push({
                venueId: venue2.id,
                row,
                col: c,
                seatNumber: `${row}${c}`,
                category,
                isActive: true,
            });
        }
    }
    await prisma.venueSeat.createMany({ data: venue2SeatsData });
    console.log('? Venues & Visual Seat Layouts created.');
    // 3. Create Events
    const event1 = await prisma.event.create({
        data: {
            title: 'Dune: Part Two (IMAX 70mm Experience)',
            description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
            category: 'MOVIE',
            bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
            durationMinutes: 166,
            venueId: venue1.id,
            organiserId: organiser.id,
        },
    });
    const event2 = await prisma.event.create({
        data: {
            title: 'Coldplay: Music of the Spheres World Tour',
            description: 'Experience the breathtaking spectacle, lasers, wristbands, and greatest hits live under the arena stars.',
            category: 'CONCERT',
            bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
            durationMinutes: 150,
            venueId: venue2.id,
            organiserId: organiser.id,
        },
    });
    const event3 = await prisma.event.create({
        data: {
            title: 'Interstellar: 10th Anniversary Live Orchestra',
            description: 'Hans Zimmers iconic organ score performed live alongside the masterpiece projected in crisp 4K laser.',
            category: 'CONCERT',
            bannerUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1000&auto=format&fit=crop',
            durationMinutes: 180,
            venueId: venue1.id,
            organiserId: organiser.id,
        },
    });
    console.log('? Events created.');
    // 4. Create Showtimes and instantiate ShowSeats
    const tomorrow7PM = new Date();
    tomorrow7PM.setDate(tomorrow7PM.getDate() + 1);
    tomorrow7PM.setHours(19, 0, 0, 0);
    const tomorrow10PM = new Date();
    tomorrow10PM.setDate(tomorrow10PM.getDate() + 1);
    tomorrow10PM.setHours(22, 0, 0, 0);
    const showtime1 = await prisma.showtime.create({
        data: {
            eventId: event1.id,
            startTime: tomorrow7PM,
            endTime: new Date(tomorrow7PM.getTime() + 166 * 60000),
            holdTtlMinutes: 10,
            pricing: JSON.stringify({ VIP: 35, PREMIUM: 25, STANDARD: 18 }),
        },
    });
    const v1Seats = await prisma.venueSeat.findMany({ where: { venueId: venue1.id } });
    const prices1 = { VIP: 35, PREMIUM: 25, STANDARD: 18 };
    await prisma.showSeat.createMany({
        data: v1Seats.map((vs) => ({
            showtimeId: showtime1.id,
            venueSeatId: vs.id,
            seatNumber: vs.seatNumber,
            row: vs.row,
            col: vs.col,
            category: vs.category,
            price: prices1[vs.category] || 18,
            status: 'AVAILABLE',
        })),
    });
    const showtime2 = await prisma.showtime.create({
        data: {
            eventId: event2.id,
            startTime: tomorrow10PM,
            endTime: new Date(tomorrow10PM.getTime() + 150 * 60000),
            holdTtlMinutes: 10,
            pricing: JSON.stringify({ VIP: 120, PREMIUM: 75, STANDARD: 45 }),
        },
    });
    const v2Seats = await prisma.venueSeat.findMany({ where: { venueId: venue2.id } });
    const prices2 = { VIP: 120, PREMIUM: 75, STANDARD: 45 };
    await prisma.showSeat.createMany({
        data: v2Seats.map((vs) => ({
            showtimeId: showtime2.id,
            venueSeatId: vs.id,
            seatNumber: vs.seatNumber,
            row: vs.row,
            col: vs.col,
            category: vs.category,
            price: prices2[vs.category] || 45,
            status: 'AVAILABLE',
        })),
    });
    console.log('? Showtimes and ShowSeats initialized with live pricing.');
    console.log('?? Database seeding complete!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
