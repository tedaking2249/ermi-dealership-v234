import { createContext, useContext, useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';
import { useVehicles } from './VehicleContext';

const ListingContext = createContext();

const API_PAGE_SIZE = 50;
const MAX_PAGES = 20;
const MAX_PHOTO_SIDE = 1600;

// Phone photos are huge. Shrink them in the browser so the upload is fast.
// If anything goes wrong, the original file is used unchanged.
async function shrinkPhoto(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (bitmap.close) bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

// API listing -> the shape the screens already use
const toAppListing = (l) => {
  const d = l.details || {};
  return {
    id: l.id,
    make: l.make,
    model: l.model,
    year: l.year,
    price: l.askingPrice,
    mileage: l.mileage,
    vehicleType: l.fuelType,
    transmission: l.transmission,
    bodyType: l.bodyType || '',
    hybridType: d.hybridType || '',
    petrolRange: d.petrolRange || '',
    combinedRange: d.combinedRange || '',
    evRange: d.evRange || '',
    chargingInfo: d.chargingInfo || '',
    batteryCondition: d.batteryCondition || '',
    features: d.features || [],
    majorIssues: d.majorIssues || [],
    photos: l.photos || [],
    sellerName: d.sellerName || l.seller?.name || '',
    sellerPhone: d.sellerPhone || l.seller?.phone || '',
    status: String(l.status).toLowerCase(),
    reviewNote: l.reviewNote || '',
    rejectionReason: l.reviewNote || '',
    rejectedAt: l.status === 'REJECTED' ? (l.updatedAt || l.createdAt) : null,
    submittedAt: l.createdAt,
    vehicleId: l.vehicleId || null,
  };
};

export function ListingProvider({ children }) {
  const { user } = useAuth();
  const { reload: reloadVehicles } = useVehicles();
  const isStaff = user?.role === 'admin';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Staff load every seller's listings. Buyers only load their own.
  useEffect(() => {
    if (!user) {
      setListings([]);
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const all = [];
        let page = 1;
        let totalPages = 1;
        do {
          const { data } = await api.get(isStaff ? '/listings' : '/listings/mine', {
            params: { page, limit: API_PAGE_SIZE },
          });
          all.push(...data.data);
          totalPages = data.pagination.totalPages;
          page += 1;
        } while (page <= totalPages && page <= MAX_PAGES);

        if (!cancelled) setListings(all.map(toAppListing));
      } catch (err) {
        console.error('Could not load listings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, isStaff, reloadKey]);

  // The old demo data from the localStorage days is no longer used
  useEffect(() => {
    try {
      localStorage.removeItem('ermi_listings');
    } catch {
      // Nothing to clean up
    }
  }, []);

  const reload = () => setReloadKey((key) => key + 1);

  // form: the answers from the sell form. files: the photo files the seller picked.
  const submitListing = async (form, files) => {
    try {
      const smallFiles = await Promise.all(files.map(shrinkPhoto));

      const formData = new FormData();
      smallFiles.forEach((file) => formData.append('images', file, file.name));
      const { data: uploaded } = await api.post('/uploads/images', formData, {
        timeout: 120000,
      });

      const {
        vehicleType, make, model, year, mileage, price, bodyType, transmission, ...extras
      } = form;

      await api.post('/listings', {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        askingPrice: Number(price),
        mileage: Number(mileage),
        fuelType: vehicleType,
        transmission,
        bodyType,
        photos: uploaded.images.map((img) => img.url),
        details: extras,
      });

      reload();
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not submit your listing.') };
    }
  };

  const approveListing = async (id) => {
    try {
      await api.patch(`/listings/${id}/approve`, {});
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'approved' } : l)));
      reloadVehicles(); // the new car now exists in the inventory
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not approve this listing.') };
    }
  };

  const rejectListing = async (id, reason) => {
    try {
      await api.patch(`/listings/${id}/reject`, { reviewNote: reason });
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'rejected', reviewNote: reason, rejectionReason: reason, rejectedAt: new Date().toISOString() } : l))
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not reject this listing.') };
    }
  };

  const pendingListings = listings.filter((l) => l.status === 'pending');

  return (
    <ListingContext.Provider
      value={{
        listings, pendingListings, loading, reload, submitListing, approveListing, rejectListing,
      }}
    >
      {children}
    </ListingContext.Provider>
  );
}

export function useListings() {
  return useContext(ListingContext);
}