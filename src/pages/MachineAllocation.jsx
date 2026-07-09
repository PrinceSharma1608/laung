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
        initialSelections[m.machineId] = {
          jhOwnerId: m.jhOwnerId || '',
          subarea: m.subarea || '',
          machineStatus: m.machineStatus || 'ACTIVE'
        };
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

  const handleFieldChange = (machineId, field, value) => {
    setSelections(prev => ({
      ...prev,
      [machineId]: {
        ...(prev[machineId] || { jhOwnerId: '', subarea: '', machineStatus: 'ACTIVE' }),
        [field]: value
      }
    }));
  };

  const handleRevertCard = (machineId) => {
    const originalMachine = machines.find(m => m.machineId === machineId);
    setSelections(prev => ({
      ...prev,
      [machineId]: originalMachine ? {
        jhOwnerId: originalMachine.jhOwnerId || '',
        subarea: originalMachine.subarea || '',
        machineStatus: originalMachine.machineStatus || 'ACTIVE'
      } : { jhOwnerId: '', subarea: '', machineStatus: 'ACTIVE' }
    }));
  };

  const handleResetAll = () => {
    const reset = {};
    machines.forEach(m => {
      reset[m.machineId] = {
        jhOwnerId: m.jhOwnerId || '',
        subarea: m.subarea || '',
        machineStatus: m.machineStatus || 'ACTIVE'
      };
    });
    setSelections(reset);
  };

  // Get list of JHO IDs currently allocated/selected on screen (excluding the current machine's selection)
  const getAllocatedJhoIds = (currentMachineId) => {
    return Object.keys(selections)
      .filter(mId => mId !== currentMachineId)
      .map(mId => selections[mId]?.jhOwnerId)
      .filter(Boolean);
  };

  // Calculate pending changes
  const getPendingChanges = () => {
    const changes = [];
    machines.forEach(m => {
      const original = {
        jhOwnerId: m.jhOwnerId || '',
        subarea: m.subarea || '',
        machineStatus: m.machineStatus || 'ACTIVE'
      };
      const current = selections[m.machineId] || { jhOwnerId: '', subarea: '', machineStatus: 'ACTIVE' };
      if (
        original.jhOwnerId !== current.jhOwnerId ||
        original.subarea !== current.subarea ||
        original.machineStatus !== current.machineStatus
      ) {
        changes.push({
          machineId: m.machineId,
          jhOwnerId: current.jhOwnerId || null, // Send null to unassign
          subarea: current.subarea,
          machineStatus: current.machineStatus
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
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Toast alert system */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
        <div>
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            Plant Portal
          </span>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-1">
            Machine Allocation Mapping
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Assign registered machines to specific Jishu Hozen (JH) Owners and update status/subarea
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs font-bold text-indigo-650 dark:text-indigo-400 self-start sm:self-center">
          Role Scope: LINE INCHARGE
        </div>
      </div>

      {/* Search and control bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input 
          type="text"
          placeholder="Search by Machine ID or Machine Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all font-semibold shadow-sm"
        />
      </div>

      {/* Main mapping area */}
      {loading ? (
        // Loading skeletons
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-pulse">
              <div className="space-y-2 lg:w-3/5">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-48" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-32" />
              </div>
              <div className="lg:w-1/3 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filteredMachines.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/10">
          <ShieldAlert className="w-12 h-12 text-slate-400 dark:text-slate-650 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-550 dark:text-slate-405">No Machines Found</h3>
          <p className="text-sm text-slate-450 dark:text-slate-550 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or check the database registration.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMachines.map((machine) => {
            const currentSelection = selections[machine.machineId] || { jhOwnerId: '', subarea: '', machineStatus: 'ACTIVE' };
            const currentJhoId = currentSelection.jhOwnerId || '';
            const currentSubarea = currentSelection.subarea || '';
            const currentStatus = currentSelection.machineStatus || 'ACTIVE';

            const originalJhoId = machine.jhOwnerId || '';
            const originalSubarea = machine.subarea || '';
            const originalStatus = machine.machineStatus || 'ACTIVE';

            const isDirty = 
              currentJhoId !== originalJhoId ||
              currentSubarea !== originalSubarea ||
              currentStatus !== originalStatus;

            const allocatedIds = getAllocatedJhoIds(machine.machineId);
            const availableJhos = jhOwners.filter(jho => !allocatedIds.includes(jho.userId));

            return (
              <div 
                key={machine.machineId}
                className={`bg-white dark:bg-slate-900/60 border rounded-2xl p-5 hover:border-slate-350 dark:hover:border-slate-700/80 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-md ${
                  isDirty 
                    ? 'border-indigo-500/50 ring-1 ring-indigo-500/10 bg-indigo-50/5 dark:bg-indigo-950/10' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Left Section (Machine details) */}
                <div className="flex items-start gap-4 lg:w-[40%]">
                  <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">
                        ID: {machine.machineId}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-extrabold bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-800 uppercase tracking-wide">
                        {machine.areaName || 'Unknown Shop'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-white tracking-wide">
                      {machine.machineName}
                    </h4>
                    <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-450 font-medium">
                      <span>Subarea:</span>
                      <input
                        type="text"
                        value={currentSubarea}
                        onChange={(e) => handleFieldChange(machine.machineId, 'subarea', e.target.value)}
                        placeholder="e.g. Line A, Printing..."
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Section (Current JH Owner) */}
                <div className="flex flex-col gap-1.5 lg:w-[20%] lg:border-l lg:border-slate-200 dark:lg:border-slate-800/80 lg:pl-6 w-full lg:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Current JH Owner
                  </span>
                  {machine.jhOwnerName ? (
                    <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-lg text-emerald-650 shrink-0">
                        <UserCheck className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-800 dark:text-white text-sm font-bold leading-tight">{machine.jhOwnerName}</span>
                        <span className="text-slate-450 dark:text-slate-555 text-xs font-mono">ID: {machine.jhOwnerId}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 font-semibold text-sm">
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-500 shrink-0">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                      </div>
                      <span className="text-slate-500 dark:text-slate-555 text-sm font-medium">Not Assigned</span>
                    </div>
                  )}
                </div>

                {/* Right Section (Dropdown & Actions) */}
                <div className="lg:w-[40%] flex items-end gap-2.5 shrink-0 w-full lg:w-auto lg:border-l lg:border-slate-200 dark:lg:border-slate-800/80 lg:pl-6">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest block">
                      Assign JH Owner
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450 dark:text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <select
                        value={currentJhoId}
                        onChange={(e) => handleFieldChange(machine.machineId, 'jhOwnerId', e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all font-semibold cursor-pointer"
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

                  <div className="w-[120px] space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest block">
                      Machine Status
                    </label>
                    <select
                      value={currentStatus}
                      onChange={(e) => handleFieldChange(machine.machineId, 'machineStatus', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all font-semibold cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  
                  {/* Revert individual change */}
                  {isDirty && (
                    <button
                      onClick={() => handleRevertCard(machine.machineId)}
                      title="Revert mapping"
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-450 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
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
        <div className="mt-8 pt-6 border-t border-slate-200/65 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between bg-white/40 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-900 gap-4">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-450">
            {!hasChanges ? (
              <span>No changes selected. Update options inline to configure machines.</span>
            ) : (
              <span className="text-indigo-650 dark:text-indigo-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                {pendingChanges.length} change(s) pending save.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {hasChanges && (
              <button
                onClick={handleResetAll}
                disabled={submitting}
                className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold text-sm transition-all cursor-pointer disabled:opacity-40"
              >
                Reset All
              </button>
            )}
            
            <button
              onClick={handleSaveAll}
              disabled={submitting || !hasChanges}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Mappings...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
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
