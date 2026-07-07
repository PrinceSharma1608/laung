import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import {
  ClipboardCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  X,
  Tag,
  Calendar,
  Check
} from 'lucide-react';

const STATUS_COLORS = {
  PENDING:      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  COMPLETED:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  DONE_MANUALLY:'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  MISSED:       'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
};

const formatFreq = (days) => {
  if (!days) return '--';
  if (days === 1) return 'Daily';
  if (days === 7) return 'Weekly';
  if (days === 30) return 'Monthly';
  return `Every ${days} days`;
};

const formatDate = (d) => {
  if (!d) return '--';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

// ─── Audit Modal (perform or view) ───────────────────────────────────────────
const AuditModal = ({ task, auditLog, mode, onClose, onSuccess }) => {
  const [checklistItems, setChecklistItems] = useState([]);
  const [answers, setAnswers] = useState({});
  const [findings, setFindings] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const items = await apiService.getChecklist(task.machineId, task.frequencyDays);
        setChecklistItems(items);
        const init = {};
        items.forEach(item => { init[item] = ''; });
        setAnswers(init);
      } catch {
        setError('Failed to load checklist.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [task]);

  const allAnswered = checklistItems.length > 0 && checklistItems.every(item => answers[item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allAnswered) { setError('All checklist items must have a status.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const checklistPayload = {};
      checklistItems.forEach(item => { checklistPayload[item] = answers[item]; });
      await apiService.submitAudit({
        machineId: task.machineId,
        frequencyDays: task.frequencyDays,
        checklist: checklistPayload,
        findings: findings.trim() || null
      });
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to submit audit.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {mode === 'view' ? 'View Supervisor Audit' : 'Perform Audit'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {task.machineName} — {formatFreq(task.frequencyDays)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 text-sm font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          {/* Machine info row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/40 text-xs font-semibold">
            {[['Machine ID', task.machineId], ['Machine', task.machineName], ['Subarea', task.subarea || '--'], ['Frequency', formatFreq(task.frequencyDays)]].map(([label, val]) => (
              <div key={label}>
                <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">{label}</span>
                <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold">{val}</span>
              </div>
            ))}
          </div>

          {/* View mode */}
          {mode === 'view' && auditLog ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Audit Findings</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{auditLog.findings || 'No findings recorded during this audit.'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Audited On</span>
                <p className="text-sm font-semibold">{formatDate(auditLog.auditDate)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Auditor</span>
                <p className="text-sm font-semibold">{auditLog.auditorName || auditLog.auditorId}</p>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">Close</button>
              </div>
            </div>
          ) : (
            /* Perform mode */
            <form onSubmit={handleSubmit} className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="ml-2 text-sm font-semibold text-slate-400">Loading checklist...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Checklist Status <span className="text-rose-500">*</span>
                  </label>
                  {checklistItems.map((item, idx) => (
                    <div key={item} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                        <span className="text-[10px] font-black text-indigo-500 font-mono mr-2">{idx + 1}.</span>{item}
                      </p>
                      <div className="flex gap-3">
                        {['OK', 'GREEN', 'RED'].map(opt => (
                          <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all select-none font-bold text-xs ${
                            answers[item] === opt
                              ? opt === 'OK'    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : opt === 'GREEN' ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                              :                  'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                          }`}>
                            <input type="radio" name={`audit-item-${idx}`} value={opt}
                              checked={answers[item] === opt}
                              onChange={() => setAnswers(prev => ({ ...prev, [item]: opt }))}
                              className="sr-only" />
                            <span className={`w-2.5 h-2.5 rounded-full ${opt === 'OK' ? 'bg-emerald-500' : opt === 'GREEN' ? 'bg-orange-400' : 'bg-rose-500'}`} />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Findings (optional)</label>
                <textarea rows={3} value={findings} onChange={e => setFindings(e.target.value)}
                  placeholder="Describe any issues, observations, or findings..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 resize-none transition-all" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={onClose} disabled={submitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={submitting || !allAnswered}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></>
                    : <><ClipboardCheck className="w-4 h-4" /><span>Submit Audit</span></>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Audit Card ───────────────────────────────────────────────────────────────
const AuditCard = ({ task, todayLogs, allUsers, isLineIncharge, onPerform, onView }) => {
  const taskLogs = todayLogs.filter(log => log.machineId === task.machineId);

  const supervisorAudit = taskLogs.find(log => {
    const auditor = allUsers.find(u => u.userId === log.auditorId);
    return (auditor?.userRole === 'SUPERVISOR') || (log.auditorId?.toUpperCase().startsWith('SU'));
  });

  const myAudit = isLineIncharge
    ? taskLogs.find(log => {
        const auditor = allUsers.find(u => u.userId === log.auditorId);
        return auditor?.userRole === 'LINE_INCHARGE' || log.auditorId?.toUpperCase().startsWith('LI');
      })
    : taskLogs.find(log => {
        const auditor = allUsers.find(u => u.userId === log.auditorId);
        return auditor?.userRole === 'SUPERVISOR' || log.auditorId?.toUpperCase().startsWith('SU');
      });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4">
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block">{task.machineId}</span>
          <h4 className="text-base font-extrabold text-slate-800 dark:text-white mt-0.5 leading-tight">{task.machineName}</h4>
          {task.subarea && <p className="text-xs text-slate-400 font-semibold mt-0.5">{task.subarea}</p>}
        </div>
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0 ${STATUS_COLORS[task.maintenanceStatus] || STATUS_COLORS.PENDING}`}>
          {task.maintenanceStatus}
        </span>
      </div>

      {/* Frequency + Date */}
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-indigo-400" /><span>{formatFreq(task.frequencyDays)}</span></div>
        {task.nextDueDate && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span>Next: {formatDate(task.nextDueDate)}</span></div>}
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {/* Supervisor Audit status (visible to LI) */}
        {isLineIncharge && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Supervisor Audit</span>
            {supervisorAudit ? (
              <button onClick={() => onView(task, supervisorAudit)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold cursor-pointer hover:bg-emerald-100 transition-colors">
                <Eye className="w-3.5 h-3.5" />Audited
              </button>
            ) : (
              <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-bold">Not Yet</span>
            )}
          </div>
        )}

        {/* My audit action */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {isLineIncharge ? 'My Audit' : 'Audit Action'}
          </span>
          {myAudit ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-bold">
              <Check className="w-3.5 h-3.5" />Audited
            </span>
          ) : (
            <button onClick={() => onPerform(task)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-transparent rounded-lg text-xs font-bold transition-all shadow hover:shadow-md cursor-pointer">
              <ClipboardCheck className="w-3.5 h-3.5" />Perform Audit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Audit Page ──────────────────────────────────────────────────────────
const AuditPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const isLineIncharge = user?.role === 'LINE_INCHARGE';

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 5000);
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [taskRes, logsRes, usersRes] = await Promise.allSettled([
        apiService.getDailyDashboard(user.userId),
        apiService.getAuditLogs(),
        apiService.getUsers()
      ]);
      setTasks(taskRes.status === 'fulfilled' ? taskRes.value : []);
      setAuditLogs(logsRes.status === 'fulfilled' ? logsRes.value : []);
      setAllUsers(usersRes.status === 'fulfilled' ? usersRes.value : []);
    } catch {
      showToast('error', 'Failed to load audit data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = auditLogs.filter(log => log.auditDate && log.auditDate.startsWith(todayStr));
  const filteredTasks = statusFilter ? tasks.filter(t => t.maintenanceStatus === statusFilter) : tasks;

  const handleSuccess = async () => {
    setModal(null);
    showToast('success', 'Audit submitted successfully!');
    await loadData();
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Quality Assurance</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1">Perform Quality Audits</h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold">
            Each card is a unique checklist task — same machine may have multiple audit cards
          </p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          Role: {isLineIncharge ? 'LINE INCHARGE' : 'SUPERVISOR'}
        </div>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div className={`flex items-start gap-2.5 p-4 rounded-xl border text-sm font-semibold animate-fade-in ${
          toast.type === 'success'
            ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
            : 'border-rose-100 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['', 'PENDING', 'COMPLETED', 'DONE_MANUALLY', 'MISSED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
            }`}>{s || 'All'}</button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-sm font-semibold text-slate-400">Loading audit tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-sm font-bold text-slate-400">No audit tasks found.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map(task => (
            <AuditCard
              key={`${task.machineId}-${task.frequencyDays}`}
              task={task}
              todayLogs={todayLogs}
              allUsers={allUsers}
              isLineIncharge={isLineIncharge}
              onPerform={(t) => setModal({ task: t, mode: 'perform' })}
              onView={(t, log) => setModal({ task: t, auditLog: log, mode: 'view' })}
            />
          ))}
        </div>
      )}

      {modal && (
        <AuditModal
          task={modal.task}
          auditLog={modal.auditLog}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default AuditPage;
