const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Cinema Hall Ticket Booking System database...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seatHold.deleteMany();
  await prisma.show.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.theatre.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@cinema.com',
      passwordHash: adminPasswordHash,
      fullName: 'Cinema Administrator',
      role: 'ADMIN',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@cinema.com',
      passwordHash: staffPasswordHash,
      fullName: 'Gate Staff Operator',
      role: 'STAFF',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@cinema.com',
      passwordHash,
      fullName: 'Alex Rivera',
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      passwordHash,
      fullName: 'Jane Doe',
      role: 'CUSTOMER',
    },
  });

  console.log('Created Users: Admin, Staff, and Customers.');

  // 3. Create Theatre & Screens
  const theatre = await prisma.theatre.create({
    data: {
      name: 'Starlight Grand Multiplex',
      city: 'Metropolis',
      address: '450 Boulevard Avenue, Entertainment District',
    },
  });

  const screen1 = await prisma.screen.create({
    data: {
      theatreId: theatre.id,
      name: 'Screen 1 - IMAX with Laser',
      totalSeats: 50,
    },
  });

  const screen2 = await prisma.screen.create({
    data: {
      theatreId: theatre.id,
      name: 'Screen 2 - Dolby Atmos Cinema',
      totalSeats: 40,
    },
  });

  console.log('Created Theatre and Screens.');

  // 4. Generate Seats for Screen 1 (50 seats: Rows A-E, 10 seats each)
  const rows1 = [
    { row: 'A', cat: 'SILVER', mult: 1.0 },
    { row: 'B', cat: 'SILVER', mult: 1.0 },
    { row: 'C', cat: 'GOLD', mult: 1.3 },
    { row: 'D', cat: 'GOLD', mult: 1.3 },
    { row: 'E', cat: 'VIP_RECLINER', mult: 1.8 },
  ];

  for (const r of rows1) {
    for (let num = 1; num <= 10; num++) {
      await prisma.seat.create({
        data: {
          screenId: screen1.id,
          rowName: r.row,
          seatNumber: num,
          category: r.cat,
          priceMultiplier: r.mult,
        },
      });
    }
  }

  // Generate Seats for Screen 2 (40 seats: Rows A-D, 10 seats each)
  const rows2 = [
    { row: 'A', cat: 'SILVER', mult: 1.0 },
    { row: 'B', cat: 'SILVER', mult: 1.0 },
    { row: 'C', cat: 'GOLD', mult: 1.3 },
    { row: 'D', cat: 'VIP_RECLINER', mult: 1.6 },
  ];

  for (const r of rows2) {
    for (let num = 1; num <= 10; num++) {
      await prisma.seat.create({
        data: {
          screenId: screen2.id,
          rowName: r.row,
          seatNumber: num,
          category: r.cat,
          priceMultiplier: r.mult,
        },
      });
    }
  }

  console.log('Generated 90 Seats across 2 Screens with Silver, Gold, and Recliner tiers.');

  // 5. Create Movies with verified cinematic high-res posters
  const movieDune = await prisma.movie.create({
    data: {
      title: 'Dune: Part Two',
      description:
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between the love of his life and the fate of the universe.',
      durationMins: 166,
      language: 'English',
      genre: 'Sci-Fi / Adventure',
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      rating: 'PG-13',
      releaseDate: new Date('2026-03-01'),
    },
  });

  const movieOppenheimer = await prisma.movie.create({
    data: {
      title: 'Oppenheimer',
      description:
        'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
      durationMins: 180,
      language: 'English',
      genre: 'Biography / Drama / History',
      posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      rating: 'R',
      releaseDate: new Date('2026-02-15'),
    },
  });

  const movieInterstellar = await prisma.movie.create({
    data: {
      title: 'Interstellar',
      description:
        'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.',
      durationMins: 169,
      language: 'English',
      genre: 'Sci-Fi / Adventure',
      posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=80',
      rating: 'PG-13',
      releaseDate: new Date('2026-01-10'),
    },
  });

  const movieInception = await prisma.movie.create({
    data: {
      title: 'Inception',
      description:
        'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      durationMins: 148,
      language: 'English',
      genre: 'Action / Sci-Fi',
      posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
      rating: 'PG-13',
      releaseDate: new Date('2026-02-01'),
    },
  });

  console.log('Created Movies.');

  // 6. Schedule Shows
  const today = new Date();
  
  // Show 1: Dune in IMAX today at 6:00 PM
  const show1Start = new Date(today);
  show1Start.setHours(18, 0, 0, 0);
  const show1End = new Date(today);
  show1End.setHours(20, 50, 0, 0);

  const show1 = await prisma.show.create({
    data: {
      movieId: movieDune.id,
      screenId: screen1.id,
      startTime: show1Start,
      endTime: show1End,
      basePrice: 350,
      format: 'IMAX',
    },
  });

  // Show 2: Dune in IMAX today at 9:30 PM
  const show2Start = new Date(today);
  show2Start.setHours(21, 30, 0, 0);
  const show2End = new Date(today);
  show2End.setHours(23, 59, 0, 0);

  const show2 = await prisma.show.create({
    data: {
      movieId: movieDune.id,
      screenId: screen1.id,
      startTime: show2Start,
      endTime: show2End,
      basePrice: 350,
      format: 'IMAX',
    },
  });

  // Show 3: Oppenheimer in Screen 2 today at 7:00 PM
  const show3Start = new Date(today);
  show3Start.setHours(19, 0, 0, 0);
  const show3End = new Date(today);
  show3End.setHours(22, 0, 0, 0);

  const show3 = await prisma.show.create({
    data: {
      movieId: movieOppenheimer.id,
      screenId: screen2.id,
      startTime: show3Start,
      endTime: show3End,
      basePrice: 280,
      format: '2D',
    },
  });

  // Show 4: Interstellar in Screen 1 tomorrow at 4:00 PM
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const show4Start = new Date(tomorrow);
  show4Start.setHours(16, 0, 0, 0);
  const show4End = new Date(tomorrow);
  show4End.setHours(18, 50, 0, 0);

  const show4 = await prisma.show.create({
    data: {
      movieId: movieInterstellar.id,
      screenId: screen1.id,
      startTime: show4Start,
      endTime: show4End,
      basePrice: 300,
      format: 'IMAX',
    },
  });

  // Show 5: Inception in Screen 2 tomorrow at 7:30 PM
  const show5Start = new Date(tomorrow);
  show5Start.setHours(19, 30, 0, 0);
  const show5End = new Date(tomorrow);
  show5End.setHours(22, 10, 0, 0);

  const show5 = await prisma.show.create({
    data: {
      movieId: movieInception.id,
      screenId: screen2.id,
      startTime: show5Start,
      endTime: show5End,
      basePrice: 320,
      format: '4K DOLBY',
    },
  });

  // Show 6: Dune Part Two in Screen 1 tomorrow at 8:00 PM
  const show6Start = new Date(tomorrow);
  show6Start.setHours(20, 0, 0, 0);
  const show6End = new Date(tomorrow);
  show6End.setHours(22, 50, 0, 0);

  await prisma.show.create({
    data: {
      movieId: movieDune.id,
      screenId: screen1.id,
      startTime: show6Start,
      endTime: show6End,
      basePrice: 350,
      format: 'IMAX',
    },
  });

  console.log('Created Shows.');

  // 7. Seed Sample Bookings & Digital Tickets
  const allScreen1Seats = await prisma.seat.findMany({ where: { screenId: screen1.id } });
  const seatC4 = allScreen1Seats.find((s) => s.rowName === 'C' && s.seatNumber === 4);
  const seatC5 = allScreen1Seats.find((s) => s.rowName === 'C' && s.seatNumber === 5);

  if (seatC4 && seatC5) {
    const booking1 = await prisma.booking.create({
      data: {
        bookingReference: 'BK-DEMO01',
        userId: customer1.id,
        showId: show1.id,
        totalAmount: 910,
        status: 'CONFIRMED',
        bookingSeats: {
          create: [
            { seatId: seatC4.id, price: 455, activeShowSeatKey: `${show1.id}_${seatC4.id}` },
            { seatId: seatC5.id, price: 455, activeShowSeatKey: `${show1.id}_${seatC5.id}` },
          ],
        },
      },
    });

    await prisma.ticket.create({
      data: {
        bookingId: booking1.id,
        qrValidationToken: 'TCK-DEMO-VAL1',
        validationStatus: 'VALID',
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking1.id,
        transactionReference: 'TXN-DEMO-001',
        amount: 910,
        method: 'SIMULATED_CARD',
        status: 'SUCCESS',
        gatewayResponse: '{"status":"AUTHORIZED","sandbox":true}',
      },
    });
  }

  // Pre-seed a cancelled booking with simulated refund
  const seatA1 = allScreen1Seats.find((s) => s.rowName === 'A' && s.seatNumber === 1);
  if (seatA1) {
    const booking2 = await prisma.booking.create({
      data: {
        bookingReference: 'BK-CANCELLED',
        userId: customer2.id,
        showId: show1.id,
        totalAmount: 350,
        status: 'CANCELLED',
        cancellationReason: 'Personal schedule conflict',
        cancelledAt: new Date(),
        refundStatus: 'COMPLETED',
        refundAmount: 350,
        bookingSeats: {
          create: [{ seatId: seatA1.id, price: 350, activeShowSeatKey: null }],
        },
      },
    });

    await prisma.ticket.create({
      data: {
        bookingId: booking2.id,
        qrValidationToken: 'TCK-DEMO-CANCELLED',
        validationStatus: 'CANCELLED',
      },
    });
  }

  console.log('Database successfully re-seeded with verified cinematic posters!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
