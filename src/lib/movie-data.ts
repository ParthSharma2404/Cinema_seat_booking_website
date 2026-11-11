export interface CastMember {
  name: string;
  character: string;
  photoUrl: string;
}

export interface MovieExtendedMeta {
  director: string;
  imdbRating: string;
  rottenTomatoes: string;
  audienceScore: string;
  contentRating: string;
  tagline: string;
  backdropUrl: string;
  cast: CastMember[];
}

export const MOVIE_EXTENDED_DATA: Record<string, MovieExtendedMeta> = {
  Interstellar: {
    director: 'Christopher Nolan',
    imdbRating: '8.7',
    rottenTomatoes: '73%',
    audienceScore: '86%',
    contentRating: 'PG-13',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80',
    cast: [
      {
        name: 'Matthew McConaughey',
        character: 'Joseph Cooper',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Anne Hathaway',
        character: 'Dr. Amelia Brand',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Jessica Chastain',
        character: 'Murphy "Murph" Cooper',
        photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Michael Caine',
        character: 'Professor John Brand',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Matt Damon',
        character: 'Dr. Mann',
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
  'Dune: Part Two': {
    director: 'Denis Villeneuve',
    imdbRating: '8.6',
    rottenTomatoes: '92%',
    audienceScore: '95%',
    contentRating: 'PG-13',
    tagline: 'Long live the fighters.',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    cast: [
      {
        name: 'Timothée Chalamet',
        character: 'Paul Atreides',
        photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Zendaya',
        character: 'Chani',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Rebecca Ferguson',
        character: 'Lady Jessica',
        photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Austin Butler',
        character: 'Feyd-Rautha Harkonnen',
        photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Florence Pugh',
        character: 'Princess Irulan',
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
  Oppenheimer: {
    director: 'Christopher Nolan',
    imdbRating: '8.9',
    rottenTomatoes: '93%',
    audienceScore: '91%',
    contentRating: 'R',
    tagline: 'The world forever changes.',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    cast: [
      {
        name: 'Cillian Murphy',
        character: 'J. Robert Oppenheimer',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Emily Blunt',
        character: 'Katherine "Kitty" Oppenheimer',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Matt Damon',
        character: 'Gen. Leslie Groves',
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Robert Downey Jr.',
        character: 'Lewis Strauss',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Florence Pugh',
        character: 'Jean Tatlock',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
  Inception: {
    director: 'Christopher Nolan',
    imdbRating: '8.8',
    rottenTomatoes: '87%',
    audienceScore: '91%',
    contentRating: 'PG-13',
    tagline: 'Your mind is the scene of the crime.',
    backdropUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80',
    cast: [
      {
        name: 'Leonardo DiCaprio',
        character: 'Dom Cobb',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Joseph Gordon-Levitt',
        character: 'Arthur',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Elliot Page',
        character: 'Ariadne',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Tom Hardy',
        character: 'Eames',
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Ken Watanabe',
        character: 'Mr. Saito',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
};

export function getMovieExtendedMeta(title: string): MovieExtendedMeta {
  const match = Object.keys(MOVIE_EXTENDED_DATA).find(
    (key) => key.toLowerCase() === title.toLowerCase() || title.toLowerCase().includes(key.toLowerCase())
  );
  if (match) {
    return MOVIE_EXTENDED_DATA[match];
  }
  // Default fallback
  return {
    director: 'Acclaimed Director',
    imdbRating: '8.5',
    rottenTomatoes: '90%',
    audienceScore: '92%',
    contentRating: 'PG-13',
    tagline: 'Experience the ultimate cinematic spectacle on the grand screen.',
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
    cast: [
      {
        name: 'Lead Actor',
        character: 'Protagonist',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Lead Actress',
        character: 'Co-Star',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Supporting Actor',
        character: 'Antagonist',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      },
    ],
  };
}

