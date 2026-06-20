import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Toast from '../components/Toast';
import { MapPin, UserCheck, ShieldAlert, CheckCircle } from 'lucide-react';

const AreaSupervisorMapping = () => {
  const [areas, setAreas] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        // Fetch real machines database records and extract unique Area entities
        const [machinesData, supervisorsData] = await Promise.all([
          apiService.getMachines(''),
          apiService.getUsers('SUPERVISOR')
        ]);

        const uniqueAreasMap = {};
        machinesData.forEach(m => {
          if (m.areaId && !uniqueAreasMap[m.areaId]) {
            uniqueAreasMap[m.areaId] = {
              areaId: m.areaId,
              areaName: m.areaName,
              supervisorId: m.supervisorId,
              supervisorName: m.supervisorName
            };
          }
        });

        setAreas(Object.values(uniqueAreasMap));
        setSupervisors(supervisorsData);
      } catch (err) {
        console.error('Error loading dropdown details', err);
      }
    };
    loadDropdownData();
  }, []);

  const handleMapSubmit = async (e) => {
    e.preventDefault();

    if (!selectedArea || !selectedSupervisor) {
      setToast({ message: 'Please select both Area and Supervisor.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const resultMsg = await apiService.mapSupervisor(selectedArea, selectedSupervisor);
      
      // Update local state to reflect mapping immediately in selection UI
      const updatedAreas = areas.map(a => {
        if (a.areaId === selectedArea) {
          const supervisor = supervisors.find(s => s.userId === selectedSupervisor);
          return { ...a, supervisorId: selectedSupervisor, supervisorName: supervisor?.userName };
        }
        return a;
      });
      setAreas(updatedAreas);

      setToast({ message: resultMsg || 'Mapping completed successfully!', type: 'success' });
      
      // Clear selections
      setSelectedArea('');
      setSelectedSupervisor('');
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || err.message || 'Mapping failed. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Page Header */}
      <div>
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Floor Layout</span>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Area-Supervisor Mapping
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Mapping Form */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 lg:col-span-1 space-y-6 bg-white/60 dark:bg-slate-900/60 shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Establish Allocation</h3>
            <p className="text-xs font-semibold text-slate-455 dark:text-slate-500 tracking-wide mt-1">
              Associate a shop floor area with an assigned supervisor
            </p>
          </div>

          <form onSubmit={handleMapSubmit} className="space-y-5">
            {/* Area Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Select Floor Area
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-150 text-sm focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer"
                  required
                >
                  <option value="">Select Area...</option>
                  {areas.map(a => (
                    <option key={a.areaId} value={a.areaId}>
                      {a.areaName} ({a.areaId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Supervisor Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Select Supervisor
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <UserCheck className="w-4 h-4" />
                </div>
                <select
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-150 text-sm focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer"
                  required
                >
                  <option value="">Select Supervisor...</option>
                  {supervisors.map(s => (
                    <option key={s.userId} value={s.userId}>
                      {s.userName} (ID: {s.userId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Map Supervisor</span>
              )}
            </button>
          </form>
        </div>

        {/* Existing Mapping Grid table */}
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 lg:col-span-2 overflow-hidden bg-white/40 dark:bg-slate-900/40 shadow-lg">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Current Assignments</h3>
            <p className="text-xs font-semibold text-slate-455 dark:text-slate-500 tracking-wide mt-1">
              Currently registered supervisor-area combinations on file
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-4 px-6">Area ID</th>
                  <th className="py-4 px-6">Area Name</th>
                  <th className="py-4 px-6">Supervisor ID</th>
                  <th className="py-4 px-6">Supervisor Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-sm">
                {areas.map((a) => (
                  <tr key={a.areaId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {a.areaId}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {a.areaName}
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-slate-600 dark:text-slate-350">
                      {a.supervisorId || (
                        <span className="text-xs text-rose-500 font-semibold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                          Vacant
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-850 dark:text-slate-250">
                      {a.supervisorName || <span className="text-slate-400 text-xs">Unassigned</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaSupervisorMapping;
