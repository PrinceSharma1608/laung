import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Toast from '../components/Toast';
import { 
  Loader2, 
  Search, 
  Settings, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  User,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Activity,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 45, 60, 90, 180, 365];

const MachineConfigurationPage = () => {
  const { user } = useAuth();
  
  // States
  const [machines, setMachines] = useState([]);
  const [jhOwners, setJhOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingMachineId, setUpdatingMachineId] = useState(null);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  
  // Local card edits state (machineId -> form state object)
  const [edits, setEdits] = useState({});
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  const loadData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError('');
      
      const [machinesData, jhOwnersData] = await Promise.all([
        apiService.getMachines(user?.userId),
        apiService.getUsers('JH_OWNER')
      ]);
      
      setMachines(machinesData);
      setJhOwners(jhOwnersData);
      
      // Initialize edit states for each machine
      const initialEdits = {};
      machinesData.forEach(m => {
        const isCustomFreq = !FREQUENCY_OPTIONS.includes(m.maintenanceFrequencyDays);
        initialEdits[m.machineId] = {
          jhOwnerId: m.jhOwnerId || '',
          maintenanceFrequencyDays: m.maintenanceFrequencyDays || 7,
          freqMode: isCustomFreq ? 'custom' : 'select',
          customFreq: isCustomFreq ? String(m.maintenanceFrequencyDays) : '',
          subarea: m.subarea || '',
          machineStatus: m.machineStatus || 'ACTIVE',
          flag: m.flag || 'EC'
        };
      });
      setEdits(initialEdits);
      
    } catch (err) {
      console.error('Error loading configuration data:', err);
      setError(
        err.response?.status === 401 ? '401 Unauthorized: Please login again.' :
        err.response?.status === 403 ? '403 Forbidden: You do not have permission to access this page.' :
        err.response?.status === 404 ? '404 Resources Not Found.' :
        err.response?.status === 500 ? '500 Internal Server Error: Please contact system support.' :
        'Network Error: Unable to reach the server.'
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Edit Input Change
  const handleEditChange = (machineId, field, value) => {
    setEdits(prev => ({
      ...prev,
      [machineId]: {
        ...prev[machineId],
        [field]: value
      }
    }));
  };

  // Submit Configuration Update for a Single Machine
  const handleUpdateConfig = async (machineId) => {
    const editState = edits[machineId];
    if (!editState) return;

    let frequency = Number(editState.maintenanceFrequencyDays);
    if (editState.freqMode === 'custom') {
      const customVal = Number(editState.customFreq);
      if (isNaN(customVal) || customVal <= 0) {
        setToast({ message: 'Custom frequency must be a valid positive number.', type: 'error' });
        return;
      }
      frequency = customVal;
    }

    setUpdatingMachineId(machineId);
    try {
      const payload = {
        machineId,
        jhOwnerId: editState.jhOwnerId || null,
        maintenanceFrequencyDays: frequency,
        subarea: editState.subarea.trim() || null,
        machineStatus: editState.machineStatus,
        flag: editState.flag
      };

      const responseMessage = await apiService.updateMachineConfiguration(payload);
      setToast({ message: responseMessage || 'Machine Configuration Updated Successfully', type: 'success' });
      
      // Refresh only this machine in local state
      setMachines(prev => prev.map(m => {
        if (m.machineId === machineId) {
          const matchedJho = jhOwners.find(j => j.userId === payload.jhOwnerId);
          return {
            ...m,
            jhOwnerId: payload.jhOwnerId,
            jhOwnerName: matchedJho ? matchedJho.userName : null,
            maintenanceFrequencyDays: frequency,
            subarea: payload.subarea,
            machineStatus: payload.machineStatus,
            flag: payload.flag
          };
        }
        return m;
      }));

    } catch (err) {
      console.error('Update configuration error:', err);
      const msg = err.response?.status === 401 ? '401 Unauthorized: Session expired.' :
                  err.response?.status === 403 ? '403 Forbidden: Action not permitted.' :
                  err.response?.status === 404 ? '404 Machine Not Found.' :
                  err.response?.status === 500 ? '500 Internal Server Error: Database update rejected.' :
                  'Network Error: Unable to perform update.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setUpdatingMachineId(null);
    }
  };

  // Extract all unique areas for the Area Filter dropdown
  const uniqueAreas = [...new Set(machines.map(m => m.areaName).filter(Boolean))];

  // Client-side Searching & Filtering
  const getFilteredMachines = () => {
    return machines.filter(m => {
      const matchesSearch = 
        m.machineId.toLowerCase().includes(search.toLowerCase()) ||
        m.machineName.toLowerCase().includes(search.toLowerCase()) ||
        (m.jhOwnerName && m.jhOwnerName.toLowerCase().includes(search.toLowerCase()));

      const matchesArea = !areaFilter || m.areaName === areaFilter;
      const matchesStatus = !statusFilter || m.machineStatus === statusFilter;
      const matchesFlag = !flagFilter || m.flag === flagFilter;

      return matchesSearch && matchesArea && matchesStatus && matchesFlag;
    });
  };

  const filteredMachines = getFilteredMachines();

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
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
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Administration</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1">
            Machine Master Configuration
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold">
            Define metadata, mapping assignments, and frequencies for shop floor machines
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shrink-0 self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-955/20 dark:bg-rose-955/20 dark:text-rose-400 animate-fade-in text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-550" />
          <span>{error}</span>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by ID, Name, JH Owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Area Filter */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-600 dark:text-slate-350 cursor-pointer focus:outline-none focus:border-indigo-550"
          >
            <option value="">All Areas</option>
            {uniqueAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-600 dark:text-slate-350 cursor-pointer focus:outline-none focus:border-indigo-555"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          {/* Flag Filter */}
          <select
            value={flagFilter}
            onChange={(e) => setFlagFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-600 dark:text-slate-350 cursor-pointer focus:outline-none focus:border-indigo-555"
          >
            <option value="">All Flags</option>
            <option value="EC">EC</option>
            <option value="WC">WC</option>
          </select>

          {/* Reset Filters button */}
          {(search || areaFilter || statusFilter || flagFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setAreaFilter('');
                setStatusFilter('');
                setFlagFilter('');
              }}
              className="px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl border border-transparent transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        /* Skeleton List Loading */
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 w-1/3 rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="w-full md:w-80 h-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredMachines.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10">
          <span className="text-sm font-semibold text-slate-450 dark:text-slate-505 font-semibold">
            No matching machines found.
          </span>
        </div>
      ) : (
        /* VERTICALLY STACKED WIDE CARDS LIST */
        <div className="space-y-4">
          {filteredMachines.map(m => {
            const editState = edits[m.machineId] || {};
            const isUpdating = updatingMachineId === m.machineId;

            return (
              <div
                key={m.machineId}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 hover:border-slate-350 dark:hover:border-slate-700/80 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-8 relative ${
                  isUpdating ? 'opacity-85 pointer-events-none' : ''
                } ${
                  editState.machineStatus === 'INACTIVE'
                    ? 'border-l-4 border-l-rose-505 border-slate-200 dark:border-slate-800'
                    : 'border-l-4 border-l-emerald-505 border-slate-205 dark:border-slate-805'
                }`}
              >
                {/* Left Section (70% width - Read Only) */}
                <div className="flex-1 space-y-4">
                  {/* Title & Identity */}
                  <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block">
                      ID: {m.machineId}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-805 dark:text-white leading-tight">
                      {m.machineName}
                    </h3>
                  </div>

                  {/* Read-Only Attributes Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3.5 gap-x-6 text-xs">
                    {/* Area */}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Area</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">{m.areaName || 'Unassigned'}</span>
                      </div>
                    </div>

                    {/* Current JH Owner */}
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Current JH Owner</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                          {m.jhOwnerName ? `${m.jhOwnerName} (${m.jhOwnerId})` : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {/* Current Subarea */}
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Current Subarea</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">{m.subarea || 'None'}</span>
                      </div>
                    </div>

                    {/* Maintenance Frequency */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Frequency</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          {m.maintenanceFrequencyDays ? `${m.maintenanceFrequencyDays} Days` : 'Not Configured'}
                        </span>
                      </div>
                    </div>

                    {/* Machine Status */}
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Status</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                          m.machineStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400'
                        }`}>
                          {m.machineStatus || 'INACTIVE'}
                        </span>
                      </div>
                    </div>

                    {/* Flag */}
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Flag</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">{m.flag || 'None'}</span>
                      </div>
                    </div>

                    {/* Last Maintenance Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Last Maintenance</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">{formatDate(m.lastMaintenanceDate)}</span>
                      </div>
                    </div>

                    {/* Next Maintenance Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Next Maintenance</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">{formatDate(m.nextMaintenanceDate)}</span>
                      </div>
                    </div>

                    {/* Delay Count */}
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Delay Count</span>
                        <span className={`font-semibold block ${m.delayCount > 0 ? 'text-rose-500 font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {m.delayCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px bg-slate-100 dark:bg-slate-800 self-stretch my-1" />

                {/* Right Section (30% width - Editable Controls) */}
                <div className="w-full md:w-80 shrink-0 flex flex-col justify-between gap-5 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-855">
                  <div className="space-y-3.5">
                    {/* JH Owner Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                        JH Owner Assignment
                      </label>
                      <select
                        value={editState.jhOwnerId || ''}
                        onChange={(e) => handleEditChange(m.machineId, 'jhOwnerId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {jhOwners.map(jho => (
                          <option key={jho.userId} value={jho.userId}>
                            {jho.userName} ({jho.userId})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Maintenance Frequency */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                        Maintenance Frequency
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={editState.freqMode === 'custom' ? 'custom' : editState.maintenanceFrequencyDays}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              handleEditChange(m.machineId, 'freqMode', 'custom');
                            } else {
                              handleEditChange(m.machineId, 'freqMode', 'select');
                              handleEditChange(m.machineId, 'maintenanceFrequencyDays', Number(val));
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          {FREQUENCY_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt} Days</option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>

                        {/* If custom is selected, render numeric text box */}
                        {editState.freqMode === 'custom' && (
                          <input
                            type="number"
                            min="1"
                            placeholder="Days"
                            value={editState.customFreq}
                            onChange={(e) => handleEditChange(m.machineId, 'customFreq', e.target.value)}
                            className="w-20 px-3 py-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-550 text-slate-800 dark:text-slate-200"
                          />
                        )}
                      </div>
                    </div>

                    {/* Subarea TextBox */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                        Subarea Tag
                      </label>
                      <input
                        type="text"
                        placeholder="Subarea name..."
                        value={editState.subarea || ''}
                        onChange={(e) => handleEditChange(m.machineId, 'subarea', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    {/* Machine Status & Flag Dropdowns */}
                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Status */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest block">
                          Status
                        </label>
                        <select
                          value={editState.machineStatus || 'ACTIVE'}
                          onChange={(e) => handleEditChange(m.machineId, 'machineStatus', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div>

                      {/* Flag */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest block">
                          Flag
                        </label>
                        <select
                          value={editState.flag || 'EC'}
                          onChange={(e) => handleEditChange(m.machineId, 'flag', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="EC">EC</option>
                          <option value="WC">WC</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Update Configuration Button */}
                  <button
                    onClick={() => handleUpdateConfig(m.machineId)}
                    disabled={isUpdating}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-805 disabled:opacity-45 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Update Configuration</span>
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

export default MachineConfigurationPage;
