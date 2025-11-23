import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { USER_ROLES } from './userService';
import { ORG_STATUS } from './organizationService';

/**
 * Get platform-wide statistics (super admin only)
 */
export const getPlatformStats = async () => {
  try {
    const stats = {
      users: {
        totalConsumers: 0,
        totalTeachers: 0,
        totalSchoolAdmins: 0,
        totalSuperAdmins: 0,
        totalUsers: 0
      },
      organizations: {
        totalOrganizations: 0,
        activeOrganizations: 0,
        totalSchools: 0,
        totalIndividualTeachers: 0
      },
      learners: {
        totalChildren: 0, // B2C
        totalStudents: 0, // B2B
        totalLearners: 0
      },
      activity: {
        totalLessonsCompleted: 0,
        totalContentCreated: 0
      }
    };

    // Get user counts
    const usersSnapshot = await getDocs(collection(db, 'users'));
    usersSnapshot.docs.forEach(doc => {
      const role = doc.data().role;
      stats.users.totalUsers++;

      switch (role) {
        case USER_ROLES.CONSUMER:
          stats.users.totalConsumers++;
          break;
        case USER_ROLES.TEACHER:
          stats.users.totalTeachers++;
          break;
        case USER_ROLES.SCHOOL_ADMIN:
          stats.users.totalSchoolAdmins++;
          break;
        case USER_ROLES.SUPER_ADMIN:
          stats.users.totalSuperAdmins++;
          break;
      }
    });

    // Get organization counts
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    stats.organizations.totalOrganizations = orgsSnapshot.size;

    orgsSnapshot.docs.forEach(doc => {
      const orgData = doc.data();

      if (orgData.status === ORG_STATUS.ACTIVE) {
        stats.organizations.activeOrganizations++;
      }

      if (orgData.type === 'school') {
        stats.organizations.totalSchools++;
      } else if (orgData.type === 'individual_teacher') {
        stats.organizations.totalIndividualTeachers++;
      }
    });

    // Count children (B2C)
    let childrenCount = 0;
    const consumerProfilesSnapshot = await getDocs(collection(db, 'consumerProfiles'));

    for (const profileDoc of consumerProfilesSnapshot.docs) {
      const childrenSnapshot = await getDocs(
        collection(db, 'consumerProfiles', profileDoc.id, 'children')
      );
      childrenCount += childrenSnapshot.size;
    }

    stats.learners.totalChildren = childrenCount;

    // Count students (B2B)
    let studentsCount = 0;
    for (const orgDoc of orgsSnapshot.docs) {
      const studentsSnapshot = await getDocs(
        collection(db, 'organizations', orgDoc.id, 'students')
      );
      studentsCount += studentsSnapshot.size;
    }

    stats.learners.totalStudents = studentsCount;
    stats.learners.totalLearners = childrenCount + studentsCount;

    // Count content
    const contentSnapshot = await getDocs(collection(db, 'content'));
    stats.activity.totalContentCreated = contentSnapshot.size;

    // Note: Lessons completed would need to be aggregated from gameProgress
    // This could be expensive, so we'll leave it at 0 for now
    // In production, this should be pre-calculated via Cloud Functions

    return stats;
  } catch (error) {
    console.error('Error getting platform stats:', error);
    throw error;
  }
};

/**
 * Get organization analytics
 */
export const getOrganizationAnalytics = async (organizationId) => {
  try {
    // Try to get cached analytics first
    const analyticsDoc = await getDoc(
      doc(db, 'organizationAnalytics', organizationId, 'stats', 'current')
    );

    if (analyticsDoc.exists()) {
      return analyticsDoc.data();
    }

    // If no cached data, calculate fresh
    return await calculateOrganizationAnalytics(organizationId);
  } catch (error) {
    console.error('Error getting organization analytics:', error);
    throw error;
  }
};

/**
 * Calculate organization analytics (expensive operation)
 */
export const calculateOrganizationAnalytics = async (organizationId) => {
  try {
    const analytics = {
      totalStudents: 0,
      activeStudents: 0, // Active in last 7 days
      totalLessons: 0,
      avgProgress: 0,
      lastUpdated: new Date()
    };

    // Get all students
    const studentsSnapshot = await getDocs(
      collection(db, 'organizations', organizationId, 'students')
    );

    analytics.totalStudents = studentsSnapshot.size;

    // Calculate active students and progress
    let totalProgress = 0;
    let studentsWithProgress = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    for (const studentDoc of studentsSnapshot.docs) {
      // Check game progress for activity
      const gameProgressSnapshot = await getDocs(
        collection(
          db,
          'organizations',
          organizationId,
          'students',
          studentDoc.id,
          'gameProgress'
        )
      );

      let hasRecentActivity = false;
      let studentLessonsCompleted = 0;

      gameProgressSnapshot.docs.forEach(progressDoc => {
        const progressData = progressDoc.data();
        const lastPlayed = progressData.lastPlayed?.toDate();

        if (lastPlayed && lastPlayed >= cutoffDate) {
          hasRecentActivity = true;
        }

        if (progressData.stars >= 2) {
          // Consider it completed if 2+ stars
          studentLessonsCompleted++;
        }
      });

      if (hasRecentActivity) {
        analytics.activeStudents++;
      }

      if (gameProgressSnapshot.size > 0) {
        studentsWithProgress++;
        totalProgress += studentLessonsCompleted;
      }

      analytics.totalLessons += studentLessonsCompleted;
    }

    // Calculate average progress per student
    if (studentsWithProgress > 0) {
      analytics.avgProgress = Math.round(totalProgress / studentsWithProgress);
    }

    return analytics;
  } catch (error) {
    console.error('Error calculating organization analytics:', error);
    throw error;
  }
};

/**
 * Update organization analytics cache
 */
export const updateOrganizationAnalyticsCache = async (organizationId) => {
  try {
    const analytics = await calculateOrganizationAnalytics(organizationId);

    await setDoc(
      doc(db, 'organizationAnalytics', organizationId, 'stats', 'current'),
      {
        ...analytics,
        lastUpdated: serverTimestamp()
      }
    );

    return analytics;
  } catch (error) {
    console.error('Error updating organization analytics cache:', error);
    throw error;
  }
};

/**
 * Get daily analytics for an organization
 */
export const getDailyAnalytics = async (organizationId, date) => {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const dailyDoc = await getDoc(
      doc(db, 'organizationAnalytics', organizationId, 'daily', dateStr)
    );

    if (!dailyDoc.exists()) {
      return {
        date: dateStr,
        activeUsers: 0,
        lessonsCompleted: 0,
        newStudents: 0
      };
    }

    return dailyDoc.data();
  } catch (error) {
    console.error('Error getting daily analytics:', error);
    throw error;
  }
};

/**
 * Get analytics for a date range
 */
export const getAnalyticsDateRange = async (organizationId, startDate, endDate) => {
  try {
    const dailyAnalytics = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const analytics = await getDailyAnalytics(organizationId, currentDate);
      dailyAnalytics.push(analytics);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyAnalytics;
  } catch (error) {
    console.error('Error getting analytics date range:', error);
    throw error;
  }
};

/**
 * Get growth statistics
 */
export const getGrowthStats = async (daysBack = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get users created in the period
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let newConsumers = 0;
    let newTeachers = 0;

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const createdAt = userData.createdAt?.toDate();

      if (createdAt && createdAt >= cutoffDate) {
        if (userData.role === USER_ROLES.CONSUMER) {
          newConsumers++;
        } else if (
          userData.role === USER_ROLES.TEACHER ||
          userData.role === USER_ROLES.SCHOOL_ADMIN
        ) {
          newTeachers++;
        }
      }
    });

    // Get organizations created in the period
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    let newOrganizations = 0;

    orgsSnapshot.docs.forEach(doc => {
      const orgData = doc.data();
      const createdAt = orgData.createdAt?.toDate();

      if (createdAt && createdAt >= cutoffDate) {
        newOrganizations++;
      }
    });

    return {
      period: `Last ${daysBack} days`,
      newConsumers,
      newTeachers,
      newOrganizations,
      totalNewUsers: newConsumers + newTeachers
    };
  } catch (error) {
    console.error('Error getting growth stats:', error);
    throw error;
  }
};

/**
 * Get top performing organizations
 */
export const getTopOrganizations = async (metric = 'totalStudents', limitCount = 10) => {
  try {
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    const orgStats = [];

    for (const orgDoc of orgsSnapshot.docs) {
      const orgData = orgDoc.data();
      const analytics = await getOrganizationAnalytics(orgDoc.id);

      orgStats.push({
        id: orgDoc.id,
        name: orgData.name,
        type: orgData.type,
        ...analytics
      });
    }

    // Sort by metric
    orgStats.sort((a, b) => (b[metric] || 0) - (a[metric] || 0));

    return orgStats.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting top organizations:', error);
    throw error;
  }
};

/**
 * Export analytics to CSV
 */
export const exportAnalyticsToCSV = async (organizationId = null) => {
  try {
    let csv = 'Organization ID,Organization Name,Type,Total Students,Active Students,Total Lessons,Avg Progress\n';

    if (organizationId) {
      // Single organization
      const org = await getDoc(doc(db, 'organizations', organizationId));
      const analytics = await getOrganizationAnalytics(organizationId);

      csv += `"${organizationId}","${org.data().name}","${org.data().type}",${analytics.totalStudents},${analytics.activeStudents},${analytics.totalLessons},${analytics.avgProgress}\n`;
    } else {
      // All organizations
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));

      for (const orgDoc of orgsSnapshot.docs) {
        const orgData = orgDoc.data();
        const analytics = await getOrganizationAnalytics(orgDoc.id);

        csv += `"${orgDoc.id}","${orgData.name}","${orgData.type}",${analytics.totalStudents},${analytics.activeStudents},${analytics.totalLessons},${analytics.avgProgress}\n`;
      }
    }

    return csv;
  } catch (error) {
    console.error('Error exporting analytics to CSV:', error);
    throw error;
  }
};
