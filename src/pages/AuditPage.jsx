import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { 
  ClipboardCheck, 
  Loader, 
  AlertCircle, 
  CheckCircle2 
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
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [machineId, setMachineId] = useState('');
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
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCheckboxChange = (id) => {
    setChecklist(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const validateForm = () => {
    if (!machineId.trim()) {
      setError('Machine ID is mandatory.');
      return false;
    }
    const anyChecked = Object.values(checklist).some(val => val === true);
    if (!anyChecked) {
      setError('At least one checklist item must be selected.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        machineId: machineId.trim().toUpperCase(),
        checklist,
        findings: findings.trim() || null
      };

      await apiService.submitAudit(payload);
      
      setSuccessMsg('Audit report submitted successfully!');
      
      // Clear form states on success
      setMachineId('');
      setFindings('');
      setChecklist({
        step1: false,
        step2: false,
        step3: false,
        step4: false,
        step5: false,
        step6: false,
        step7: false
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMsg(''), 5000);

    } catch (err) {
      console.error('Submit audit error:', err);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        logout();
        navigate('/login');
      } else {
        const backendMessage = err.response?.data?.message || err.response?.data || 'Failed to submit audit. Please check your inputs or try again.';
        setError(typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Quality Assurance</span>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-1">
          Perform Shop Audit
        </h2>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold tracking-wide">
          Complete checks on equipment to verify standard compliance and log findings
        </p>
      </div>

      {/* Main card */}
      <div className="glass-card p-6 md:p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-slate-100/10 dark:shadow-black/25">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Notifications */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-950/20 dark:bg-rose-950/20 dark:text-rose-455 animate-fade-in text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-550" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-950/20 dark:bg-emerald-950/20 dark:text-emerald-455 animate-fade-in text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-550" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Machine ID Input */}
          <div className="space-y-2">
            <label htmlFor="machineId" className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
              Machine ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="machineId"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              placeholder="e.g. M001, M010"
              disabled={submitting}
              className="px-4 py-3 w-full rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-semibold uppercase"
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
              Audit Checklist Items <span className="text-rose-500">*</span>
            </label>
            
            <div className="grid grid-cols-1 gap-3">
              {CHECKLIST_ITEMS.map((item) => {
                const isChecked = checklist[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => !submitting && handleCheckboxChange(item.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                      isChecked
                        ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/50 shadow-sm'
                        : 'bg-slate-100/50 dark:bg-slate-850/55 border-slate-200 dark:border-slate-805/80 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Large Checkbox Element */}
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                      isChecked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {isChecked && <ClipboardCheck className="w-4 h-4" />}
                    </div>

                    <span className={`text-sm font-semibold transition-colors ${
                      isChecked 
                        ? 'text-indigo-900 dark:text-indigo-300 font-bold' 
                        : 'text-slate-655 dark:text-slate-300'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Findings Textarea */}
          <div className="space-y-2">
            <label htmlFor="findings" className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
              Audit Findings / Remarks
            </label>
            <textarea
              id="findings"
              rows="4"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Describe any anomalies, visual comments, or test reports here (optional)..."
              disabled={submitting}
              className="px-4 py-3 w-full rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-semibold resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-750 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Submitting Audit Report...</span>
              </>
            ) : (
              <>
                <ClipboardCheck className="w-5 h-5" />
                <span>Submit Audit Report</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AuditPage;
