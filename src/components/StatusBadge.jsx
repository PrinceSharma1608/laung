import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeClasses = (val) => {
    switch (val) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-850 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'PENDING':
        return 'bg-amber-100 text-amber-850 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
      case 'MISSED':
        return 'bg-rose-100 text-rose-850 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50';
      case 'DONE_MANUALLY':
        return 'bg-blue-100 text-blue-850 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getLabel = (val) => {
    switch (val) {
      case 'COMPLETED':
        return 'Completed';
      case 'PENDING':
        return 'Pending';
      case 'MISSED':
        return 'Missed';
      case 'DONE_MANUALLY':
        return 'Done Manually';
      default:
        return val || 'Unknown';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeClasses(status)}`}>
      {getLabel(status)}
    </span>
  );
};

export default StatusBadge;
