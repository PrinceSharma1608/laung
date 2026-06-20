import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Toast from '../components/Toast';
import { 
  MapPin, 
  User, 
  UserCheck, 
  Check, 
  Loader2, 
  ShieldAlert, 
  LayoutGrid,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AreaSupervisorMapping = () => {
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selections, setSelections] = useState({}); // areaId -> selected supervisorId
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null); // areaId currently mapping
  const [toast, setToast] = useState(null);

  // Fetch areas and supervisors on load
  const loadData = async () => {
    try {
      setLoading(true);
      const [areasData, supervisorsData] = await Promise.all([
        apiService.getAreas(),
        apiService.getUsers('SUPERVISOR')
      ]);
      setAreas(areasData);
      setSupervisors(supervisorsData);
    } catch (err) {
      console.error('Error loading Area/Supervisor data', err);
      setToast({ message: 'Failed to load area or supervisor listings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectChange = (areaId, supervisorId) => {
    setSelections(prev => ({
      ...prev,
      [areaId]: supervisorId
    }));
  };

  const handleAssign = async (areaId) => {
    const supervisorId = selections[areaId];
    if (!supervisorId) {
      setToast({ message: 'Please select a supervisor first.', type: 'error' });
      return;
    }

    setSubmittingId(areaId);
    try {
      const resultMsg = await apiService.mapSupervisor(areaId, supervisorId);
      setToast({ message: resultMsg || 'Supervisor mapped successfully!', type: 'success' });
      
      // Clear selection for this card
      setSelections(prev => {
        const next = { ...prev };
        delete next[areaId];
        return next;
      });

      // Refresh data
      await loadData();
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || err.message || 'Failed to map supervisor.', 
        type: 'error' 
      });
    } finally {
      setSubmittingId(null);
    }
  };

  // Get list of supervisors already assigned in the database
  const assignedSupervisorIds = areas.map(a => a.supervisorId).filter(Boolean);

  // Get list of supervisors selected in other dropdowns (to avoid double selection on screen)
  const getSelectedInOtherDropdowns = (currentAreaId) => {
    return Object.entries(selections)
      .filter(([areaId, supervisorId]) => areaId !== currentAreaId && supervisorId)
      .map(([_, supervisorId]) => supervisorId);
  };

  return (
    <div className="space-y-8 min-h-[80vh] text-slate-100 font-sans">
      {/* Toast Alert */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Floor Administration
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Area Supervisor Mapping
          </h2>
        </div>
        <div className="px-4 py-2 bg-indigo-950/40 border border-indigo-900/50 rounded-xl text-xs font-semibold text-indigo-400">
          Role Scope: LINE INCHARGE (1:1 Allocation)
        </div>
      </div>

      {loading ? (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Fetching floor maps...</span>
        </div>
      ) : areas.length === 0 ? (
        <div className="h-[40vh] flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-3xl bg-slate-900/20 p-8 text-center">
          <LayoutGrid className="w-12 h-12 text-slate-650 mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No Areas Registered</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            There are no shop floor areas registered in the database. Please add areas or check backend config.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => {
            const currentSelected = selections[area.areaId] || '';
            
            // Filter supervisors: exclude supervisors assigned to other areas OR selected in other dropdowns
            const unavailableIds = [
              ...assignedSupervisorIds.filter(id => id !== area.supervisorId),
              ...getSelectedInOtherDropdowns(area.areaId)
            ];
            
            const availableSupervisors = supervisors.filter(s => !unavailableIds.includes(s.userId));

            return (
              <div 
                key={area.areaId} 
                className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Card ID & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-900/50 px-2.5 py-1 rounded-lg">
                      {area.areaId}
                    </span>
                    <MapPin className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>

                  {/* Area Title */}
                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">
                      {area.areaName}
                    </h4>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-800/80" />

                  {/* Currently Assigned Supervisor */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Current Supervisor
                    </span>
                    {area.supervisorName ? (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-850">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-white truncate">
                            {area.supervisorName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: {area.supervisorId}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/10 border border-rose-900/20 text-rose-400 text-xs font-semibold">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>No Supervisor Assigned (Vacant)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dropdown & Assignment Button */}
                <div className="mt-6 pt-5 border-t border-slate-850 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Assign Supervisor
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <select
                        value={currentSelected}
                        onChange={(e) => handleSelectChange(area.areaId, e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer"
                      >
                        <option value="">Select Supervisor...</option>
                        {availableSupervisors.map(s => (
                          <option key={s.userId} value={s.userId}>
                            {s.userName} (ID: {s.userId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAssign(area.areaId)}
                    disabled={submittingId === area.areaId || !currentSelected}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
                  >
                    {submittingId === area.areaId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Assign</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AreaSupervisorMapping;
