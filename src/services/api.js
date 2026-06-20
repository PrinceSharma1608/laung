import axios from 'axios';
import { 
  getMockUsers, 
  getMockMachines, 
  getMockMaintenanceStatus, 
  mapSupervisorMock, 
  mapTeamLeaderToJhOwnerMock, 
  mapMachineToJhOwnerMock 
} from './mockData';

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
    try {
      const response = await apiClient.get('/fetch/users', {
        params: role ? { role } : {}
      });
      return response.data;
    } catch (error) {
      console.warn('Backend getUsers failed. Using local mock data.', error);
      return getMockUsers(role);
    }
  },

  // 3. Fetch Machines for Dashboard (GET /fetch/machines?userId={userId})
  getMachines: async (userId) => {
    try {
      const response = await apiClient.get('/fetch/machines', {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.warn('Backend getMachines failed. Using local mock data.', error);
      return getMockMachines(userId);
    }
  },

  // 4. Fetch Daily Maintenance Dashboard (GET /fetch/daily-dashboard?userId={userId})
  getDailyDashboard: async (userId) => {
    try {
      const response = await apiClient.get('/fetch/daily-dashboard', {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.warn('Backend getDailyDashboard failed. Using local mock data.', error);
      const statusData = getMockMaintenanceStatus();
      const userMachines = getMockMachines(userId);
      const userMachineIds = new Set(userMachines.map(m => m.machineId));
      return statusData.filter(item => userMachineIds.has(item.machineId));
    }
  },

  // 5. Map Area to Supervisor (PUT /fetch/a-sMap)
  mapSupervisor: async (areaId, supervisorId) => {
    try {
      const response = await apiClient.put('/fetch/a-sMap', { areaId, supervisorId });
      return response.data;
    } catch (error) {
      console.warn('Backend mapSupervisor failed. Using local mock simulation.', error);
      return mapSupervisorMock(areaId, supervisorId);
    }
  },

  // 6. Map Team Leader to JH Owner (PUT /fetch/tl-jhoMap)
  mapTeamLeaderToJhOwner: async (teamLeaderId, jhOwnerId) => {
    try {
      const response = await apiClient.put('/fetch/tl-jhoMap', { teamLeaderId, jhOwnerId });
      return response.data;
    } catch (error) {
      console.warn('Backend mapTeamLeaderToJhOwner failed. Using local mock simulation.', error);
      return mapTeamLeaderToJhOwnerMock(teamLeaderId, jhOwnerId);
    }
  },

  // 7. Map Machine to JH Owner (Bulk) (PUT /fetch/machine-jhoMap)
  mapMachineToJhOwner: async (dtoList) => {
    try {
      const response = await apiClient.put('/fetch/machine-jhoMap', dtoList);
      return response.data;
    } catch (error) {
      console.warn('Backend mapMachineToJhOwner failed. Using local mock simulation.', error);
      return mapMachineToJhOwnerMock(dtoList);
    }
  },
};
