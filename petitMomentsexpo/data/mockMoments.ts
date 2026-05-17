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
  scoreDirection: "up" | "down";
  /** Supabase auth.users id of the creator. Null voor seed/mock data. */
  ownerId?: string | null;
  /** True = zichtbaar voor iedereen, false = alleen voor de eigenaar. */
  isPublic?: boolean;
};

export const MOCK_MOMENTS: Moment[] = [
  {
    id: "1",
    username: "Younes",
    location: {
      label: "200m",
      latitude: 50.8503,
      longitude: 4.3517,
    },
    title: "Elke keer opnieuw overgeschilderd",
    description:
      "De muur op de hoek van de school werd elk jaar opnieuw beschilderd door verschillende klassen. Ik passeerde er elke dag en zag hoe het verhaal van de buurt veranderde.",
    imageUrl: "https://picsum.photos/seed/petit1/800/600",
    score: 21,
    scoreDirection: "up",
  },
  {
    id: "2",
    username: "Thomas",
    location: {
      label: "250m",
      latitude: 50.851,
      longitude: 4.3525,
    },
    title: "Het kaartspel tijdens corona",
    description:
      "Op dit bankje speelden we elke vrijdagavond kaart tot de winkels sloten. Regen of niet — het was ons vaste plekje.",
    imageUrl: "https://picsum.photos/seed/petit2/800/600",
    score: 34,
    scoreDirection: "up",
  },
  {
    id: "3",
    username: "Lien",
    location: {
      label: "340m",
      latitude: 50.8495,
      longitude: 4.3505,
    },
    title: "Sindsdien kijk ik twee keer",
    description:
      "Hier struikelde ik ooit over een losse tegel. Nu let ik op elke voeg in deze straat — een rare gewoonte, maar het herinnert me eraan voorzichtig te zijn.",
    imageUrl: "https://picsum.photos/seed/petit3/800/600",
    score: 58,
    scoreDirection: "down",
  },
  {
    id: "4",
    username: "Thomas",
    location: {
      label: "250m",
      latitude: 50.851,
      longitude: 4.3525,
    },
    title: "Het kaartspel tijdens corona",
    description:
      "Dezelfde bank, een andere avond: iemand had een thermos met thee mee. Sindsdien was het thee in plaats van koffie.",
    imageUrl: "https://picsum.photos/seed/petit4/800/600",
    score: 15,
    scoreDirection: "down",
  },
  {
    id: "5",
    username: "Sofie",
    location: {
      label: "120m",
      latitude: 50.8508,
      longitude: 4.351,
    },
    title: "De geur van vers brood om zes uur",
    description:
      "Als de bakker de deur op een kier zet, ruikt de hele straat naar koren. Ik stond hier vaak te wachten op de bus en gebruikte die geur als wekker.",
    imageUrl: "https://picsum.photos/seed/petit5/800/600",
    score: 9,
    scoreDirection: "up",
  },
  {
    id: "6",
    username: "Marc",
    location: {
      label: "480m",
      latitude: 50.848,
      longitude: 4.355,
    },
    title: "Onder deze boom las ik mijn eerste gedicht voor",
    description:
      "Het was te luid op het plein, dus ik schuilde hier. Een klein publiek van voorbijgangers klapte — meer moest dat niet zijn.",
    imageUrl: "https://picsum.photos/seed/petit6/800/600",
    score: 42,
    scoreDirection: "up",
  },
  {
    id: "7",
    username: "Amina",
    location: {
      label: "1.1km",
      latitude: 50.852,
      longitude: 4.348,
    },
    title: "De tram die nooit op tijd reed",
    description:
      "Dit perron kende ik uit het hoofd: welke richting welk spoor, waar je uit de wind stond. De vertraging werd onderdeel van het ritme van mijn week.",
    imageUrl: "https://picsum.photos/seed/petit7/800/600",
    score: 7,
    scoreDirection: "down",
  },
  {
    id: "8",
    username: "Elias",
    location: {
      label: "80m",
      latitude: 50.8505,
      longitude: 4.352,
    },
    title: "Hier kreeg ik mijn eerste fietsles",
    description:
      "Mijn vader hield het stuur vast tot ik durfde. Ik val nog steeds elke keer als ik hier passeer — uit gewoonte, niet uit nood.",
    imageUrl: "https://picsum.photos/seed/petit8/800/600",
    score: 19,
    scoreDirection: "up",
  },
  {
    id: "9",
    username: "Nina",
    location: {
      label: "600m",
      latitude: 50.847,
      longitude: 4.3535,
    },
    title: "De fontein waar we nooit in mochten",
    description:
      "Als kind waren we er stiekem toch. Nu drink ik er alleen nog mijn fles water en denk ik aan die ene zomer dat iedereen nat werd.",
    imageUrl: "https://picsum.photos/seed/petit9/800/600",
    score: 31,
    scoreDirection: "up",
  },
  {
    id: "10",
    username: "Joris",
    location: {
      label: "1.4km",
      latitude: 50.8535,
      longitude: 4.345,
    },
    title: "Onder deze brug schreef ik mijn thesis",
    description:
      "Het rook naar regen en beton. Mijn laptop batterij was leeg maar mijn hoofdstuk over architectuur was eindelijk af.",
    imageUrl: "https://picsum.photos/seed/petit10/800/600",
    score: 12,
    scoreDirection: "down",
  },
  {
    id: "11",
    username: "Fatima",
    location: {
      label: "90m",
      latitude: 50.8512,
      longitude: 4.3508,
    },
    title: "Het raam waar de kat altijd lag",
    description:
      "Ik groette hem elke ochtend. Toen de kat weg was, bleef het raam open — alsof de buurt nog op hem wachtte.",
    imageUrl: "https://picsum.photos/seed/petit11/800/600",
    score: 47,
    scoreDirection: "up",
  },
  {
    id: "12",
    username: "Wout",
    location: {
      label: "2km",
      latitude: 50.845,
      longitude: 4.36,
    },
    title: "Mijn eerste kus bij het kanaal",
    description:
      "Het rook naar olie en koud water. We stonden te dicht bij de reling en niemand zei iets slim — dat was het mooiste.",
    imageUrl: "https://picsum.photos/seed/petit12/800/600",
    score: 63,
    scoreDirection: "down",
  },
  {
    id: "13",
    username: "Charlotte",
    location: {
      label: "350m",
      latitude: 50.849,
      longitude: 4.354,
    },
    title: "De winkel waar oma haar hoed kocht",
    description:
      "De zaak is een koffiebar nu, maar het plafond is hetzelfde. Ik bestel een cappuccino en stel me haar voor in de rij.",
    imageUrl: "https://picsum.photos/seed/petit13/800/600",
    score: 26,
    scoreDirection: "up",
  },
  {
    id: "14",
    username: "Daan",
    location: {
      label: "150m",
      latitude: 50.8502,
      longitude: 4.3495,
    },
    title: "Hier speelde ik verstoppertje tot het donker werd",
    description:
      "De garages rookten naar olie en avondeten. Mijn moeder fluitte en ik deed alsof ik niet hoorde — nog één ronde.",
    imageUrl: "https://picsum.photos/seed/petit14/800/600",
    score: 8,
    scoreDirection: "down",
  },
  {
    id: "15",
    username: "Hanne",
    location: {
      label: "750m",
      latitude: 50.8485,
      longitude: 4.357,
    },
    title: "De bank waar ik afscheid nam van de hond",
    description:
      "De dierenarts was om de hoek. We zaten hier nog vijf minuten en ze likte aan mijn hand alsof het gewoon een wandeling was.",
    imageUrl: "https://picsum.photos/seed/petit15/800/600",
    score: 54,
    scoreDirection: "up",
  },
  {
    id: "16",
    username: "Victor",
    location: {
      label: "410m",
      latitude: 50.8518,
      longitude: 4.3512,
    },
    title: "Eerste keer dat ik hier jazz hoorde",
    description:
      "Een straatmuzikant met een scheve hoed. Ik liet een munt vallen en bleef staan tot de laatste noot. Sindsdien loop ik deze kant expres.",
    imageUrl: "https://picsum.photos/seed/petit16/800/600",
    score: 3,
    scoreDirection: "up",
  },
  {
    id: "17",
    username: "Zahra",
    location: {
      label: "55m",
      latitude: 50.8509,
      longitude: 4.3528,
    },
    title: "De stoep waar mijn zus haar tanden verloor",
    description:
      "Ze fietste tegen een paaltje. Bloed en lachen door elkaar. We bewaren die tand nog in een doosje — absurd en lief.",
    imageUrl: "https://picsum.photos/seed/petit17/800/600",
    score: 41,
    scoreDirection: "down",
  },
  {
    id: "18",
    username: "Ruben",
    location: {
      label: "920m",
      latitude: 50.8465,
      longitude: 4.3585,
    },
    title: "Onder deze lantaarn las ik het nieuws van thuis",
    description:
      "Ik had net geen data meer. Eén bar streep en het bericht van mijn vader kwam binnen: alles goed. Ik huilde hier stilletjes.",
    imageUrl: "https://picsum.photos/seed/petit18/800/600",
    score: 28,
    scoreDirection: "up",
  },
  {
    id: "19",
    username: "Elise",
    location: {
      label: "280m",
      latitude: 50.8501,
      longitude: 4.3538,
    },
    title: "Het pleintje waar niemand ooit zit",
    description:
      "Twee bankjes, een kapotte fontein, veel duiven. Ik eet hier mijn broodjes en vind het geruststellend dat het altijd hetzelfde is.",
    imageUrl: "https://picsum.photos/seed/petit19/800/600",
    score: 16,
    scoreDirection: "down",
  },
  {
    id: "20",
    username: "Ken",
    location: {
      label: "1.8km",
      latitude: 50.844,
      longitude: 4.362,
    },
    title: "Hier belde ik mijn ouders: ik ben aangenomen",
    description:
      "Ik schreeuwde het bijna tegen het verkeer. Een buschauffeur knikte alsof hij het begreep. Ik ben die knik nooit vergeten.",
    imageUrl: "https://picsum.photos/seed/petit20/800/600",
    score: 72,
    scoreDirection: "up",
  },
];
