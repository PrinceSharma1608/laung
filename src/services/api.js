import axios from 'axios';

// API base URL configuration (uses dev env variable or defaults to Spring Boot's localhost:1608)
const API_BASE_URL = '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const apiService = {
  // 1. Auth Login (POST /auth/login)
  login: async (userId, password) => {
    const response = await apiClient.post('/auth/login', { userId, password });
    return response.data;
  },

  // 2. Fetch Users (GET /fetch/users)
  getUsers: async (role) => {
    const response = await apiClient.get('/fetch/users', {
      params: role ? { role } : {}
    });
    return response.data;
  },

  // 3. Fetch Machines for Dashboard (GET /fetch/machines?userId={userId})
  getMachines: async (userId) => {
    const response = await apiClient.get('/fetch/machines', {
      params: { userId }
    });
    return response.data;
  },

  // 4. Fetch Daily Maintenance Dashboard (GET /fetch/daily-dashboard?userId={userId})
  getDailyDashboard: async (userId) => {
    const response = await apiClient.get('/fetch/daily-dashboard', {
      params: { userId }
    });
    return response.data;
  },

  // 5. Map Area to Supervisor (PUT /fetch/a-sMap)
  mapSupervisor: async (areaId, supervisorId) => {
    const response = await apiClient.put('/fetch/a-sMap', { areaId, supervisorId });
    return response.data;
  },

  // 6. Map Team Leader to JH Owner (PUT /fetch/tl-jhoMap)
  mapTeamLeaderToJhOwner: async (teamLeaderId, jhOwnerId) => {
    const response = await apiClient.put('/fetch/tl-jhoMap', { teamLeaderId, jhOwnerId });
    return response.data;
  },

  // 7. Map Machine to JH Owner (Bulk) (PUT /fetch/machine-jhoMap)
  mapMachineToJhOwner: async (dtoList) => {
    const response = await apiClient.put('/fetch/machine-jhoMap', dtoList);
    return response.data;
  },
};
