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
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Matthew_McConaughey_-_2019_%28cropped%29.jpg/440px-Matthew_McConaughey_-_2019_%28cropped%29.jpg',
      },
      {
        name: 'Anne Hathaway',
        character: 'Dr. Amelia Brand',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Anne_Hathaway_at_The_Intern_premiere_in_London_%28cropped%29.jpg/440px-Anne_Hathaway_at_The_Intern_premiere_in_London_%28cropped%29.jpg',
      },
      {
        name: 'Jessica Chastain',
        character: 'Murphy "Murph" Cooper',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Jessica_Chastain_Cannes_2016_2.jpg/440px-Jessica_Chastain_Cannes_2016_2.jpg',
      },
      {
        name: 'Michael Caine',
        character: 'Professor John Brand',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Michael_Caine_at_the_Karlovy_Vary_International_Film_Festival_%28cropped%29.jpg/440px-Michael_Caine_at_the_Karlovy_Vary_International_Film_Festival_%28cropped%29.jpg',
      },
      {
        name: 'Matt Damon',
        character: 'Dr. Mann',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Matt_Damon_TIFF_2015.jpg/440px-Matt_Damon_TIFF_2015.jpg',
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
        photoUrl: '/cast/timothee.jpg',
      },
      {
        name: 'Zendaya',
        character: 'Chani',
        photoUrl: '/cast/zendaya.jpg',
      },
      {
        name: 'Rebecca Ferguson',
        character: 'Lady Jessica',
        photoUrl: '/cast/rebecca.jpg',
      },
      {
        name: 'Austin Butler',
        character: 'Feyd-Rautha Harkonnen',
        photoUrl: '/cast/austin.jpg',
      },
      {
        name: 'Florence Pugh',
        character: 'Princess Irulan',
        photoUrl: '/cast/florence.jpg',
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
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cillian_Murphy_Press_Conference_The_Party_Berlinale_2017_02_%28cropped%29.jpg/440px-Cillian_Murphy_Press_Conference_The_Party_Berlinale_2017_02_%28cropped%29.jpg',
      },
      {
        name: 'Emily Blunt',
        character: 'Katherine "Kitty" Oppenheimer',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Emily_Blunt_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg/440px-Emily_Blunt_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg',
      },
      {
        name: 'Matt Damon',
        character: 'Gen. Leslie Groves',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Matt_Damon_TIFF_2015.jpg/440px-Matt_Damon_TIFF_2015.jpg',
      },
      {
        name: 'Robert Downey Jr.',
        character: 'Lewis Strauss',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg/440px-Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg',
      },
      {
        name: 'Florence Pugh',
        character: 'Jean Tatlock',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Florence_Pugh_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg/440px-Florence_Pugh_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg',
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
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Leonardo_DiCaprio_2014.jpg/440px-Leonardo_DiCaprio_2014.jpg',
      },
      {
        name: 'Joseph Gordon-Levitt',
        character: 'Arthur',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Joseph_Gordon-Levitt_2013.jpg/440px-Joseph_Gordon-Levitt_2013.jpg',
      },
      {
        name: 'Elliot Page',
        character: 'Ariadne',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Elliot_Page_in_2019.jpg/440px-Elliot_Page_in_2019.jpg',
      },
      {
        name: 'Tom Hardy',
        character: 'Eames',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Tom_Hardy_by_Gage_Skidmore.jpg/440px-Tom_Hardy_by_Gage_Skidmore.jpg',
      },
      {
        name: 'Ken Watanabe',
        character: 'Mr. Saito',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Ken_Watanabe_2014.jpg/440px-Ken_Watanabe_2014.jpg',
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
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Matthew_McConaughey_-_2019_%28cropped%29.jpg/440px-Matthew_McConaughey_-_2019_%28cropped%29.jpg',
      },
      {
        name: 'Lead Actress',
        character: 'Co-Star',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Anne_Hathaway_at_The_Intern_premiere_in_London_%28cropped%29.jpg/440px-Anne_Hathaway_at_The_Intern_premiere_in_London_%28cropped%29.jpg',
      },
      {
        name: 'Supporting Actor',
        character: 'Antagonist',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Michael_Caine_at_the_Karlovy_Vary_International_Film_Festival_%28cropped%29.jpg/440px-Michael_Caine_at_the_Karlovy_Vary_International_Film_Festival_%28cropped%29.jpg',
      },
    ],
  };
}
