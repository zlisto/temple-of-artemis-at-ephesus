// Themed doors between the Seven Wonders. Keep in sync with ../network.json (make.py regenerates this).
export const WORLDS = {
  great_pyramid: { name: 'Great Pyramid of Giza', short: 'Great Pyramid', address: 'https://zlisto.github.io/great-pyramid-of-giza/' },
  hanging_gardens: { name: 'Hanging Gardens of Babylon', short: 'Hanging Gardens', address: 'https://zlisto.github.io/hanging-gardens-of-babylon/' },
  temple_of_artemis: { name: 'Temple of Artemis at Ephesus', short: 'Temple of Artemis', address: 'https://zlisto.github.io/temple-of-artemis-at-ephesus/' },
  statue_of_zeus: { name: 'Statue of Zeus at Olympia', short: 'Statue of Zeus', address: 'https://zlisto.github.io/statue-of-zeus-at-olympia/' },
  mausoleum: { name: 'Mausoleum at Halicarnassus', short: 'Mausoleum', address: 'https://zlisto.github.io/mausoleum-at-halicarnassus/' },
  colossus_of_rhodes: { name: 'Colossus of Rhodes', short: 'Colossus', address: 'https://zlisto.github.io/colossus-of-rhodes/' },
  lighthouse_of_alexandria: { name: 'Lighthouse of Alexandria', short: 'Lighthouse', address: 'https://zlisto.github.io/lighthouse-of-alexandria/' },
}

export const EDGES = [
  { from: 'great_pyramid', to: 'hanging_gardens', kind: 'tour', sub: 'next stop · tour' },
  { from: 'hanging_gardens', to: 'temple_of_artemis', kind: 'tour', sub: 'next stop · tour' },
  { from: 'temple_of_artemis', to: 'statue_of_zeus', kind: 'tour', sub: 'next stop · tour' },
  { from: 'statue_of_zeus', to: 'mausoleum', kind: 'tour', sub: 'next stop · tour' },
  { from: 'mausoleum', to: 'colossus_of_rhodes', kind: 'tour', sub: 'next stop · tour' },
  { from: 'colossus_of_rhodes', to: 'lighthouse_of_alexandria', kind: 'tour', sub: 'next stop · tour' },
  { from: 'lighthouse_of_alexandria', to: 'great_pyramid', kind: 'tour', sub: 'next stop · tour' },
  { from: 'great_pyramid', to: 'lighthouse_of_alexandria', kind: 'shortcut', sub: 'Egypt · shortcut' },
  { from: 'mausoleum', to: 'temple_of_artemis', kind: 'shortcut', sub: 'coast · shortcut' },
  { from: 'colossus_of_rhodes', to: 'statue_of_zeus', kind: 'shortcut', sub: 'Helios → Zeus' },
]

const COLOR = { tour: '#ffd166', shortcut: '#5fe3d8' }

// Place outgoing doors in a row beside the hub portal, along the opening.
export function doorsOf(worldId, hub) {
  const out = EDGES.filter((e) => e.from === worldId)
  const t = [Math.cos(hub.rot), -Math.sin(hub.rot)] // along the opening
  return out.map((e, i) => {
    const dest = WORLDS[e.to]
    const side = (i + 1) * 3.6 // meters from hub portal center along the frame
    return {
      id: `to_${e.to}`,
      to: e.to,
      label: dest.short,
      href: dest.address,
      spawn: `from_${worldId}`, // land in the destination at its from_<here> spawn
      back: `to_${e.to}`, // Back returns you next to this door
      sub: e.sub,
      kind: e.kind,
      color: COLOR[e.kind] ?? '#ff4fa3',
      x: hub.x + t[0] * side,
      z: hub.z + t[1] * side,
      rot: hub.rot,
    }
  })
}

export function arrivalsOf(worldId) {
  return EDGES.filter((e) => e.to === worldId).map((e) => `from_${e.from}`)
}

// Destinations the guide can send you to (same as the doors, for click-to-go).
export function destinations(worldId) {
  return doorsOf(worldId, { x: 0, z: 0, rot: 0 }).map(({ id, to, label, href, spawn, back, sub, kind }) => ({
    id,
    to,
    label,
    href,
    spawn,
    back,
    sub,
    kind,
  }))
}
