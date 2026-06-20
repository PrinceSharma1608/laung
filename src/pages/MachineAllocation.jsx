import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Toast from '../components/Toast';
import { Layers, Plus, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';

const MachineAllocation = () => {
  const [machines, setMachines] = useState([]);
  const [jhOwners, setJhOwners] = useState([]);
  const [rows, setRows] = useState([{ machineId: '', jhOwnerId: '' }]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [machinesData, jhoData] = await Promise.all([
          apiService.getMachines(''), // Load all machines for mapping
          apiService.getUsers('JH_OWNER')
        ]);
        setMachines(machinesData);
        setJhOwners(jhoData);
      } catch (err) {
        console.error('Error loading dropdown details for machine mapping', err);
      }
    };
    loadDropdownData();
  }, []);

  const handleAddRow = () => {
    setRows(prev => [...prev, { machineId: '', jhOwnerId: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length === 1) {
      setRows([{ machineId: '', jhOwnerId: '' }]);
      return;
    }
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setRows(prev => prev.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate incomplete selections
    const hasEmpty = rows.some(r => !r.machineId || !r.jhOwnerId);
    if (hasEmpty) {
      setToast({ message: 'Please complete all selections in your mapping rows.', type: 'error' });
      return;
    }

    // 2. Validate duplicate machine selection
    const selectedMachines = rows.map(r => r.machineId);
    const hasDuplicates = selectedMachines.length !== new Set(selectedMachines).size;
    if (hasDuplicates) {
      setToast({ message: 'Duplicate Machine allocations found. Each machine must be mapped once.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const resultMsg = await apiService.mapMachineToJhOwner(rows);
      
      // Update local machines list to reflect mappings in the list
      const updatedMachines = [...machines];
      rows.forEach(row => {
        const targetMachine = updatedMachines.find(m => m.machineId === row.machineId);
        const jho = jhOwners.find(j => j.userId === row.jhOwnerId);
        if (targetMachine && jho) {
          targetMachine.jhOwnerId = jho.userId;
          targetMachine.jhOwnerName = jho.userName;
        }
      });
      setMachines(updatedMachines);

      setToast({ message: resultMsg || 'Bulk machine allocation completed!', type: 'success' });
      
      // Reset rows to single empty row
      setRows([{ machineId: '', jhOwnerId: '' }]);
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || err.message || 'Bulk mapping failed. Check if a JHO is already assigned to another machine.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Get selected machines to disable in other rows
  const getSelectedMachines = (currentIndex) => {
    return rows
      .map((r, idx) => idx !== currentIndex ? r.machineId : '')
      .filter(Boolean);
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
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Machine Control</span>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Machine Allocation
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Dynamic Mapping List Form */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 xl:col-span-2 space-y-6 bg-white/60 dark:bg-slate-900/60 shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Bulk Allocate Machines</h3>
            <p className="text-xs font-semibold text-slate-455 dark:text-slate-500 tracking-wide mt-1">
              Add multiple machines and map them to their respective JH Owners for daily cleanings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {rows.map((row, index) => {
                const alreadySelected = getSelectedMachines(index);
                return (
                  <div 
                    key={index} 
                    className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 group hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <span className="text-xs font-extrabold text-slate-400 font-mono w-6 h-6 rounded-full bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    {/* Machine Dropdown */}
                    <div className="flex-1 w-full space-y-1">
                      <select
                        value={row.machineId}
                        onChange={(e) => handleRowChange(index, 'machineId', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-semibold"
                        required
                      >
                        <option value="">Select Machine...</option>
                        {machines.map(m => {
                          const isDisabled = alreadySelected.includes(m.machineId);
                          return (
                            <option key={m.machineId} value={m.machineId} disabled={isDisabled}>
                              {m.machineName} ({m.machineId}) {m.jhOwnerName ? `[Active: ${m.jhOwnerName}]` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* JH Owner Dropdown */}
                    <div className="flex-1 w-full space-y-1">
                      <select
                        value={row.jhOwnerId}
                        onChange={(e) => handleRowChange(index, 'jhOwnerId', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-semibold"
                        required
                      >
                        <option value="">Select JH Owner...</option>
                        {jhOwners.map(jho => (
                          <option key={jho.userId} value={jho.userId}>
                            {jho.userName} (ID: {jho.userId})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all hover:scale-105 shrink-0 self-center"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-850/50 pt-5">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/20 hover:border-indigo-300 dark:hover:bg-indigo-950/10 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Allocation Row</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Allocation'}
              </button>
            </div>
          </form>
        </div>

        {/* Informational Guidelines Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 xl:col-span-1 space-y-4 bg-white/40 dark:bg-slate-900/40 shadow-lg">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Allocation Rules</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Machine-JHO mapping allocates primary cleanup responsibilities. Please verify constraints before saving:
          </p>

          <ul className="space-y-3 mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <li className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
              <span>Each machine can only have one assigned JH Owner at a time.</span>
            </li>
            <li className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
              <span>A JH Owner can only be assigned to one machine (1-to-1 operational scope).</span>
            </li>
            <li className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
              <span>Submitting mappings will overwrite any prior allocation for the selected machine.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MachineAllocation;
