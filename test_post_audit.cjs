const axios = require('axios');

async function run() {
  try {
    console.log('Logging in as SUP001...');
    const loginRes = await axios.post('https://elaichi.up.railway.app/auth/login', {
      userId: 'SUP001',
      password: 'pass'
    });
    const token = loginRes.data.token;
    console.log('Token received:', token);

    console.log('Submitting audit request...');
    const auditRes = await axios.post(
      'https://elaichi.up.railway.app/fetch/audit',
      {
        machineId: 'M002',
        frequencyDays: 7,
        checklist: [
          { item: 'Leakage Check', status: 'OK' },
          { item: 'Safety Guards and Covers', status: 'OK' },
          { item: 'Abnormal Noise or Vibration', status: 'OK' },
          { item: 'Tool and Material Arrangement (5S)', status: 'OK' },
          { item: 'Identification and Tagging', status: 'OK' }
        ],
        findings: 'tested'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log('Success:', auditRes.data);
  } catch (err) {
    console.error('Failed:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

run();
