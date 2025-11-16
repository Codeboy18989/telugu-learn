# Firebase Security Rules for తెలుగు Learn

## Important: Apply These Rules to Your Firebase Project

Before deploying to production, you MUST update your Firebase Security Rules to protect user data.

---

## Firestore Security Rules

**How to Apply:**
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `telugu-learn-19045`
3. Navigate to: **Firestore Database** → **Rules** tab
4. Replace the existing rules with the rules below
5. Click **Publish**

### Firestore Rules Code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user is super admin
    function isSuperAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/parents/$(request.auth.uid)).data.isSuperAdmin == true;
    }

    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Parents collection
    match /parents/{parentId} {
      // Users can read and write their own parent document
      allow read, write: if isOwner(parentId);

      // Kids subcollection
      match /kids/{kidId} {
        // Users can manage their own kids
        allow read, write: if isOwner(parentId);
      }
    }

    // Content collection
    match /content/{contentId} {
      // Anyone authenticated can read content
      allow read: if isAuthenticated();

      // Super admins can create pre-loaded content
      allow create: if isSuperAdmin() || isAuthenticated();

      // Users can update/delete their own content
      // Super admins can update/delete any content
      allow update, delete: if isSuperAdmin() ||
                               (isAuthenticated() && resource.data.createdBy == request.auth.uid);
    }
  }
}
```

---

## Firebase Storage Rules

**How to Apply:**
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `telugu-learn-19045`
3. Navigate to: **Storage** → **Rules** tab
4. Replace the existing rules with the rules below
5. Click **Publish**

### Storage Rules Code:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Audio files (in 'audio/' folder)
    match /audio/{fileName} {
      // Anyone authenticated can read audio files
      allow read: if request.auth != null;

      // Only authenticated users can upload audio files
      allow create: if request.auth != null &&
                       request.resource.size < 10 * 1024 * 1024 && // Max 10MB
                       request.resource.contentType.matches('audio/.*');

      // Users can delete audio files (content deletion will trigger this)
      allow delete: if request.auth != null;
    }
  }
}
```

---

## Setting Up Your First Super Admin Account

After deploying and creating your first account, you need to manually set the Super Admin flag:

### Method 1: Firebase Console (Easiest)

1. Go to Firebase Console: https://console.firebase.google.com
2. Navigate to: **Firestore Database** → **Data** tab
3. Find the `parents` collection
4. Click on your user document (your user ID)
5. Click **Add field**:
   - Field name: `isSuperAdmin`
   - Type: `boolean`
   - Value: `true`
6. Click **Add**

### Method 2: Firebase CLI (Advanced)

If you have Firebase CLI installed, you can run this command:

```bash
firebase firestore:update parents/YOUR_USER_ID '{"isSuperAdmin": true}'
```

Replace `YOUR_USER_ID` with your actual Firebase Auth user ID.

---

## Testing the Security Rules

After applying the rules, test them to ensure they work correctly:

1. **Test as Regular User:**
   - Sign up as a new user
   - Try to add kids (should work)
   - Try to add content (should work)
   - Try to delete other users' content (should fail)

2. **Test as Super Admin:**
   - Set your account as Super Admin (see above)
   - Log out and log back in
   - You should see "SUPER ADMIN" badge in the header
   - Try to seed pre-loaded content (should work)
   - Try to delete any content (should work)

---

## Security Best Practices

1. **Never share your Super Admin credentials**
2. **Use environment variables** for Firebase config in production (move API keys to .env files)
3. **Monitor Firebase Console** for suspicious activity
4. **Regularly backup your Firestore data**
5. **Keep these security rules updated** as you add new features

---

## Troubleshooting

**Issue:** "Permission denied" errors when accessing Firestore
- **Solution:** Make sure you published the Firestore rules above

**Issue:** "Permission denied" when uploading audio
- **Solution:** Make sure you published the Storage rules above

**Issue:** Can't see Super Admin features after setting isSuperAdmin flag
- **Solution:** Log out and log back in to refresh your auth state

---

## Notes

- These rules are designed for the MVP and may need adjustment as the app grows
- Consider adding rate limiting rules for production to prevent abuse
- Monitor your Firebase usage to stay within free tier limits or upgrade as needed
