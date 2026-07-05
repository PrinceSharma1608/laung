import React from 'react';
import { Filter } from 'lucide-react';

const FilterBar = ({
  statusValue,
  onStatusChange,
  areaValue,
  onAreaChange,
  areas = []
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
      {/* Status Filter */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3.5 py-2.5 shadow-sm flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={statusValue}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none font-bold pr-4 cursor-pointer"
        >
          <option value="" className="dark:bg-slate-950">All Statuses</option>
          <option value="PENDING" className="dark:bg-slate-950">Pending</option>
          <option value="COMPLETED" className="dark:bg-slate-950">Completed</option>
          <option value="MISSED" className="dark:bg-slate-950">Missed</option>
          <option value="DONE_MANUALLY" className="dark:bg-slate-950">Done Manually</option>
        </select>
      </div>

      {/* Area Filter */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3.5 py-2.5 shadow-sm flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={areaValue}
          onChange={(e) => onAreaChange(e.target.value)}
          className="bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none font-bold pr-4 cursor-pointer"
        >
          <option value="" className="dark:bg-slate-950">All Areas</option>
          {areas.map((areaName) => (
            <option key={areaName} value={areaName} className="dark:bg-slate-950">
              {areaName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
