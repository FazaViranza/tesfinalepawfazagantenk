import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('umkm_token');
      setUser(null);
    };

    window.addEventListener('umkm:unauthorized', handleUnauthorized);

    const token = localStorage.getItem('umkm_token');

    if (!token) {
      setLoading(false);
      return () => {
        window.removeEventListener('umkm:unauthorized', handleUnauthorized);
      };
    }

    api.get('/auth/me')
      .then((res) => {
        setUser(res?.data || null);
      })
      .catch(() => {
        localStorage.removeItem('umkm_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      window.removeEventListener('umkm:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    });

    const token = res?.data?.token;
    const loggedInUser = res?.data?.user;

    if (!token || !loggedInUser?.role) {
      throw new Error('Response login dari server tidak valid.');
    }

    localStorage.setItem('umkm_token', token);
    setUser(loggedInUser);

    return res;
  };

  const logout = () => {
    localStorage.removeItem('umkm_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
