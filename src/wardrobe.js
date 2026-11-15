import AR from './ar.json'
import SOURCE from './source.json'

// Seed wardrobe — every piece pulled from the two closet videos.
// [id, name, cat, sub, color, fit, vibes, warmth, pattern]
const S = [
  ['v01', 'Light Grey Zip Hoodie', 'layer', 'hoodie', 'grey', 'oversized', 'cozy casual street campus', 3, 'solid'],
  ['v02', 'Black Slim Long Sleeve', 'top', 'long sleeve', 'black', 'fitted', 'clean night casual edgy', 2, 'solid'],
  ['v03', 'Patagonia Fleece Jacket', 'layer', 'fleece', 'charcoal', 'regular', 'sporty cozy campus street', 3, 'solid'],
  ['v04', 'Columbia Business School Hoodie', 'layer', 'hoodie', 'navy', 'oversized', 'campus cozy street casual', 3, 'graphic'],
  ['v05', 'Cream Boxy Tee', 'top', 'tee', 'cream', 'oversized', 'clean casual street', 1, 'solid'],
  ['v06', 'Light-Wash Denim Jacket', 'layer', 'jacket', 'lightdenim', 'regular', 'casual street y2k campus', 2, 'solid'],
  ['v07', 'Grey Gap Quarter-Zip', 'layer', 'fleece', 'charcoal', 'oversized', 'cozy campus sporty casual', 3, 'graphic'],
  ['v08', 'Garden Floral Maxi Dress', 'dress', 'maxi dress', 'cream', 'regular', 'boho girly beach', 1, 'print'],
  ['v09', 'Black Lace Long Sleeve', 'top', 'long sleeve', 'black', 'fitted', 'night edgy girly', 1, 'solid'],
  ['v10', 'Black Draped Mesh Top', 'top', 'blouse', 'black', 'regular', 'night edgy', 1, 'solid'],
  ['v11', 'SZA SOS Hockey Jersey', 'top', 'long sleeve', 'white', 'oversized', 'street y2k campus sporty', 2, 'graphic'],
  ['v12', 'Mauve Wide-Sleeve Top', 'top', 'blouse', 'brown', 'regular', 'clean girly night boho', 1, 'solid'],
  ['v13', 'Navy Striped Jersey', 'top', 'tee', 'navy', 'oversized', 'sporty street campus casual', 1, 'solid'],
  ['v14', 'Stussy Crewneck', 'layer', 'crewneck', 'white', 'oversized', 'street casual y2k', 3, 'graphic'],
  ['v15', 'Brown Houndstooth Dress', 'dress', 'mini dress', 'brown', 'regular', 'preppy clean boho', 1, 'print'],
  ['v16', 'Mustang Graphic Tee', 'top', 'tee', 'white', 'oversized', 'street y2k casual', 1, 'graphic'],
  ['v17', 'Death Valley Moto Tee', 'top', 'tee', 'charcoal', 'oversized', 'street edgy y2k', 1, 'graphic'],
  ['v18', 'Cream Fuzzy Cardigan', 'layer', 'sweater', 'cream', 'oversized', 'cozy clean girly', 3, 'solid'],
  ['v19', 'Work Gone Blind Long Sleeve', 'top', 'long sleeve', 'grey', 'oversized', 'street y2k casual', 2, 'graphic'],
  ['v20', 'White Graphic Tee', 'top', 'tee', 'white', 'oversized', 'casual clean street', 1, 'graphic'],
  ['v21', 'Grey Print Zip Hoodie', 'layer', 'hoodie', 'charcoal', 'oversized', 'street edgy y2k', 3, 'graphic'],
  ['v22', 'Powder Blue 04 Jersey', 'top', 'tee', 'blue', 'oversized', 'sporty street y2k campus', 1, 'graphic'],
  ['v23', 'Navy Sleeveless Dress', 'dress', 'sundress', 'navy', 'fitted', 'clean night preppy', 1, 'solid'],
  ['v24', 'Coral Tiered Maxi Dress', 'dress', 'maxi dress', 'coral', 'regular', 'boho girly beach night', 1, 'solid'],
  ['v25', 'White Boxy Tee', 'top', 'tee', 'white', 'oversized', 'clean casual', 1, 'solid'],
  ['v26', 'White Back-Print Tee', 'top', 'tee', 'white', 'oversized', 'street casual y2k', 1, 'graphic'],
  ['v27', 'Navy Sport Tee', 'top', 'tee', 'navy', 'regular', 'sporty casual clean', 1, 'solid'],
  ['v28', 'Charcoal Long Sleeve', 'top', 'long sleeve', 'charcoal', 'regular', 'clean casual cozy', 2, 'solid'],
  ['w01', 'Navy Track Pants', 'bottom', 'sweats', 'navy', 'relaxed', 'sporty street casual cozy', 2, 'solid'],
  ['w02', 'Charcoal Wide Trousers', 'bottom', 'pants', 'charcoal', 'wide', 'clean street night', 2, 'solid'],
  ['w03', 'Dark Denim Maxi Skirt', 'bottom', 'skirt', 'darkdenim', 'straight', 'casual street y2k boho', 2, 'solid'],
  ['w04', 'White Jeans', 'bottom', 'jeans', 'white', 'straight', 'clean casual beach', 2, 'solid'],
  ['w05', 'Ripped Light Jeans', 'bottom', 'jeans', 'lightdenim', 'straight', 'casual street y2k', 2, 'solid'],
  ['w06', 'Denim Maxi Skirt', 'bottom', 'skirt', 'lightdenim', 'wide', 'boho casual y2k', 2, 'solid'],
  ['w07', 'Light Wide-Leg Jeans', 'bottom', 'jeans', 'lightdenim', 'wide', 'casual street clean', 2, 'solid'],
  ['w08', 'Brown Leather Jacket', 'layer', 'jacket', 'brown', 'regular', 'street edgy y2k night', 2, 'solid'],
  ['w09', 'Mint Long Sleeve', 'top', 'long sleeve', 'sage', 'regular', 'clean casual girly', 2, 'solid'],
  ['w10', 'Pink Striped Tee', 'top', 'tee', 'pink', 'regular', 'casual girly y2k', 1, 'print'],
  ['w11', 'Mauve Short Sleeve Top', 'top', 'tee', 'taupe', 'fitted', 'clean casual girly', 1, 'solid'],
  ['w12', 'Billie Eilish Tour Tee', 'top', 'tee', 'white', 'oversized', 'street casual y2k', 1, 'graphic'],
  ['w13', 'Grey Long Sleeve', 'top', 'long sleeve', 'grey', 'regular', 'clean cozy casual', 2, 'solid'],
  ['w14', 'White Sleeveless Top', 'top', 'tank', 'white', 'regular', 'clean girly', 1, 'solid'],
  ['w15', 'Pink Floral Draped Top', 'top', 'blouse', 'pink', 'regular', 'girly night boho', 1, 'print'],
  ['w16', 'Black Tee', 'top', 'tee', 'black', 'regular', 'clean casual edgy', 1, 'solid'],
  ['w17', 'White Wrap Tank', 'top', 'tank', 'white', 'regular', 'clean girly night', 1, 'solid'],
  ['w18', 'Periwinkle Tank', 'top', 'tank', 'periwinkle', 'fitted', 'sporty clean casual', 1, 'solid'],
  ['w19', 'Blush Satin Cami', 'top', 'cami', 'pink', 'fitted', 'night girly clean', 1, 'solid'],
  ['w20', 'Periwinkle Tee', 'top', 'tee', 'periwinkle', 'regular', 'casual clean girly', 1, 'solid'],
  ['w21', 'White Print Tee', 'top', 'tee', 'white', 'oversized', 'casual street y2k', 1, 'graphic'],
  ['w22', 'Red Plaid Top', 'top', 'blouse', 'red', 'regular', 'girly preppy boho', 1, 'print'],
  ['w23', 'Cream Ribbed Tank', 'top', 'tank', 'cream', 'fitted', 'clean casual beach', 1, 'solid'],
  ['w24', 'Cal Berkeley Tee', 'top', 'tee', 'blue', 'regular', 'campus casual sporty', 1, 'graphic'],
  ['w25', 'White Floral Sheer Top', 'top', 'blouse', 'white', 'regular', 'girly boho night', 1, 'print'],
  ['w26', 'Periwinkle Button Cami', 'top', 'cami', 'periwinkle', 'fitted', 'girly clean beach', 1, 'solid'],
  ['w27', 'Cream Slip Dress', 'dress', 'mini dress', 'cream', 'fitted', 'night girly clean', 1, 'solid'],
  ['w28', 'Butter Yellow Slip Dress', 'dress', 'mini dress', 'yellow', 'fitted', 'girly night beach boho', 1, 'solid'],
]

export const SEED = S.map(([id, name, cat, sub, color, fit, vibes, warmth, pattern]) => ({
  id, name, cat, sub, color, fit, vibes: vibes.split(' '), warmth, pattern,
  img: `/cut/${id}.webp`, ar: AR[id] || 0.92, src: SOURCE[id] || 'drawn',
}))

export const CATS = [
  { id: 'all', label: 'Everything' },
  { id: 'top', label: 'Tops' },
  { id: 'bottom', label: 'Bottoms' },
  { id: 'dress', label: 'Dresses' },
  { id: 'layer', label: 'Layers' },
  { id: 'acc', label: 'Extras' },
  { id: 'swim', label: 'Swim' },
]

export const SUBS = {
  top: ['tee', 'baby tee', 'crop tee', 'crop top', 'tank', 'cami', 'long sleeve', 'shirt', 'blouse'],
  bottom: ['jeans', 'pants', 'cargos', 'flares', 'leggings', 'sweats', 'shorts', 'skirt'],
  dress: ['mini dress', 'sundress', 'maxi dress'],
  layer: ['sweater', 'hoodie', 'crewneck', 'fleece', 'jacket', 'puffer', 'blazer'],
  acc: ['beanie', 'headband', 'bag', 'shoes', 'jewelry', 'scarf', 'belt'],
  swim: ['bikini', 'one-piece', 'rash guard'],
}
export const FITS = ['cropped', 'fitted', 'regular', 'oversized', 'straight', 'wide', 'flare', 'relaxed', 'short']
export const VIBES = ['casual', 'clean', 'street', 'y2k', 'girly', 'cozy', 'sporty', 'night', 'boho', 'preppy', 'edgy', 'campus', 'beach']

export const COLORS = {
  black: '#1c1b1f', charcoal: '#4a4a52', grey: '#a9abb3', white: '#ffffff', cream: '#f3e9d6', beige: '#d6c4a8',
  taupe: '#a8958c', brown: '#6b4a3a', navy: '#1f2a4d', darkdenim: '#2a3550', denim: '#5f7fa8', lightdenim: '#a9c1d9',
  blue: '#4f74c4', periwinkle: '#a3b4ea', lilac: '#c9b3ec', purple: '#4a2a5e', pink: '#f3b6cb', magenta: '#b0256b',
  red: '#d64545', coral: '#ea7f6d', rust: '#b8563a', orange: '#f0913a', yellow: '#f0c24a', gold: '#d8c08a',
  green: '#2f8f6a', olive: '#7a7f55', sage: '#8fa99c',
}
