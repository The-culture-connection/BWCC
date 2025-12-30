import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask } from '@/lib/firebase/db';
import { adminDb } from '@/lib/firebase/admin';
import { convertTimestamps } from '@/lib/firebase/db';
import { Task } from '@/lib/types/database';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    // If ID is provided, fetch single task
    if (id) {
      if (!adminDb) throw new Error('Firebase Admin not initialized');
      const taskDoc = await adminDb.collection('tasks').doc(id).get();
      if (!taskDoc.exists) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      const task = convertTimestamps({ id: taskDoc.id, ...taskDoc.data() } as Task);
      return NextResponse.json({ task }, { status: 200 });
    }
    
    // Otherwise, fetch all tasks with filters
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');
    const relatedEventId = searchParams.get('relatedEventId');

    const tasks = await getTasks({
      assignedTo: assignedTo || undefined,
      status: status || undefined,
      relatedEventId: relatedEventId || undefined,
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json();
    
    const taskId = await createTask({
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'Not Started',
      priority: taskData.priority || 'Medium',
      assignedTo: taskData.assignedTo,
      assignedToCommittee: taskData.assignedToCommittee,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      relatedEventId: taskData.relatedEventId,
      relatedPersonId: taskData.relatedPersonId,
      relatedRequestId: taskData.relatedRequestId,
      createdBy: taskData.createdBy,
    });

    // Link task to committee bidirectionally
    if (taskData.assignedToCommittee && adminDb) {
      try {
        const committeeRef = adminDb.collection('committees').doc(taskData.assignedToCommittee);
        const committeeDoc = await committeeRef.get();
        if (committeeDoc.exists) {
          const committeeData = committeeDoc.data();
          const relatedTaskIds = committeeData?.relatedTaskIds || [];
          if (!relatedTaskIds.includes(taskId)) {
            relatedTaskIds.push(taskId);
            await committeeRef.update({
              relatedTaskIds,
              updatedAt: Timestamp.fromDate(new Date()),
            });
          }
        }
      } catch (error) {
        console.error(`Error linking task ${taskId} to committee:`, error);
      }
    }

    return NextResponse.json({ id: taskId, success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;
    if (updates.assignedToCommittee !== undefined) {
      updateData.assignedToCommittee = updates.assignedToCommittee;
      
      // Handle bidirectional linking with committees
      if (adminDb) {
        // Get current task to check old committee
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        const oldCommitteeId = taskDoc.data()?.assignedToCommittee;
        const newCommitteeId = updates.assignedToCommittee || null;
        
        // Remove task from old committee
        if (oldCommitteeId && oldCommitteeId !== newCommitteeId) {
          try {
            const oldCommitteeRef = adminDb.collection('committees').doc(oldCommitteeId);
            const oldCommitteeDoc = await oldCommitteeRef.get();
            if (oldCommitteeDoc.exists) {
              const oldCommitteeData = oldCommitteeDoc.data();
              const relatedTaskIds = (oldCommitteeData?.relatedTaskIds || []).filter((tid: string) => tid !== id);
              await oldCommitteeRef.update({
                relatedTaskIds,
                updatedAt: Timestamp.fromDate(new Date()),
              });
            }
          } catch (error) {
            console.error(`Error unlinking task ${id} from committee ${oldCommitteeId}:`, error);
          }
        }
        
        // Add task to new committee
        if (newCommitteeId && newCommitteeId !== oldCommitteeId) {
          try {
            const newCommitteeRef = adminDb.collection('committees').doc(newCommitteeId);
            const newCommitteeDoc = await newCommitteeRef.get();
            if (newCommitteeDoc.exists) {
              const newCommitteeData = newCommitteeDoc.data();
              const relatedTaskIds = newCommitteeData?.relatedTaskIds || [];
              if (!relatedTaskIds.includes(id)) {
                relatedTaskIds.push(id);
                await newCommitteeRef.update({
                  relatedTaskIds,
                  updatedAt: Timestamp.fromDate(new Date()),
                });
              }
            }
          } catch (error) {
            console.error(`Error linking task ${id} to committee ${newCommitteeId}:`, error);
          }
        }
      }
    }
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.dueDate) updateData.dueDate = Timestamp.fromDate(new Date(updates.dueDate));
    
    if (updates.status === 'Completed' && !updates.completedAt) {
      updateData.completedAt = Timestamp.fromDate(new Date());
    }

    await adminDb.collection('tasks').doc(id).update(updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update task' },
      { status: 500 }
    );
  }
}

