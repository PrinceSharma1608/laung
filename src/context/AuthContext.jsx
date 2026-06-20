import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Default name mappings for Tata Motors users based on their typical IDs
const USER_NAME_MAPPINGS = {
  '100001': 'Vijay Patil',
  '100011': 'Anil Sharma',
  '100021': 'Suresh Singh',
  '100031': 'Ramesh Kumar',
  '100032': 'Sunil Gawde',
  '100033': 'Prakash Shinde'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');

    if (token && userId && role) {
      const name = USER_NAME_MAPPINGS[userId] || `User #${userId}`;
      setUser({
        token,
        userId,
        role,
        userName: name
      });
    }
    setLoading(false);
  }, []);

  const login = async (userId, password) => {
    // Determine the API base URL (configurable)
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    
    const response = await axios.post(`${apiBaseUrl}/auth/login`, {
      userId,
      password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const { token, role } = response.data;
    const userName = USER_NAME_MAPPINGS[userId] || `User #${userId}`;

    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('role', role);

    const loggedUser = { token, userId, role, userName };
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { USER_NAME_MAPPINGS };
