import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMaintenance } from '../hooks/useMaintenance';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import MaintenanceTable from '../components/MaintenanceTable';
import MaintenanceModal from '../components/MaintenanceModal';
import { CheckCircle2, AlertCircle, Wrench } from 'lucide-react';

const MaintenancePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    machines,
    uniqueAreas,
    selectedMachine,
    loading,
    submitting,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    areaFilter,
    setAreaFilter,
    modalOpen,
    openMaintenanceModal,
    closeMaintenanceModal,
    formData,
    handleChecklistChange,
    handleRemarksChange,
    submitMaintenance,
    errors
  } = useMaintenance(user?.userId);

  const [successToast, setSuccessToast] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async () => {
    setGeneralError('');
    setSuccessToast('');
    try {
      const success = await submitMaintenance();
      if (success) {
        setSuccessToast('Maintenance Completed Successfully');
        setTimeout(() => setSuccessToast(''), 5000);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        logout();
        navigate('/login');
      } else {
        const msg = err.response?.data?.message || err.response?.data || 'Failed to complete maintenance.';
        setGeneralError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    }
  };

  if (user?.role === 'JH_OWNER') {
    const machine = machines[0]; // Gets their single assigned machine
    
    return (
      <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 font-sans max-w-4xl mx-auto py-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">JH Owner Portal</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1">My Machine Configuration</h2>
          </div>
        </div>

        {/* Success/Error Toasts */}
        {successToast && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl border border-emerald-105 bg-emerald-50 text-emerald-700 dark:border-emerald-950/20 dark:bg-emerald-950/20 dark:text-emerald-455 animate-fade-in text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-550" />
            <span>{successToast}</span>
          </div>
        )}

        {generalError && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-950/20 dark:bg-rose-950/20 dark:text-rose-455 animate-fade-in text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-550" />
            <span>{generalError}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-400">Loading assigned machine...</span>
          </div>
        ) : !machine ? (
          <div className="text-center p-12 border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10">
            <span className="text-sm font-bold text-slate-400">No machine assigned to your JH Owner account.</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl p-8 relative overflow-hidden">
            {/* Header: Next Maintenance Date Written Big on Top Right */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-slate-800/60 pb-6 gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block font-mono">Status</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase mt-1.5 ${
                  machine.maintenanceStatus === 'COMPLETED' || machine.maintenanceStatus === 'DONE_MANUALLY'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/25 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30'
                }`}>
                  {machine.maintenanceStatus}
                </span>
              </div>
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 px-6 py-4 rounded-2xl text-right self-stretch md:self-auto flex flex-col items-end shrink-0">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Next Due Date</span>
                <span className="text-3xl font-black font-mono mt-1 text-indigo-700 dark:text-indigo-350">
                  {machine.nextMaintenanceDate}
                </span>
              </div>
            </div>

            {/* Middle Section: Machine ID, Machine Name, Area, Subarea */}
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-indigo-500 font-mono tracking-widest block">
                  MACHINE ID: {machine.machineId}
                </span>
                <h3 className="text-3xl font-black text-slate-850 dark:text-white leading-tight">
                  {machine.machineName}
                </h3>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-500">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2 rounded-xl border border-slate-105 dark:border-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Area</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold">{machine.areaName}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2 rounded-xl border border-slate-105 dark:border-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Subarea</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold">{machine.subarea}</span>
                </div>
              </div>
            </div>

            {/* Bottom Section: Start Maintenance Button or Status Label */}
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-6 flex flex-col items-center">
              {machine.maintenanceStatus === 'COMPLETED' || machine.maintenanceStatus === 'DONE_MANUALLY' ? (
                <div className="flex flex-col items-center gap-2 p-6 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl w-full max-w-md">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-450 font-bold text-base">
                    <CheckCircle2 className="w-5.5 h-5.5 text-emerald-550" />
                    <span className="font-extrabold">Maintenance Done</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Completed on: {machine.lastMaintenanceDate}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => openMaintenanceModal(machine)}
                  className="w-full max-w-md py-4 bg-indigo-650 hover:bg-indigo-750 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Start Maintenance</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form Modal */}
        <MaintenanceModal
          isOpen={modalOpen}
          onClose={closeMaintenanceModal}
          machine={selectedMachine}
          formData={formData}
          onChecklistChange={handleChecklistChange}
          onRemarksChange={handleRemarksChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          errors={errors}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block">Maintenance Execution</span>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-1">
          Perform Today's Maintenance
        </h2>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold tracking-wide">
          JH Owners and Team Leaders can verify parameters and log compliance logs
        </p>
      </div>

      {/* Success/Error Toasts */}
      {successToast && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-950/20 dark:bg-emerald-950/20 dark:text-emerald-455 animate-fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-550" />
          <span>{successToast}</span>
        </div>
      )}

      {generalError && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-950/20 dark:bg-rose-950/20 dark:text-rose-455 animate-fade-in text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-550" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Filter and Search Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search Machine ID/Name..."
        />
        <FilterBar
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          areaValue={areaFilter}
          onAreaChange={setAreaFilter}
          areas={uniqueAreas}
        />
      </div>

      {/* Table Section */}
      <MaintenanceTable
        machines={machines}
        onPerformMaintenance={openMaintenanceModal}
        loading={loading}
      />

      {/* Form Modal */}
      <MaintenanceModal
        isOpen={modalOpen}
        onClose={closeMaintenanceModal}
        machine={selectedMachine}
        formData={formData}
        onChecklistChange={handleChecklistChange}
        onRemarksChange={handleRemarksChange}
        onSubmit={handleSubmit}
        submitting={submitting}
        errors={errors}
      />
    </div>
  );
};

export default MaintenancePage;
