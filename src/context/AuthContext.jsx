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
    
    try {
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
    } catch (err) {
      // If we are on Vercel or local backend is down, fall back to mock credentials
      if (window.location.hostname !== 'localhost' || err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.response?.status === 404) {
        console.warn('Backend server unreachable. Falling back to local mock authentication.');
        
        let role = 'JH_OWNER';
        const idNum = parseInt(userId);
        if (idNum >= 100001 && idNum <= 100010) role = 'LINE_INCHARGE';
        else if (idNum >= 100011 && idNum <= 100020) role = 'SUPERVISOR';
        else if (idNum >= 100021 && idNum <= 100030) role = 'TEAM_LEADER';
        else if (idNum >= 100031 && idNum <= 100040) role = 'JH_OWNER';

        if (password === 'Password@123') {
          const token = 'mock_jwt_token_for_' + userId;
          const userName = USER_NAME_MAPPINGS[userId] || `Mock User (${role.replace('_', ' ')})`;

          localStorage.setItem('token', token);
          localStorage.setItem('userId', userId);
          localStorage.setItem('role', role);

          const loggedUser = { token, userId, role, userName, isMock: true };
          setUser(loggedUser);
          return loggedUser;
        }
      }
      throw err;
    }
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
