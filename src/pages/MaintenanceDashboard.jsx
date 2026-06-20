import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
  Wrench, 
  CheckCircle, 
  Clock, 
  XOctagon, 
  Search, 
  Filter, 
  UserCheck, 
  ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MaintenanceDashboard = () => {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const loadMaintenance = async () => {
      try {
        setLoading(true);
        const data = await apiService.getDailyDashboard(user.userId);
        setMaintenance(data);
      } catch (err) {
        console.error('Error fetching daily maintenance dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    loadMaintenance();
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'MISSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30">
            <XOctagon className="w-3.5 h-3.5" />
            <span>Missed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  const filteredData = maintenance.filter(m => {
    const matchesSearch = 
      m.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.machineName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filters (PENDING, COMPLETED, MISSED)
    const matchesStatus = !statusFilter || m.maintenanceStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Operational Compliance</span>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Daily Maintenance Dashboard
          </h2>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Machine ID/Name..."
              className="bg-transparent text-sm focus:outline-none border-none text-slate-700 dark:text-slate-300 w-44"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-350 focus:outline-none border-none cursor-pointer pr-4"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="MISSED">Missed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compliance Tracking Table */}
      <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-lg shadow-slate-100/10 dark:shadow-black/20">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Daily TPM Inspections</h3>
              <p className="text-xs font-semibold text-slate-455 dark:text-slate-500 tracking-wide mt-0.5">
                Realtime status indicators for daily autonomous cleaning checks
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-4 px-6">Machine ID</th>
                  <th className="py-4 px-6">Machine Name</th>
                  <th className="py-4 px-6">Maintenance Status</th>
                  <th className="py-4 px-6">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-sm">
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr 
                      key={row.machineId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors"
                    >
                      <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {row.machineId}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                        {row.machineName}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(row.maintenanceStatus)}
                      </td>
                      <td className="py-4 px-6">
                        {row.audited ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-full">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Audited</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/40 border border-slate-250 dark:border-slate-700 px-2.5 py-1 rounded-full">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Not Audited</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No daily maintenance entries fit the search queries/filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
