// Initial Mock Data representing Tata Motors JishuHozen System

const INITIAL_USERS = [
  { userId: '100001', userName: 'Vijay Patil', userRole: 'LINE_INCHARGE' },
  { userId: '100011', userName: 'Anil Sharma', userRole: 'SUPERVISOR' },
  { userId: '100012', userName: 'Mahesh Joshi', userRole: 'SUPERVISOR' },
  { userId: '100021', userName: 'Suresh Singh', userRole: 'TEAM_LEADER' },
  { userId: '100022', userName: 'Rajesh Nair', userRole: 'TEAM_LEADER' },
  { userId: '100031', userName: 'Ramesh Kumar', userRole: 'JH_OWNER' },
  { userId: '100032', userName: 'Sunil Gawde', userRole: 'JH_OWNER' },
  { userId: '100033', userName: 'Prakash Shinde', userRole: 'JH_OWNER' },
  { userId: '100034', userName: 'Dilip Kamble', userRole: 'JH_OWNER' },
];

const INITIAL_AREAS = [
  { areaId: 'A001', areaName: 'Assembly Line A', supervisorId: '100011', supervisorName: 'Anil Sharma' },
  { areaId: 'A002', areaName: 'Press Shop B', supervisorId: '100012', supervisorName: 'Mahesh Joshi' },
  { areaId: 'A003', areaName: 'Weld Shop C', supervisorId: null, supervisorName: '' },
  { areaId: 'A004', areaName: 'Paint Shop D', supervisorId: null, supervisorName: '' },
];

const INITIAL_MACHINES = [
  {
    machineId: 'M001',
    machineName: 'Robotic Welder W1',
    areaId: 'A003',
    areaName: 'Weld Shop C',
    subarea: 'W1-Robot-Cell',
    jhOwnerId: '100031',
    jhOwnerName: 'Ramesh Kumar',
    delayCount: 0,
    supervisorId: '100011',
    supervisorName: 'Anil Sharma',
    teamLeaderId: '100021',
    teamLeaderName: 'Suresh Singh'
  },
  {
    machineId: 'M002',
    machineName: 'Stamping Press P1',
    areaId: 'A002',
    areaName: 'Press Shop B',
    subarea: 'P1-Heavy-Press',
    jhOwnerId: '100032',
    jhOwnerName: 'Sunil Gawde',
    delayCount: 2,
    supervisorId: '100012',
    supervisorName: 'Mahesh Joshi',
    teamLeaderId: '100022',
    teamLeaderName: 'Rajesh Nair'
  },
  {
    machineId: 'M003',
    machineName: 'Conveyor Belt C1',
    areaId: 'A001',
    areaName: 'Assembly Line A',
    subarea: 'C1-Chassis-Line',
    jhOwnerId: '100031',
    jhOwnerName: 'Ramesh Kumar',
    delayCount: 0,
    supervisorId: '100011',
    supervisorName: 'Anil Sharma',
    teamLeaderId: '100021',
    teamLeaderName: 'Suresh Singh'
  },
  {
    machineId: 'M004',
    machineName: 'Paint Sprayer S1',
    areaId: 'A004',
    areaName: 'Paint Shop D',
    subarea: 'S1-Primer-Booth',
    jhOwnerId: '100033',
    jhOwnerName: 'Prakash Shinde',
    delayCount: 5,
    supervisorId: '100012',
    supervisorName: 'Mahesh Joshi',
    teamLeaderId: '100022',
    teamLeaderName: 'Rajesh Nair'
  },
  {
    machineId: 'M005',
    machineName: 'Pneumatic Nut Runner N1',
    areaId: 'A001',
    areaName: 'Assembly Line A',
    subarea: 'N1-Trim-Line',
    jhOwnerId: '100034',
    jhOwnerName: 'Dilip Kamble',
    delayCount: 1,
    supervisorId: '100011',
    supervisorName: 'Anil Sharma',
    teamLeaderId: '100021',
    teamLeaderName: 'Suresh Singh'
  },
  {
    machineId: 'M006',
    machineName: 'Hydraulic Press H1',
    areaId: 'A002',
    areaName: 'Press Shop B',
    subarea: 'H1-Subassembly',
    jhOwnerId: null,
    jhOwnerName: '',
    delayCount: 0,
    supervisorId: '100012',
    supervisorName: 'Mahesh Joshi',
    teamLeaderId: null,
    teamLeaderName: ''
  },
  {
    machineId: 'M007',
    machineName: 'Laser Cutter L1',
    areaId: 'A003',
    areaName: 'Weld Shop C',
    subarea: 'L1-Cutting-Deck',
    jhOwnerId: null,
    jhOwnerName: '',
    delayCount: 3,
    supervisorId: null,
    supervisorName: '',
    teamLeaderId: null,
    teamLeaderName: ''
  }
];

const INITIAL_MAINTENANCE = [
  { machineId: 'M001', machineName: 'Robotic Welder W1', maintenanceStatus: 'COMPLETED', audited: true, completedBy: 'Ramesh Kumar' },
  { machineId: 'M002', machineName: 'Stamping Press P1', maintenanceStatus: 'PENDING', audited: false, completedBy: '' },
  { machineId: 'M003', machineName: 'Conveyor Belt C1', maintenanceStatus: 'MISSED', audited: false, completedBy: '' },
  { machineId: 'M004', machineName: 'Paint Sprayer S1', maintenanceStatus: 'COMPLETED', audited: true, completedBy: 'Prakash Shinde' },
  { machineId: 'M005', machineName: 'Pneumatic Nut Runner N1', maintenanceStatus: 'PENDING', audited: false, completedBy: '' },
  { machineId: 'M006', machineName: 'Hydraulic Press H1', maintenanceStatus: 'COMPLETED', audited: false, completedBy: 'Sunil Gawde' },
  { machineId: 'M007', machineName: 'Laser Cutter L1', maintenanceStatus: 'MISSED', audited: false, completedBy: '' },
];

const INITIAL_TL_JHO_MAPPINGS = [
  { teamLeaderId: '100021', jhOwnerId: '100031' },
  { teamLeaderId: '100021', jhOwnerId: '100032' },
  { teamLeaderId: '100022', jhOwnerId: '100033' },
];

// Helper to initialize localStorage
const initStorage = () => {
  if (!localStorage.getItem('jh_users')) {
    localStorage.setItem('jh_users', JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem('jh_areas')) {
    localStorage.setItem('jh_areas', JSON.stringify(INITIAL_AREAS));
  }
  if (!localStorage.getItem('jh_machines')) {
    localStorage.setItem('jh_machines', JSON.stringify(INITIAL_MACHINES));
  }
  if (!localStorage.getItem('jh_maintenance')) {
    localStorage.setItem('jh_maintenance', JSON.stringify(INITIAL_MAINTENANCE));
  }
  if (!localStorage.getItem('jh_tl_jho_mappings')) {
    localStorage.setItem('jh_tl_jho_mappings', JSON.stringify(INITIAL_TL_JHO_MAPPINGS));
  }
};

initStorage();

export const getMockUsers = (role) => {
  const users = JSON.parse(localStorage.getItem('jh_users'));
  if (role) {
    return users.filter(u => u.userRole === role);
  }
  return users;
};

export const getMockMachines = (userId) => {
  const machines = JSON.parse(localStorage.getItem('jh_machines'));
  const users = JSON.parse(localStorage.getItem('jh_users'));
  const currentUser = users.find(u => u.userId === userId);
  
  if (!currentUser) return machines;

  // Filter based on role hierarchy
  switch (currentUser.userRole) {
    case 'LINE_INCHARGE':
      return machines; // Can see everything
    case 'SUPERVISOR':
      return machines.filter(m => m.supervisorId === userId);
    case 'TEAM_LEADER':
      return machines.filter(m => m.teamLeaderId === userId);
    case 'JH_OWNER':
      return machines.filter(m => m.jhOwnerId === userId);
    default:
      return machines;
  }
};

export const getMockAreas = () => {
  return JSON.parse(localStorage.getItem('jh_areas'));
};

export const getMockMaintenanceStatus = () => {
  return JSON.parse(localStorage.getItem('jh_maintenance'));
};

export const mapSupervisorMock = (areaId, supervisorId) => {
  const areas = JSON.parse(localStorage.getItem('jh_areas'));
  const users = JSON.parse(localStorage.getItem('jh_users'));
  const machines = JSON.parse(localStorage.getItem('jh_machines'));

  if (!supervisorId) {
    const updatedAreas = areas.map(a => {
      if (a.areaId === areaId) {
        return { ...a, supervisorId: null, supervisorName: '' };
      }
      return a;
    });

    const updatedMachines = machines.map(m => {
      if (m.areaId === areaId) {
        return { ...m, supervisorId: null, supervisorName: '' };
      }
      return m;
    });

    localStorage.setItem('jh_areas', JSON.stringify(updatedAreas));
    localStorage.setItem('jh_machines', JSON.stringify(updatedMachines));
    return 'Supervisor unassigned successfully';
  }

  const supervisor = users.find(u => u.userId === supervisorId && u.userRole === 'SUPERVISOR');
  if (!supervisor) {
    throw new Error('Supervisor Not Found or Invalid Role');
  }

  // Check if supervisor already assigned
  const isAssigned = areas.some(a => a.supervisorId === supervisorId && a.areaId !== areaId);
  if (isAssigned) {
    throw new Error('Supervisor Already Assigned to another Area');
  }

  const updatedAreas = areas.map(a => {
    if (a.areaId === areaId) {
      return { ...a, supervisorId, supervisorName: supervisor.userName };
    }
    return a;
  });

  // Also update machines' supervisor name belonging to this area
  const updatedMachines = machines.map(m => {
    if (m.areaId === areaId) {
      return { ...m, supervisorId, supervisorName: supervisor.userName };
    }
    return m;
  });

  localStorage.setItem('jh_areas', JSON.stringify(updatedAreas));
  localStorage.setItem('jh_machines', JSON.stringify(updatedMachines));
  return 'Supervisor Mapped Successfully';
};

export const mapTeamLeaderToJhOwnerMock = (teamLeaderId, jhOwnerId) => {
  const users = JSON.parse(localStorage.getItem('jh_users'));
  const mappings = JSON.parse(localStorage.getItem('jh_tl_jho_mappings'));
  const machines = JSON.parse(localStorage.getItem('jh_machines'));

  const tl = users.find(u => u.userId === teamLeaderId && u.userRole === 'TEAM_LEADER');
  const jho = users.find(u => u.userId === jhOwnerId && u.userRole === 'JH_OWNER');

  if (!tl) throw new Error('Invalid Team Leader');
  if (!jho) throw new Error('Invalid JH Owner');

  // Check if JHO is already mapped
  const isMapped = mappings.some(m => m.jhOwnerId === jhOwnerId);
  if (isMapped) {
    throw new Error('JH Owner Already Mapped');
  }

  const newMappings = [...mappings, { teamLeaderId, jhOwnerId }];
  localStorage.setItem('jh_tl_jho_mappings', JSON.stringify(newMappings));

  // Update machines: if a machine has this jhOwnerId, assign the corresponding teamLeaderId
  const updatedMachines = machines.map(m => {
    if (m.jhOwnerId === jhOwnerId) {
      return { ...m, teamLeaderId, teamLeaderName: tl.userName };
    }
    return m;
  });
  localStorage.setItem('jh_machines', JSON.stringify(updatedMachines));

  return 'Mapping Successful';
};

export const mapMachineToJhOwnerMock = (dtoList) => {
  const machines = JSON.parse(localStorage.getItem('jh_machines'));
  const users = JSON.parse(localStorage.getItem('jh_users'));
  const mappings = JSON.parse(localStorage.getItem('jh_tl_jho_mappings'));

  for (const dto of dtoList) {
    const machine = machines.find(m => m.machineId === dto.machineId);
    const jho = users.find(u => u.userId === dto.jhOwnerId && u.userRole === 'JH_OWNER');

    if (!machine) throw new Error(`Machine Not Found: ${dto.machineId}`);
    if (!jho) throw new Error(`JH Owner Not Found: ${dto.jhOwnerId}`);

    // Check if machine already assigned to someone else
    if (machine.jhOwnerId && machine.jhOwnerId !== dto.jhOwnerId) {
      throw new Error(`Machine Already Assigned: ${dto.machineId}`);
    }

    // Check if JHO already assigned to another machine
    const hasMachine = machines.some(m => m.jhOwnerId === dto.jhOwnerId && m.machineId !== dto.machineId);
    if (hasMachine) {
      throw new Error(`JH Owner Already Assigned: ${dto.jhOwnerId}`);
    }

    // Assign JHO to machine
    machine.jhOwnerId = dto.jhOwnerId;
    machine.jhOwnerName = jho.userName;

    // Find if JHO has a mapped Team Leader, and update that too
    const mapping = mappings.find(map => map.jhOwnerId === dto.jhOwnerId);
    if (mapping) {
      const tl = users.find(u => u.userId === mapping.teamLeaderId);
      if (tl) {
        machine.teamLeaderId = tl.userId;
        machine.teamLeaderName = tl.userName;
      }
    }
  }

  localStorage.setItem('jh_machines', JSON.stringify(machines));
  return 'Mapping Successful';
};
