// Reads what a 17-character VIN says about a car. Works offline, no service needed.
// The 10th character is the model year, the first character is where the car was built.

const YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY'; // 2010 to 2030 (the same letters were used for 1980 to 2000)
const DIGIT_CODES = '123456789'; // 2001 to 2009 (and 2031 to 2039)

const REGIONS = [
  ['ABCDEFGH', 'Africa'],
  ['JKLMNPR', 'Asia'],
  ['STUVWXYZ', 'Europe'],
  ['12345', 'North America'],
  ['67', 'Oceania'],
  ['89', 'South America'],
];

const COUNTRIES = {
  J: 'Japan', K: 'South Korea', L: 'China', M: 'India, Thailand or Indonesia',
  W: 'Germany', Z: 'Italy', S: 'United Kingdom', V: 'France or Spain', T: 'Czechia or Hungary',
  1: 'United States', 4: 'United States', 5: 'United States', 2: 'Canada', 3: 'Mexico', 6: 'Australia',
};

// The first three characters name the maker. Only well-known, unambiguous codes are listed.
const MAKERS = [
  ['JS', 'Suzuki'], ['MA3', 'Suzuki (Maruti, India)'], ['TSM', 'Suzuki (Hungary)'],
  ['JT', 'Toyota or Lexus'], ['2T', 'Toyota (Canada)'], ['4T', 'Toyota (USA)'], ['5T', 'Toyota (USA)'],
  ['1FA', 'Ford'], ['1FT', 'Ford'], ['1FM', 'Ford'], ['1FD', 'Ford'], ['3FA', 'Ford'], ['WF0', 'Ford (Germany)'], ['MAJ', 'Ford (India)'],
  ['LGX', 'BYD'], ['LC0', 'BYD'],
  ['ZCF', 'Iveco'],
  ['KMH', 'Hyundai'], ['KNA', 'Kia'], ['KND', 'Kia'], ['KNM', 'Kia'],
  ['JN', 'Nissan'], ['JHM', 'Honda'], ['JM', 'Mazda'],
  ['JA3', 'Mitsubishi'], ['JA4', 'Mitsubishi'], ['JMB', 'Mitsubishi'], ['JAA', 'Isuzu'], ['JAL', 'Isuzu'],
  ['WDB', 'Mercedes-Benz'], ['WDD', 'Mercedes-Benz'], ['WVW', 'Volkswagen'], ['WBA', 'BMW'],
];

export function cleanVin(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function readVin(value, now = new Date()) {
  const vin = cleanVin(value);

  // Skip strict 17-character check - allow variable length VINs including short chassis numbers
// from Japan and other regions. Only validate character validity.
  if (/[IOQ]/.test(vin)) {
    return { ok: false, message: 'A VIN never contains the letters I, O or Q. Check the letters you typed.' };
  }

  const code = vin[9];
  const first = vin[0];
  const latest = now.getFullYear() + 1; // new models are sold a year early

  let years = [];
  if (YEAR_CODES.includes(code)) {
    const i = YEAR_CODES.indexOf(code);
    years = [2010 + i, 1980 + i];
  } else if (DIGIT_CODES.includes(code)) {
    const i = DIGIT_CODES.indexOf(code);
    years = [2001 + i, 1981 + i]; // 2031 and later has not happened yet
  } else {
    return { ok: false, message: `The 10th character is "${code}", which is not a valid year code. This VIN may have a typing mistake.` };
  }
  years = years.filter((y) => y <= latest);

  // North American VINs with a letter code: a letter as 7th character means 2010 or newer
  let note = '';
  if ('12345'.includes(first) && YEAR_CODES.includes(code)) {
    years = [/[A-Z]/.test(vin[6]) ? years[0] : years[1]];
  } else if (years.length > 1) {
    note = `The same code was also used in ${years[1]}. A car that old would be rare, so ${years[0]} is the likely year.`;
  }

  const region = REGIONS.find(([letters]) => letters.includes(first));
  const maker = MAKERS.find(([prefix]) => vin.startsWith(prefix));

  return {
    ok: true,
    vin,
    year: years[0],
    note,
    maker: maker ? maker[1] : '',
    country: COUNTRIES[first] || '',
    region: region ? region[1] : '',
  };
}


export function hasInvalidVinChars(value) {
  return /[IOQ]/.test(String(value || ''));
}

export function validateVinFormat(value) {
  const vin = cleanVin(value);
  const errors = [];

  // Remove the strict 17-character length requirement
  // Allow variable length VINs (including short chassis numbers from Japan)
  if (hasInvalidVinChars(vin)) errors.push('VINs never contain the letters I, O, or Q.');

  // Check for valid VIN character pattern (alphanumeric without I, O, Q)
  // Allow any length - just check that remaining characters are valid
  const validPattern = /^[A-HJ-NPR-Z0-9]+$/;
  if (!validPattern.test(vin)) errors.push('VIN contains invalid characters.');

  if (vin.length > 0 && vin.length < 5) {
    errors.push('VIN appears too short. Minimum 5 characters recommended, but shorter chassis numbers are valid.');
  }

  return { valid: errors.length === 0, vin, errors };
}

const CHECK_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const CHECK_VALUES = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

export function checkDigit(vin) {
  const v = cleanVin(vin);
  // Support variable length VINs - check digit calculation cycles through weights
  if (v.length < 3) return 'not-applicable';
  const ninth = v[v.length - 9]; // adjust ninth position for variable length
  if (!/[0-9X]/.test(ninth)) return 'not-applicable';
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    const ch = v[i];
    const val = /[0-9]/.test(ch) ? Number(ch) : (CHECK_VALUES[ch] || 0);
    sum += val * CHECK_WEIGHTS[i % 17]; // cycle weights for variable length VINs
  }
  const remainder = sum % 11;
  const computed = remainder === 10 ? 'X' : String(remainder);
  if (computed === ninth) return 'pass';
  return 'fail';
}

export function identifyManufacturer(vin) {
  const v = cleanVin(vin);
  if (v.length < 3) return '';
  const maker = MAKERS.find(([prefix]) => v.startsWith(prefix));
  return maker ? maker[1] : '';
}
// For the website lookups: any VIN or chassis number, letters, digits and dashes only.
export function cleanLookup(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 60);
}

export async function decodeVinApi(vin, timeoutMs = 12000) {
  const v = cleanVin(vin);
  // Remove strict 17-character requirement - allow API to handle variable length VINs
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(v)}?format=json`,
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`API request failed (${res.status}).`);
    const data = await res.json();
    const row = Array.isArray(data?.Results) ? data.Results[0] : null;
    if (!row) throw new Error('Unexpected API response.');
    return row;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The request timed out. Please try again.');
    throw new Error(err.message || 'Could not reach the VIN decoding service.');
  } finally {
    clearTimeout(timer);
  }
}

