import React from 'react';
import StatusBadge from './StatusBadge';
import { Wrench } from 'lucide-react';

const MaintenanceTable = ({ machines, onPerformMaintenance, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-400">Loading assigned machines...</span>
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10">
        <span className="text-sm font-bold text-slate-400">No maintenance scheduled for today.</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-205 dark:border-slate-800/80 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-450 uppercase bg-slate-50/75 dark:bg-slate-950/20">
            <th className="px-6 py-4">Machine ID</th>
            <th className="px-6 py-4">Machine Name</th>
            <th className="px-6 py-4">Area</th>
            <th className="px-6 py-4">Subarea</th>
            <th className="px-6 py-4">Frequency</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-center">Delay Count</th>
            <th className="px-6 py-4">Last Done</th>
            <th className="px-6 py-4">Next Due</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-805/50 text-sm font-semibold text-slate-650 dark:text-slate-300">
          {machines.map((m) => {
            const isCompleted = m.maintenanceStatus === 'COMPLETED' || m.maintenanceStatus === 'DONE_MANUALLY';
            const buttonText = m.maintenanceStatus === 'MISSED' ? 'Complete Manually' : 'Perform Maintenance';

            return (
              <tr 
                key={m.machineId}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors"
              >
                <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-100 uppercase">{m.machineId}</td>
                <td className="px-6 py-4">{m.machineName}</td>
                <td className="px-6 py-4">{m.areaName}</td>
                <td className="px-6 py-4">{m.subarea}</td>
                <td className="px-6 py-4">{m.maintenanceFrequency}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={m.maintenanceStatus} />
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                    m.delayCount > 0 
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455' 
                      : 'bg-slate-50 text-slate-500 dark:bg-slate-950/40 dark:text-slate-400'
                  }`}>
                    {m.delayCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-400">{m.lastMaintenanceDate}</td>
                <td className="px-6 py-4 text-xs font-bold text-slate-400">{m.nextMaintenanceDate}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => !isCompleted && onPerformMaintenance(m)}
                    disabled={isCompleted}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isCompleted
                        ? 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 border-indigo-200 hover:border-indigo-300 text-indigo-650 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-indigo-900/60 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer shadow-sm'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{buttonText}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MaintenanceTable;
