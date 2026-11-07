import { createContext, useContext, useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';

const RequestContext = createContext();

const API_PAGE_SIZE = 50;
const MAX_PAGES = 20;
const REFRESH_EVERY_MS = 30000;

export function RequestProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const isStaff = user?.role === 'admin';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Staff load every buyer's requests. Buyers load their own.
  // The list refreshes by itself so new requests and answers show up without a page reload.
  useEffect(() => {
    if (!userId) {
      setRequests([]);
      return undefined;
    }

    let cancelled = false;

    const load = async (showSpinner) => {
      if (showSpinner) setLoading(true);
      try {
        const all = [];
        let page = 1;
        let totalPages = 1;
        do {
          const { data } = await api.get(isStaff ? '/requests' : '/requests/mine', {
            params: { page, limit: API_PAGE_SIZE },
          });
          all.push(...data.data);
          totalPages = data.pagination.totalPages;
          page += 1;
        } while (page <= totalPages && page <= MAX_PAGES);

        if (!cancelled) setRequests(all);
      } catch (err) {
        console.error('Could not load requests:', err);
      } finally {
        if (!cancelled && showSpinner) setLoading(false);
      }
    };

    load(true);
    const timer = setInterval(() => {
      if (!document.hidden) load(false);
    }, REFRESH_EVERY_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [userId, isStaff, reloadKey]);

  // The old demo data from the localStorage days is no longer used
  useEffect(() => {
    try {
      localStorage.removeItem('ermi_requests');
    } catch {
      // Nothing to clean up
    }
  }, []);

  const reload = () => setReloadKey((key) => key + 1);

  const mergeRequest = (updated) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  };

  // data: { vehicleId, type: 'RESERVE' | 'TEST_DRIVE', phone, message, preferredDate (ISO) }
  const createRequest = async (data) => {
    try {
      await api.post('/requests', data);
      reload();
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not send your request.') };
    }
  };

  // Staff: { status: 'CONFIRMED' | 'DECLINED' | 'COMPLETED', scheduledDate?, staffNote? }
  const setRequestStatus = async (id, payload) => {
    try {
      const { data } = await api.patch(`/requests/${id}/status`, payload);
      mergeRequest(data.request);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not update this request.') };
    }
  };

  const cancelRequest = async (id) => {
    try {
      const { data } = await api.patch(`/requests/${id}/cancel`);
      mergeRequest(data.request);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not cancel this request.') };
    }
  };

  const rescheduleRequest = async (id, preferredDate) => {
    try {
      const { data } = await api.patch(`/requests/${id}/reschedule`, { preferredDate });
      mergeRequest(data.request);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not reschedule this request.') };
    }
  };

  const markAllSeen = async () => {
    try {
      await api.patch('/requests/seen');
      setRequests((prev) => prev.map((r) => ({ ...r, buyerSeen: true })));
    } catch (err) {
      console.error('Could not mark requests as seen:', err);
    }
  };

  const pendingCount = isStaff ? requests.filter((r) => r.status === 'PENDING').length : 0;
  const unseenCount = !isStaff ? requests.filter((r) => r.buyerSeen === false).length : 0;

  return (
    <RequestContext.Provider
      value={{
        requests,
        loading,
        reload,
        pendingCount,
        unseenCount,
        createRequest,
        setRequestStatus,
        cancelRequest,
        rescheduleRequest,
        markAllSeen,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export function useRequests() {
  return useContext(RequestContext);
}