import { createContext, useContext, useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';

const VehicleContext = createContext();

// Fields the API stores as real columns. Everything else the forms collect
// (battery, range, features...) is kept together in the API's flexible "specs" field.
const COLUMN_FIELDS = [
  'make',
  'model',
  'year',
  'price',
  'mileage',
  'fuelType',
  'transmission',
  'bodyType',
  'color',
  'description',
  'featured',
  'status',
];
const NUMBER_FIELDS = ['year', 'price', 'mileage'];
const SKIPPED_FIELDS = ['id', 'image', 'photos', 'specs', 'createdAt', 'updatedAt', 'createdById', 'soldAt'];
const MAX_PAGES = 20;
const API_PAGE_SIZE = 50;

// The API stores photo links only. Inline (base64) images are dropped until uploads are connected.
const isUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const unique = (list) => [...new Set(list)];

// API vehicle -> the shape the screens already use
const toAppVehicle = (apiVehicle) => {
  const { specs, photos, ...columns } = apiVehicle;
  return {
    ...(specs || {}),
    ...columns,
    photos: photos || [],
    image: photos?.[0] || '',
  };
};

const toColumnValue = (key, value) => (NUMBER_FIELDS.includes(key) ? Number(value) : value);

const extractSpecs = (vehicle) => {
  const specs = {};
  Object.entries(vehicle).forEach(([key, value]) => {
    if (SKIPPED_FIELDS.includes(key) || COLUMN_FIELDS.includes(key) || value === undefined) return;
    specs[key] = value;
  });
  return specs;
};

const buildCreatePayload = (vehicle) => {
  const payload = {};
  COLUMN_FIELDS.forEach((key) => {
    if (vehicle[key] !== undefined) payload[key] = toColumnValue(key, vehicle[key]);
  });
  payload.bodyType = payload.bodyType || 'Other';
  payload.photos = unique([vehicle.image, ...(vehicle.photos || [])].filter(isUrl));

  const specs = extractSpecs(vehicle);
  if (Object.keys(specs).length > 0) payload.specs = specs;

  return payload;
};

// Only the fields that changed are sent, so an edit cannot overwrite something
// that changed elsewhere in the meantime (for example a car reserved by a buyer).
const buildUpdatePayload = (existing, updates) => {
  const payload = {};
  let touchesSpecs = false;

  Object.entries(updates).forEach(([key, value]) => {
    if (SKIPPED_FIELDS.includes(key) || value === undefined) return;
    if (COLUMN_FIELDS.includes(key)) {
      payload[key] = toColumnValue(key, value);
    } else {
      touchesSpecs = true;
    }
  });

  if (touchesSpecs) payload.specs = extractSpecs({ ...existing, ...updates });

  // Changing the main image replaces the first photo and keeps the others
  if ('image' in updates && updates.image !== existing.image) {
    payload.photos = unique([updates.image, ...(existing.photos || []).slice(1)].filter(isUrl));
  }

  return payload;
};

export function VehicleProvider({ children }) {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin';

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Load every page of vehicles. Staff also get sold cars; visitors get the public list.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const all = [];
        let page = 1;
        let totalPages = 1;

        do {
          const { data } = await api.get('/vehicles', {
            params: { page, limit: API_PAGE_SIZE, ...(isStaff && { status: 'ALL' }) },
          });
          const recent = (data.data || []).filter((v) => {
            if (v.status !== 'SOLD') return true;
            if (!v.soldAt) return true;
            return Date.now() - new Date(v.soldAt).getTime() < 7 * 24 * 60 * 60 * 1000;
          });
          all.push(...recent);
          totalPages = data.pagination.totalPages;
          page += 1;
        } while (page <= totalPages && page <= MAX_PAGES);

        if (cancelled) return;
        setVehicles(all.map(toAppVehicle));
        setError('');
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load vehicles.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isStaff, reloadKey]);

  // The old demo data from the localStorage days is no longer used
  useEffect(() => {
    try {
      localStorage.removeItem('ermi_vehicles');
    } catch {
      // Nothing to clean up
    }
  }, []);

  const reload = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const reportFailure = (action, err) => {
    const message = getErrorMessage(err);
    console.error(`Could not ${action}:`, err);
    window.alert(`Could not ${action}: ${message}`);
    return { success: false, error: message };
  };

  const addVehicle = async (vehicle) => {
    try {
      const { data } = await api.post('/vehicles', buildCreatePayload(vehicle));
      const created = toAppVehicle(data.vehicle);
      setVehicles((prev) => [created, ...prev]);
      return { success: true, vehicle: created };
    } catch (err) {
      return reportFailure('save the vehicle', err);
    }
  };

  const updateVehicle = async (id, updates) => {
    const existing = vehicles.find((v) => v.id === id);
    if (!existing) return { success: false, error: 'Vehicle not found' };

    try {
      const { data } = await api.patch(`/vehicles/${id}`, buildUpdatePayload(existing, updates));
      const updated = toAppVehicle(data.vehicle);
      setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
      return { success: true, vehicle: updated };
    } catch (err) {
      return reportFailure('update the vehicle', err);
    }
  };

  const deleteVehicle = async (id) => {
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      return { success: true };
    } catch (err) {
      return reportFailure('delete the vehicle', err);
    }
  };

  return (
    <VehicleContext.Provider
      value={{ vehicles, loading, error, reload, addVehicle, updateVehicle, deleteVehicle }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  return useContext(VehicleContext);
}