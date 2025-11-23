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
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Invitation status
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired'
};

/**
 * Create an invitation to another adult
 */
export const createInvitation = async (fromUserId, invitationData) => {
  try {
    const invitationRef = doc(collection(db, 'invitations'));

    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invitation = {
      fromUserId,
      fromEmail: invitationData.fromEmail,
      fromName: invitationData.fromName,
      toEmail: invitationData.toEmail,
      message: invitationData.message || '',
      childrenIds: invitationData.childrenIds || [], // Specific children to share
      status: INVITATION_STATUS.PENDING,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      respondedAt: null
    };

    await setDoc(invitationRef, invitation);

    return {
      id: invitationRef.id,
      ...invitation
    };
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw error;
  }
};

/**
 * Get invitations sent by a user
 */
export const getSentInvitations = async (userId) => {
  try {
    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('fromUserId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting sent invitations:', error);
    throw error;
  }
};

/**
 * Get invitations received by a user (by email)
 */
export const getReceivedInvitations = async (userEmail) => {
  try {
    const invitationsRef = collection(db, 'invitations');
    const q = query(
      invitationsRef,
      where('toEmail', '==', userEmail),
      where('status', '==', INVITATION_STATUS.PENDING)
    );
    const snapshot = await getDocs(q);

    const invitations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter out expired invitations
    const now = new Date();
    return invitations.filter(inv => {
      const expiresAt = inv.expiresAt?.toDate();
      return expiresAt && expiresAt > now;
    });
  } catch (error) {
    console.error('Error getting received invitations:', error);
    throw error;
  }
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (invitationId, acceptorId, acceptorData) => {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    const invitationDoc = await getDoc(invitationRef);

    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationDoc.data();

    // Check if invitation is still valid
    const now = new Date();
    const expiresAt = invitation.expiresAt?.toDate();

    if (!expiresAt || expiresAt < now) {
      await updateDoc(invitationRef, {
        status: INVITATION_STATUS.EXPIRED
      });
      throw new Error('Invitation has expired');
    }

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw new Error('Invitation is no longer pending');
    }

    // Update invitation status
    await updateDoc(invitationRef, {
      status: INVITATION_STATUS.ACCEPTED,
      respondedAt: serverTimestamp()
    });

    // Import child service to grant access
    const { grantAccess } = require('./childService');

    // Grant access to the children
    await grantAccess(
      invitation.fromUserId,
      acceptorId,
      {
        email: acceptorData.email,
        displayName: acceptorData.displayName,
        ownerEmail: invitation.fromEmail,
        ownerName: invitation.fromName
      },
      invitation.childrenIds
    );

    return true;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
};

/**
 * Decline an invitation
 */
export const declineInvitation = async (invitationId) => {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);

    await updateDoc(invitationRef, {
      status: INVITATION_STATUS.DECLINED,
      respondedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    throw error;
  }
};

/**
 * Cancel a sent invitation
 */
export const cancelInvitation = async (invitationId, userId) => {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    const invitationDoc = await getDoc(invitationRef);

    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationDoc.data();

    // Verify user is the sender
    if (invitation.fromUserId !== userId) {
      throw new Error('Unauthorized to cancel this invitation');
    }

    // Only allow canceling pending invitations
    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw new Error('Can only cancel pending invitations');
    }

    await deleteDoc(invitationRef);
  } catch (error) {
    console.error('Error canceling invitation:', error);
    throw error;
  }
};

/**
 * Get invitation by ID
 */
export const getInvitation = async (invitationId) => {
  try {
    const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));

    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    return {
      id: invitationDoc.id,
      ...invitationDoc.data()
    };
  } catch (error) {
    console.error('Error getting invitation:', error);
    throw error;
  }
};

/**
 * Check if invitation exists for email (to prevent duplicates)
 */
export const hasExistingInvitation = async (fromUserId, toEmail) => {
  try {
    const invitationsRef = collection(db, 'invitations');
    const q = query(
      invitationsRef,
      where('fromUserId', '==', fromUserId),
      where('toEmail', '==', toEmail),
      where('status', '==', INVITATION_STATUS.PENDING)
    );

    const snapshot = await getDocs(q);

    // Check if any non-expired invitations exist
    const now = new Date();
    return snapshot.docs.some(doc => {
      const expiresAt = doc.data().expiresAt?.toDate();
      return expiresAt && expiresAt > now;
    });
  } catch (error) {
    console.error('Error checking existing invitation:', error);
    return false;
  }
};

/**
 * Clean up expired invitations (should be run periodically)
 */
export const cleanupExpiredInvitations = async () => {
  try {
    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('status', '==', INVITATION_STATUS.PENDING));
    const snapshot = await getDocs(q);

    const now = new Date();
    const expiredIds = [];

    snapshot.docs.forEach(doc => {
      const expiresAt = doc.data().expiresAt?.toDate();
      if (expiresAt && expiresAt < now) {
        expiredIds.push(doc.id);
      }
    });

    // Update expired invitations
    for (const id of expiredIds) {
      await updateDoc(doc(db, 'invitations', id), {
        status: INVITATION_STATUS.EXPIRED
      });
    }

    return expiredIds.length;
  } catch (error) {
    console.error('Error cleaning up expired invitations:', error);
    throw error;
  }
};

/**
 * Resend invitation (create a new one with same details)
 */
export const resendInvitation = async (originalInvitationId, fromUserId) => {
  try {
    const originalInvitation = await getInvitation(originalInvitationId);

    // Verify user is the sender
    if (originalInvitation.fromUserId !== fromUserId) {
      throw new Error('Unauthorized to resend this invitation');
    }

    // Create new invitation with same details
    return await createInvitation(fromUserId, {
      fromEmail: originalInvitation.fromEmail,
      fromName: originalInvitation.fromName,
      toEmail: originalInvitation.toEmail,
      message: originalInvitation.message,
      childrenIds: originalInvitation.childrenIds
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    throw error;
  }
};
