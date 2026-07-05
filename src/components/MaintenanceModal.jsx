import React from 'react';
import { X, Wrench, Loader2, AlertCircle } from 'lucide-react';
import ChecklistItem from './ChecklistItem';

const CHECKLIST_METADATA = [
  { id: 'step1', label: 'Clean Machine Surface' },
  { id: 'step2', label: 'Check Lubrication' },
  { id: 'step3', label: 'Inspect Bolts and Nuts' },
  { id: 'step4', label: 'Verify Safety Guard' },
  { id: 'step5', label: 'Check for Abnormal Noise' },
  { id: 'step6', label: 'Verify Temperature' },
  { id: 'step7', label: 'General Visual Inspection' }
];

const MaintenanceModal = ({
  isOpen,
  onClose,
  machine,
  formData,
  onChecklistChange,
  onRemarksChange,
  onSubmit,
  submitting,
  errors
}) => {
  if (!isOpen || !machine) return null;

  const isAllChecked = Object.values(formData.checklist).every(v => v === true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAllChecked) return;
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
      />

      {/* Content Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                {machine.maintenanceStatus === 'MISSED' ? 'Complete Manually' : 'Perform Maintenance'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-semibold mt-0.5">
                Verify checklists and log machine operational status
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* API and validation errors */}
          {errors.apiError && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-750 dark:border-rose-950/20 dark:bg-rose-950/20 dark:text-rose-400 animate-fade-in text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errors.apiError}</span>
            </div>
          )}

          {/* Read-Only Machine Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/40 text-xs font-semibold">
            <div>
              <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">Machine ID</span>
              <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold uppercase">{machine.machineId}</span>
            </div>
            <div>
              <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">Machine Name</span>
              <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold">{machine.machineName}</span>
            </div>
            <div>
              <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">Area</span>
              <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold">{machine.areaName}</span>
            </div>
            <div>
              <span className="block text-slate-400 uppercase tracking-wider font-bold mb-1">Subarea</span>
              <span className="text-slate-800 dark:text-slate-200 text-sm font-extrabold">{machine.subarea}</span>
            </div>
          </div>

          {/* Checklist Area */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
                Operational Check Items <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-500">
                {Object.values(formData.checklist).filter(Boolean).length} / 7 Checked
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CHECKLIST_METADATA.map((item) => (
                <ChecklistItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  checked={formData.checklist[item.id]}
                  onChange={onChecklistChange}
                  disabled={submitting}
                />
              ))}
            </div>
            {errors.checklist && (
              <p className="text-xs text-rose-500 font-bold">{errors.checklist}</p>
            )}
          </div>

          {/* Remarks Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="remarks" className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
                Remarks / Comments
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                {(formData.remarks || '').length} / 500 chars
              </span>
            </div>
            <textarea
              id="remarks"
              rows="3"
              maxLength={500}
              value={formData.remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              placeholder="Enter optional comments here (e.g. noise levels normal, oil refilled)..."
              disabled={submitting}
              className="px-4 py-3 w-full rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-all font-semibold resize-none"
            />
            {errors.remarks && (
              <p className="text-xs text-rose-500 font-bold">{errors.remarks}</p>
            )}
          </div>

          {/* Footer / Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-5 -mx-6 -mb-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isAllChecked}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-750 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Complete Maintenance</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default MaintenanceModal;
