import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Activity types
export const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  ADD_STUDENT: 'add_student',
  DELETE_STUDENT: 'delete_student',
  UPDATE_STUDENT: 'update_student',
  COMPLETE_LESSON: 'complete_lesson',
  CREATE_CONTENT: 'create_content',
  DELETE_CONTENT: 'delete_content',
  UPDATE_SETTINGS: 'update_settings',
  GENERATE_REPORT: 'generate_report',
  UPDATE_BRANDING: 'update_branding'
};

/**
 * Log an activity (for B2B users only)
 */
export const logActivity = async (activityData) => {
  try {
    const logRef = doc(collection(db, 'activityLogs'));

    const log = {
      organizationId: activityData.organizationId,
      userId: activityData.userId,
      userRole: activityData.userRole,
      action: activityData.action,
      details: activityData.details || {},
      timestamp: serverTimestamp(),
      ipAddress: activityData.ipAddress || null,
      userAgent: activityData.userAgent || null
    };

    await setDoc(logRef, log);

    return {
      id: logRef.id,
      ...log
    };
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - logging failures shouldn't break the app
  }
};

/**
 * Get activity logs for an organization
 */
export const getOrganizationLogs = async (organizationId, filters = {}) => {
  try {
    let logsQuery = collection(db, 'activityLogs');

    // Filter by organization
    logsQuery = query(logsQuery, where('organizationId', '==', organizationId));

    // Apply additional filters
    if (filters.action) {
      logsQuery = query(logsQuery, where('action', '==', filters.action));
    }
    if (filters.userId) {
      logsQuery = query(logsQuery, where('userId', '==', filters.userId));
    }

    // Order by timestamp descending
    logsQuery = query(logsQuery, orderBy('timestamp', 'desc'));

    // Limit results
    if (filters.limit) {
      logsQuery = query(logsQuery, limit(filters.limit));
    }

    const snapshot = await getDocs(logsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting organization logs:', error);
    throw error;
  }
};

/**
 * Get all activity logs (super admin only)
 */
export const getAllLogs = async (filters = {}) => {
  try {
    let logsQuery = collection(db, 'activityLogs');

    // Apply filters
    if (filters.organizationId) {
      logsQuery = query(logsQuery, where('organizationId', '==', filters.organizationId));
    }
    if (filters.action) {
      logsQuery = query(logsQuery, where('action', '==', filters.action));
    }
    if (filters.userId) {
      logsQuery = query(logsQuery, where('userId', '==', filters.userId));
    }

    // Order by timestamp
    logsQuery = query(logsQuery, orderBy('timestamp', 'desc'));

    // Limit results
    const maxLimit = filters.limit || 100;
    logsQuery = query(logsQuery, limit(maxLimit));

    const snapshot = await getDocs(logsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all logs:', error);
    throw error;
  }
};

/**
 * Get recent activity (last N entries)
 */
export const getRecentActivity = async (limitCount = 50) => {
  try {
    let logsQuery = collection(db, 'activityLogs');
    logsQuery = query(
      logsQuery,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(logsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting recent activity:', error);
    throw error;
  }
};

/**
 * Get logs for a specific time range
 */
export const getLogsByDateRange = async (startDate, endDate, filters = {}) => {
  try {
    let logsQuery = collection(db, 'activityLogs');

    // Convert dates to Timestamps
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    logsQuery = query(
      logsQuery,
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp)
    );

    // Apply additional filters
    if (filters.organizationId) {
      logsQuery = query(logsQuery, where('organizationId', '==', filters.organizationId));
    }

    logsQuery = query(logsQuery, orderBy('timestamp', 'desc'));

    const snapshot = await getDocs(logsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting logs by date range:', error);
    throw error;
  }
};

/**
 * Get activity count by action type
 */
export const getActivityCountByType = async (organizationId = null) => {
  try {
    let logsQuery = collection(db, 'activityLogs');

    if (organizationId) {
      logsQuery = query(logsQuery, where('organizationId', '==', organizationId));
    }

    const snapshot = await getDocs(logsQuery);

    const counts = {};
    snapshot.docs.forEach(doc => {
      const action = doc.data().action;
      counts[action] = (counts[action] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Error getting activity count by type:', error);
    throw error;
  }
};

/**
 * Get user activity summary
 */
export const getUserActivitySummary = async (userId) => {
  try {
    let logsQuery = collection(db, 'activityLogs');
    logsQuery = query(logsQuery, where('userId', '==', userId));

    const snapshot = await getDocs(logsQuery);

    const summary = {
      totalActions: snapshot.size,
      actionCounts: {},
      lastActivity: null,
      firstActivity: null
    };

    const logs = snapshot.docs.map(doc => ({
      timestamp: doc.data().timestamp?.toDate(),
      action: doc.data().action
    }));

    // Count actions
    logs.forEach(log => {
      summary.actionCounts[log.action] = (summary.actionCounts[log.action] || 0) + 1;
    });

    // Find first and last activity
    if (logs.length > 0) {
      logs.sort((a, b) => a.timestamp - b.timestamp);
      summary.firstActivity = logs[0].timestamp;
      summary.lastActivity = logs[logs.length - 1].timestamp;
    }

    return summary;
  } catch (error) {
    console.error('Error getting user activity summary:', error);
    throw error;
  }
};

/**
 * Export logs to CSV format (returns CSV string)
 */
export const exportLogsToCSV = async (filters = {}) => {
  try {
    const logs = await getAllLogs(filters);

    // CSV header
    let csv = 'Timestamp,Organization ID,User ID,User Role,Action,Details\n';

    // Add rows
    logs.forEach(log => {
      const timestamp = log.timestamp?.toDate().toISOString() || '';
      const details = JSON.stringify(log.details).replace(/"/g, '""'); // Escape quotes

      csv += `"${timestamp}","${log.organizationId}","${log.userId}","${log.userRole}","${log.action}","${details}"\n`;
    });

    return csv;
  } catch (error) {
    console.error('Error exporting logs to CSV:', error);
    throw error;
  }
};
