// The two websites used by the "Google my car" page.
// The address patterns come from each website's own lookup pages (checked November 2026).
// If a website changes its address format, only the build() line of that site needs a fix.

export const lookupSites = [
  {
    name: 'ToyoDIY',
    host: 'toyodiy.com',
    home: 'https://www.toyodiy.com/parts/q',
    text: 'Toyota, Lexus and Scion only. Opens the parts catalogue lookup for your number.',
    tags: ['Toyota', 'Lexus', 'Scion', 'Parts catalogue'],
    build: (number) => `https://www.toyodiy.com/parts/q?vin=${encodeURIComponent(number)}`,
  },
  {
    name: 'VinDecoderz',
    host: 'vindecoderz.com',
    home: 'https://www.vindecoderz.com/EN/International',
    text: 'All makes. Opens the VIN lookup page with the specs it has for your number.',
    tags: ['All makes', 'VIN lookup', 'Specs'],
    build: (number) => `https://www.vindecoderz.com/EN/check-lookup/${encodeURIComponent(number)}`,
  },
];

export function lookupUrl(site, number) {
  return site.build(number);
}
