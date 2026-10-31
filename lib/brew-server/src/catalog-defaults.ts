import type { Product, Bundle } from "@workspace/brew-catalog";

// Server-only input to the explicit seed script; never used as a runtime fallback.
export const products: Product[] = [
  { id: 'xbloom', name: 'xBloom Studio', price: 199, category: 'machine', image: 'xbloom-photo', description: 'A complete pour-over system, tuned to your recipe.', why: 'It grinds, weighs, and pours following a programmed recipe, so every variable has a place.' },
  { id: 'fellow-aiden', name: 'Fellow Aiden Precision Coffee Maker', price: 129, category: 'machine', image: 'aiden-photo', description: 'Precision brewing, with the ease of a morning button.', why: 'It controls water temperature and timing for each brew stage, bringing repeatability to batch coffee.' },
  { id: 'moccamaster', name: 'Moccamaster 10-Cup Coffee Maker', price: 100, category: 'machine', image: 'moccamaster-photo', description: 'A considered classic for cups shared around the table.', why: 'A copper heating element maintains brew temperature for a steady, balanced extraction.' },
  { id: 'eureka-filtro', name: 'Eureka Filtro grinder', price: 89, category: 'machine', image: 'eureka-photo', description: 'A dedicated filter grinder with a quietly capable motor.', why: 'Flat steel burrs produce even grounds across the range, helping your coffee taste clear and composed.' },
  { id: 'stagg-ekg', name: 'Fellow Stagg EKG Electric Kettle Pro', price: 59, category: 'machine', image: 'stagg-photo', description: 'A precise pour, with temperature at your fingertips.', why: 'A PID controller maintains your set temperature; the balanced spout makes a measured pour feel natural.' },
  { id: 'hario-scale', name: 'Hario V60 Drip Scale and Timer', price: 19, category: 'machine', image: 'hario-photo', description: 'Two useful measurements, neatly brought together.', why: 'It weighs your coffee and water while a built-in timer tracks each pour.' },
  { id: 'konga', name: 'Ethiopian 1', price: 6, category: 'bean', image: 'bean-bag-photo', description: '250g · Roasted in Kuwait by Brew', why: 'An expressive Ethiopian coffee, roasted locally to make the most of its lively, layered character.', origin: '250g · Brew' },
  { id: 'webanchi', name: 'Ethiopian 2', price: 6.5, category: 'bean', image: 'bean-bag-photo', description: '250g · Roasted in Kuwait by Brew', why: 'A carefully roasted Ethiopian coffee with a bright, fragrant cup and a long, sweet finish.', origin: '250g · Brew' },
  { id: 'caramel-candy', name: 'Caramel', price: 5, category: 'bean', image: 'bean-bag-photo', description: '250g · Roasted in Kuwait by Brew', why: 'A comforting everyday blend with a rounded sweetness that works beautifully across brew styles.', origin: '250g · Brew' },
  { id: 'brazil-samba', name: 'Brazil', price: 3.5, category: 'bean', image: 'bean-bag-photo', description: '250g · Roasted in Kuwait by Brew', why: 'An easygoing Brazilian coffee roasted for a sweet, dependable cup, morning after morning.', origin: '250g · Brew' },
];

export const bundles: Bundle[] = [
  { id: 'bundle-morning', name: 'The Automatic Morning', regular: 211.5, price: 199, items: ['xBloom Studio', 'Ethiopian 1', 'Ethiopian 2'], note: 'A whole recipe, ready to wake up with you.' },
  { id: 'bundle-daily', name: 'The Daily Brewer', regular: 140, price: 132, items: ['Fellow Aiden Precision Coffee Maker', 'Caramel', 'Ethiopian 1'], note: 'A reliable daily ritual, with room to explore.' },
  { id: 'bundle-precision', name: 'The Precision Set', regular: 81.5, price: 75, items: ['Fellow Stagg EKG Electric Kettle Pro', 'Hario V60 Drip Scale and Timer', 'Brazil'], note: 'The essentials for a deliberate pour-over.' },
];
