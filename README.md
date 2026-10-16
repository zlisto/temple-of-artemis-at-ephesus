# Temple of Artemis at Ephesus

**Walk it:** https://zlisto.github.io/temple-of-artemis-at-ephesus/

The great marble temple of Artemis at Ephesus, with its forest of Ionic columns. Artebubu the priestess tells its story.

One of seven worlds, one per Wonder of the Ancient World, on the [Metaverse Web](https://github.com/zlisto/metaverse_web): 3D worlds as websites, linked by portals you walk through. A pink portal here leads to [Metaverse Square](https://zlisto.github.io/hub_world/), the plaza with a portal to every world.

Talk to the guide (look at them and click, or press **E**; on a phone, tap **Talk**) for fixed facts about the wonder. W A S D to walk, the mouse to look, Shift to run, Space to jump, Esc to pause.

## Run it locally

```bash
npm install
npm run dev
```

## How it's built

React, Vite, three.js and @react-three/fiber, with everything drawn from simple shapes (no model files).

- `src/wonder.js`: the world's name, the guide's outfit, greeting and facts, the sky and ground, spawn points, the portal, and what you can't walk through.
- `src/Scene.jsx`: the monument and its surroundings.
- `src/kit.jsx`: shared building blocks (columns, steps, roofs, trees, water, boats).
- `src/guide/`: the guide Labubu and the chat; `Labubu.jsx` comes from [evans-hall-3d](https://github.com/zlisto/evans-hall-3d).
- `src/mvw.js`, `src/Portal.jsx`: the Metaverse Web protocol client and portal, the same in every world.
- `public/.well-known/metaverse.json`: the manifest that describes this world to browsers, Metaverse Square and AI agents.

Sizes are scaled down and details simplified; the guide's facts describe the real wonder.
