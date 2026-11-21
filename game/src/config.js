// Every tuning number and name in one place. The playfield is a fixed 1280x720 logical area;
// the renderer scales it to the window, so no rule below depends on the screen size.
// Each picture panel is 616x560 in scene space; the two panels show the same scene, the right
// one with every difference applied. A difference is a spot in scene space with a click radius.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Two picture panels, side by side under the header. */
export const PANEL = { width: 616, height: 560, y: 68, leftX: 16, rightX: 648, gap: 16 };

/** Header (y 0..60) and footer (y 664..720) bands. */
export const HEADER = { height: 60 };
export const FOOTER = { y: 664, height: 56 };

/** Points for a found difference, a wrong click, a hint, and a scene time bonus. */
export const SCORE = { found: 100, wrong: -5, hint: -25, sceneBonusBase: 300, sceneBonusPerSecond: 2 };

/** Click tolerance around a difference centre, in scene pixels. */
export const CLICK_RADIUS = 34;

/** How long a hint ring pulses around one unfound difference, in seconds. */
export const HINT_SECONDS = 2.5;

/** How long a wrong-click red X stays on screen, in seconds. */
export const FLASH_SECONDS = 0.6;

export const PALETTE = {
  backdrop: '#101623',
  header: '#1a2233',
  panelBorder: '#2c3a52',
  panelLabel: '#0e1522',
  text: '#eef1f5',
  muted: '#8b93a3',
  accent: '#f2c94c',
  good: '#4ade80',
  bad: '#e5534b',
  marker: '#ff3b30',
  markerSoft: 'rgba(255, 59, 48, 0.35)',
  button: '#24304a',
  buttonText: '#eef1f5',
  overlay: 'rgba(10, 14, 24, 0.82)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'pasar-pagi.best';

/**
 * The three scenes. Each difference names what changes between the two pictures and where it
 * sits in scene space; the renderer decides how that change looks in each panel.
 */
export const SCENES = [
  {
    name: 'Pasar Pagi',
    subtitle: 'Morning market',
    diffs: [
      { id: 'cat', label: 'the cat on the counter', x: 470, y: 372, r: 34 },
      { id: 'mango', label: 'a mango in the basket', x: 180, y: 398, r: 30 },
      { id: 'awning', label: 'the awning stripe', x: 308, y: 78, r: 30 },
      { id: 'bell', label: 'the bicycle bell', x: 520, y: 452, r: 22 },
      { id: 'hat', label: "the vendor's hat", x: 308, y: 212, r: 30 },
      { id: 'price', label: 'the price on the sign', x: 120, y: 296, r: 28 },
      { id: 'cloud', label: 'a cloud in the sky', x: 480, y: 150, r: 30 },
    ],
  },
  {
    name: 'Taman Senja',
    subtitle: 'Park at dusk',
    diffs: [
      { id: 'duck', label: 'a duck in the pond', x: 240, y: 505, r: 28 },
      { id: 'lamp', label: 'the lamp glow', x: 500, y: 200, r: 30 },
      { id: 'kite', label: 'the kite colour', x: 140, y: 110, r: 30 },
      { id: 'bench', label: 'a slat on the bench', x: 350, y: 400, r: 28 },
      { id: 'flower', label: 'a tulip in the bed', x: 520, y: 505, r: 26 },
      { id: 'bird', label: 'the bird on the branch', x: 150, y: 230, r: 24 },
      { id: 'apple', label: 'an apple in the tree', x: 170, y: 160, r: 24 },
    ],
  },
  {
    name: 'Pantai Pagi',
    subtitle: 'Beach morning',
    diffs: [
      { id: 'crab', label: 'the crab on the sand', x: 220, y: 500, r: 28 },
      { id: 'sail', label: 'the sail colour', x: 430, y: 285, r: 30 },
      { id: 'shell', label: 'a shell on the sand', x: 500, y: 520, r: 24 },
      { id: 'coconut', label: 'a coconut on the palm', x: 150, y: 220, r: 24 },
      { id: 'umbrella', label: 'the umbrella stripe', x: 480, y: 400, r: 30 },
      { id: 'bucket', label: 'the bucket colour', x: 330, y: 480, r: 28 },
      { id: 'starfish', label: 'the starfish', x: 560, y: 470, r: 26 },
    ],
  },
];
