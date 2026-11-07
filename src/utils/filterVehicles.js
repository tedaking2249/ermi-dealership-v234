const COMBINED_FUEL_ALIASES = new Set([
  'petrol',
  'diesel',
  'petrol_diesel',
  'petrol or diesel',
  'petrol/diesel',
  'petrol-or-diesel',
  'ፔትሮል ወይም ዲዝል',
]);

const COMBINED_FUEL_VALUES = new Set([
  'petrol',
  'diesel',
  'petrol or diesel',
  'petrol/diesel',
  'diesel/other',
  'diesel or other',
]);

const normalize = (value) => String(value ?? '').trim().toLowerCase();

function isCombinedFuelFilter(value) {
  return COMBINED_FUEL_ALIASES.has(normalize(value));
}

function fuelMatches(selected, vehicleFuelType) {
  const selectedNorm = normalize(selected);
  const vehicleNorm = normalize(vehicleFuelType);

  if (isCombinedFuelFilter(selected)) {
    return COMBINED_FUEL_VALUES.has(vehicleNorm);
  }

  return selectedNorm === vehicleNorm;
}

function filterVehicles(vehicles, filters) {
  const { minPrice, maxPrice, fuelTypes, transmissions, minYear, maxYear } = filters;

  return vehicles.filter((vehicle) => {
    if (minPrice && vehicle.price < Number(minPrice)) return false;
    if (maxPrice && vehicle.price > Number(maxPrice)) return false;
    if (minYear && vehicle.year < Number(minYear)) return false;
    if (maxYear && vehicle.year > Number(maxYear)) return false;
    if (fuelTypes && fuelTypes.length > 0) {
      const matches = fuelTypes.some((selected) => fuelMatches(selected, vehicle.fuelType));
      if (!matches) return false;
    }
    if (transmissions && transmissions.length > 0 && !transmissions.includes(vehicle.transmission)) return false;
    return true;
  });
}

export default filterVehicles;
