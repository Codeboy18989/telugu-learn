import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Add new content
export async function addContent(contentData, userId, isSuperAdmin) {
  try {
    const content = {
      teluguText: contentData.teluguText,
      englishTranslation: contentData.englishTranslation,
      audioUrl: contentData.audioUrl || null,
      ageGroup: contentData.ageGroup,
      category: contentData.category || 'words',
      createdBy: isSuperAdmin ? 'system' : userId,
      isPreloaded: isSuperAdmin,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'content'), content);
    return { id: docRef.id, ...content };
  } catch (error) {
    console.error('Error adding content:', error);
    throw error;
  }
}

// Get all content (pre-loaded + user's own content)
export async function getContent(userId, ageGroup = null, isSuperAdmin = false) {
  try {
    const contentRef = collection(db, 'content');
    let q;

    if (isSuperAdmin) {
      // Super admin sees all content
      if (ageGroup) {
        q = query(contentRef, where('ageGroup', '==', ageGroup), orderBy('createdAt', 'desc'));
      } else {
        q = query(contentRef, orderBy('createdAt', 'desc'));
      }
    } else {
      // Regular users see pre-loaded content + their own
      if (ageGroup) {
        q = query(
          contentRef,
          where('ageGroup', '==', ageGroup),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(contentRef, orderBy('createdAt', 'desc'));
      }
    }

    const snapshot = await getDocs(q);
    const contentList = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      // Filter: show if pre-loaded OR created by this user
      if (data.isPreloaded || data.createdBy === userId || isSuperAdmin) {
        contentList.push({ id: doc.id, ...data });
      }
    });

    return contentList;
  } catch (error) {
    console.error('Error getting content:', error);
    throw error;
  }
}

// Update content
export async function updateContent(contentId, updates) {
  try {
    const contentRef = doc(db, 'content', contentId);
    await updateDoc(contentRef, updates);
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
}

// Delete content
export async function deleteContent(contentId, audioUrl) {
  try {
    // Delete audio file from storage if exists
    if (audioUrl) {
      try {
        const audioRef = ref(storage, audioUrl);
        await deleteObject(audioRef);
      } catch (err) {
        console.warn('Audio file not found or already deleted:', err);
      }
    }

    // Delete content document
    await deleteDoc(doc(db, 'content', contentId));
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
}

// Upload audio file to Firebase Storage
export async function uploadAudioFile(file, contentId) {
  try {
    const timestamp = Date.now();
    const fileName = `audio/${contentId}_${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
}

// Upload recorded audio blob
export async function uploadRecordedAudio(audioBlob, contentId) {
  try {
    const timestamp = Date.now();
    const fileName = `audio/${contentId}_${timestamp}.webm`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, audioBlob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading recorded audio:', error);
    throw error;
  }
}
