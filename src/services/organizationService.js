import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Organization types
export const ORG_TYPES = {
  SCHOOL: 'school',
  INDIVIDUAL_TEACHER: 'individual_teacher'
};

// Organization status
export const ORG_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive'
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  TRIAL: 'trial',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
};

/**
 * Create a new organization (super admin only)
 */
export const createOrganization = async (orgData) => {
  try {
    const orgRef = doc(collection(db, 'organizations'));

    const organization = {
      name: orgData.name,
      type: orgData.type, // 'school' or 'individual_teacher'
      createdBy: 'super_admin',
      createdAt: serverTimestamp(),
      status: ORG_STATUS.ACTIVE,

      branding: {
        logo: orgData.branding?.logo || '',
        primaryColor: orgData.branding?.primaryColor || '#1976d2',
        secondaryColor: orgData.branding?.secondaryColor || '#dc004e',
        appName: orgData.branding?.appName || `${orgData.name} తెలుగు Learn`,
        welcomeMessage: orgData.branding?.welcomeMessage || '',
        customDomain: orgData.branding?.customDomain || ''
      },

      subscription: {
        plan: orgData.subscription?.plan || SUBSCRIPTION_PLANS.TRIAL,
        startDate: serverTimestamp(),
        expiryDate: orgData.subscription?.expiryDate || null,
        maxStudents: orgData.subscription?.maxStudents || 50,
        features: orgData.subscription?.features || []
      },

      settings: {
        timezone: orgData.settings?.timezone || 'America/New_York',
        language: orgData.settings?.language || 'en',
        features: orgData.settings?.features || {}
      }
    };

    await setDoc(orgRef, organization);

    return {
      id: orgRef.id,
      ...organization
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

/**
 * Get organization by ID
 */
export const getOrganization = async (organizationId) => {
  try {
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));

    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }

    return {
      id: orgDoc.id,
      ...orgDoc.data()
    };
  } catch (error) {
    console.error('Error getting organization:', error);
    throw error;
  }
};

/**
 * Get all organizations (super admin only)
 */
export const getAllOrganizations = async (filters = {}) => {
  try {
    let orgQuery = collection(db, 'organizations');

    // Apply filters
    if (filters.type) {
      orgQuery = query(orgQuery, where('type', '==', filters.type));
    }
    if (filters.status) {
      orgQuery = query(orgQuery, where('status', '==', filters.status));
    }

    const snapshot = await getDocs(orgQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting organizations:', error);
    throw error;
  }
};

/**
 * Update organization information
 */
export const updateOrganization = async (organizationId, updates) => {
  try {
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, updates);
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
};

/**
 * Update organization branding
 */
export const updateOrganizationBranding = async (organizationId, branding) => {
  try {
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, {
      branding: branding
    });
  } catch (error) {
    console.error('Error updating organization branding:', error);
    throw error;
  }
};

/**
 * Update organization status (activate/suspend)
 */
export const updateOrganizationStatus = async (organizationId, status) => {
  try {
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, {
      status: status
    });
  } catch (error) {
    console.error('Error updating organization status:', error);
    throw error;
  }
};

/**
 * Delete organization and all associated data
 */
export const deleteOrganization = async (organizationId) => {
  try {
    // Note: This is a dangerous operation and should have additional safeguards
    // In production, you might want to soft-delete instead
    const orgRef = doc(db, 'organizations', organizationId);
    await deleteDoc(orgRef);

    // TODO: Clean up all students, progress, analytics, etc.
    // This should be done via Cloud Functions for consistency
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
};

/**
 * Add admin/teacher to organization
 */
export const addOrganizationAdmin = async (organizationId, adminData) => {
  try {
    const adminRef = doc(
      db,
      'organizations',
      organizationId,
      'admins',
      adminData.userId
    );

    const admin = {
      email: adminData.email,
      displayName: adminData.displayName,
      credentials: {
        username: adminData.username,
        temporaryPassword: adminData.temporaryPassword, // Should be hashed
        passwordChangeRequired: true
      },
      addedAt: serverTimestamp(),
      lastLogin: null,
      permissions: adminData.permissions || {}
    };

    await setDoc(adminRef, admin);

    return admin;
  } catch (error) {
    console.error('Error adding organization admin:', error);
    throw error;
  }
};

/**
 * Get organization admins/teachers
 */
export const getOrganizationAdmins = async (organizationId) => {
  try {
    const adminsRef = collection(db, 'organizations', organizationId, 'admins');
    const snapshot = await getDocs(adminsRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting organization admins:', error);
    throw error;
  }
};

/**
 * Remove admin/teacher from organization
 */
export const removeOrganizationAdmin = async (organizationId, adminId) => {
  try {
    const adminRef = doc(db, 'organizations', organizationId, 'admins', adminId);
    await deleteDoc(adminRef);
  } catch (error) {
    console.error('Error removing organization admin:', error);
    throw error;
  }
};

/**
 * Get organization statistics
 */
export const getOrganizationStats = async (organizationId) => {
  try {
    const statsDoc = await getDoc(
      doc(db, 'organizationAnalytics', organizationId, 'stats', 'current')
    );

    if (!statsDoc.exists()) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        totalLessons: 0,
        avgProgress: 0
      };
    }

    return statsDoc.data();
  } catch (error) {
    console.error('Error getting organization stats:', error);
    throw error;
  }
};

/**
 * Check if organization has reached student limit
 */
export const hasReachedStudentLimit = async (organizationId) => {
  try {
    const org = await getOrganization(organizationId);
    const studentsRef = collection(db, 'organizations', organizationId, 'students');
    const snapshot = await getDocs(studentsRef);

    return snapshot.size >= org.subscription.maxStudents;
  } catch (error) {
    console.error('Error checking student limit:', error);
    throw error;
  }
};

/**
 * Upload organization logo to Firebase Storage
 */
export const uploadOrganizationLogo = async (organizationId, file) => {
  // TODO: Implement Firebase Storage upload
  // This will be implemented when we handle file uploads
  throw new Error('Not implemented yet');
};

/**
 * Get organization count by type
 */
export const getOrganizationCountByType = async () => {
  try {
    const orgsRef = collection(db, 'organizations');
    const snapshot = await getDocs(orgsRef);

    const counts = {
      [ORG_TYPES.SCHOOL]: 0,
      [ORG_TYPES.INDIVIDUAL_TEACHER]: 0,
      total: snapshot.size
    };

    snapshot.docs.forEach(doc => {
      const type = doc.data().type;
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return counts;
  } catch (error) {
    console.error('Error getting organization counts:', error);
    throw error;
  }
};

/**
 * Get active organizations (logged in within last N days)
 */
export const getActiveOrganizations = async (daysBack = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const orgs = await getAllOrganizations({ status: ORG_STATUS.ACTIVE });

    // TODO: Filter by recent admin login activity
    // This would require querying the users collection for each org
    // For now, return all active organizations

    return orgs;
  } catch (error) {
    console.error('Error getting active organizations:', error);
    throw error;
  }
};
