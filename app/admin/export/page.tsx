'use client';

import AdminLayout from '@/components/AdminLayout';
import SuggestionButton from '@/components/SuggestionButton';

export default function ExportPage() {
  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = blob.type === 'text/csv' ? response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${type}.csv` : `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const exportTypes = [
    { id: 'newsletter', name: 'Newsletter Signups', description: 'Export all newsletter subscribers' },
    { id: 'volunteers', name: 'Volunteers', description: 'Export all volunteer applications' },
    { id: 'requests', name: 'Requests', description: 'Export all form submissions and requests' },
    { id: 'events', name: 'Events', description: 'Export all events and activities' },
    { id: 'people', name: 'People & Partners', description: 'Export all contacts in the people database' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-black mb-8">Export Data</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-6">
            Export data from any collection as a CSV file. The file will download automatically.
          </p>

          <div className="space-y-4">
            {exportTypes.map((type) => (
              <div
                key={type.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-brand-gold transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-brand-black mb-1">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  <button
                    onClick={() => handleExport(type.id)}
                    className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SuggestionButton />
    </AdminLayout>
  );
}

