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
    const userName = localStorage.getItem('userName');

    if (token && userId && role) {
      const name = userName || USER_NAME_MAPPINGS[userId] || `User #${userId}`;
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
    const apiBaseUrl = '';
    
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/login`, {
        userId,
        password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { token, role } = response.data;
      
      // Fetch the real name from database
      let userName = USER_NAME_MAPPINGS[userId] || `User #${userId}`;
      try {
        const usersResponse = await axios.get(`${apiBaseUrl}/fetch/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const loggedInUser = usersResponse.data.find(u => u.userId === userId);
        if (loggedInUser && loggedInUser.userName) {
          userName = loggedInUser.userName;
        }
      } catch (e) {
        console.warn('Failed to fetch real name from backend. Using static fallback.', e);
      }

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);
      localStorage.setItem('userName', userName);

      const loggedUser = { token, userId, role, userName };
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
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
