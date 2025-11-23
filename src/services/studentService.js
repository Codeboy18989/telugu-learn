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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Add a student (B2B teachers/school admins only)
 */
export const addStudent = async (organizationId, studentData, addedBy) => {
  try {
    const studentRef = doc(collection(db, 'organizations', organizationId, 'students'));

    const student = {
      name: studentData.name,
      studentNumber: studentData.studentNumber || '',
      ageGroup: studentData.ageGroup,
      addedBy,
      createdAt: serverTimestamp()
    };

    await setDoc(studentRef, student);

    return {
      id: studentRef.id,
      ...student
    };
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

/**
 * Get all students for an organization
 */
export const getStudents = async (organizationId) => {
  try {
    const studentsRef = collection(db, 'organizations', organizationId, 'students');
    const snapshot = await getDocs(studentsRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
};

/**
 * Get a specific student's data
 */
export const getStudent = async (organizationId, studentId) => {
  try {
    const studentDoc = await getDoc(
      doc(db, 'organizations', organizationId, 'students', studentId)
    );

    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }

    return {
      id: studentDoc.id,
      ...studentDoc.data()
    };
  } catch (error) {
    console.error('Error getting student:', error);
    throw error;
  }
};

/**
 * Update student information
 */
export const updateStudent = async (organizationId, studentId, updates) => {
  try {
    const studentRef = doc(db, 'organizations', organizationId, 'students', studentId);
    await updateDoc(studentRef, updates);
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

/**
 * Delete a student and all associated data
 */
export const deleteStudent = async (organizationId, studentId) => {
  try {
    const batch = writeBatch(db);

    // Delete student document
    const studentRef = doc(db, 'organizations', organizationId, 'students', studentId);
    batch.delete(studentRef);

    // Delete game progress
    const gameProgressRef = collection(
      db,
      'organizations',
      organizationId,
      'students',
      studentId,
      'gameProgress'
    );
    const gameProgressSnapshot = await getDocs(gameProgressRef);
    gameProgressSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete stats
    const statsStreakRef = doc(
      db,
      'organizations',
      organizationId,
      'students',
      studentId,
      'stats',
      'streak'
    );
    batch.delete(statsStreakRef);

    // Delete progress
    const progressRef = collection(
      db,
      'organizations',
      organizationId,
      'students',
      studentId,
      'progress'
    );
    const progressSnapshot = await getDocs(progressRef);
    progressSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

/**
 * Get students added by a specific teacher
 */
export const getStudentsByTeacher = async (organizationId, teacherId) => {
  try {
    const studentsRef = collection(db, 'organizations', organizationId, 'students');
    const q = query(studentsRef, where('addedBy', '==', teacherId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting students by teacher:', error);
    throw error;
  }
};

/**
 * Get student count for organization
 */
export const getStudentCount = async (organizationId) => {
  try {
    const studentsRef = collection(db, 'organizations', organizationId, 'students');
    const snapshot = await getDocs(studentsRef);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting student count:', error);
    throw error;
  }
};

/**
 * Get active students (those who have activity in the last N days)
 */
export const getActiveStudents = async (organizationId, daysBack = 7) => {
  try {
    const students = await getStudents(organizationId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const activeStudents = [];

    for (const student of students) {
      // Check if student has recent game progress
      const gameProgressRef = collection(
        db,
        'organizations',
        organizationId,
        'students',
        student.id,
        'gameProgress'
      );

      const snapshot = await getDocs(gameProgressRef);
      const hasRecentActivity = snapshot.docs.some(doc => {
        const data = doc.data();
        const lastPlayed = data.lastPlayed?.toDate();
        return lastPlayed && lastPlayed >= cutoffDate;
      });

      if (hasRecentActivity) {
        activeStudents.push(student);
      }
    }

    return activeStudents;
  } catch (error) {
    console.error('Error getting active students:', error);
    throw error;
  }
};

/**
 * Bulk import students from array
 */
export const bulkImportStudents = async (organizationId, studentsData, addedBy) => {
  try {
    const batch = writeBatch(db);
    const results = [];

    for (const studentData of studentsData) {
      const studentRef = doc(collection(db, 'organizations', organizationId, 'students'));

      const student = {
        name: studentData.name,
        studentNumber: studentData.studentNumber || '',
        ageGroup: studentData.ageGroup,
        addedBy,
        createdAt: serverTimestamp()
      };

      batch.set(studentRef, student);
      results.push({
        id: studentRef.id,
        ...studentData
      });
    }

    await batch.commit();
    return results;
  } catch (error) {
    console.error('Error bulk importing students:', error);
    throw error;
  }
};
