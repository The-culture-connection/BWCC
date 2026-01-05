'use client';

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { Task } from '@/lib/types/database';
import { getCurrentUser } from '@/lib/firebase/auth';

interface User {
  uid: string;
  email: string;
  name?: string;
  role: string;
}

interface TaskDetailModalProps {
  task: Task;
  users: User[];
  committees: Committee[];
  onClose: () => void;
  onUpdate: () => void;
}

// Normalize deliverables to handle both legacy string URLs and new object format
function normalizeDeliverables(input: any): Array<any> {
  if (!Array.isArray(input)) return [];

  return input
    .map((d, idx) => {
      if (!d) return null;

      // If legacy string URL
      if (typeof d === 'string') {
        const url = d;
        const fileNameRaw = url.split('/').pop()?.split('?')[0] || `File_${idx + 1}`;
        let fileName = fileNameRaw;
        try { 
          fileName = decodeURIComponent(fileNameRaw); 
        } catch {}
        fileName = fileName.replace(/^\d+-/, '');

        return {
          id: `legacy-${idx}`,
          fileName,
          contentType: '',
          size: 0,
          storagePath: '',
          previewUrl: url,
          createdAt: new Date().toISOString(),
        };
      }

      // If new object shape
      if (typeof d === 'object') {
        return {
          id: d.id ?? `obj-${idx}`,
          fileName: d.fileName ?? d.name ?? `File_${idx + 1}`,
          contentType: d.contentType ?? d.type ?? '',
          size: d.size ?? 0,
          storagePath: d.storagePath ?? d.path ?? '',
          previewUrl: d.previewUrl ?? d.url ?? d.publicUrl ?? '',
          createdAt: d.createdAt ?? new Date().toISOString(),
        };
      }

      return null;
    })
    .filter((item): item is any => item !== null);
}

function TaskDetailModal({ task, users, committees, onClose, onUpdate }: TaskDetailModalProps) {
  const [uploading, setUploading] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [preview, setPreview] = useState<null | { url: string; fileName: string; contentType: string }>(null);

  // Reload task data
  useEffect(() => {
    const loadTask = async () => {
      try {
        console.log('[DEBUG] ========== LOADING TASK DATA ==========');
        console.log('[DEBUG] Loading task data for task ID:', task.id);
        const response = await fetch(`/api/admin/tasks?id=${task.id}`);
        console.log('[DEBUG] Task fetch response status:', response.status);
        const data = await response.json();
        console.log('[DEBUG] Task data response:', data);
        if (data.task) {
          console.log('[DEBUG] Task found, deliverables:', data.task.deliverables);
          console.log('[DEBUG] Task deliverables count:', data.task.deliverables?.length || 0);
          console.log('[DEBUG] Task deliverables type:', typeof data.task.deliverables);
          console.log('[DEBUG] Task deliverables is array:', Array.isArray(data.task.deliverables));
          setCurrentTask(data.task);
          console.log('[DEBUG] Task state updated');
        } else {
          console.error('[DEBUG] No task data in response');
        }
        console.log('[DEBUG] ========== LOADING TASK DATA END ==========');
      } catch (error) {
        console.error('[DEBUG] Error loading task:', error);
      }
    };
    loadTask();
  }, [task.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('[DEBUG] No file selected');
      return;
    }

    console.log('[DEBUG] Starting file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      taskId: task.id,
      relatedEventId: task.relatedEventId,
    });

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (task.relatedEventId) {
        formData.append('eventId', task.relatedEventId);
        console.log('[DEBUG] Added eventId to formData:', task.relatedEventId);
      }

      console.log('[DEBUG] Sending request to:', `/api/admin/tasks/${task.id}/upload`);
      const response = await fetch(`/api/admin/tasks/${task.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('[DEBUG] Upload response status:', response.status);
      const responseData = await response.json();
      console.log('[DEBUG] Upload response data:', responseData);

      if (response.ok) {
        console.log('[DEBUG] ========== UPLOAD SUCCESS (FRONTEND) ==========');
        console.log('[DEBUG] Upload successful, response status:', response.status);
        console.log('[DEBUG] Full response data:', JSON.stringify(responseData, null, 2));
        console.log('[DEBUG] Uploaded URL:', responseData.url);
        console.log('[DEBUG] Public URL:', responseData.publicUrl);
        console.log('[DEBUG] Signed URL:', responseData.signedUrl);
        console.log('[DEBUG] Debug info:', responseData.debug);
        console.log('[DEBUG] Deliverables from response:', responseData.deliverables);
        console.log('[DEBUG] Deliverables array length:', responseData.deliverables?.length || 0);
        
        // Reload task to get updated deliverables
        console.log('[DEBUG] Reloading task data from API...');
        try {
          const taskResponse = await fetch(`/api/admin/tasks?id=${task.id}`);
          console.log('[DEBUG] Task reload response status:', taskResponse.status);
          
          const taskData = await taskResponse.json();
          console.log('[DEBUG] Task reload response data:', JSON.stringify(taskData, null, 2));
          
          if (taskData.task) {
            console.log('[DEBUG] Task found, deliverables count:', taskData.task.deliverables?.length || 0);
            console.log('[DEBUG] Updated task deliverables array:', JSON.stringify(taskData.task.deliverables || []));
            setCurrentTask(taskData.task);
            console.log('[DEBUG] ✓ Task state updated with new deliverables');
          } else {
            console.error('[DEBUG] ✗ No task data in response');
          }
        } catch (reloadError) {
          console.error('[DEBUG] ✗ Error reloading task:', reloadError);
        }
        
        onUpdate(); // Trigger parent update
        alert(`File uploaded successfully! URL: ${responseData.url}`);
        console.log('[DEBUG] ========== UPLOAD SUCCESS END ==========');
      } else {
        console.error('[DEBUG] ========== UPLOAD FAILED (FRONTEND) ==========');
        console.error('[DEBUG] Upload failed with status:', response.status);
        console.error('[DEBUG] Upload failed response:', JSON.stringify(responseData, null, 2));
        alert(`Error uploading file: ${responseData.error || 'Unknown error'}`);
        console.error('[DEBUG] ========== UPLOAD FAILED END ==========');
      }
    } catch (error) {
      console.error('[DEBUG] Error uploading deliverable:', error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleStatusUpdate = async (status: Task['status']) => {
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status }),
      });
      onUpdate();
      setCurrentTask({ ...currentTask, status });
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating status');
    }
  };

  const assignedUser = users.find(u => u.uid === currentTask.assignedTo);
  const assignedCommittee = committees.find(c => c.id === currentTask.assignedToCommittee);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-brand-black">{currentTask.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700">Status</h3>
              <select
                value={currentTask.status}
                onChange={(e) => handleStatusUpdate(e.target.value as Task['status'])}
                className="mt-1 px-4 py-2 border border-gray-300 rounded-lg w-full"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Priority</h3>
              <p className="text-gray-900">{currentTask.priority}</p>
            </div>
          </div>

          {currentTask.description && (
            <div>
              <h3 className="font-semibold text-gray-700">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{currentTask.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {currentTask.dueDate && (
              <div>
                <h3 className="font-semibold text-gray-700">Due Date</h3>
                <p className="text-gray-900">{new Date(currentTask.dueDate).toLocaleDateString()}</p>
              </div>
            )}
            {(assignedUser || assignedCommittee) && (
              <div>
                <h3 className="font-semibold text-gray-700">Assigned To</h3>
                <p className="text-gray-900">
                  {assignedUser ? assignedUser.email : assignedCommittee ? assignedCommittee.name : '-'}
                </p>
              </div>
            )}
          </div>

          {/* Deliverables Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-4">Deliverables</h3>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Deliverable</label>
              <label className="inline-flex items-center px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan cursor-pointer text-sm font-medium">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                {uploading ? 'Uploading...' : '+ Upload File'}
              </label>
              <p className="text-xs text-gray-500 mt-1">Upload photos, videos, or documents</p>
            </div>

            {/* Uploaded Files */}
            {(() => {
              console.log('[DEBUG] Raw deliverables before normalization:', currentTask.deliverables);
              console.log('[DEBUG] First deliverable type:', typeof currentTask.deliverables?.[0]);
              console.log('[DEBUG] First deliverable value:', currentTask.deliverables?.[0]);
              
              const deliverables = normalizeDeliverables(currentTask.deliverables);
              
              console.log('[DEBUG] Normalized deliverables:', deliverables);
              console.log('[DEBUG] Normalized deliverables IDs:', deliverables.map((d: any) => d.id));
              
              if (deliverables.length === 0) {
                return <p className="text-sm text-gray-500">No deliverables uploaded yet</p>;
              }

              return (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Uploaded Files ({deliverables.length})
                  </h4>
                  <div className="space-y-3">
                    {deliverables.map((d: any) => {
                      const url = d.previewUrl;
                      const isImage = d.contentType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(d.fileName);
                      const isVideo = d.contentType?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(d.fileName);
                      const isPdf = d.contentType === 'application/pdf' || /\.pdf$/i.test(d.fileName);

                      return (
                        <div key={d.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                          <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded border border-gray-300 overflow-hidden flex-shrink-0">
                            {isImage && url ? (
                              <img 
                                src={url} 
                                alt={d.fileName} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-600">
                                {isVideo ? 'Video' : isPdf ? 'PDF' : 'File'}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 break-words">{d.fileName}</div>
                            {d.size > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {(d.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 flex flex-col gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/tasks/${task.id}/deliverables/${d.id}/url`);
                                  const data = await res.json();
                                  const viewUrl = data.url || url;
                                  if (!viewUrl) {
                                    alert('No URL available for preview.');
                                    return;
                                  }
                                  setPreview({ url: viewUrl, fileName: d.fileName, contentType: d.contentType });
                                } catch (error) {
                                  console.error('Error getting preview URL:', error);
                                  alert('Error loading preview');
                                }
                              }}
                              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 font-medium whitespace-nowrap"
                            >
                              Preview
                            </button>

                            <button
                              onClick={() => {
                                window.location.href = `/api/admin/tasks/${task.id}/deliverables/${d.id}/download`;
                              }}
                              className="px-4 py-2 text-sm bg-brand-gold text-brand-black rounded hover:bg-brand-tan font-medium whitespace-nowrap"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Total: {deliverables.length} file{deliverables.length !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-semibold text-gray-900">{preview.fileName}</div>
              <button 
                onClick={() => setPreview(null)} 
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-4 h-[75vh] overflow-auto">
              {preview.contentType?.startsWith('image/') ? (
                <img src={preview.url} alt={preview.fileName} className="max-h-full max-w-full mx-auto" />
              ) : preview.contentType?.startsWith('video/') ? (
                <video src={preview.url} controls className="w-full h-full max-h-[70vh]" />
              ) : preview.contentType === 'application/pdf' || /\.pdf$/i.test(preview.fileName) ? (
                <iframe src={preview.url} className="w-full h-full min-h-[70vh]" />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <a className="text-blue-600 underline text-lg" href={preview.url} target="_blank" rel="noreferrer">
                    Open file in new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Committee {
  id?: string;
  name: string;
  description?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string }>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Not Started' as Task['status'],
    priority: 'Medium' as Task['priority'],
    assignedTo: '',
    assignedToCommittee: '',
    dueDate: '',
  });

  useEffect(() => {
    loadTasks();
    loadUsers();
    loadCommittees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCommittees = async () => {
    try {
      const response = await fetch('/api/admin/committees');
      const data = await response.json();
      setCommittees(data.committees || []);
    } catch (error) {
      console.error('Error loading committees:', error);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      
      const response = await fetch(`/api/admin/tasks?${params.toString()}`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert('You must be logged in to create tasks');
      return;
    }

    try {
      await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          dueDate: newTask.dueDate || undefined,
          assignedTo: newTask.assignedTo || undefined,
          assignedToCommittee: newTask.assignedToCommittee || undefined,
          createdBy: user.uid,
        }),
      });
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', status: 'Not Started', priority: 'Medium', assignedTo: '', assignedToCommittee: '', dueDate: '' });
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: Task['status']) => {
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black">Tasks</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
          >
            Create Task
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ status: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => {
                  const assignedUser = users.find(u => u.uid === task.assignedTo);
                  const assignedCommittee = committees.find(c => c.id === task.assignedToCommittee);
                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="text-left text-sm font-medium text-brand-black hover:text-brand-gold"
                        >
                          {task.title}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          task.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignedUser ? assignedUser.email : assignedCommittee ? assignedCommittee.name : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="text-brand-gold hover:text-brand-brown"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal 
            task={selectedTask}
            users={users}
            committees={committees}
            onClose={() => setSelectedTask(null)}
            onUpdate={loadTasks}
          />
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-brand-black mb-4">Create Task</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To User</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value, assignedToCommittee: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.uid} value={user.uid}>
                        {user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Committee</label>
                  <select
                    value={newTask.assignedToCommittee}
                    onChange={(e) => setNewTask({ ...newTask, assignedToCommittee: e.target.value, assignedTo: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {committees.map((committee) => (
                      <option key={committee.id} value={committee.id}>
                        {committee.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleCreateTask}
                    className="flex-1 px-4 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan font-medium"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

