import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardList,
  Search
} from 'lucide-react';

const ChecklistManagementPage = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [machineSearch, setMachineSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [frequencyDays, setFrequencyDays] = useState('');
  const [frequencyError, setFrequencyError] = useState('');
  const [items, setItems] = useState(['']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getMachines(user?.userId);
        setMachines(data);
      } catch (err) {
        console.error('Failed to load machines', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    const fetchExistingChecklist = async () => {
      if (!selectedMachineId || !frequencyDays) {
        return;
      }
      const freqNum = parseInt(frequencyDays, 10);
      if (isNaN(freqNum) || freqNum < 1 || freqNum > 364) {
        return;
      }
      
      try {
        const existingItems = await apiService.getChecklist(selectedMachineId, freqNum);
        if (Array.isArray(existingItems) && existingItems.length > 0) {
          setItems(existingItems);
          setSuccess('Found existing checklist! You can modify its items below.');
          setError('');
        } else {
          setItems(['']);
        }
      } catch (err) {
        setItems(['']);
      }
    };
    
    fetchExistingChecklist();
  }, [selectedMachineId, frequencyDays]);

  const filteredMachines = machines.filter(m =>
    m.machineId.toLowerCase().includes(machineSearch.toLowerCase()) ||
    (m.machineName || '').toLowerCase().includes(machineSearch.toLowerCase())
  );

  const handleSelectMachine = (m) => {
    setSelectedMachineId(m.machineId);
    setMachineSearch(`${m.machineId} - ${m.machineName}`);
    setShowDropdown(false);
  };

  const handleFrequencyChange = (val) => {
    setFrequencyDays(val);
    const num = parseInt(val, 10);
    if (!val) {
      setFrequencyError('Frequency is required.');
    } else if (!Number.isInteger(num) || num < 1 || num > 364) {
      setFrequencyError('Frequency must be between 1 and 364 days.');
    } else {
      setFrequencyError('');
    }
  };

  const addItem = () => setItems(prev => [...prev, '']);

  const updateItem = (idx, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? val : it));
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedMachineId) { setError('Please select a machine.'); return; }
    const freqNum = parseInt(frequencyDays, 10);
    if (!frequencyDays || isNaN(freqNum) || freqNum < 1 || freqNum > 364) {
      setError('Frequency must be between 1 and 364 days.'); return;
    }
    const cleaned = items.map(it => it.trim()).filter(Boolean);
    if (cleaned.length === 0) { setError('At least one checklist item is required.'); return; }
    if (items.some(it => !it.trim())) { setError('Remove or fill in all empty checklist items.'); return; }

    try {
      setSubmitting(true);
      await apiService.createChecklist({
        machineId: selectedMachineId,
        frequencyDays: freqNum,
        checklist: cleaned
      });
      setSuccess('Checklist created successfully!');
      setSelectedMachineId('');
      setMachineSearch('');
      setFrequencyDays('');
      setItems(['']);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to create checklist.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Maintenance Setup</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1">Create Machine Checklist</h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold">
            Define checklist items for a machine at a specific maintenance frequency
          </p>
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl">
          <ClipboardList className="w-7 h-7 text-indigo-500" />
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 text-sm font-semibold animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Row 1: Machine + Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Machine Searchable Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Machine <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={machineSearch}
                  onChange={e => { setMachineSearch(e.target.value); setShowDropdown(true); setSelectedMachineId(''); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Search machine ID or name..."
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-all"
                />
                {showDropdown && filteredMachines.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                    {filteredMachines.slice(0, 20).map(m => (
                      <button
                        key={m.machineId}
                        type="button"
                        onMouseDown={() => handleSelectMachine(m)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-sm font-semibold border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                      >
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs mr-2">{m.machineId}</span>
                        {m.machineName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedMachineId && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Selected: {selectedMachineId}</span>
              )}
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Frequency (Days) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="364"
                value={frequencyDays}
                onChange={e => handleFrequencyChange(e.target.value)}
                placeholder="e.g. 1 = Daily, 7 = Weekly, 30 = Monthly"
                className={`w-full px-4 py-3 rounded-xl border text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none transition-all ${
                  frequencyError
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                }`}
              />
              {frequencyError && (
                <p className="text-xs text-rose-500 font-bold">{frequencyError}</p>
              )}
              {frequencyDays && !frequencyError && (
                <p className="text-[10px] font-semibold text-slate-400">
                  {parseInt(frequencyDays) === 1 ? 'Daily' : parseInt(frequencyDays) === 7 ? 'Weekly' : parseInt(frequencyDays) === 30 ? 'Monthly' : `Every ${frequencyDays} days`}
                </p>
              )}
            </div>
          </div>

          {/* Checklist Items Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Checklist Items <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm font-semibold">
                  No items added yet. Click "+ Add Item" to begin.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3">
                      <span className="text-[10px] font-black text-slate-400 font-mono w-6 text-center shrink-0">{idx + 1}</span>
                      <input
                        type="text"
                        value={item}
                        onChange={e => updateItem(idx, e.target.value)}
                        placeholder={`Checklist item ${idx + 1}...`}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">
              {items.filter(i => i.trim()).length} item(s) defined. Minimum 1 required.
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating...</span></>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /><span>Create Checklist</span></>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChecklistManagementPage;
