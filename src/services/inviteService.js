// Invite Service - Manages friend invitations for learning together
import { db } from '../config/firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

/**
 * Create a new invite
 * @param {string} userId - User creating the invite
 * @param {Object} inviteData - Invite details {email, message}
 * @returns {Object} Created invite object
 */
export async function createInvite(userId, inviteData) {
  try {
    const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const inviteRef = doc(db, 'users', userId, 'invites', inviteId);

    const invite = {
      id: inviteId,
      inviterId: userId,
      email: inviteData.email,
      message: inviteData.message || 'Join me in learning Telugu together!',
      status: 'pending', // pending, accepted, declined, expired
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    await setDoc(inviteRef, invite);
    return { ...invite, createdAt: new Date(), expiresAt: invite.expiresAt };
  } catch (error) {
    console.error('Error creating invite:', error);
    throw new Error('Failed to create invite');
  }
}

/**
 * Get all invites sent by a user
 * @param {string} userId - User ID
 * @returns {Array} List of invites
 */
export async function getSentInvites(userId) {
  try {
    const invitesRef = collection(db, 'users', userId, 'invites');
    const q = query(invitesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate?.() || doc.data().expiresAt
    }));
  } catch (error) {
    console.error('Error getting sent invites:', error);
    return [];
  }
}

/**
 * Get all invites received by a user (by email)
 * @param {string} userEmail - User's email
 * @returns {Array} List of invites
 */
export async function getReceivedInvites(userEmail) {
  // Note: This is a simplified version. In production, you'd want to
  // use a separate "receivedInvites" collection for better querying
  // For now, we'll return an empty array as we'd need to query all users' invites
  // which isn't scalable. A better approach would be to use Cloud Functions.

  // eslint-disable-next-line no-unused-vars
  const email = userEmail; // Preserve parameter for API compatibility
  return [];
}

/**
 * Accept an invite
 * @param {string} inviteId - Invite ID
 * @param {string} inviterId - User who sent the invite
 * @param {string} accepterId - User accepting the invite
 */
export async function acceptInvite(inviteId, inviterId, accepterId) {
  try {
    const inviteRef = doc(db, 'users', inviterId, 'invites', inviteId);

    await updateDoc(inviteRef, {
      status: 'accepted',
      acceptedBy: accepterId,
      acceptedAt: serverTimestamp()
    });

    // Add each user as a learning partner to the other
    await addLearningPartner(inviterId, accepterId);
    await addLearningPartner(accepterId, inviterId);

    return true;
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw new Error('Failed to accept invite');
  }
}

/**
 * Decline an invite
 * @param {string} inviteId - Invite ID
 * @param {string} inviterId - User who sent the invite
 */
export async function declineInvite(inviteId, inviterId) {
  try {
    const inviteRef = doc(db, 'users', inviterId, 'invites', inviteId);

    await updateDoc(inviteRef, {
      status: 'declined',
      declinedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error declining invite:', error);
    throw new Error('Failed to decline invite');
  }
}

/**
 * Cancel an invite
 * @param {string} userId - User who created the invite
 * @param {string} inviteId - Invite ID
 */
export async function cancelInvite(userId, inviteId) {
  try {
    const inviteRef = doc(db, 'users', userId, 'invites', inviteId);
    await deleteDoc(inviteRef);
    return true;
  } catch (error) {
    console.error('Error canceling invite:', error);
    throw new Error('Failed to cancel invite');
  }
}

/**
 * Add a learning partner (friend) to a user
 * @param {string} userId - User ID
 * @param {string} partnerId - Partner's user ID
 */
async function addLearningPartner(userId, partnerId) {
  try {
    // Get partner's info
    const partnerRef = doc(db, 'users', partnerId, 'profile', 'info');
    const partnerDoc = await getDoc(partnerRef);

    const partnerData = partnerDoc.exists() ? partnerDoc.data() : {};

    // Add as a learner with type 'friend'
    const learnerRef = doc(db, 'users', userId, 'learners', partnerId);

    await setDoc(learnerRef, {
      name: partnerData.displayName || partnerData.email || 'Friend',
      email: partnerData.email,
      type: 'friend',
      partnerId: partnerId,
      addedAt: serverTimestamp(),
      ageGroup: 'adult', // Friends are assumed to be adults
    });

    return true;
  } catch (error) {
    console.error('Error adding learning partner:', error);
    throw error;
  }
}

/**
 * Get all learning partners for a user
 * @param {string} userId - User ID
 * @returns {Array} List of learning partners
 */
export async function getLearningPartners(userId) {
  try {
    const learnersRef = collection(db, 'users', userId, 'learners');
    const q = query(learnersRef, where('type', '==', 'friend'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      addedAt: doc.data().addedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting learning partners:', error);
    return [];
  }
}

/**
 * Remove a learning partner
 * @param {string} userId - User ID
 * @param {string} partnerId - Partner's ID to remove
 */
export async function removeLearningPartner(userId, partnerId) {
  try {
    const learnerRef = doc(db, 'users', userId, 'learners', partnerId);
    await deleteDoc(learnerRef);
    return true;
  } catch (error) {
    console.error('Error removing learning partner:', error);
    throw new Error('Failed to remove learning partner');
  }
}

/**
 * Generate an invite link (for sharing)
 * @param {string} inviteId - Invite ID
 * @returns {string} Shareable invite link
 */
export function generateInviteLink(inviteId) {
  // In production, this would be your actual domain
  const baseUrl = window.location.origin;
  return `${baseUrl}/invite/${inviteId}`;
}

/**
 * Check if an invite is expired
 * @param {Object} invite - Invite object
 * @returns {boolean} True if expired
 */
export function isInviteExpired(invite) {
  if (!invite.expiresAt) return false;

  const expiryDate = invite.expiresAt instanceof Date
    ? invite.expiresAt
    : new Date(invite.expiresAt);

  return expiryDate < new Date();
}

/**
 * Get invite status badge color
 * @param {string} status - Invite status
 * @returns {string} CSS class name
 */
export function getInviteStatusBadge(status) {
  const badges = {
    pending: 'badge-pending',
    accepted: 'badge-success',
    declined: 'badge-error',
    expired: 'badge-gray'
  };

  return badges[status] || 'badge-gray';
}
