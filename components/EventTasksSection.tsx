'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types/database';
import { getCurrentUser } from '@/lib/firebase/auth';
import { Upload } from 'lucide-react';

interface EventTasksSectionProps {
  eventId: string;
  onTaskCreated?: () => void;
}

interface User {
  uid: string;
  email: string;
  role: string;
}

interface Committee {
  id?: string;
  name: string;
  description?: string;
  members?: string[];
}

export default function EventTasksSection({ eventId, onTaskCreated }: EventTasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
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
  }, [eventId]);

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
      const response = await fetch(`/api/admin/tasks?relatedEventId=${eventId}`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateTask = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert('You must be logged in to create tasks');
      return;
    }

    if (!newTask.title.trim()) {
      alert('Task title is required');
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
          relatedEventId: eventId,
          createdBy: user.uid,
        }),
      });
      setShowCreateForm(false);
      setNewTask({
        title: '',
        description: '',
        status: 'Not Started',
        priority: 'Medium',
        assignedTo: '',
        assignedToCommittee: '',
        dueDate: '',
      });
      loadTasks();
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    }
  };

  const handleUpdateStatus = async (taskId: string, status: Task['status']) => {
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status }),
      });
      loadTasks();
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading tasks...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-700">Tasks</h4>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-3 py-1 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan text-sm font-medium"
        >
          + Task Out
        </button>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. Send flyer to marketing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To User</label>
            <select
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value, assignedToCommittee: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Unassigned</option>
              {committees.map((committee) => (
                <option key={committee.id} value={committee.id}>
                  {committee.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateTask}
              className="flex-1 px-3 py-2 bg-brand-gold text-brand-black rounded-lg hover:bg-brand-tan text-sm font-medium"
            >
              Create Task
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewTask({
                  title: '',
                  description: '',
                  status: 'Not Started',
                  priority: 'Medium',
                  assignedTo: '',
                  assignedToCommittee: '',
                  dueDate: '',
                });
              }}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <p className="text-gray-500 text-sm">No tasks yet. Click &quot;Task Out&quot; to create one.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const assignedUser = users.find(u => u.uid === task.assignedTo);
            return (
              <TaskItem
                key={task.id}
                task={task}
                eventId={eventId}
                assignedUser={assignedUser}
                onStatusUpdate={(status) => handleUpdateStatus(task.id!, status)}
                onTaskUpdate={loadTasks}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskItem({ 
  task, 
  eventId, 
  assignedUser, 
  onStatusUpdate,
  onTaskUpdate 
}: { 
  task: Task; 
  eventId: string;
  assignedUser?: User;
  onStatusUpdate: (status: Task['status']) => void;
  onTaskUpdate: () => void;
}) {
  const [showDeliverables, setShowDeliverables] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('eventId', eventId);

      const response = await fetch(`/api/admin/tasks/${task.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onTaskUpdate();
      } else {
        alert('Error uploading file');
      }
    } catch (error) {
      console.error('Error uploading deliverable:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h5 className="font-medium text-gray-900 text-sm">{task.title}</h5>
          {task.description && (
            <p className="text-xs text-gray-600 mt-1">{task.description}</p>
          )}
        </div>
        <select
          value={task.status}
          onChange={(e) => onStatusUpdate(e.target.value as Task['status'])}
          className="ml-2 text-xs px-2 py-1 border border-gray-300 rounded"
        >
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      <div className="flex gap-2 items-center text-xs text-gray-500 mb-2">
        <span className={`px-2 py-1 rounded ${
          task.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
          task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
        )}
        {assignedUser && (
          <span className="text-gray-600">• {assignedUser.email}</span>
        )}
      </div>
      
      {/* Deliverables */}
      <div className="mt-2 border-t pt-2">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowDeliverables(!showDeliverables)}
            className="text-xs text-brand-gold hover:text-brand-brown"
          >
            {task.deliverables && task.deliverables.length > 0 
              ? `Deliverables (${task.deliverables.length})`
              : 'Upload Deliverable'}
          </button>
          <label className="text-xs text-brand-gold hover:text-brand-brown cursor-pointer">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? 'Uploading...' : '+ Upload'}
          </label>
        </div>
        {showDeliverables && task.deliverables && task.deliverables.length > 0 && (
          <div className="mt-2 space-y-2">
            {task.deliverables.map((url, idx) => {
              if (!url) return null;
              const urlString = typeof url === 'string' ? url : (url.toString ? url.toString() : String(url));
              if (!urlString || urlString === '[object Object]' || !urlString.startsWith('http')) {
                console.error('Invalid URL in deliverables:', url);
                return null;
              }
              const fileName = urlString.split('/').pop() || 'File';
              const isImage = urlString.match(/\.(jpg|jpeg|png|gif|webp)$/i);
              const isVideo = urlString.match(/\.(mp4|webm|mov)$/i);
              
              return (
                <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                  {isImage ? (
                    <img src={urlString} alt={fileName} className="w-12 h-12 object-cover rounded" />
                  ) : isVideo ? (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">Video</div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">Doc</div>
                  )}
                  <a
                    href={urlString}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs text-brand-gold hover:text-brand-brown truncate"
                  >
                    {fileName}
                  </a>
                  <a
                    href={urlString}
                    download={fileName}
                    className="px-2 py-1 text-xs bg-brand-gold text-brand-black rounded hover:bg-brand-tan font-medium"
                  >
                    Download
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

