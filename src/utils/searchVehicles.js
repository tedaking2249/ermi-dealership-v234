function searchVehicles(vehicles, term) {
  if (!term || !term.trim()) return vehicles;

  const query = term.trim().toLowerCase();

  return vehicles.filter((vehicle) => {
    const searchableText = [
      vehicle.make,
      vehicle.model,
      String(vehicle.year),
      vehicle.fuelType,
      vehicle.transmission,
      `${vehicle.make} ${vehicle.model}`,
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  });
}

export default searchVehicles;
