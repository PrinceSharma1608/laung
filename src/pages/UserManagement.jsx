import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Users, Filter, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Search, Sort, and Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('userId');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await apiService.getUsers(selectedRole || null);
        setUsers(data);
        setCurrentPage(1); // Reset to page 1 on filter change
      } catch (err) {
        console.error('Error fetching users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [selectedRole]);

  // Format roles for display
  const formatRole = (role) => {
    if (!role) return '';
    return role.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'LINE_INCHARGE':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
      case 'SUPERVISOR':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'TEAM_LEADER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'JH_OWNER':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
    }
  };

  // Sorting Handler
  const handleSort = (field) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  };

  const RenderSortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-3.5 h-3.5 inline ml-1 text-indigo-500 animate-fade-in" />
      : <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-indigo-500 animate-fade-in" />;
  };

  // Search Logic
  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      u.userId.toLowerCase().includes(query) ||
      u.userName.toLowerCase().includes(query);
    return matchesSearch;
  });

  // Sorting Logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    // Handle nested role or object if needed, else compare direct fields
    // DTO maps roles to userRole
    if (sortField === 'role') {
      aVal = a.userRole || '';
      bVal = b.userRole || '';
    } else if (sortField === 'userId') {
      aVal = a.userId || '';
      bVal = b.userId || '';
    } else if (sortField === 'userName') {
      aVal = a.userName || '';
      bVal = b.userName || '';
    }

    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedUsers.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Administration</span>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            User Directory
          </h2>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ID or name..."
              className="bg-transparent text-sm focus:outline-none border-none text-slate-700 dark:text-slate-300 w-44"
            />
          </div>

          {/* Role Dropdown Filter */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-350 focus:outline-none border-none cursor-pointer pr-4"
            >
              <option value="">All Staff Roles</option>
              <option value="LINE_INCHARGE">Line Incharges</option>
              <option value="SUPERVISOR">Supervisors</option>
              <option value="TEAM_LEADER">Team Leaders</option>
              <option value="JH_OWNER">JH Owners (Workers)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-lg shadow-slate-100/10 dark:shadow-black/20">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Staff Members</h3>
              <p className="text-xs font-semibold text-slate-455 dark:text-slate-500 tracking-wide mt-0.5">
                Manage and audit staff roles and ticket identifiers
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                    <th onClick={() => handleSort('userId')} className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      User ID (Ticket No.) <RenderSortIcon field="userId" />
                    </th>
                    <th onClick={() => handleSort('userName')} className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      User Name <RenderSortIcon field="userName" />
                    </th>
                    <th onClick={() => handleSort('role')} className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      Role Scope <RenderSortIcon field="role" />
                    </th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-sm">
                  {currentRows.length > 0 ? (
                    currentRows.map((row) => (
                      <tr 
                        key={row.userId}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {row.userId}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                          {row.userName}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(row.userRole)}`}>
                            {formatRole(row.userRole)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                        No staff members found matching search queries or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
              <div className="p-5 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/20 dark:bg-slate-900/20">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredUsers.length)} of {filteredUsers.length} staff records
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
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
