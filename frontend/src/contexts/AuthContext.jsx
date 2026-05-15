import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Helper: read response body ONCE as text and parse JSON safely.
  // Uses response.clone() to be resilient against fetch interceptors
  // (e.g. PostHog session recording, devtools, service workers) that may
  // have already started consuming the body stream.
  const readJsonSafe = async (response) => {
    let text = '';
    try {
      // Clone first so we don't fight with any wrapper that already touched
      // the original stream. Falls back to reading the original if clone fails.
      const target = typeof response.clone === 'function' ? response.clone() : response;
      text = await target.text();
    } catch (e) {
      try {
        text = await response.text();
      } catch {
        return {};
      }
    }
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { _raw: text };
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await readJsonSafe(response);

      if (response.ok) {
        setUser(data);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const parseApiResponse = async (response) => {
    if (response.bodyUsed) {
      return null;
    }

    const rawBody = await response.text();
    if (!rawBody) {
      return null;
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      return { detail: rawBody };
    }
  };

  const getErrorMessage = (payload) => {
    if (!payload) {
      return 'Credenciales inválidas';
    }

    if (typeof payload.detail === 'string') {
      return payload.detail;
    }

    if (Array.isArray(payload.detail)) {
      return payload.detail
        .map((item) => (typeof item?.msg === 'string' ? item.msg : String(item)))
        .filter(Boolean)
        .join(' ');
    }

    if (typeof payload.message === 'string') {
      return payload.message;
    }

    return 'Credenciales inválidas';
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

<<<<<<< HEAD
      const payload = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      if (!payload?.access_token || !payload?.user) {
        throw new Error('Respuesta inválida del servidor');
      }

      setToken(payload.access_token);
      setUser(payload.user);
      localStorage.setItem('token', payload.access_token);
=======
      const data = await readJsonSafe(response);

      if (!response.ok) {
        const detail = data?.detail;
        const message =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
            ? detail.map((d) => d.msg || d).join(', ')
            : 'Credenciales incorrectas';
        throw new Error(message);
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('token', data.access_token);
>>>>>>> origin/conflict_150526_1026
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAdmin = () => user?.role === 'admin';
  const isManager = () => user?.role === 'manager' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAdmin: isAdmin(), isManager: isManager() }}>
      {children}
    </AuthContext.Provider>
  );
};
