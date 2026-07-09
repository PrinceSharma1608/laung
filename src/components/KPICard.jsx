import React from 'react';

const KPICard = ({ title, value, icon: Icon, trend, color = 'indigo', onClick }) => {
  // Setup color maps
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      border: 'border-indigo-100 dark:border-indigo-900/50',
      text: 'text-indigo-600 dark:text-indigo-400',
      glow: 'shadow-indigo-500/5',
      iconContainer: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-100 dark:border-amber-900/50',
      text: 'text-amber-600 dark:text-amber-400',
      glow: 'shadow-amber-500/5',
      iconContainer: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-100 dark:border-emerald-900/50',
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'shadow-emerald-500/5',
      iconContainer: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
    },
    red: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-100 dark:border-rose-900/50',
      text: 'text-rose-600 dark:text-rose-400',
      glow: 'shadow-rose-500/5',
      iconContainer: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
    }
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div 
      onClick={onClick}
      className={`glass-card p-6 rounded-2xl flex items-center justify-between hover-lift hover-glow shadow-md border ${currentTheme.border} ${currentTheme.bg} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="space-y-2">
        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {title}
        </span>
        <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          {value}
        </h3>
        {trend && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {trend}
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentTheme.iconContainer}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default KPICard;
