import React from 'react';
import { Check } from 'lucide-react';

const ChecklistItem = ({ id, label, checked, onChange, disabled }) => {
  return (
    <div
      onClick={() => !disabled && onChange(id)}
      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
        checked
          ? 'bg-indigo-50/50 border-indigo-205 dark:bg-indigo-950/20 dark:border-indigo-900/50 shadow-sm'
          : 'bg-slate-100/50 dark:bg-slate-850/55 border-slate-205 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors duration-200 ${
        checked
          ? 'bg-indigo-600 border-indigo-600 text-white'
          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
      }`}>
        {checked && <Check className="w-4 h-4" />}
      </div>
      <span className={`text-sm font-semibold transition-colors ${
        checked 
          ? 'text-indigo-900 dark:text-indigo-300 font-bold' 
          : 'text-slate-600 dark:text-slate-350'
      }`}>
        {label}
      </span>
    </div>
  );
};

export default ChecklistItem;
