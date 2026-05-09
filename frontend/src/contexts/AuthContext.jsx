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

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
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
