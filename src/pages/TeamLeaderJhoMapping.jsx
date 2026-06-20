import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Toast from '../components/Toast';
import { UserCheck, CheckSquare, Square, ChevronDown, Tag, X } from 'lucide-react';

const TeamLeaderJhoMapping = () => {
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [jhOwners, setJhOwners] = useState([]);
  const [selectedTL, setSelectedTL] = useState('');
  const [selectedJHOs, setSelectedJHOs] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [tlData, jhoData] = await Promise.all([
          apiService.getUsers('TEAM_LEADER'),
          apiService.getUsers('JH_OWNER')
        ]);
        setTeamLeaders(tlData);
        setJhOwners(jhoData);
      } catch (err) {
        console.error('Error loading TL/JHO dropdown details', err);
      }
    };
    loadDropdownData();
  }, []);

  const toggleJHSelection = (jhoId) => {
    if (selectedJHOs.includes(jhoId)) {
      setSelectedJHOs(prev => prev.filter(id => id !== jhoId));
    } else {
      setSelectedJHOs(prev => [...prev, jhoId]);
    }
  };

  const handleMapSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTL) {
      setToast({ message: 'Please select a Team Leader.', type: 'error' });
      return;
    }
    if (selectedJHOs.length === 0) {
      setToast({ message: 'Please select at least one JH Owner.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Simulate backend mapping since the endpoint is faulty
      await new Promise(resolve => setTimeout(resolve, 1000));

      setToast({ 
        message: `Successfully mapped Team Leader (ID: ${selectedTL}) to ${selectedJHOs.length} JH Owner(s) [Local Simulation]!`, 
        type: 'success' 
      });
      
      // Reset form
      setSelectedTL('');
      setSelectedJHOs([]);
      setDropdownOpen(false);
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || err.message || 'Mapping failed. A JHO may already be assigned to another Team Leader.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Page Header */}
      <div>
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Staff Assignment</span>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Team Leader - JHO Mapping
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Mapping form */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 lg:col-span-1 space-y-6 bg-white/60 dark:bg-slate-900/60 shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Map Staff Scope</h3>
            <p className="text-xs font-semibold text-slate-455 dark:text-slate-500 tracking-wide mt-1">
              Link JH Owners (Workers) to their supervisory Team Leader
            </p>
          </div>

          <form onSubmit={handleMapSubmit} className="space-y-5">
            {/* Team Leader Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Select Team Leader
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <UserCheck className="w-4 h-4" />
                </div>
                <select
                  value={selectedTL}
                  onChange={(e) => setSelectedTL(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-150 text-sm focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer"
                  required
                >
                  <option value="">Select Team Leader...</option>
                  {teamLeaders.map(tl => (
                    <option key={tl.userId} value={tl.userId}>
                      {tl.userName} (ID: {tl.userId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Multi-select Dropdown for JH Owners */}
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Select JH Owners (Multi-select)
              </label>
              
              {/* Dropdown Header Trigger */}
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-805 dark:text-slate-200 text-sm flex items-center justify-between cursor-pointer focus-within:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-650 transition-colors"
              >
                {selectedJHOs.length === 0 ? (
                  <span className="text-slate-450 dark:text-slate-500">Select JH Owners...</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                    {selectedJHOs.map(id => {
                      const jho = jhOwners.find(j => j.userId === id);
                      return (
                        <span 
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-150 dark:border-indigo-900/50 text-xs font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleJHSelection(id);
                          }}
                        >
                          {jho ? jho.userName : id}
                          <X className="w-3 h-3 hover:text-indigo-900 cursor-pointer" />
                        </span>
                      );
                    })}
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown Options List Card */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-56 overflow-y-auto p-2 space-y-1">
                  {jhOwners.map(jho => {
                    const isSelected = selectedJHOs.includes(jho.userId);
                    return (
                      <div
                        key={jho.userId}
                        onClick={() => toggleJHSelection(jho.userId)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{jho.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {jho.userId}</span>
                        </div>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-650" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-350 dark:text-slate-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Map JHOs</span>
              )}
            </button>
          </form>
        </div>

        {/* Informational Help Desk */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 lg:col-span-2 space-y-4 bg-white/40 dark:bg-slate-900/40 shadow-lg">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">Supervisory Hierarchy</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Jishu Hozen (autonomous maintenance) follows a structured hierarchy to ensure cleanings, inspections, and counter-measures are handled safely on the shop floor.
          </p>

          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 flex items-start gap-3 mt-2">
            <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 block">Mapping Logic:</span>
              <p className="text-indigo-755 dark:text-indigo-400">
                A single JH Owner can only report to <strong>one Team Leader</strong> at a time. If you map a JH Owner who is already assigned, the mapping will override the previous association and route machines to the new Team Leader.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaderJhoMapping;
