// Official links shown on the "Google my car" page. Edit this file to add or change brands.
// kind: 'site' = the maker's own website, 'recall' = an official recall or VIN page.
// Most maker lookups only work for one country and mostly show recalls, not the build year.
// Links last checked: October 2026.

export const generalTools = [
  {
    name: 'NHTSA VIN decoder',
    text: 'Official US government decoder. Full details for US-market vehicles.',
  },
  {
    name: 'NHTSA recall lookup',
    text: 'Official US recall search by VIN. Works for cars sold in the United States.',
  },
];

export const brands = [
  {
    name: 'Toyota', country: 'Japan',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.toyodiy.com' },
      { label: 'Recall check (Australia)', kind: 'recall' },
    ],
  },
  {
    name: 'Suzuki', country: 'Japan',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.vindecoderz.com' },
      { label: 'Recall check (Canada)', kind: 'recall' },
    ],
  },
  {
    name: 'Ford', country: 'United States',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.toyodiy.com' },
      { label: 'Recall check (USA)', kind: 'recall' },
    ],
  },
  {
    name: 'BYD', country: 'China',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.vindecoderz.com' },
      { label: 'Recall check (Australia)', kind: 'recall' },
    ],
  },
  {
    name: 'Iveco', country: 'Italy',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.toyodiy.com' },
    ],
    note: 'No public VIN lookup found. Ask an Iveco dealer to check the chassis number.',
  },
  {
    name: 'Hyundai', country: 'South Korea',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.vindecoderz.com' },
      { label: 'Recall check (USA)', kind: 'recall' },
    ],
  },
  {
    name: 'Kia', country: 'South Korea',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.toyodiy.com' },
    ],
  },
  {
    name: 'Nissan', country: 'Japan',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.vindecoderz.com' },
      { label: 'Recall check (USA)', kind: 'recall' },
    ],
  },
  {
    name: 'Honda', country: 'Japan',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.toyodiy.com' },
    ],
  },
  {
    name: 'Mitsubishi', country: 'Japan',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.vindecoderz.com' },
    ],
  },
  {
    name: 'Isuzu', country: 'Japan',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.toyodiy.com' },
    ],
  },
  {
    name: 'Mazda', country: 'Japan',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.vindecoderz.com' },
    ],
  },
  {
    name: 'Mercedes-Benz', country: 'Germany',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.toyodiy.com' },
    ],
  },
  {
    name: 'Volkswagen', country: 'Germany',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.vindecoderz.com' },
    ],
  },
  {
    name: 'BMW', country: 'Germany',
    links: [
      { label: 'VIN Decoder', kind: 'site', url: 'https://www.toyodiy.com' },
    ],
  },
];