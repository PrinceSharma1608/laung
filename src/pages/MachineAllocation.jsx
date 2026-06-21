import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Toast from '../components/Toast';
import { 
  Cpu, 
  User, 
  UserCheck, 
  Check, 
  Loader2, 
  ShieldAlert, 
  ListTodo,
  Activity,
  Save,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MachineAllocation = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState([]);
  const [jhOwners, setJhOwners] = useState([]);
  const [selections, setSelections] = useState({}); // machineId -> selected jhOwnerId
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch machines and JH owners on load
  const loadData = async () => {
    try {
      setLoading(true);
      const [machinesData, jhoData] = await Promise.all([
        apiService.getMachines(''), // Fetch all machines
        apiService.getUsers('JH_OWNER')
      ]);
      setMachines(machinesData);
      setJhOwners(jhoData);
    } catch (err) {
      console.error('Error loading Machine Allocation details', err);
      setToast({ message: 'Failed to load machine or JH owner listings.', type: 'error' });
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
    setSelections(prev => {
      const next = { ...prev };
      delete next[machineId];
      return next;
    });
  };

  const handleReset = () => {
    setSelections({});
  };

  // Get active JHO for a machine (takes selection state into account)
  const getActiveJho = (machineId, dbJhoId) => {
    return selections[machineId] !== undefined ? selections[machineId] : (dbJhoId || '');
  };

  // List of all JHO IDs currently assigned/selected on the screen
  const assignedOnScreen = machines
    .map(m => getActiveJho(m.machineId, m.jhOwnerId))
    .filter(Boolean);

  // Calculate pending changes
  const getPendingChanges = () => {
    const changes = [];
    Object.keys(selections).forEach(machineId => {
      const machine = machines.find(m => m.machineId === machineId);
      const originalId = machine ? (machine.jhOwnerId || '') : '';
      const selectedId = selections[machineId];
      if (selectedId !== originalId) {
        changes.push({
          machineId,
          machineName: machine?.machineName,
          oldJhoId: originalId,
          newJhoId: selectedId
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
      const dtoList = pendingChanges.map(change => ({
        machineId: change.machineId,
        jhOwnerId: change.newJhoId || null
      }));
      
      await apiService.mapMachineToJhOwner(dtoList);
      
      setToast({ 
        message: `Successfully updated ${pendingChanges.length} Machine Allocation(s)!`, 
        type: 'success' 
      });
      
      setSelections({}); // Clear pending selections
      await loadData(); // Reload fresh database state
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || err.message || 'Mapping failed. Check if a JH Owner is already assigned.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 min-h-[80vh] text-slate-800 dark:text-slate-100 font-sans">
      {/* Toast notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Machine Control
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Machine Allocation
          </h2>
        </div>
        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs font-semibold text-indigo-650 dark:text-indigo-400 self-start sm:self-center">
          Role Scope: LINE INCHARGE (1:1 Bulk Mapping)
        </div>
      </div>

      {loading ? (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Fetching machine configurations...</span>
        </div>
      ) : machines.length === 0 ? (
        <div className="h-[40vh] flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/20 p-8 text-center">
          <ListTodo className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-350">No Machines Registered</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            There are no floor machines registered. Add machines to configure allocations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Horizontal list of machine rows */}
          <div className="space-y-4">
            {machines.map((machine) => {
              const currentSelected = getActiveJho(machine.machineId, machine.jhOwnerId);
              const originalSelected = machine.jhOwnerId || '';
              const isDirty = currentSelected !== originalSelected;

              // Filter out JHOs assigned to OTHER machines on screen
              const unavailableIds = assignedOnScreen.filter(id => id !== currentSelected);
              const availableJhos = jhOwners.filter(jho => !unavailableIds.includes(jho.userId));

              return (
                <div 
                  key={machine.machineId} 
                  className={`bg-white dark:bg-slate-900/40 border rounded-2xl p-5 hover:border-slate-400 dark:hover:border-slate-700/80 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 shadow-sm ${
                    isDirty 
                      ? 'border-indigo-500/60 dark:border-indigo-500/40 ring-1 ring-indigo-500/10 dark:ring-indigo-500/5' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Left Section: Machine info */}
                  <div className="flex items-start gap-4 lg:w-1/3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-slate-950 rounded-xl border border-indigo-100 dark:border-slate-800 text-indigo-650 dark:text-indigo-400 shrink-0">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">
                          ID: {machine.machineId}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                          {machine.areaName || 'Unknown Shop'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                        {machine.machineName}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Subarea: {machine.subarea || 'General Floor'}
                      </p>
                    </div>
                  </div>

                  {/* Middle Section: Currently Assigned JH Owner */}
                  <div className="flex-1 lg:max-w-xs">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                      Current JH Owner
                    </span>
                    {machine.jhOwnerName ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {machine.jhOwnerName} <span className="text-xs text-slate-450 dark:text-slate-500 font-mono">(ID: {machine.jhOwnerId})</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>Vacant (No Assignment)</span>
                      </div>
                    )}
                  </div>

                  {/* Right Section: Dropdown for mapping */}
                  <div className="lg:w-80 flex items-end gap-2.5">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                        Assign JH Owner (None to clear)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                        <select
                          value={currentSelected}
                          onChange={(e) => handleSelectChange(machine.machineId, e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold cursor-pointer"
                        >
                          <option value="">None (Unassigned / Free)</option>
                          {availableJhos.map(jho => (
                            <option key={jho.userId} value={jho.userId}>
                              {jho.userName} (ID: {jho.userId})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Undo/Revert individual card button */}
                    {isDirty && (
                      <button
                        onClick={() => handleRevertCard(machine.machineId)}
                        title="Revert change"
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer with single Save Button */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {!hasChanges ? (
                <span>No changes selected. Select JH Owners to enable saving.</span>
              ) : (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {pendingChanges.length} allocation change(s) pending save.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  disabled={submitting}
                  className="w-1/2 sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold text-sm transition-all cursor-pointer disabled:opacity-40"
                >
                  Reset
                </button>
              )}
              
              <button
                onClick={handleSaveAll}
                disabled={submitting || !hasChanges}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/10 dark:shadow-indigo-600/5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Allocations...</span>
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
        </div>
      )}
    </div>
  );
};

export default MachineAllocation;
