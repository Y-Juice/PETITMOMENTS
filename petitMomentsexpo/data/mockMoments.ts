/**
 * Mock moments: personal stories tied to places. `description` and `imageUrl` are for the detail screen.
 */

export type MomentLocation = {
  /** Short label for lists (e.g. distance or neighbourhood). */
  label: string;
  /** Approximate coordinates for future map use. */
  latitude: number;
  longitude: number;
};

export type Moment = {
  id: string;
  username: string;
  location: MomentLocation;
  title: string;
  description: string;
  imageUrl: string;
  /** Shown on home cards: net score with up (green) or down (red) badge. */
  score: number;
  scoreDirection: 'up' | 'down';
};

export const MOCK_MOMENTS: Moment[] = [
  {
    id: '1',
    username: 'Younes',
    location: {
      label: '200m',
      latitude: 50.8503,
      longitude: 4.3517,
    },
    title: 'Elke keer opnieuw overgeschilderd',
    description:
      'De muur op de hoek van de school werd elk jaar opnieuw beschilderd door verschillende klassen. Ik passeerde er elke dag en zag hoe het verhaal van de buurt veranderde.',
    imageUrl: 'https://picsum.photos/seed/petit1/800/600',
    score: 21,
    scoreDirection: 'up',
  },
  {
    id: '2',
    username: 'Thomas',
    location: {
      label: '250m',
      latitude: 50.851,
      longitude: 4.3525,
    },
    title: 'Het kaartspel tijdens corona',
    description:
      'Op dit bankje speelden we elke vrijdagavond kaart tot de winkels sloten. Regen of niet — het was ons vaste plekje.',
    imageUrl: 'https://picsum.photos/seed/petit2/800/600',
    score: 34,
    scoreDirection: 'up',
  },
  {
    id: '3',
    username: 'Lien',
    location: {
      label: '340m',
      latitude: 50.8495,
      longitude: 4.3505,
    },
    title: 'Sindsdien kijk ik twee keer',
    description:
      'Hier struikelde ik ooit over een losse tegel. Nu let ik op elke voeg in deze straat — een rare gewoonte, maar het herinnert me eraan voorzichtig te zijn.',
    imageUrl: 'https://picsum.photos/seed/petit3/800/600',
    score: 58,
    scoreDirection: 'down',
  },
  {
    id: '4',
    username: 'Thomas',
    location: {
      label: '250m',
      latitude: 50.851,
      longitude: 4.3525,
    },
    title: 'Het kaartspel tijdens corona',
    description:
      'Dezelfde bank, een andere avond: iemand had een thermos met thee mee. Sindsdien was het thee in plaats van koffie.',
    imageUrl: 'https://picsum.photos/seed/petit4/800/600',
    score: 15,
    scoreDirection: 'down',
  },
  {
    id: '5',
    username: 'Sofie',
    location: {
      label: '120m',
      latitude: 50.8508,
      longitude: 4.351,
    },
    title: 'De geur van vers brood om zes uur',
    description:
      'Als de bakker de deur op een kier zet, ruikt de hele straat naar koren. Ik stond hier vaak te wachten op de bus en gebruikte die geur als wekker.',
    imageUrl: 'https://picsum.photos/seed/petit5/800/600',
    score: 9,
    scoreDirection: 'up',
  },
  {
    id: '6',
    username: 'Marc',
    location: {
      label: '480m',
      latitude: 50.848,
      longitude: 4.355,
    },
    title: 'Onder deze boom las ik mijn eerste gedicht voor',
    description:
      'Het was te luid op het plein, dus ik schuilde hier. Een klein publiek van voorbijgangers klapte — meer moest dat niet zijn.',
    imageUrl: 'https://picsum.photos/seed/petit6/800/600',
    score: 42,
    scoreDirection: 'up',
  },
  {
    id: '7',
    username: 'Amina',
    location: {
      label: '1.1km',
      latitude: 50.852,
      longitude: 4.348,
    },
    title: 'De tram die nooit op tijd reed',
    description:
      'Dit perron kende ik uit het hoofd: welke richting welk spoor, waar je uit de wind stond. De vertraging werd onderdeel van het ritme van mijn week.',
    imageUrl: 'https://picsum.photos/seed/petit7/800/600',
    score: 7,
    scoreDirection: 'down',
  },
];
