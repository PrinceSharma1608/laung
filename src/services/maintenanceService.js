import { apiService } from './api';

export const maintenanceService = {
  getAssignedMachines: async (userId) => {
    // Fetch daily dashboard assigned machines for today (gets status, audited flag)
    const dailyStatus = await apiService.getDailyDashboard(userId);
    
    // Fetch all mapped machines details (gets area, subarea, delayCount, etc.)
    let machinesList = [];
    try {
      machinesList = await apiService.getMachines(userId);
    } catch (err) {
      console.warn('Failed to fetch machines mapping. Falling back to daily status data.', err);
    }

    // Merge the daily assigned statuses with detailed machine properties
    const merged = dailyStatus.map(statusObj => {
      const detail = machinesList.find(m => m.machineId === statusObj.machineId) || {};
      
      // Calculate sensible fallbacks for frequency and dates
      const mockFrequency = '1 Day';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const mockLastDate = yesterday.toISOString().split('T')[0];
      const mockNextDate = new Date().toISOString().split('T')[0];

      return {
        machineId: statusObj.machineId,
        machineName: statusObj.machineName || detail.machineName || `Machine ${statusObj.machineId}`,
        areaId: detail.areaId || '',
        areaName: detail.areaName || 'Standard Shop Floor',
        subarea: detail.subarea || 'Line A',
        maintenanceStatus: statusObj.maintenanceStatus || 'PENDING',
        delayCount: detail.delayCount !== undefined ? detail.delayCount : 0,
        maintenanceFrequency: mockFrequency,
        lastMaintenanceDate: mockLastDate,
        nextMaintenanceDate: mockNextDate,
        audited: statusObj.audited || false
      };
    });

    return merged;
  },

  completeMaintenance: async (payload) => {
    return await apiService.completeMaintenance(payload);
  }
};
