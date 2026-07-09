import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Calendar,
  Tag,
  Clock
} from 'lucide-react';

const STATUS_COLORS = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  DONE_MANUALLY: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  MISSED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
};

const FLAG_COLORS = {
  OK:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400',
  GREEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  RED:   'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
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

// ─── Maintenance Modal ────────────────────────────────────────────────────────
const MaintenanceModal = ({ task, onClose, onSuccess }) => {
  const [checklistItems, setChecklistItems] = useState([]);
  const [answers, setAnswers] = useState({});
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await apiService.getChecklist(task.machineId, task.frequencyDays);
        setChecklistItems(items);
        const init = {};
        items.forEach(item => { init[item] = ''; });
        setAnswers(init);
      } catch {
        setError('Failed to load checklist items. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [task]);

  const allAnswered = checklistItems.length > 0 &&
    checklistItems.every(item => answers[item] && answers[item] !== '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allAnswered) { setError('All checklist items must be answered before submitting.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const checklist = checklistItems.map(item => ({ item, status: answers[item] }));
      await apiService.completeMaintenance({
        machineId: task.machineId,
        frequencyDays: task.frequencyDays,
        checklist,
        remarks: remarks.trim() || null
      });
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to complete maintenance.';
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
              <Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {task.maintenanceStatus === 'MISSED' ? 'Complete Missed Task' : 'Perform Maintenance'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {task.machineName} — {formatFreq(task.frequencyDays)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 text-sm font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Machine details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/40 text-xs font-semibold">
            {[
              ['Machine ID', task.machineId],
              ['Machine', task.machineName],
              ['Subarea', task.subarea || '--'],
              ['Frequency', formatFreq(task.frequencyDays)]
            ].map(([label, val]) => (
              <div key={label}>
                <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">{label}</span>
                <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold">{val}</span>
              </div>
            ))}
          </div>

          {/* Dynamic Checklist */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="ml-2 text-sm font-semibold text-slate-400">Loading checklist...</span>
            </div>
          ) : checklistItems.length === 0 ? (
            <div className="text-center py-8 text-sm font-semibold text-slate-400">No checklist items found for this task.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Checklist Items <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-500">
                  {checklistItems.filter(item => answers[item]).length} / {checklistItems.length} answered
                </span>
              </div>
              {checklistItems.map((item, idx) => (
                <div key={item} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                    <span className="text-[10px] font-black text-indigo-500 font-mono mr-2">{idx + 1}.</span>
                    {item}
                  </p>
                  <div className="flex gap-3">
                    {['OK', 'GREEN', 'RED'].map(opt => (
                      <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all select-none font-bold text-xs ${
                        answers[item] === opt
                          ? opt === 'OK'    ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400'
                          : opt === 'GREEN' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          :                  'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}>
                        <input
                          type="radio"
                          name={`item-${idx}`}
                          value={opt}
                          checked={answers[item] === opt}
                          onChange={() => setAnswers(prev => ({ ...prev, [item]: opt }))}
                          className="sr-only"
                        />
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          opt === 'OK' ? 'bg-cyan-500' : opt === 'GREEN' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Remarks (optional)</label>
              <span className="text-[10px] text-slate-400">{remarks.length}/500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Any comments or observations..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 resize-none transition-all"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !allAnswered}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></>
                : <><Wrench className="w-4 h-4" /><span>Complete Maintenance</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Time Remaining Helper ───────────────────────────────────────────────────
const TimeRemaining = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(20, 0, 0, 0); // 8:00 PM today
      const diffMs = target - now;
      if (diffMs <= 0) {
        setTimeLeft('0h 0m');
        return;
      }
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${diffHrs}h ${diffMins}m`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 px-2 py-0.5 rounded">
      {timeLeft} left
    </span>
  );
};

// ─── Task Card ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onPerform, userRole }) => {
  const isDone = task.maintenanceStatus === 'COMPLETED' || task.maintenanceStatus === 'DONE_MANUALLY';
  const isPending = task.maintenanceStatus === 'PENDING';
  const isJho = userRole === 'JH_OWNER';
  const isTl = userRole === 'TEAM_LEADER';
  
  const hideFlag = isPending && (isJho || isTl);
  const hideNextDue = isPending && (isJho || isTl);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4">
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block">{task.machineId}</span>
          <h4 className="text-base font-extrabold text-slate-800 dark:text-white mt-0.5 leading-tight">{task.machineName}</h4>
          {task.subarea && <p className="text-xs text-slate-400 font-semibold mt-0.5">{task.subarea}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black border ${STATUS_COLORS[task.maintenanceStatus] || STATUS_COLORS.PENDING}`}>
            {task.maintenanceStatus}
          </span>
          {task.flag && !hideFlag && (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${FLAG_COLORS[task.flag] || ''}`}>
              ● {task.flag}
            </span>
          )}
        </div>
      </div>

      {/* Frequency + Next Date */}
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <span>{formatFreq(task.frequencyDays)}</span>
        </div>
        {task.nextDueDate && !hideNextDue && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Next: {formatDate(task.nextDueDate)}</span>
          </div>
        )}
        {isJho && isPending && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <TimeRemaining />
          </div>
        )}
      </div>

      {/* Action */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        {isDone ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Maintenance Done</span>
          </div>
        ) : (
          <button
            onClick={() => onPerform(task)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Wrench className="w-4 h-4" />
            Perform Maintenance
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MaintenancePage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 5000);
  };

  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await apiService.getDailyDashboard(user.userId);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      showToast('error', 'Failed to load maintenance tasks.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const filteredTasks = statusFilter ? tasks.filter(t => t.maintenanceStatus === statusFilter) : tasks;

  const handleSuccess = async () => {
    setSelectedTask(null);
    showToast('success', 'Maintenance completed successfully!');
    await loadTasks();
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Maintenance Execution</span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1">Perform Maintenance</h2>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold">
          Each card represents one maintenance checklist task — same machine can have multiple cards
        </p>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div className={`flex items-start gap-2.5 p-4 rounded-xl border text-sm font-semibold animate-fade-in ${
          toast.type === 'success'
            ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
            : 'border-rose-100 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {['', 'PENDING', 'COMPLETED', 'DONE_MANUALLY', 'MISSED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              statusFilter === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-sm font-semibold text-slate-400">Loading tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10">
          <span className="text-sm font-bold text-slate-400">No maintenance tasks found.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map(task => (
            <TaskCard
              key={`${task.machineId}-${task.frequencyDays}`}
              task={task}
              onPerform={setSelectedTask}
              userRole={user?.role}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedTask && (
        <MaintenanceModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default MaintenancePage;
