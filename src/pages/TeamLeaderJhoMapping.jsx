import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Toast from '../components/Toast';
import { 
  User, 
  UserCheck, 
  X, 
  Loader2, 
  Save, 
  RotateCcw, 
  Activity,
  Users,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TeamLeaderJhoMapping = () => {
  const { user } = useAuth();
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [jhOwners, setJhOwners] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [selections, setSelections] = useState({}); // teamLeaderId -> array of selected jhOwnerIds
  const [activeDropdown, setActiveDropdown] = useState(null); // teamLeaderId of currently active dropdown
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch team leaders, JH owners, and mappings
  const loadData = async () => {
    try {
      setLoading(true);
      const [tlData, jhoData, mappingsData] = await Promise.all([
        apiService.getUsers('TEAM_LEADER'),
        apiService.getUsers('JH_OWNER'),
        apiService.getTlJhoMappings()
      ]);
      setTeamLeaders(tlData);
      setJhOwners(jhoData);
      setMappings(mappingsData);

      // Initialize selections
      const initialSelections = {};
      tlData.forEach(tl => {
        initialSelections[tl.userId] = mappingsData
          .filter(m => m.teamLeaderId === tl.userId)
          .map(m => m.jhOwnerId);
      });
      setSelections(initialSelections);
    } catch (err) {
      console.error('Error loading TL/JHO mapping details', err);
      setToast({ message: 'Failed to load team leader or JH owner listings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleJho = (tlId, jhoId) => {
    setSelections(prev => {
      const current = prev[tlId] || [];
      const next = current.includes(jhoId)
        ? current.filter(id => id !== jhoId)
        : [...current, jhoId];
      return {
        ...prev,
        [tlId]: next
      };
    });
  };

  const handleRevertCard = (tlId) => {
    setSelections(prev => ({
      ...prev,
      [tlId]: mappings.filter(m => m.teamLeaderId === tlId).map(m => m.jhOwnerId)
    }));
  };

  const handleReset = () => {
    const initialSelections = {};
    teamLeaders.forEach(tl => {
      initialSelections[tl.userId] = mappings
        .filter(m => m.teamLeaderId === tl.userId)
        .map(m => m.jhOwnerId);
    });
    setSelections(initialSelections);
  };

  // Check if a specific Team Leader card is modified (dirty)
  const isCardDirty = (tlId) => {
    const original = mappings.filter(m => m.teamLeaderId === tlId).map(m => m.jhOwnerId).sort();
    const current = (selections[tlId] || []).sort();
    return JSON.stringify(original) !== JSON.stringify(current);
  };

  // Get list of JH Owner IDs selected on OTHER Team Leaders
  const getSelectedOnOtherCards = (tlId) => {
    const otherSelected = [];
    Object.keys(selections).forEach(key => {
      if (key !== tlId) {
        otherSelected.push(...(selections[key] || []));
      }
    });
    return otherSelected;
  };

  // Determine if there are overall changes
  const dirtyTlsCount = teamLeaders.filter(tl => isCardDirty(tl.userId)).length;
  const hasChanges = dirtyTlsCount > 0;

  const handleSaveAll = async () => {
    const dirtyTls = teamLeaders.filter(tl => isCardDirty(tl.userId));
    if (dirtyTls.length === 0) {
      setToast({ message: 'No changes to save.', type: 'info' });
      return;
    }

    setSubmitting(true);
    try {
      // Save all dirty Team Leaders mappings
      for (const tl of dirtyTls) {
        const newJhoIds = selections[tl.userId] || [];
        await apiService.mapTeamLeaderToJhOwner(tl.userId, newJhoIds);
      }
      
      setToast({ 
        message: 'Successfully saved all Team Leader mappings!', 
        type: 'success' 
      });
      
      await loadData(); // Reload fresh database state
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || err.message || 'Mapping failed.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 min-h-[80vh] text-slate-800 dark:text-slate-100 font-sans relative">
      {/* Click-outside backdrop to close active dropdown */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setActiveDropdown(null)} 
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Staff Assignment
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Team Leader - JHO Mapping
          </h2>
        </div>
        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs font-semibold text-indigo-650 dark:text-indigo-400 self-start sm:self-center">
          Role Scope: LINE INCHARGE (1:M Mapping)
        </div>
      </div>

      {loading ? (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Fetching supervisor maps...</span>
        </div>
      ) : teamLeaders.length === 0 ? (
        <div className="h-[40vh] flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/20 p-8 text-center">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-350">No Team Leaders Registered</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            There are no shop floor Team Leaders registered. Add users with Team Leader role to assign them JH Owners.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* List of Team Leader rows */}
          <div className="space-y-4">
            {teamLeaders.map((tl) => {
              const currentSelected = selections[tl.userId] || [];
              const isDirty = isCardDirty(tl.userId);

              // Available JHOs are those not selected on OTHER cards
              const otherSelectedIds = getSelectedOnOtherCards(tl.userId);
              const availableJhos = jhOwners.filter(jho => !otherSelectedIds.includes(jho.userId));

              return (
                <div 
                  key={tl.userId} 
                  className={`bg-white dark:bg-slate-900/40 border rounded-2xl p-5 hover:border-slate-350 dark:hover:border-slate-700/80 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 shadow-sm relative ${
                    activeDropdown === tl.userId ? 'z-50' : 'z-10'
                  } ${
                    isDirty 
                      ? 'border-indigo-500/60 dark:border-indigo-500/40 ring-1 ring-indigo-500/10' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Left Section (LHS): Team Leader Details and JHO badges list */}
                  <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
                    {/* TL Identity */}
                    <div className="flex items-start gap-4 md:w-60 shrink-0">
                      <div className="p-2.5 bg-indigo-50 dark:bg-slate-950 rounded-xl border border-indigo-100 dark:border-slate-800 text-indigo-650 dark:text-indigo-400 shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block">
                          TL-ID: {tl.userId}
                        </span>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                          {tl.userName}
                        </h4>
                      </div>
                    </div>

                    {/* JHO badges */}
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                        Assigned JH Owners
                      </span>
                      {currentSelected.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {currentSelected.map(id => {
                            const jho = jhOwners.find(j => j.userId === id);
                            return (
                              <span 
                                key={id} 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 text-xs font-semibold animate-scale-in"
                              >
                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{jho ? jho.userName : id}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveJho(tl.userId, id)}
                                  className="p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-slate-400 pt-1">
                          No Team Members Assigned
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section (RHS): Dropdown with checkboxes for multi-select */}
                  <div className="md:w-80 shrink-0 flex items-center gap-3 relative">
                    <div className="flex-1 relative">
                      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block mb-1">
                        Link JHO (Multi-select)
                      </label>
                      
                      {/* Dropdown Trigger Button */}
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === tl.userId ? null : tl.userId)}
                        className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm flex items-center justify-between cursor-pointer hover:border-slate-350 dark:hover:border-slate-750 transition-all font-semibold select-none"
                      >
                        {currentSelected.length === 0 ? (
                          <span className="text-slate-400 dark:text-slate-500">Select JH Owners...</span>
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            {currentSelected.length} Selected
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${activeDropdown === tl.userId ? 'rotate-180' : ''}`} />
                      </div>

                      {/* Dropdown Panel Menu with Checkboxes */}
                      {activeDropdown === tl.userId && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl max-h-56 overflow-y-auto p-2 space-y-0.5 animate-scale-in">
                          {availableJhos.length === 0 ? (
                            <div className="text-xs text-slate-500 p-3 text-center">
                              No JH Owners available.
                            </div>
                          ) : (
                            availableJhos.map(jho => {
                              const isChecked = currentSelected.includes(jho.userId);
                              return (
                                <div
                                  key={jho.userId}
                                  onClick={() => handleToggleJho(tl.userId, jho.userId)}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                                    isChecked
                                      ? 'bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-bold'
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-805 dark:text-slate-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // handled by onClick
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate text-slate-800 dark:text-slate-200">{jho.userName}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">ID: {jho.userId}</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Individual Revert button if card is dirty */}
                    {isDirty && (
                      <button
                        onClick={() => handleRevertCard(tl.userId)}
                        title="Revert changes"
                        className="mt-5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-655 transition-colors h-[42px] shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer with single Save Button */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {!hasChanges ? (
                <span>No changes selected. Configure team members to enable saving.</span>
              ) : (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-550" />
                  {dirtyTlsCount} Team Leader mapping card(s) modified.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  disabled={submitting}
                  className="w-1/2 sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold text-sm transition-all cursor-pointer disabled:opacity-40"
                >
                  Reset
                </button>
              )}
              
              <button
                onClick={handleSaveAll}
                disabled={submitting || !hasChanges}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-750 disabled:opacity-40 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Mappings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Mappings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeaderJhoMapping;
