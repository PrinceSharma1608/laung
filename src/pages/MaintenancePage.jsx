import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMaintenance } from '../hooks/useMaintenance';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import MaintenanceTable from '../components/MaintenanceTable';
import MaintenanceModal from '../components/MaintenanceModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
