import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
  Users, 
  Search, 
  Download, 
  ShieldAlert, 
  Loader2, 
  Cpu, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Clock
} from 'lucide-react';
import Toast from '../components/Toast';

const MachineDirectoryPage = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await apiService.getMachineDirectory();
        setMachines(data);
      } catch (err) {
        console.error('Error loading Machine Directory data', err);
        setToast({ message: 'Failed to load machine directory from database.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatDate = (d) => {
    if (!d) return '--';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return d;
    }
  };

  const handleExport = () => {
    if (machines.length === 0) return;
    
    // Convert to CSV string helper
    const headers = ['Machine ID', 'Machine Name', 'Supervisor ID', 'Supervisor Name', 'Team Leader ID', 'Team Leader Name', 'JH Owner ID', 'JH Owner Name', 'Total Delays', 'Last Maintenance Date'];
    const csvContent = [
      headers.join(','),
      ...machines.map(m => [
        `"${m.machineId || ''}"`,
        `"${m.machineName || ''}"`,
        `"${m.supervisorId || ''}"`,
        `"${m.supervisorName || ''}"`,
        `"${m.teamLeaderId || ''}"`,
        `"${m.teamLeaderName || ''}"`,
        `"${m.jhOwnerId || ''}"`,
        `"${m.jhOwnerName || ''}"`,
        m.delay || 0,
        `"${m.lastMaintenanceDate || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `machine_directory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter
  const filtered = machines.filter(m => {
    const query = searchQuery.toLowerCase();
    return (
      (m.machineId || '').toLowerCase().includes(query) ||
      (m.machineName || '').toLowerCase().includes(query) ||
      (m.supervisorName || '').toLowerCase().includes(query) ||
      (m.teamLeaderName || '').toLowerCase().includes(query) ||
      (m.jhOwnerName || '').toLowerCase().includes(query)
    );
  });

  // Paginated chunks
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  return (
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 p-6 rounded-3xl border border-slate-900 font-sans shadow-2xl">
      {/* Toast alert system */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5 mb-6">
        <div>
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Tata Motors Lucknow
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Machine Directory
          </h2>
        </div>
        <div className="px-3.5 py-1.5 bg-indigo-950/40 border border-indigo-900/50 rounded-xl text-xs font-bold text-indigo-400 self-start sm:self-center">
          Role Scope: LINE INCHARGE / SUPERVISOR
        </div>
      </div>

      {/* Search and export bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text"
            placeholder="Search by ID, name, supervisor, TL, JH Owner..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-205 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-505 transition-all font-medium"
          />
        </div>
        
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-650 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow hover:shadow-lg shadow-indigo-600/10 cursor-pointer disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table Area */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-sm font-semibold text-slate-450">Loading machine directory...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-850 rounded-3xl bg-slate-900/10">
          <ShieldAlert className="w-12 h-12 text-slate-650 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-450">No Machines Found</h3>
          <p className="text-sm text-slate-550 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or check the database.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-900 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-900 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-5">Machine ID</th>
                  <th className="py-4 px-5">Machine</th>
                  <th className="py-4 px-5">Supervisor</th>
                  <th className="py-4 px-5">Team Leader</th>
                  <th className="py-4 px-5">JH Owner</th>
                  <th className="py-4 px-5">Total Delays</th>
                  <th className="py-4 px-5">Last Maintenance Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-sm">
                {currentRows.map((row) => (
                  <tr key={row.machineId} className="hover:bg-slate-900/40 transition-colors duration-150">
                    <td className="py-4 px-5 font-mono font-bold text-indigo-400">
                      {row.machineId}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-indigo-400 shrink-0">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-white text-sm">{row.machineName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {row.supervisorName ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 leading-snug">{row.supervisorName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {row.supervisorId}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">--</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {row.teamLeaderName ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 leading-snug">{row.teamLeaderName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {row.teamLeaderId}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">--</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {row.jhOwnerName ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 leading-snug">{row.jhOwnerName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {row.jhOwnerId}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-950/20 border border-rose-900/40 px-2 py-0.5 rounded-full">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        (row.delay || 0) > 0 
                          ? 'bg-rose-950/30 text-rose-400 border border-rose-900/30' 
                          : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                      }`}>
                        <TrendingDown className="w-3.5 h-3.5" />
                        {row.delay || 0}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {row.lastMaintenanceDate ? (
                        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDate(row.lastMaintenanceDate)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-650" />
                          <span className="text-xs italic">Never Maintained</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filtered.length > 0 && (
            <div className="p-5 border border-slate-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40">
              <span className="text-xs font-semibold text-slate-500">
                Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filtered.length)} of {filtered.length} machines
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-350 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-300 px-3">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-350 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MachineDirectoryPage;
