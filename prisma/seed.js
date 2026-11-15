const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Supabase PostgreSQL database with batch optimizations...');

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
  await prisma.castMember.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@cinema.com',
        passwordHash: adminPasswordHash,
        fullName: 'Cinema Administrator',
        role: 'ADMIN',
      },
      {
        email: 'staff@cinema.com',
        passwordHash: staffPasswordHash,
        fullName: 'Gate Staff Operator',
        role: 'STAFF',
      },
      {
        email: 'customer@cinema.com',
        passwordHash,
        fullName: 'Alex Rivera',
        role: 'CUSTOMER',
      },
      {
        email: 'jane@example.com',
        passwordHash,
        fullName: 'Jane Doe',
        role: 'CUSTOMER',
      },
    ],
  });

  console.log('Created Users.');

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
      totalSeats: 80,
    },
  });

  const screen2 = await prisma.screen.create({
    data: {
      theatreId: theatre.id,
      name: 'Screen 2 - Dolby Atmos Cinema',
      totalSeats: 80,
    },
  });

  console.log('Created Theatre and Screens.');

  // 4. Batch Generate Seats for Screen 1 & 2 (160 seats total)
  const rows = [
    { row: 'A', cat: 'SILVER', mult: 1.0 },
    { row: 'B', cat: 'SILVER', mult: 1.0 },
    { row: 'C', cat: 'GOLD', mult: 1.3 },
    { row: 'D', cat: 'GOLD', mult: 1.3 },
    { row: 'E', cat: 'GOLD', mult: 1.3 },
    { row: 'F', cat: 'GOLD', mult: 1.3 },
    { row: 'G', cat: 'VIP_RECLINER', mult: 1.8 },
    { row: 'H', cat: 'VIP_RECLINER', mult: 1.8 },
  ];

  const seatsData = [];
  for (const sId of [screen1.id, screen2.id]) {
    for (const r of rows) {
      for (let num = 1; num <= 10; num++) {
        seatsData.push({
          screenId: sId,
          rowName: r.row,
          seatNumber: num,
          category: r.cat,
          priceMultiplier: r.mult,
        });
      }
    }
  }

  await prisma.seat.createMany({ data: seatsData });
  console.log(`Generated ${seatsData.length} Seats across 2 Screens with Silver, Gold, and VIP Recliner tiers.`);

  // 5. Create Movies with verified cinematic high-res posters, backdrops, and Cast
  const movieDune = await prisma.movie.create({
    data: {
      title: 'Dune: Part Two',
      description:
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between the love of his life and the fate of the universe.',
      durationMins: 166,
      language: 'English',
      genre: 'Sci-Fi / Adventure',
      posterUrl: '/posters/dune-poster.jpg',
      backdropUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1920&auto=format&fit=crop&q=85',
      rating: 'PG-13',
      releaseDate: new Date('2026-03-01'),
      cast: {
        create: [
          {
            name: 'Timothée Chalamet',
            character: 'Paul Atreides',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            order: 1,
          },
          {
            name: 'Zendaya',
            character: 'Chani',
            photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
            order: 2,
          },
          {
            name: 'Rebecca Ferguson',
            character: 'Lady Jessica',
            photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
            order: 3,
          },
          {
            name: 'Javier Bardem',
            character: 'Stilgar',
            photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
            order: 4,
          },
          {
            name: 'Austin Butler',
            character: 'Feyd-Rautha',
            photoUrl: null, // Demonstrating optional photo (falls back to initials avatar)
            order: 5,
          },
        ],
      },
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
      posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1516339901601-2e1562986307?w=1920&auto=format&fit=crop&q=85',
      rating: 'R',
      releaseDate: new Date('2026-02-15'),
      cast: {
        create: [
          {
            name: 'Cillian Murphy',
            character: 'J. Robert Oppenheimer',
            photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
            order: 1,
          },
          {
            name: 'Emily Blunt',
            character: 'Katherine "Kitty" Oppenheimer',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            order: 2,
          },
          {
            name: 'Matt Damon',
            character: 'Leslie Groves',
            photoUrl: null,
            order: 3,
          },
          {
            name: 'Robert Downey Jr.',
            character: 'Lewis Strauss',
            photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
            order: 4,
          },
        ],
      },
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
      backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&auto=format&fit=crop&q=85',
      rating: 'PG-13',
      releaseDate: new Date('2026-01-10'),
      cast: {
        create: [
          {
            name: 'Matthew McConaughey',
            character: 'Cooper',
            photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
            order: 1,
          },
          {
            name: 'Anne Hathaway',
            character: 'Brand',
            photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
            order: 2,
          },
          {
            name: 'Jessica Chastain',
            character: 'Murph',
            photoUrl: null,
            order: 3,
          },
        ],
      },
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
      backdropUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&auto=format&fit=crop&q=85',
      rating: 'PG-13',
      releaseDate: new Date('2026-02-01'),
      cast: {
        create: [
          {
            name: 'Leonardo DiCaprio',
            character: 'Dom Cobb',
            photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
            order: 1,
          },
          {
            name: 'Joseph Gordon-Levitt',
            character: 'Arthur',
            photoUrl: null,
            order: 2,
          },
          {
            name: 'Elliot Page',
            character: 'Ariadne',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            order: 3,
          },
        ],
      },
    },
  });

  console.log('Created Movies with Backdrops and Cast Members.');

  // 6. Batch Schedule Shows for Today and Next 7 Days
  const movies = [movieDune, movieOppenheimer, movieInterstellar, movieInception];
  const showTimeslots = [
    { hour: 13, min: 30, basePrice: 280, format: 'IMAX' },
    { hour: 16, min: 45, basePrice: 320, format: 'IMAX' },
    { hour: 19, min: 30, basePrice: 380, format: 'IMAX' },
    { hour: 22, min: 15, basePrice: 350, format: 'IMAX' },
  ];

  const showTimeslotsScreen2 = [
    { hour: 14, min: 0, basePrice: 260, format: 'DOLBY_ATMOS' },
    { hour: 17, min: 15, basePrice: 300, format: 'DOLBY_ATMOS' },
    { hour: 20, min: 0, basePrice: 340, format: 'DOLBY_ATMOS' },
    { hour: 22, min: 45, basePrice: 300, format: 'DOLBY_ATMOS' },
  ];

  const showsData = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);

    for (let slotIdx = 0; slotIdx < showTimeslots.length; slotIdx++) {
      const slot = showTimeslots[slotIdx];
      const start = new Date(targetDate);
      start.setHours(slot.hour, slot.min, 0, 0);

      const end = new Date(start);
      end.setHours(start.getHours() + 2, start.getMinutes() + 45, 0, 0);

      const movie = movies[(dayOffset + slotIdx) % movies.length];

      showsData.push({
        movieId: movie.id,
        screenId: screen1.id,
        startTime: start,
        endTime: end,
        basePrice: slot.basePrice,
        format: slot.format,
      });
    }

    for (let slotIdx = 0; slotIdx < showTimeslotsScreen2.length; slotIdx++) {
      const slot = showTimeslotsScreen2[slotIdx];
      const start = new Date(targetDate);
      start.setHours(slot.hour, slot.min, 0, 0);

      const end = new Date(start);
      end.setHours(start.getHours() + 2, start.getMinutes() + 30, 0, 0);

      const movie = movies[(dayOffset + slotIdx + 2) % movies.length];

      showsData.push({
        movieId: movie.id,
        screenId: screen2.id,
        startTime: start,
        endTime: end,
        basePrice: slot.basePrice,
        format: slot.format,
      });
    }
  }

  await prisma.show.createMany({ data: showsData });
  console.log(`Scheduled ${showsData.length} Shows across 7 upcoming days.`);
  console.log('Seeding complete! Database is 100% ready on Supabase PostgreSQL.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
