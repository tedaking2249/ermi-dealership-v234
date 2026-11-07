import { createContext, useContext, useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  // Only buyers have favorites (the dealer portal does not)
  const isBuyer = user?.role === 'customer';

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isBuyer) {
      setFavoriteIds([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    api
      .get('/favorites/ids')
      .then(({ data }) => {
        if (!cancelled) setFavoriteIds(data.ids);
      })
      .catch((err) => console.error('Could not load favorites:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, isBuyer]);

  const isFavorite = (vehicleId) => favoriteIds.includes(vehicleId);

  // The heart changes at once. If the server refuses, it changes back.
  const toggleFavorite = async (vehicleId) => {
    const wasSaved = favoriteIds.includes(vehicleId);
    setFavoriteIds((prev) => (wasSaved ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]));

    try {
      if (wasSaved) await api.delete(`/favorites/${vehicleId}`);
      else await api.put(`/favorites/${vehicleId}`);
      return { success: true };
    } catch (err) {
      setFavoriteIds((prev) => (wasSaved ? [...prev, vehicleId] : prev.filter((id) => id !== vehicleId)));
      return { success: false, error: getErrorMessage(err, 'Could not update your saved cars.') };
    }
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, loading, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}