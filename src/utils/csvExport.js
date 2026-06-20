export const exportToCSV = (data, filename = 'exported-data.csv') => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape double quotes and wrap in quotes if value has comma/new line
      const escaped = ('' + (val !== null && val !== undefined ? val : '')).replace(/"/g, '\\"');
      return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(','));
  }

  // Create blob and download link
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
