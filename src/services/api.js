import axios from 'axios';

const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:1608'
  : 'https://elaichi.up.railway.app';

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

// Global 401 interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

  // Fetch Areas (GET /fetch/areas)
  getAreas: async () => {
    const response = await apiClient.get('/fetch/areas');
    return response.data;
  },

  // Fetch TL-JHO Mappings (GET /fetch/tl-jhoMap)
  getTlJhoMappings: async () => {
    const response = await apiClient.get('/fetch/tl-jhoMap');
    return response.data;
  },

  // 3. Fetch Machines for Dashboard (GET /fetch/machines?userId={userId})
  getMachines: async (userId) => {
    const response = await apiClient.get('/fetch/machines', {
      params: { userId }
    });
    return response.data;
  },

  // 4. Fetch Daily Maintenance Dashboard — returns one entry per (machineId, frequencyDays)
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
  mapTeamLeaderToJhOwner: async (teamLeaderId, jhOwnerIds) => {
    const response = await apiClient.put('/fetch/tl-jhoMap', { teamLeaderId, jhOwnerIds });
    return response.data;
  },

  // 7. Map Machine to JH Owner (Bulk) (PUT /fetch/machine-jhoMap)
  mapMachineToJhOwner: async (dtoList) => {
    const response = await apiClient.put('/fetch/machine-jhoMap', dtoList);
    return response.data;
  },

  // 8. Fetch Maintenance Logs (GET /fetch/maintenance-logs)
  getMaintenanceLogs: async () => {
    const response = await apiClient.get('/fetch/maintenance-logs');
    return response.data;
  },

  // 9. Fetch Audit Logs (GET /fetch/audit-logs)
  getAuditLogs: async () => {
    const response = await apiClient.get('/fetch/audit-logs');
    return response.data;
  },

  // 10. Submit Audit (POST /fetch/audit)
  submitAudit: async (auditData) => {
    const response = await apiClient.post('/fetch/audit', auditData);
    return response.data;
  },

  // 11. Complete Maintenance — payload: { machineId, frequencyDays, checklist: [{item, status}], remarks }
  completeMaintenance: async (payload) => {
    const response = await apiClient.post('/fetch/maintenance/complete', payload);
    return response.data;
  },

  // 12. Get Machine Directory (GET /fetch/machine-directory)
  getMachineDirectory: async () => {
    const response = await apiClient.get('/fetch/machine-directory');
    return response.data;
  },

  // 13. Get Checklist items for a specific (machineId, frequencyDays)
  getChecklist: async (machineId, frequencyDays) => {
    const response = await apiClient.get('/fetch/machine/checklist', {
      params: { machineId, frequencyDays }
    });
    return response.data; // List<String>
  },

  // 14. Create Checklist — payload: { machineId, frequencyDays, checklist: ["item1","item2"] }
  createChecklist: async (payload) => {
    const response = await apiClient.post('/fetch/machine/checklist', payload);
    return response.data;
  },
};
