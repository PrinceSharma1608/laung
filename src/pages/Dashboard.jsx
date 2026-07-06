import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import KPICard from '../components/KPICard';
import { exportToCSV } from '../utils/csvExport';
import { Navigate } from 'react-router-dom';
import { 
  Cpu, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  UserCheck,
  User,
  Shield,
  Copy,
  Calendar,
  Check,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = ({ defaultTab = 'machines' }) => {
  const { user } = useAuth();
  if (user?.role === 'JH_OWNER') {
    return <Navigate to="/maintenance" replace />;
  }
  const [machines, setMachines] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Views & Filter States
  const [liView, setLiView] = useState(defaultTab); // 'machines' | 'maintenance_logs' | 'audit_logs'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLogs, setExpandedLogs] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    setLiView(defaultTab);
  }, [defaultTab]);

  // Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('machineId');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  const isLineIncharge = user?.role === 'LINE_INCHARGE';

  useEffect(() => {
    const fetchResilient = async (promise, fallbackValue = []) => {
      try {
        return await promise;
      } catch (error) {
        console.warn('Dashboard API call failed, using fallback:', error);
        return fallbackValue;
      }
    };

    const fetchData = async (isInitial = true) => {
      try {
        if (isInitial) setLoading(true);
        if (user?.role === 'LINE_INCHARGE') {
          const [machinesData, usersData, areasData, dailyData, maintLogsData, audLogsData] = await Promise.all([
            fetchResilient(apiService.getMachines(user.userId), []),
            fetchResilient(apiService.getUsers(), []),
            fetchResilient(apiService.getAreas(), []),
            fetchResilient(apiService.getDailyDashboard(user.userId), []),
            fetchResilient(apiService.getMaintenanceLogs(), []),
            fetchResilient(apiService.getAuditLogs(), [])
          ]);
          setMachines(machinesData);
          setAllUsers(usersData);
          setAreas(areasData);
          setMaintenance(dailyData);
          setMaintenanceLogs(maintLogsData);
          setAuditLogs(audLogsData);
        } else {
          const [machinesData, dailyData] = await Promise.all([
            fetchResilient(apiService.getMachines(user?.userId), []),
            fetchResilient(apiService.getDailyDashboard(user?.userId), [])
          ]);
          setMachines(machinesData);
          setMaintenance(dailyData);
        }
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchData(true);

    // Auto-update database data every 5 seconds for real-time changes
    const interval = setInterval(() => {
      fetchData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Calculate KPI Metrics directly from daily maintenance status list
  const totalMachines = machines.length;
  const completedCount = maintenance.filter(m => m.maintenanceStatus === 'COMPLETED').length;
  const pendingCount = maintenance.filter(m => m.maintenanceStatus === 'PENDING').length;
  const missedCount = maintenance.filter(m => m.maintenanceStatus === 'MISSED').length;

  const totalAreas = areas.length;
  const totalJhos = allUsers.filter(u => u.userRole === 'JH_OWNER').length;
  const totalTls = allUsers.filter(u => u.userRole === 'TEAM_LEADER').length;
  const totalSupervisors = allUsers.filter(u => u.userRole === 'SUPERVISOR').length;
  const totalLis = allUsers.filter(u => u.userRole === 'LINE_INCHARGE').length;

  // Helper for formatting date
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to copy ID
  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Helper to toggle expanded state of card
  const toggleExpand = (id) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Render checklist helper
  const renderChecklist = (checklistStr) => {
    if (!checklistStr) return <span className="text-slate-400 text-xs italic">No checklist recorded</span>;
    try {
      const parsed = JSON.parse(checklistStr);
      if (Array.isArray(parsed)) {
        return (
          <ul className="space-y-1 mt-2">
            {parsed.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-slate-650 dark:text-slate-350">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      }
      if (typeof parsed === 'object') {
        return (
          <ul className="space-y-1 mt-2">
            {Object.entries(parsed).map(([task, val], idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-slate-650 dark:text-slate-350">
                {val ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={val ? '' : 'line-through text-slate-400'}>{task}</span>
              </li>
            ))}
          </ul>
        );
      }
    } catch (e) {
      // Fallback
    }
    return <span className="text-xs text-slate-650 dark:text-slate-300 block mt-1">{checklistStr}</span>;
  };

  // Filtered maintenance logs
  const filteredMaintenanceLogs = maintenanceLogs.filter(log => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      (log.machineId && log.machineId.toLowerCase().includes(query)) ||
      (log.machineName && log.machineName.toLowerCase().includes(query)) ||
      (log.performedByName && log.performedByName.toLowerCase().includes(query)) ||
      (log.performedById && log.performedById.toLowerCase().includes(query)) ||
      (log.remarks && log.remarks.toLowerCase().includes(query)) ||
      (log.overallStatus && log.overallStatus.toLowerCase().includes(query)) ||
      (log.completionType && log.completionType.toLowerCase().includes(query))
    );

    let matchesDate = true;
    if (log.maintenanceDate) {
      const logDate = new Date(log.maintenanceDate).setHours(0,0,0,0);
      if (startDate) {
        const start = new Date(startDate).setHours(0,0,0,0);
        if (logDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(0,0,0,0);
        if (logDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      (log.machineId && log.machineId.toLowerCase().includes(query)) ||
      (log.machineName && log.machineName.toLowerCase().includes(query)) ||
      (log.auditedByName && log.auditedByName.toLowerCase().includes(query)) ||
      (log.auditedById && log.auditedById.toLowerCase().includes(query)) ||
      (log.findings && log.findings.toLowerCase().includes(query)) ||
      (log.auditResult && log.auditResult.toLowerCase().includes(query))
    );

    let matchesDate = true;
    if (log.auditDate) {
      const logDate = new Date(log.auditDate).setHours(0,0,0,0);
      if (startDate) {
        const start = new Date(startDate).setHours(0,0,0,0);
        if (logDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(0,0,0,0);
        if (logDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const renderLogFilters = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
      <div className="relative flex-1 min-w-[280px]">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${liView === 'maintenance_logs' ? 'machines, operator remarks, completion type...' : 'machines, auditor findings, results...'}`}
          className="pl-10 pr-4 py-2.5 w-full rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Start:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-105 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">End:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-105 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-semibold"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-650 dark:text-rose-400 text-xs font-bold transition-all hover:bg-rose-100/50"
          >
            Clear Dates
          </button>
        )}
      </div>
    </div>
  );

  // 2. Prepare Recharts Data
  // Status Distribution (Pie Chart)
  const pieData = [
    { name: 'Completed', value: completedCount, color: '#10b981' }, // Emerald Green
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },   // Amber
    { name: 'Missed', value: missedCount, color: '#f43f5e' }      // Rose Red
  ].filter(d => d.value > 0); // Only display non-zero status

  // Area Delay count (Bar Chart)
  // Aggregate delay count by Area Name
  const areaDelayMap = {};
  machines.forEach(m => {
    areaDelayMap[m.areaName] = (areaDelayMap[m.areaName] || 0) + (m.delayCount || 0);
  });
  const barData = Object.entries(areaDelayMap).map(([name, delays]) => ({
    name,
    Delays: delays
  }));

  // 3. Search, Sort, Pagination logic
  const handleSort = (field) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  };

  const filteredMachines = machines.filter(m => {
    const query = searchQuery.toLowerCase();
    return (
      m.machineId.toLowerCase().includes(query) ||
      m.machineName.toLowerCase().includes(query) ||
      m.areaName.toLowerCase().includes(query) ||
      (m.subarea && m.subarea.toLowerCase().includes(query)) ||
      (m.jhOwnerName && m.jhOwnerName.toLowerCase().includes(query))
    );
  });

  const sortedMachines = [...filteredMachines].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated chunk
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = isLineIncharge ? sortedMachines : sortedMachines.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedMachines.length / rowsPerPage);

  const handleExport = () => {
    const exportData = machines.map(m => ({
      'Machine ID': m.machineId,
      'Machine Name': m.machineName,
      'Area ID': m.areaId,
      'Area Name': m.areaName,
      'Subarea': m.subarea,
      'JH Owner ID': m.jhOwnerId || 'Unassigned',
      'JH Owner Name': m.jhOwnerName || 'Unassigned',
      'Delay Count': m.delayCount,
      'Supervisor ID': m.supervisorId || 'Unassigned',
      'Supervisor Name': m.supervisorName || 'Unassigned',
      'Team Leader ID': m.teamLeaderId || 'Unassigned',
      'Team Leader Name': m.teamLeaderName || 'Unassigned'
    }));
    exportToCSV(exportData, `jishuhozen_machines_${user.userId}.csv`);
  };

  const RenderSortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-3.5 h-3.5 inline ml-1 text-indigo-500" />
      : <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-indigo-500" />;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Heading */}
      <div>
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">
          {liView === 'machines' ? 'Overview' : 'Logs'}
        </span>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-1">
          {liView === 'machines' 
            ? 'JH Cleaning & Inspection Center' 
            : liView === 'maintenance_logs' 
              ? 'Maintenance Logs History' 
              : 'Audit Logs History'}
        </h2>
      </div>

      {/* KPI Widgets */}
      {isLineIncharge ? (
        liView === 'machines' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard 
              title="Total Machines" 
              value={totalMachines} 
              icon={Cpu} 
              trend="Registered on floor"
              color="indigo" 
            />
            <KPICard 
              title="Total Areas" 
              value={totalAreas} 
              icon={MapPin} 
              trend="Active floor areas"
              color="indigo" 
            />
            <KPICard 
              title="Total JH Owners" 
              value={totalJhos} 
              icon={Users} 
              trend="Registered JHOs"
              color="indigo" 
            />
            <KPICard 
              title="Total Team Leaders" 
              value={totalTls} 
              icon={UserCheck} 
              trend="Registered TLs"
              color="indigo" 
            />
            <KPICard 
              title="Total Supervisors" 
              value={totalSupervisors} 
              icon={User} 
              trend="Registered Supervisors"
              color="indigo" 
            />
            <KPICard 
              title="Total Line Incharges" 
              value={totalLis} 
              icon={Shield} 
              trend="Registered LIs"
              color="indigo" 
            />
            <KPICard 
              title="Pending for the Day" 
              value={pendingCount} 
              icon={Clock} 
              trend="Awaiting JH task"
              color="amber" 
            />
            <KPICard 
              title="Total Completed" 
              value={completedCount} 
              icon={CheckCircle2} 
              trend="Audited & approved"
              color="green" 
            />
            <KPICard 
              title="Total Missed" 
              value={missedCount} 
              icon={AlertTriangle} 
              trend="Overdue tasks alert"
              color="red" 
            />
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Total Machines" 
            value={totalMachines} 
            icon={Cpu} 
            trend="Registered on floor"
            color="indigo" 
          />
          <KPICard 
            title="Pending cleaning" 
            value={pendingCount} 
            icon={Clock} 
            trend="Awaiting JH task"
            color="amber" 
          />
          <KPICard 
            title="Completed cleanings" 
            value={completedCount} 
            icon={CheckCircle2} 
            trend="Audited & approved"
            color="green" 
          />
          <KPICard 
            title="Missed checks" 
            value={missedCount} 
            icon={AlertTriangle} 
            trend="Overdue tasks alert"
            color="red" 
          />
        </div>
      )}

      {/* Analytics Charts */}
      {!isLineIncharge && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Delay logs */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">
              JH Delays count by Shop Area
            </h3>
            <div className="h-72">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <ChartTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      className="dark:bg-slate-900"
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="Delays" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No delays recorded. Perfect clean-compliance!
                </div>
              )}
            </div>
          </div>

          {/* Pie Chart - Maintenance states */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">
              Compliance Shares
            </h3>
            <div className="h-72 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="w-full sm:w-1/2 h-full">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No status data available
                  </div>
                )}
              </div>
              {/* Custom legends */}
              <div className="flex flex-col gap-3 sm:w-1/2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <div className="text-left">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase block leading-none">
                        {d.name}
                      </span>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {d.value} {d.value === 1 ? 'Machine' : 'Machines'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Machine Table Section */}
      {(!isLineIncharge || liView === 'machines') && (
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-lg shadow-slate-100/10 dark:shadow-black/20">
        {/* Table Top Bar */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Registered Shop Machines
            </h3>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide mt-1">
              Active cleaning allocations list for inspection audits
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ID, name, owner..."
                className="pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all w-60"
              />
            </div>
            {/* Export CSV button */}
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:shadow-lg shadow-indigo-600/10"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Real Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th onClick={() => handleSort('machineId')} className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                  Machine ID <RenderSortIcon field="machineId" />
                </th>
                <th onClick={() => handleSort('machineName')} className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                  Machine Name <RenderSortIcon field="machineName" />
                </th>
                <th onClick={() => handleSort('areaName')} className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                  Area <RenderSortIcon field="areaName" />
                </th>
                {isLineIncharge ? (
                  <>
                    <th className="py-4 px-6">Corresponding Supervisor</th>
                    <th className="py-4 px-6">Corresponding TL</th>
                    <th className="py-4 px-6">Corresponding JHO</th>
                    <th onClick={() => handleSort('delayCount')} className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      Delays <RenderSortIcon field="delayCount" />
                    </th>
                  </>
                ) : (
                  <>
                    <th onClick={() => handleSort('subarea')} className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      Subarea <RenderSortIcon field="subarea" />
                    </th>
                    <th className="py-4 px-6">JH Owner (ID)</th>
                    <th onClick={() => handleSort('delayCount')} className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      Delay Count <RenderSortIcon field="delayCount" />
                    </th>
                    <th className="py-4 px-6">Supervisor (ID)</th>
                    <th className="py-4 px-6">Team Leader (ID)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-sm">
              {currentRows.length > 0 ? (
                currentRows.map((row) => (
                  <tr 
                    key={row.machineId} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors duration-150"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {row.machineId}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {row.machineName}
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-bold uppercase mr-1.5 text-slate-500">
                        {row.areaId}
                      </span>
                      {row.areaName}
                    </td>
                    {isLineIncharge ? (
                      <>
                        <td className="py-4 px-6">
                          {row.supervisorName ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{row.supervisorName}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {row.supervisorId}</span>
                            </div>
                          ) : (
                            <span className="text-slate-450 text-xs">--</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {row.teamLeaderName ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{row.teamLeaderName}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {row.teamLeaderId}</span>
                            </div>
                          ) : (
                            <span className="text-slate-450 text-xs">--</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {row.jhOwnerName ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{row.jhOwnerName}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {row.jhOwnerId}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-rose-500 font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                            row.delayCount > 0 
                              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' 
                              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                          }`}>
                            {row.delayCount}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6 text-slate-550 dark:text-slate-400">
                          {row.subarea || '--'}
                        </td>
                        <td className="py-4 px-6">
                          {row.jhOwnerName ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{row.jhOwnerName}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {row.jhOwnerId}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-rose-500 font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                            row.delayCount > 0 
                              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' 
                              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                          }`}>
                            {row.delayCount}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {row.supervisorName ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-755 dark:text-slate-300 leading-snug">{row.supervisorName}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {row.supervisorId}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">--</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {row.teamLeaderName ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-755 dark:text-slate-300 leading-snug">{row.teamLeaderName}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {row.teamLeaderId}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">--</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isLineIncharge ? 7 : 8} className="py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No matching machines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {!isLineIncharge && filteredMachines.length > 0 && (
          <div className="p-5 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/20 dark:bg-slate-900/20">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredMachines.length)} of {filteredMachines.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-3">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Maintenance Logs View */}
      {isLineIncharge && liView === 'maintenance_logs' && (
        <div className="space-y-6 animate-fade-in">
          {renderLogFilters()}

          <div className="flex flex-col gap-4">
            {filteredMaintenanceLogs.length > 0 ? (
              filteredMaintenanceLogs.map((log) => {
                const isExpanded = !!expandedLogs[log.logId];
                return (
                  <div
                    key={log.logId}
                    onClick={() => toggleExpand(log.logId)}
                    className={`glass-card p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between hover-lift hover-glow group ${
                      isExpanded ? 'ring-1 ring-indigo-500/20 border-indigo-500/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block">
                          {log.machineId}
                        </span>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                          {log.machineName}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleCopyId(e, log.logId)}
                          title="Copy Log ID"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 transition-all shrink-0 animate-fade-in"
                        >
                          {copiedId === log.logId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          log.completionType === 'COMPLETED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                            : log.completionType === 'DONE_MANUALLY'
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                        }`}>
                          {log.completionType ? log.completionType.replace('_', ' ') : 'COMPLETED'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs font-semibold text-slate-450 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {log.performedByName} <span className="font-mono text-[10px] text-slate-400">(ID: {log.performedById})</span>
                        </span>
                      </div>
                      
                      <span className="text-[10px] text-indigo-500 font-extrabold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {isExpanded ? 'Click to collapse' : 'Click to view checklist & remarks'}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(log.maintenanceDate)}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-3 text-sm animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                              Completion Type
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mt-1">
                              {log.completionType || 'REGULAR'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                              Remarks
                            </span>
                            <span className="text-xs text-slate-700 dark:text-slate-350 block mt-1">
                              {log.remarks || 'No remarks recorded.'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                            Checklist Details
                          </span>
                          {renderChecklist(log.checklist)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                No matching maintenance logs found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs View */}
      {isLineIncharge && liView === 'audit_logs' && (
        <div className="space-y-6 animate-fade-in">
          {renderLogFilters()}

          <div className="flex flex-col gap-4">
            {filteredAuditLogs.length > 0 ? (
              filteredAuditLogs.map((log) => {
                const isExpanded = !!expandedLogs[log.auditId];
                return (
                  <div
                    key={log.auditId}
                    onClick={() => toggleExpand(log.auditId)}
                    className={`glass-card p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between hover-lift hover-glow group ${
                      isExpanded ? 'ring-1 ring-indigo-500/20 border-indigo-500/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block">
                          {log.machineId}
                        </span>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                          {log.machineName}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleCopyId(e, log.auditId)}
                          title="Copy Audit ID"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 transition-all shrink-0 animate-fade-in"
                        >
                          {copiedId === log.auditId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          log.auditResult === 'APPROVED' || log.auditResult === 'PASS'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                        }`}>
                          {log.auditResult || 'PASSED'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs font-semibold text-slate-450 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {log.auditorName || log.auditorId} <span className="font-mono text-[10px] text-slate-400">(ID: {log.auditorId})</span>
                        </span>
                      </div>
                      
                      <span className="text-[10px] text-indigo-500 font-extrabold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {isExpanded ? 'Click to collapse' : 'Click to view checklist & findings'}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(log.auditDate)}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-4 text-sm animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                              Audit Findings
                            </span>
                            <span className="text-xs text-slate-705 dark:text-slate-350 block mt-1">
                              {log.findings || 'No findings recorded during this audit.'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest block mb-1">
                              Checklist Details
                            </span>
                            {renderChecklist(log.checklist)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                No matching audit logs found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
