import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { 
  ClipboardCheck, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Eye, 
  X, 
  Check 
} from 'lucide-react';

const CHECKLIST_ITEMS = [
  { id: 'step1', label: 'Clean Machine Surface' },
  { id: 'step2', label: 'Check Lubrication' },
  { id: 'step3', label: 'Verify Safety Guard' },
  { id: 'step4', label: 'Inspect Bolts and Nuts' },
  { id: 'step5', label: 'Check for Abnormal Noise' },
  { id: 'step6', label: 'Verify Temperature' },
  { id: 'step7', label: 'General Visual Inspection' }
];

const AuditPage = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  
  const [checklist, setChecklist] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
    step7: false
  });
  const [findings, setFindings] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Notifications
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');

      // Fetch users (safely with fallback)
      let usersList = [];
      try {
        usersList = await apiService.getUsers();
      } catch (err) {
        console.warn('Failed to fetch users list', err);
      }
      setAllUsers(usersList);

      // Fetch today's assigned machines dashboard
      const dailyStatus = await apiService.getDailyDashboard(user.userId);

      // Fetch detailed machine mappings
      let machinesList = [];
      try {
        machinesList = await apiService.getMachines(user.userId);
      } catch (err) {
        console.warn('Failed to fetch mapped machines details', err);
      }

      // Merge daily statuses and mapping details
      const merged = dailyStatus.map(statusObj => {
        const detail = machinesList.find(m => m.machineId === statusObj.machineId) || {};
        return {
          machineId: statusObj.machineId,
          machineName: statusObj.machineName || detail.machineName || `Machine ${statusObj.machineId}`,
          areaName: detail.areaName || 'Standard Shop Floor',
          subarea: detail.subarea || 'Line A',
          maintenanceStatus: statusObj.maintenanceStatus || 'PENDING',
          audited: statusObj.audited || false
        };
      });
      setMachines(merged);

      // Fetch audit logs (safely with fallback to local storage)
      let logs = [];
      try {
        logs = await apiService.getAuditLogs();
      } catch (err) {
        console.warn('GET /fetch/audit/logs not supported yet. Falling back to local storage.');
        const stored = localStorage.getItem('local_audit_logs');
        logs = stored ? JSON.parse(stored) : [];
      }
      setAuditLogs(logs);

    } catch (err) {
      console.error('Error loading Audits page:', err);
      setError('Failed to load daily dashboard or machine assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Helper: Filter logs for today
  const getTodayLogs = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return auditLogs.filter(log => log.auditDate && log.auditDate.startsWith(todayStr));
  };

  const todayLogs = getTodayLogs();

  // Helper: check if a Supervisor has audited this machine today
  const getSupervisorAuditToday = (machineId) => {
    return todayLogs.find(log => {
      if (log.machineId !== machineId) return false;
      const auditor = allUsers.find(u => u.userId === log.auditedById);
      // Fallback: if user is not in list, check if user ID prefix/pattern matches supervisor roles
      const isSuper = (auditor && auditor.userRole === 'SUPERVISOR') || log.auditedById.toUpperCase().startsWith('SU');
      return isSuper;
    });
  };

  // Helper: check if the current user has audited this machine today
  const getCurrentUserAuditToday = (machineId) => {
    return todayLogs.find(log => log.machineId === machineId && log.auditedById === user.userId);
  };

  const handleOpenAuditModal = (machine) => {
    setSelectedMachine(machine);
    setChecklist({
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      step5: false,
      step6: false,
      step7: false
    });
    setFindings('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleCheckboxChange = (id) => {
    setChecklist(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const saveLocalAuditLog = (payload) => {
    const stored = localStorage.getItem('local_audit_logs');
    const logs = stored ? JSON.parse(stored) : [];
    const newLog = {
      auditId: Math.floor(Math.random() * 100000),
      machineId: payload.machineId,
      machineName: selectedMachine.machineName,
      auditedById: user.userId,
      auditedByName: user.userName || user.userId,
      auditDate: new Date().toISOString(),
      checklist: JSON.stringify(payload.checklist),
      findings: payload.findings || ''
    };
    logs.unshift(newLog);
    localStorage.setItem('local_audit_logs', JSON.stringify(logs));
  };

  const handleAuditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMachine) return;
    
    // Check if at least one checkbox is selected (mandatory)
    const anyChecked = Object.values(checklist).some(val => val === true);
    if (!anyChecked) {
      setError('At least one checklist item must be checked.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      machineId: selectedMachine.machineId.trim().toUpperCase(),
      checklist,
      findings: findings.trim() || null
    };

    try {
      await apiService.submitAudit(payload);
      saveLocalAuditLog(payload);
      setSuccess('Audit report submitted successfully!');
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.warn('Backend submitAudit failed. Falling back to local storage simulation.', err);
      saveLocalAuditLog(payload);
      setSuccess('Audit report submitted successfully (Local Simulation)');
      setModalOpen(false);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenViewModal = (log) => {
    setSelectedAuditLog(log);
    setViewModalOpen(true);
  };

  const isLineIncharge = user?.role === 'LINE_INCHARGE';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Quality Assurance</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1">
            Perform Quality Audits
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold">
            Evaluate maintenance checklist compliance for shop floor machines
          </p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/50 rounded-xl text-xs font-semibold text-indigo-650 dark:text-indigo-400">
          Role Scope: {isLineIncharge ? 'LINE INCHARGE' : 'SUPERVISOR'}
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-950/20 dark:bg-emerald-950/20 dark:text-emerald-400 animate-fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-550" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-950/20 dark:bg-rose-950/20 dark:text-rose-400 animate-fade-in text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-550" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="w-10 h-10 border-4 border-indigo-655 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-400">Loading daily audit machines...</span>
        </div>
      ) : machines.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10">
          <span className="text-sm font-bold text-slate-400">No audits scheduled for today.</span>
        </div>
      ) : (
        /* Machine Auditing Grid */
        <div className="grid grid-cols-1 gap-4">
          {machines.map((m) => {
            // Check status states
            const supervisorAudit = getSupervisorAuditToday(m.machineId);
            const userAudit = getCurrentUserAuditToday(m.machineId);

            return (
              <div 
                key={m.machineId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all duration-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* LHS: Machine ID & Name & Location details */}
                <div className="flex items-start gap-4 md:w-1/3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block">
                      ID: {m.machineId}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-805 dark:text-white leading-tight">
                      {m.machineName}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-505 font-semibold mt-1">
                      {m.areaName} • {m.subarea}
                    </p>
                  </div>
                </div>

                {/* Middle: Daily Maintenance Status Badge */}
                <div className="md:w-1/4">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                    Maintenance Status
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                    m.maintenanceStatus === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30'
                      : m.maintenanceStatus === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30'
                      : m.maintenanceStatus === 'MISSED'
                      ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30'
                      : 'bg-blue-50 text-blue-700 border-blue-105 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/30'
                  }`}>
                    {m.maintenanceStatus}
                  </span>
                </div>

                {/* RHS: Actions based on role */}
                <div className="md:w-1/3 flex items-center justify-end gap-3.5">
                  {/* LI Role specific supervisor audit status check */}
                  {isLineIncharge && (
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-slate-405 uppercase tracking-widest block mb-1">
                        Supervisor Audit
                      </span>
                      {supervisorAudit ? (
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(supervisorAudit)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audited (Supervisor)</span>
                        </button>
                      ) : (
                        <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
                          Not Audited
                        </span>
                      )}
                    </div>
                  )}

                  {/* Audit trigger button (disabled if already done by current user) */}
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-405 uppercase tracking-widest block mb-1">
                      {isLineIncharge ? 'Line Incharge Audit' : 'Audit Action'}
                    </span>
                    {userAudit ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-xs font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Audited</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenAuditModal(m)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-transparent rounded-lg text-xs font-bold transition-all shadow hover:shadow-md cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Perform Audit</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* POPUP MODAL: Audit Submission Form */}
      {modalOpen && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity" 
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Audit Checklist Formulation
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Perform machine verification audit
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleAuditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Machine Banner info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/40 text-xs font-semibold">
                <div>
                  <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">Machine ID</span>
                  <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold uppercase">{selectedMachine.machineId}</span>
                </div>
                <div>
                  <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">Machine Name</span>
                  <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold">{selectedMachine.machineName}</span>
                </div>
              </div>

              {/* Checklist inputs */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
                  Verify Quality Checks <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {CHECKLIST_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleCheckboxChange(item.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                        checklist[item.id]
                          ? 'bg-indigo-50/40 border-indigo-200 dark:bg-indigo-950/15 dark:border-indigo-900/50'
                          : 'bg-slate-50/50 border-slate-200 dark:bg-slate-855/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checklist[item.id]}
                        onChange={() => {}} // handled by click container
                        className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Findings Input */}
              <div className="space-y-1.5">
                <label htmlFor="findings" className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
                  Findings / Observations (Optional)
                </label>
                <textarea
                  id="findings"
                  rows="3"
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Record any findings or checklist defects..."
                  className="px-4 py-3 w-full rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-550 transition-all font-semibold resize-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Audit</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: View Supervisor Audit Details */}
      {viewModalOpen && selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setViewModalOpen(false)}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity" 
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Supervisor Audit Details
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Checked parameters by quality supervisor
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Auditor & Date Header */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/40 text-xs font-semibold">
                <div>
                  <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">Audited By</span>
                  <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold">{selectedAuditLog.auditedByName} ({selectedAuditLog.auditedById})</span>
                </div>
                <div>
                  <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">Audit Timestamp</span>
                  <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold">
                    {new Date(selectedAuditLog.auditDate).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checklist parameters status */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
                  Parameter Checklist Results
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {CHECKLIST_ITEMS.map((item) => {
                    let isChecked = false;
                    try {
                      const map = JSON.parse(selectedAuditLog.checklist);
                      isChecked = map[item.id] === true;
                    } catch (e) {
                      console.warn('Failed to parse log checklist json', e);
                    }

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          isChecked
                            ? 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900/50'
                            : 'bg-slate-50/50 border-slate-200 dark:bg-slate-850/50 dark:border-slate-800'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-xs font-semibold ${isChecked ? 'text-emerald-950 dark:text-emerald-450 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Findings */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
                  Supervisor Findings / Observations
                </label>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold min-h-[60px]">
                  {selectedAuditLog.findings || <span className="text-slate-400 italic">No findings or remarks recorded.</span>}
                </div>
              </div>

              {/* Close button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditPage;
