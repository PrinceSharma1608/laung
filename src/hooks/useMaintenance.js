import { useState, useEffect, useCallback, useMemo } from 'react';
import { maintenanceService } from '../services/maintenanceService';

export const useMaintenance = (userId) => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    checklist: {
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      step5: false,
      step6: false,
      step7: false
    },
    remarks: ''
  });
  const [errors, setErrors] = useState({});

  const fetchMachines = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await maintenanceService.getAssignedMachines(userId);
      setMachines(data);
    } catch (err) {
      console.error('Error fetching assigned machines:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // Derived filtered machines list
  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      const matchesSearch = 
        m.machineId.toLowerCase().includes(search.toLowerCase()) ||
        m.machineName.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = !statusFilter || m.maintenanceStatus === statusFilter;
      const matchesArea = !areaFilter || m.areaName === areaFilter;

      return matchesSearch && matchesStatus && matchesArea;
    });
  }, [machines, search, statusFilter, areaFilter]);

  // Derived list of unique areas for filter options
  const uniqueAreas = useMemo(() => {
    const areas = machines.map(m => m.areaName).filter(Boolean);
    return [...new Set(areas)];
  }, [machines]);

  const openMaintenanceModal = (machine) => {
    setSelectedMachine(machine);
    setFormData({
      checklist: {
        step1: false,
        step2: false,
        step3: false,
        step4: false,
        step5: false,
        step6: false,
        step7: false
      },
      remarks: ''
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeMaintenanceModal = () => {
    setModalOpen(false);
    setSelectedMachine(null);
  };

  const handleChecklistChange = (stepKey) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [stepKey]: !prev.checklist[stepKey]
      }
    }));
  };

  const handleRemarksChange = (remarksValue) => {
    setFormData(prev => ({
      ...prev,
      remarks: remarksValue
    }));
  };

  const submitMaintenance = async () => {
    if (!selectedMachine) return false;
    
    // Validations
    const validationErrors = {};
    const allChecked = Object.values(formData.checklist).every(val => val === true);
    if (!allChecked) {
      validationErrors.checklist = 'All checklist items are mandatory.';
    }
    if (formData.remarks && formData.remarks.length > 500) {
      validationErrors.remarks = 'Remarks cannot exceed 500 characters.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const payload = {
        machineId: selectedMachine.machineId,
        checklist: formData.checklist,
        remarks: formData.remarks.trim() || null
      };

      await maintenanceService.completeMaintenance(payload);
      
      // Reload lists and close modal
      await fetchMachines();
      closeMaintenanceModal();
      return true;
    } catch (err) {
      console.error('Error completing maintenance:', err);
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to complete maintenance. Please try again.';
      setErrors({ 
        apiError: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), 
        status: err.response?.status 
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    machines: filteredMachines,
    allRawMachines: machines,
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
    errors,
    refresh: fetchMachines
  };
};
