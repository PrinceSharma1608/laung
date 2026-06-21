import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Search, 
  Save, 
  RotateCcw, 
  ShieldAlert, 
  User, 
  Check, 
  Loader2, 
  Cpu, 
  UserCheck 
} from 'lucide-react';
import Toast from '../components/Toast';

const MachineAllocation = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState([]);
  const [jhOwners, setJhOwners] = useState([]);
  const [selections, setSelections] = useState({}); // machineId -> selected jhOwnerId
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Fetch machines and JH owners on load
  const loadData = async () => {
    try {
      setLoading(true);
      const [machinesData, jhoData] = await Promise.all([
        apiService.getMachines(user?.userId || ''), // Fetch real db machines for this admin
        apiService.getUsers('JH_OWNER')            // Fetch real db JH Owners
      ]);
      
      setMachines(machinesData);
      setJhOwners(jhoData);

      // Initialize selections mapping state from db values
      const initialSelections = {};
      machinesData.forEach(m => {
        initialSelections[m.machineId] = m.jhOwnerId || '';
      });
      setSelections(initialSelections);
    } catch (err) {
      console.error('Error loading Machine JH Owner mappings', err);
      setToast({ message: 'Failed to load machines or JH owners from database.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectChange = (machineId, jhOwnerId) => {
    setSelections(prev => ({
      ...prev,
      [machineId]: jhOwnerId
    }));
  };

  const handleRevertCard = (machineId) => {
    const originalMachine = machines.find(m => m.machineId === machineId);
    setSelections(prev => ({
      ...prev,
      [machineId]: originalMachine ? (originalMachine.jhOwnerId || '') : ''
    }));
  };

  const handleResetAll = () => {
    const reset = {};
    machines.forEach(m => {
      reset[m.machineId] = m.jhOwnerId || '';
    });
    setSelections(reset);
  };

  // Get list of JHO IDs currently allocated/selected on screen (excluding the current machine's selection)
  const getAllocatedJhoIds = (currentMachineId) => {
    return Object.keys(selections)
      .filter(mId => mId !== currentMachineId)
      .map(mId => selections[mId])
      .filter(Boolean);
  };

  // Calculate pending changes
  const getPendingChanges = () => {
    const changes = [];
    machines.forEach(m => {
      const originalId = m.jhOwnerId || '';
      const selectedId = selections[m.machineId] || '';
      if (originalId !== selectedId) {
        changes.push({
          machineId: m.machineId,
          jhOwnerId: selectedId || null // Send null to unassign
        });
      }
    });
    return changes;
  };

  const pendingChanges = getPendingChanges();
  const hasChanges = pendingChanges.length > 0;

  const handleSaveAll = async () => {
    if (!hasChanges) {
      setToast({ message: 'No changes to save.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      // Submit multiple mappings together in one request
      await apiService.mapMachineToJhOwner(pendingChanges);
      
      setToast({ 
        message: `Successfully saved ${pendingChanges.length} machine allocation mapping(s) to database!`, 
        type: 'success' 
      });
      
      await loadData(); // Refresh list after successful mapping
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || err.message || 'Failed to save mappings to database.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter machines based on search bar (Machine ID and Machine Name)
  const filteredMachines = machines.filter(m => 
    m.machineId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.machineName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 p-6 rounded-3xl border border-slate-900 font-sans shadow-2xl">
      {/* Toast alert system */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5 mb-6">
        <div>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Tata Motors Lucknow
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Machine JH Owner Mapping
          </h2>
        </div>
        <div className="px-3.5 py-1.5 bg-blue-950/40 border border-blue-900/50 rounded-xl text-xs font-bold text-blue-400 self-start sm:self-center">
          Role Scope: ADMIN (1:1 Allocation)
        </div>
      </div>

      {/* Search and control bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input 
          type="text"
          placeholder="Search by Machine ID or Machine Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all font-medium"
        />
      </div>

      {/* Main mapping area */}
      {loading ? (
        // Loading skeletons
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-pulse">
              <div className="space-y-2 lg:w-3/5">
                <div className="h-3.5 bg-slate-800 rounded w-20" />
                <div className="h-5 bg-slate-800 rounded w-48" />
                <div className="h-3 bg-slate-800 rounded w-32" />
              </div>
              <div className="lg:w-1/3 h-10 bg-slate-850 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filteredMachines.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-850 rounded-3xl bg-slate-900/10">
          <ShieldAlert className="w-12 h-12 text-slate-650 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-400">No Machines Found</h3>
          <p className="text-sm text-slate-550 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or check the database registration.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vertical stack of wide horizontal cards */}
          {filteredMachines.map((machine) => {
            const currentSelected = selections[machine.machineId] || '';
            const originalSelected = machine.jhOwnerId || '';
            const isDirty = currentSelected !== originalSelected;

            // Enforce strict 1:1 logic on the frontend by filtering out JHOs allocated to other cards
            const allocatedIds = getAllocatedJhoIds(machine.machineId);
            const availableJhos = jhOwners.filter(jho => !allocatedIds.includes(jho.userId));

            return (
              <div 
                key={machine.machineId}
                className={`bg-slate-900/60 border rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-900 shadow-md ${
                  isDirty 
                    ? 'border-blue-500/50 ring-1 ring-blue-500/10 bg-slate-900/80' 
                    : 'border-slate-850'
                }`}
              >
                {/* Left Section (60% equivalent width on large screens) */}
                <div className="flex items-start gap-4 lg:w-3/5">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-blue-500 shrink-0 mt-0.5">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-blue-500 font-mono tracking-wider">
                        ID: {machine.machineId}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-extrabold bg-slate-950 text-slate-400 rounded-md border border-slate-800 uppercase tracking-wide">
                        {machine.areaName || 'Unknown Shop'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white tracking-wide">
                      {machine.machineName}
                    </h4>
                    <div className="flex flex-col gap-0.5 text-xs text-slate-450 font-medium">
                      <span>Sub Area: {machine.subarea || 'General Floor'}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Current JH Owner:
                        </span>
                        {machine.jhOwnerName ? (
                          <span className="text-emerald-450 font-semibold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            {machine.jhOwnerName} (ID: {machine.jhOwnerId})
                          </span>
                        ) : (
                          <span className="text-rose-450 font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            Not Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section (40% equivalent width on large screens) */}
                <div className="lg:w-1/3 flex items-end gap-2.5 shrink-0 w-full lg:w-auto">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">
                      Assign JH Owner (None to clear)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <select
                        value={currentSelected}
                        onChange={(e) => handleSelectChange(machine.machineId, e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all font-semibold cursor-pointer"
                      >
                        <option value="">None (Unassigned)</option>
                        {availableJhos.map(jho => (
                          <option key={jho.userId} value={jho.userId}>
                            {jho.userId} - {jho.userName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Revert individual change */}
                  {isDirty && (
                    <button
                      onClick={() => handleRevertCard(machine.machineId)}
                      title="Revert mapping"
                      className="p-2.5 rounded-xl border border-slate-850 hover:bg-slate-950 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Action Footer with Save All Button */}
      {!loading && machines.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between bg-slate-950/20 p-5 rounded-2xl border border-slate-900 gap-4">
          <div className="text-xs font-semibold text-slate-450">
            {!hasChanges ? (
              <span>No changes selected. Update dropdown options to configure assignments.</span>
            ) : (
              <span className="text-blue-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {pendingChanges.length} allocation change(s) pending save.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {hasChanges && (
              <button
                onClick={handleResetAll}
                disabled={submitting}
                className="w-1/2 sm:w-auto px-5 py-3 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 font-bold text-sm transition-all cursor-pointer disabled:opacity-40"
              >
                Reset All
              </button>
            )}
            
            <button
              onClick={handleSaveAll}
              disabled={submitting || !hasChanges}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Mappings...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Mappings</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineAllocation;
