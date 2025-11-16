# తెలుగు Learn - Learn Telugu with Your Family

A progressive Telugu learning app for kids aged 2-8+, designed to grow with them from exposure and songs to grammar and storytelling.

## 🎉 MVP COMPLETE! (November 2025)

**Key Features:**
- ✅ **Parent/Teacher Authentication** - Secure signup and login
- ✅ **Kid Management** - Add and manage multiple children with age groups
- ✅ **Dual Content System:**
  - Pre-loaded Telugu words/phrases (Super Admin curated)
  - Custom content creation (Parents/Teachers)
- ✅ **Audio Support** - Upload files or record in-browser
- ✅ **Interactive Learning:**
  - Flashcards with flip animation
  - Pronunciation practice with audio playback
- ✅ **Age-Appropriate Content** - Filtered by age groups (2-4, 4+, 8+)
- ✅ **Super Admin Role** - Curate content for all users
- ✅ **Beautiful UI** - South Indian silk saree-inspired design

---

## 🚀 Quick Start

1. **Clone and Install:**
```bash
git clone <your-repo-url>
cd telugu-learn
npm install
```

2. **Firebase Setup:**
   - Your Firebase config is already set up
   - Apply security rules (see `FIREBASE_SECURITY_RULES.md`)

3. **Run Locally:**
```bash
npm start
```

4. **Build for Production:**
```bash
npm run build
```

5. **Deploy to Netlify:**
```bash
netlify deploy --prod --dir=build
```

## Project Structure

```
telugu-learn/
├── public/
│   └── index.html
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase configuration
│   ├── context/
│   │   └── AuthContext.js       # Auth state management
│   ├── pages/
│   │   ├── Login.js             # Parent login page
│   │   ├── Signup.js            # Parent signup page
│   │   └── Dashboard.js         # Parent dashboard
│   ├── styles/
│   │   ├── global.css
│   │   ├── auth.css
│   │   └── dashboard.css
│   ├── App.js                   # Main app with routing
│   └── index.js                 # React entry point
├── package.json
└── README.md
```

## Phase 1.1 Completion Summary

**What's implemented:**
- ✅ Firebase authentication setup (login/signup)
- ✅ Parent account creation and login
- ✅ Protected routes (dashboard only accessible when logged in)
- ✅ Auth context for state management
- ✅ Clean, kid-friendly UI with Telugu branding

## Phase 1.2 Completion Summary

**What's implemented:**
- ✅ Centralized theme system for white-label support
  - All colors use CSS variables for easy customization
  - Kalamkari & Cheriyal art-inspired color palette (deep indigo + rust/terracotta)
  - Playful but sophisticated design for all ages
- ✅ Gadapa Muggulu decorative pattern component (SVG-based)
  - Represents welcoming gesture & prosperity
  - Scalable, customizable colors and sizes
  - Used as decorative borders on dashboard
- ✅ Kid management features
  - Add kids with name and age group (2-4, 4+, 8+)
  - View all kids in a grid layout with cards
  - Delete kids with confirmation
  - Real-time sync from Firestore
  - Inline form (no modal) for simplicity
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Theme configuration file (`src/theme/theme.js`)
  - Change brand colors in ONE place
  - All app updates automatically
  - Ready for white-label customization

**Next Phase (1.3):**
- Admin panel to add content (words, phrases, images, audio)

---

## Setup Instructions

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "telugu-learn"
3. Enable "Authentication" > "Email/Password"
4. Create a Firestore database (start in test mode)
5. Create Storage bucket
6. Go to Project Settings and copy your Firebase config credentials

### 2. Clone and Setup Local Project

```bash
# Clone the repository
git clone <your-repo-url>
cd telugu-learn

# Install dependencies
npm install
```

### 3. Add Firebase Credentials

Create a `.env.local` file in the project root (DO NOT commit this file):

```
REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
```

Then update `src/config/firebase.js` to use environment variables:

```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

### 4. Run Locally

```bash
npm start
```

The app will open at `http://localhost:3000`

Test with:
- Signup with your email
- Login with those credentials
- You should see the dashboard

### 5. Deploy to Netlify

```bash
# Build for production
npm run build

# Connect to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

Or connect your Git repo to Netlify for continuous deployment.

---

## Current Features

**Authentication & User Management:**
- Parent/Teacher signup with email/password
- Secure login and logout
- Protected routes (dashboard only accessible when logged in)
- Super Admin role for content curation
- Session persistence

**Kid Management:**
- Add multiple children with names
- Set age groups (2-4, 4+, 8+ years)
- Real-time sync with Firestore
- Delete kids with confirmation

**Content Management:**
- **Super Admin Features:**
  - Add pre-loaded content available to all users
  - Seed 25 common Telugu words/phrases for age 2-4
  - Manage all content in the system
- **Parent/Teacher Features:**
  - Create custom content for their kids
  - Add Telugu text with English translations
  - Upload audio files or record in-browser
  - Filter content by age group
  - Delete own content

**Learning Interface:**
- **Kid Selection:** Choose which child is learning
- **Flashcards Mode:**
  - Interactive flip animation
  - Telugu text on front, translation on back
  - Audio playback for pronunciation
  - Progress tracking (card X of Y)
  - Navigation between cards
- **Pronunciation Practice:**
  - Listen to audio recordings
  - Reveal answer to check pronunciation
  - Mark correct/try again feedback
  - Score tracking
  - Completion celebration

**UI/UX:**
- South Indian silk saree-inspired design
- Responsive design (mobile, tablet, desktop)
- Telugu branding (తెలుగు Learn)
- Beautiful gradients and animations
- Error handling and validation
- Real-time updates

## Testing the MVP

### Complete User Flow Test:

1. **Sign Up** as a new parent/teacher
2. **Add a Child** in the "My Kids" tab (e.g., age 2-4)
3. **Set Super Admin** (see FIREBASE_SECURITY_RULES.md)
4. **Seed Content** using the "Seed Pre-loaded Content" button in Content Library
5. **Try Learning Mode:**
   - Go to "Learn" tab
   - Select your child
   - Try Flashcards mode
   - Try Pronunciation Practice mode
6. **Add Custom Content** in Content Library tab
7. **Test Audio** - Upload or record audio for content

### Quick Test (Without Super Admin):
1. Sign up and add a child
2. Manually add a few Telugu words in Content Library
3. Go to Learn → Select child → Try flashcards

---

## Next Steps (Post-MVP)

Future enhancements to consider:
- **Progress Tracking** - Save learning progress per child
- **More Age Groups** - Expand content for 4+ and 8+ age groups
- **Additional Learning Modes** - Matching games, quizzes, storytelling
- **Parent Tips Section** - Guidance on teaching Telugu
- **Offline Mode** - Service worker for offline learning
- **Analytics Dashboard** - Track child's learning progress
- **Multi-language Support** - Add other Indian languages

---

## Tech Stack

- **Frontend:** React 18, React Router
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Hosting:** Netlify
- **Styling:** CSS3

---

## Important Notes

### Security:
- ⚠️ **APPLY FIREBASE SECURITY RULES** before production (see `FIREBASE_SECURITY_RULES.md`)
- Set up your first Super Admin account (instructions in FIREBASE_SECURITY_RULES.md)
- Consider moving Firebase config to environment variables for production

### Data Structure:
```
Firestore:
  ├── parents/{userId}
  │   ├── email, isSuperAdmin, createdAt
  │   └── kids/{kidId}
  │       └── name, ageGroup, parentId, createdAt
  └── content/{contentId}
      └── teluguText, englishTranslation, audioUrl,
          ageGroup, category, createdBy, isPreloaded

Storage:
  └── audio/{contentId}_{timestamp}.{ext}
```

### Browser Compatibility:
- Audio recording requires HTTPS (works on localhost for testing)
- Modern browsers support MediaRecorder API (Chrome, Firefox, Edge, Safari)
- Mobile responsive design tested on iOS and Android

### Performance:
- All content loads in real-time from Firestore
- Audio files stored in Firebase Storage (10MB limit per file)
- Consider pagination for large content libraries in future

---

Feel free to reach out with questions or feedback! 🎓
