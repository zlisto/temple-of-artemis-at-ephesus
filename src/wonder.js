// The Temple of Artemis at Ephesus: everything about this world in one place. World.jsx, layout.js,
// the guide and the chat all read from here; Scene.jsx draws the temple.
const HUB = 'https://zlisto.github.io/hub_world/'

// the temple platform (scaled to about half the real 137 × 69 m), entered from the west front (+z here)
export const PLAT = { x0: -19, x1: 19, z0: -36, z1: 36, h: 2.4 }
export const CELLA = { x0: -8, x1: 8, z0: -25, z1: 22, door: 2.6 }
const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))
const ring = (xs, zs) => [...xs.flatMap((x) => [[x, zs[0]], [x, zs[zs.length - 1]]]), ...zs.slice(1, -1).flatMap((z) => [[xs[0], z], [xs[xs.length - 1], z]])]
// a double ring of columns (dipteral), plus a row of porch columns before the door
export const OUTER = ring(lin(-16.5, 16.5, 8), lin(-33, 33, 20))
export const INNER = ring(lin(-11.8, 11.8, 6), lin(-28.5, 28.5, 17))
export const PORCH = lin(-5.6, 5.6, 4).map((x) => [x, 25])
export const ALL_COLUMNS = [...OUTER, ...INNER, ...PORCH]

export default {
  id: 'temple_of_artemis',
  name: 'Temple of Artemis at Ephesus',
  place: 'Ephesus, Ionia · c. 550 BCE',
  blurb: 'Walk through a forest of marble Ionic columns into the great temple of Artemis at Ephesus. Artebubu the priestess will tell you its story, fire and all.',

  guideName: 'Artebubu',
  guideRole: 'priestess of Artemis',
  guideIcon: '🌙',
  greeting: (v) =>
    `Welcome to the house of the goddess${v ? `, ${v}` : ''}! I am Artebubu, priestess of Artemis of the Ephesians. People said that once you'd seen this temple, the other wonders paled beside it. Walk among the columns, then ask me anything.`,
  facts: [
    {
      q: 'Who was the temple for?',
      a: `**Artemis**, Greek goddess of the hunt, the wild and the moon. Here at Ephesus she merged with an older Anatolian mother goddess.

Her famous statue, **Artemis of the Ephesians**, was covered across the chest with rows of rounded shapes. Scholars still debate what they were: breasts, eggs, bull offerings, or decorations on her garment. A version of her stands in the shrine inside.`,
    },
    {
      q: 'Who built it, and when?',
      a: `The great marble temple was begun around **550 BCE**, funded largely by **King Croesus of Lydia**, famous for his wealth. Column bases inscribed with his dedication are now in the British Museum.

Its architects were **Chersiphron** and his son **Metagenes**. Work went on for well over a century.`,
    },
    {
      q: 'How big was it?',
      a: `About **115 m long and 55 m wide** by modern estimates. Pliny the Elder gave 137 by 69 m, about the size of a football field.

It had more than **100 marble columns** (Pliny says 127), each nearly **18 m** tall, some carved with figures around their lower drums. It was one of the first great temples built of marble, and among the largest the Greeks ever built. This one is scaled to about half size.`,
    },
    {
      q: 'Who burned it down?',
      a: `In **356 BCE**, a man named **Herostratus** set it on fire, simply to make his name famous forever.

The Ephesians tried to stop that: they **executed him and banned anyone from saying his name**. It didn't work, since a historian wrote it down. Legend says it burned the same night **Alexander the Great** was born, and Artemis was too busy attending his birth to save her temple.`,
    },
    {
      q: 'Did Alexander the Great help rebuild it?',
      a: `Alexander came through Ephesus in 334 BCE and offered to pay for the rebuilding, if his name was inscribed on it.

According to **Strabo**, the Ephesians declined politely: **it wasn't fitting for one god to dedicate a temple to another god.** They rebuilt it themselves on the same grand plan, raised on an even taller platform.`,
    },
    {
      q: 'Was it only a temple?',
      a: `It was also a place of **asylum**, where people fleeing danger could take refuge, and something like a **bank**: kings, cities and private citizens deposited treasure with the goddess for safekeeping.

The festival of Artemis drew pilgrims from all over the Greek world, and Ephesus grew rich around it.`,
    },
    {
      q: 'What happened to it?',
      a: `The rebuilt temple was damaged in a raid by the **Goths** around 262 CE. As Christianity spread, it fell out of use and was **quarried for its stone**.

Today only foundations remain in a marshy field near Selçuk, Turkey, with **a single column** put back together from scattered pieces, often with a stork's nest on top.`,
    },
  ],

  outfit: {
    fur: '#d8c3a0',
    expression: 'happy',
    shirt: '#f4efe2', // a white chiton
    skirt: '#d9a441', // a saffron overdress
    skirtLength: 0.44,
    trim: '#c0c6cf',
    parts: [['crescent', { a: '#dfe4ea' }], ['quiver'], ['bow']],
  },

  env: { sky: '#a6c8e8', fog: '#d6e0d6', fogNear: 110, fogFar: 430, ground: '#a3ad6e', hemiSky: '#fff4e2', hemiGround: '#6f7d4a', sun: [-40, 70, 50], sunIntensity: 1.7 },
  speed: { walk: 5, run: 9 },
  bound: 115,
  spawn: { x: 0, z: 66, yaw: 0 },
  portal: { x: -9, z: 72, rot: Math.PI, href: HUB, spawn: 'by_temple_of_artemis' },
  guide: { x: 4, z: 61, rot: Math.atan2(-4, 5) },
  platforms: [
    { ...PLAT },
    { x0: -19, x1: 19, z0: 36, z1: 40, h0: 0, h1: 2.4 }, // the front steps, walkable as a ramp
  ],
  boxes: [
    { x0: CELLA.x0 - 0.5, x1: CELLA.x0, z0: CELLA.z0, z1: CELLA.z1 },
    { x0: CELLA.x1, x1: CELLA.x1 + 0.5, z0: CELLA.z0, z1: CELLA.z1 },
    { x0: CELLA.x0 - 0.5, x1: CELLA.x1 + 0.5, z0: CELLA.z0 - 0.5, z1: CELLA.z0 },
    { x0: CELLA.x0 - 0.5, x1: -CELLA.door, z0: CELLA.z1, z1: CELLA.z1 + 0.5 },
    { x0: CELLA.door, x1: CELLA.x1 + 0.5, z0: CELLA.z1, z1: CELLA.z1 + 0.5 },
    { x0: -2.5, x1: 2.5, z0: -20, z1: -14 }, // the shrine of the goddess
  ],
  circles: ALL_COLUMNS.map(([x, z]) => ({ x, z, r: 0.95 })),
  areas: [
    { x: 0, z: -12, r: 7, label: 'before the shrine of Artemis' },
    { x: 0, z: 0, r: 22, label: 'among the columns of the temple' },
  ],
  elsewhere: 'in the sanctuary of Artemis',
}
