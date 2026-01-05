'use client';

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { Request, Decision, RequestStatus } from '@/lib/types/database';

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; decision?: string }>({});
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.decision) params.append('decision', filter.decision);
      
      const response = await fetch(`/api/admin/requests?${params.toString()}`);
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision: 'Approved', status: 'Approved' }),
      });
      loadRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleDeny = async (id: string) => {
    try {
      await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision: 'Denied', status: 'Denied' }),
      });
      loadRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error denying request:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-black mb-8">Requests</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Denied">Denied</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              value={filter.decision || ''}
              onChange={(e) => setFilter({ ...filter, decision: e.target.value || undefined })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Decisions</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Denied">Denied</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Decision</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-left text-sm font-medium text-brand-black hover:text-brand-gold"
                      >
                        {request.requestTitle}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.requestType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'Denied' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.decision === 'Approved' ? 'bg-green-100 text-green-800' :
                        request.decision === 'Denied' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.decision}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.decision === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request.id!)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeny(request.id!)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Request Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-black">{selectedRequest.requestTitle}</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Type</h3>
                  <p className="text-gray-900">{selectedRequest.requestType}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Contact Information</h3>
                  <p className="text-gray-900">Name: {selectedRequest.name}</p>
                  <p className="text-gray-900">Email: {selectedRequest.email}</p>
                  {selectedRequest.phone && <p className="text-gray-900">Phone: {selectedRequest.phone}</p>}
                  {selectedRequest.organization && <p className="text-gray-900">Organization: {selectedRequest.organization}</p>}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Details</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.details}</p>
                </div>
                {selectedRequest.preferredDates && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Preferred Dates</h3>
                    <p className="text-gray-900">{selectedRequest.preferredDates}</p>
                  </div>
                )}
                {selectedRequest.budgetCompensation && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Budget/Compensation</h3>
                    <p className="text-gray-900">{selectedRequest.budgetCompensation}</p>
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  {selectedRequest.decision === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedRequest.id!)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeny(selectedRequest.id!)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Deny
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

