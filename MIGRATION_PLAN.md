# Database Migration Plan
## From Parent-Child to Multi-User System

### Migration Strategy: Gradual with Backward Compatibility

**Timeline:** 2-3 weeks
**Approach:** Dual-read, single-write with gradual deprecation

---

## Phase 1: Add New Structure Alongside Old (Week 1)

### Step 1: User Profile Structure
```javascript
// New structure (will be created for all users)
users/{userId}/profile
├── name: string
├── email: string
├── mode: 'family' | 'teacher' | 'friends'  // Default: 'family'
├── createdAt: timestamp
├── settings: {
│   ├── theme: 'light' | 'dark'
│   ├── notifications: boolean
│   └── ...
│ }
```

### Step 2: Learners Collection (New Path)
```javascript
// New path
users/{userId}/learners/{learnerId}
├── name: string
├── ageGroup: string
├── type: 'family' | 'student' | 'friend'  // Auto-set based on user mode
├── createdAt: timestamp
├── metadata: {
│   ├── relationship: string (family mode)
│   ├── studentId: string (teacher mode)
│   ├── email: string (friends mode)
│   ├── inviteStatus: 'pending' | 'accepted' (friends mode)
│ }
├── gameProgress/{progressId}
├── stats/{statId}
└── progress/{progressId}
```

### Step 3: Backward Compatibility Layer
```javascript
// Service wrapper that reads from both locations
async function getLearners(userId) {
  // Try new path first
  let learners = await getLearnersFromNew(userId);

  // If empty, try old path (for existing users)
  if (learners.length === 0) {
    learners = await getLearnersFromOld(userId);
  }

  return learners;
}

// Write ONLY to new path
async function addLearner(userId, learnerData) {
  // Always write to new path
  return await addToNewPath(userId, learnerData);
}
```

---

## Phase 2: Data Migration Script (Week 1-2)

### Migration Script
```javascript
// scripts/migrateToMultiUser.js
const admin = require('firebase-admin');

async function migrateUser(userId) {
  const db = admin.firestore();

  try {
    // 1. Check if already migrated
    const profileRef = db.collection('users').doc(userId).collection('profile').doc('info');
    const profileSnap = await profileRef.get();

    if (profileSnap.exists && profileSnap.data().migrated) {
      console.log(`User ${userId} already migrated`);
      return;
    }

    // 2. Get old data
    const oldParentRef = db.collection('parents').doc(userId);
    const oldKidsRef = oldParentRef.collection('kids');
    const kidsSnapshot = await oldKidsRef.get();

    // 3. Create user profile
    await profileRef.set({
      mode: 'family',  // Auto-migrate to family mode
      migrated: true,
      migratedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 4. Copy kids to learners
    const batch = db.batch();

    for (const kidDoc of kidsSnapshot.docs) {
      const kidData = kidDoc.data();
      const learnerRef = db.collection('users').doc(userId)
        .collection('learners').doc(kidDoc.id);

      batch.set(learnerRef, {
        ...kidData,
        type: 'family',  // Mark as family member
        migratedFrom: 'kids',
        migratedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Copy subcollections (gameProgress, stats, progress)
      await copySubcollections(oldKidsRef.doc(kidDoc.id), learnerRef);
    }

    await batch.commit();
    console.log(`✅ Migrated user ${userId}: ${kidsSnapshot.size} learners`);

  } catch (error) {
    console.error(`❌ Error migrating user ${userId}:`, error);
    throw error;
  }
}

async function copySubcollections(oldRef, newRef) {
  const subcollections = ['gameProgress', 'stats', 'progress'];

  for (const subcol of subcollections) {
    const snapshot = await oldRef.collection(subcol).get();
    const batch = admin.firestore().batch();

    snapshot.forEach(doc => {
      const newDocRef = newRef.collection(subcol).doc(doc.id);
      batch.set(newDocRef, doc.data());
    });

    if (!snapshot.empty) {
      await batch.commit();
    }
  }
}

// Run migration for all users
async function migrateAllUsers() {
  const db = admin.firestore();
  const parentsSnapshot = await db.collection('parents').get();

  console.log(`Starting migration for ${parentsSnapshot.size} users...`);

  let successCount = 0;
  let errorCount = 0;

  for (const parentDoc of parentsSnapshot.docs) {
    try {
      await migrateUser(parentDoc.id);
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }

  console.log(`\n✅ Migration complete: ${successCount} succeeded, ${errorCount} failed`);
}

module.exports = { migrateUser, migrateAllUsers };
```

---

## Phase 3: Update Security Rules (Week 2)

### Updated firestore.rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // NEW: Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User profile
      match /profile/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Learners subcollection (replaces kids)
      match /learners/{learnerId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /gameProgress/{progressId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        match /stats/{statId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        match /progress/{progressId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      // Invites for friends mode
      match /invites/{inviteId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // OLD: Keep for backward compatibility during migration
    match /parents/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /kids/{kidId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /gameProgress/{progressId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        match /stats/{statId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        match /progress/{progressId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }

    // Content collection
    match /content/{contentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.auth.token.isSuperAdmin == true;
    }
  }
}
```

---

## Phase 4: Service Layer Updates (Week 2)

### Create learnerService.js (wrapper)
```javascript
// src/services/learnerService.js
import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Get all learners for a user (checks both old and new paths)
 */
export async function getLearners(userId) {
  try {
    // Try new path first
    const learnersRef = collection(db, 'users', userId, 'learners');
    const q = query(learnersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // User has been migrated, use new path
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    // Fallback to old path (not yet migrated)
    const oldKidsRef = collection(db, 'parents', userId, 'kids');
    const oldQ = query(oldKidsRef, orderBy('createdAt', 'desc'));
    const oldSnapshot = await getDocs(oldQ);

    return oldSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _fromOldPath: true  // Flag for migration
    }));

  } catch (error) {
    console.error('Error getting learners:', error);
    throw error;
  }
}

/**
 * Add a new learner (always writes to new path)
 */
export async function addLearner(userId, learnerData, userMode = 'family') {
  try {
    const learnersRef = collection(db, 'users', userId, 'learners');
    const newLearnerRef = doc(learnersRef);

    const learnerType = {
      'family': 'family',
      'teacher': 'student',
      'friends': 'friend'
    }[userMode] || 'family';

    await setDoc(newLearnerRef, {
      ...learnerData,
      type: learnerType,
      createdAt: serverTimestamp()
    });

    return newLearnerRef.id;
  } catch (error) {
    console.error('Error adding learner:', error);
    throw error;
  }
}

/**
 * Delete a learner
 */
export async function deleteLearner(userId, learnerId) {
  try {
    const learnerRef = doc(db, 'users', userId, 'learners', learnerId);
    await deleteDoc(learnerRef);
  } catch (error) {
    console.error('Error deleting learner:', error);
    throw error;
  }
}

/**
 * Get user mode from profile
 */
export async function getUserMode(userId) {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'info');
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data().mode || 'family';
    }

    return 'family';  // Default for unmigrated users
  } catch (error) {
    console.error('Error getting user mode:', error);
    return 'family';
  }
}

/**
 * Set user mode
 */
export async function setUserMode(userId, mode) {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'info');
    await setDoc(profileRef, {
      mode,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user mode:', error);
    throw error;
  }
}
```

---

## Phase 5: Rollback Plan

### If Migration Fails
1. **Firestore rules** - Keep old paths enabled (already in rules above)
2. **Service layer** - Falls back to old path automatically
3. **No data loss** - Old collections remain untouched
4. **Manual rollback** - Revert code changes, old app continues working

### Rollback Script
```javascript
async function rollbackUser(userId) {
  // Simply delete new collections
  // Old data is still intact
  const newUserRef = db.collection('users').doc(userId);
  await deleteCollection(newUserRef.collection('learners'));
  await deleteCollection(newUserRef.collection('profile'));
}
```

---

## Testing Plan

### Phase 1: Development Testing
- [ ] Test with 1 user account (manual migration)
- [ ] Verify all features work with new structure
- [ ] Test backward compatibility (old → new)
- [ ] Verify game progress persists

### Phase 2: Staging Testing
- [ ] Migrate 10 test users
- [ ] Test all three modes (family, teacher, friends)
- [ ] Test mode switching
- [ ] Verify invites work (friends mode)

### Phase 3: Production Rollout
- [ ] Deploy updated rules (keep both paths)
- [ ] Deploy updated app code (dual-read)
- [ ] Run migration script for all users
- [ ] Monitor for errors
- [ ] Verify no data loss

---

## Migration Checklist

### Pre-Migration
- [ ] Backup Firestore database
- [ ] Test migration script with 1 user
- [ ] Deploy updated security rules
- [ ] Deploy app with backward compatibility

### Migration
- [ ] Run migration script for all users
- [ ] Monitor logs for errors
- [ ] Verify user count matches
- [ ] Spot-check 10 random users

### Post-Migration
- [ ] Verify all users can access their data
- [ ] Monitor error rates
- [ ] Keep old paths active for 2 weeks
- [ ] After 2 weeks, deprecate old paths

---

## Success Criteria

✅ All users migrated successfully
✅ No data loss
✅ All features work with new structure
✅ Mode switching works
✅ Invites work (friends mode)
✅ Error rate < 0.1%
✅ Can rollback if needed

---

## Timeline

**Week 1: Foundation**
- Day 1-2: Create UserModeContext, useModeLabels hook
- Day 3-4: Update service layer (learnerService.js)
- Day 5: Update security rules
- Day 6-7: Test locally

**Week 2: Component Updates**
- Day 1: Dashboard
- Day 2: LearnerManagement (renamed from KidManagement)
- Day 3: Learning component
- Day 4: Game components
- Day 5: Settings page (mode switcher)
- Day 6-7: Testing

**Week 3: Migration & Friends**
- Day 1-2: Run migration script
- Day 3: Verify migration success
- Day 4-5: Implement friends invite system
- Day 6-7: Final testing & deployment

---

Ready to proceed with implementation!
