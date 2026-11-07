import { createContext, useContext, useState, useEffect } from 'react';
import api, { getToken, setToken, clearToken, getErrorMessage, UNAUTHORIZED_EVENT } from '../services/api';

const AuthContext = createContext();
const USER_KEY = 'ermi_user';

// The API uses BUYER / SALES_AGENT / ADMIN. The existing screens check 'customer' / 'admin',
// so we convert once here and every other component keeps working as before.
const toAppUser = (apiUser) => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  phone: apiUser.phone,
  role: apiUser.role === 'BUYER' ? 'customer' : 'admin',
  apiRole: apiUser.role,
});

// Only trust a cached user when there is also a token (ignores old mock-login leftovers)
const readCachedUser = () => {
  if (!getToken()) return null;
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveUser = (user) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage unavailable: the session just will not survive a refresh
  }
};

const clearSession = () => {
  clearToken();
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nothing to clear
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser);

  // On first load, confirm the saved session with the server.
  // A 401 logs out (handled by the api client); a network error keeps the cached user.
  useEffect(() => {
    if (!getToken()) return undefined;

    let cancelled = false;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (cancelled) return;
        const appUser = toAppUser(data.user);
        saveUser(appUser);
        setUser(appUser);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // The api client announces when the server rejects our token
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      setUser(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const startSession = ({ token, user: apiUser }) => {
    const appUser = toAppUser(apiUser);
    setToken(token);
    saveUser(appUser);
    setUser(appUser);
    return appUser;
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      return { success: true, user: startSession(data) };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const register = async ({ name, email, password, phone }) => {
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        phone: phone || undefined,
      });
      return { success: true, user: startSession(data) };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}