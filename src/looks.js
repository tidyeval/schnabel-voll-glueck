// Pip's colours, chosen in the wardrobe. Preset swatches instead of a free colour picker,
// so Pip always stays readable against sky and water (no teal or deep blue plumage).
// Each entry is the full set of shades pelican() needs; `swatch` is what the wardrobe shows.

export const PLUMAGES = {
  white: { swatch: '#fffaf0', flight: ['#fffbed', '#d1dfca'], back: '#dce7d3', quill: '#b7cbb2', tail: '#d8e3ce', body: ['#fffaf0', '#dce6d0'], head: ['#fffdf2', '#ecedd7'], wing: ['#f3f5e4', '#ccdcca'], lines: ['#c1d3c0', '#b4c9b7'] },
  rose: { swatch: '#f6d2d8', tail: '#efc4cb', body: ['#ffeef0', '#f3c9cf'], head: ['#fff3f4', '#f6d6da'], wing: ['#fbe3e6', '#e8b5bd'], lines: ['#e3aab3', '#d99ea8'] },
  sun: { swatch: '#f5e4a8', tail: '#eedc9f', body: ['#fff8dc', '#f3e1a6'], head: ['#fffbe6', '#f5e8b8'], wing: ['#fbf1c8', '#e6d28e'], lines: ['#dcc782', '#d1bb72'] },
  lilac: { swatch: '#e2d8f3', tail: '#d8cdec', body: ['#f6f1ff', '#ddd2f0'], head: ['#f9f5ff', '#e6ddf4'], wing: ['#efe8fb', '#cfc1e8'], lines: ['#c4b5e0', '#b9a9d8'] },
  stone: { swatch: '#d9d4ca', tail: '#c9c3b7', body: ['#f1efea', '#cfcac0'], head: ['#f6f4ef', '#dcd8cf'], wing: ['#e6e2da', '#bdb6a8'], lines: ['#b0a898', '#a59d8c'] },
};

export const BEAKS = {
  orange: { swatch: '#efb75f', pouch: ['#f3c574', '#dc9758'], edge: '#bd774b', shine: '#f8d79055', upper: ['#ffe19a', '#efb75f'], line: '#b8764c' },
  coral: { swatch: '#ef8f78', pouch: ['#f5a58f', '#e07a68'], edge: '#b65a4c', shine: '#ffd2c455', upper: ['#ffc0ad', '#ef8f78'], line: '#b4604f' },
  pink: { swatch: '#f0a0b7', pouch: ['#f7b3c6', '#e389a3'], edge: '#b8667f', shine: '#ffd9e455', upper: ['#ffd0dd', '#f0a0b7'], line: '#b46a80' },
  lemon: { swatch: '#f1d86a', pouch: ['#f6e27f', '#e3c252'], edge: '#b8973a', shine: '#fff2b055', upper: ['#fff0a6', '#f1d86a'], line: '#b39439' },
  lilac: { swatch: '#bba6e6', pouch: ['#c8b4ec', '#a88fd8'], edge: '#7f67ad', shine: '#e9ddff55', upper: ['#ddd0f7', '#bba6e6'], line: '#7d66aa' },
};

// The raised wings use their own shades on white Pip; tinted plumages reuse the folded-wing shades.
export const plumageOf = id => {
  const p = PLUMAGES[id] || PLUMAGES.white;
  return { flight: p.wing, back: p.tail, quill: p.lines[1], ...p };
};
export const beakOf = id => BEAKS[id] || BEAKS.orange;

// The Hawaiian shirt: worn with any head accessory; its colour (or 'none') is chosen like feathers and beak.
// `print` is the hibiscus flower, `leaf` the leaves between them.
export const SHIRTS = {
  coral: { swatch: '#ef8a6f', cloth: ['#f49a7f', '#dc7458'], print: '#fff1c9', leaf: '#5f9e6e', edge: '#b85d47' },
  sky: { swatch: '#6fb4dd', cloth: ['#82c2e6', '#5299c6'], print: '#fff6dc', leaf: '#f2c45e', edge: '#3f7aa0' },
  sun: { swatch: '#f3c955', cloth: ['#f7d773', '#e5b53e'], print: '#e9765f', leaf: '#5f9e6e', edge: '#b88a2e' },
  mint: { swatch: '#7fc9a6', cloth: ['#93d6b6', '#62b18c'], print: '#f9b0c3', leaf: '#3f7f61', edge: '#4a8f6f' },
  lilac: { swatch: '#b7a1e2', cloth: ['#c7b5ec', '#9f87d2'], print: '#fff1c9', leaf: '#6f9e70', edge: '#7a64ab' },
};
export const shirtOf = id => SHIRTS[id] || SHIRTS.coral;
