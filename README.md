# తెలుగు Learn - Learn Telugu with Your Family

A progressive Telugu learning app for kids aged 2-8+, designed to grow with them from exposure and songs to grammar and storytelling.

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

**Authentication:**
- Parent signup with email/password
- Parent login
- Logout functionality
- Protected dashboard

**UI/UX:**
- Responsive design
- Telugu branding (తెలుగు)
- Clean, intuitive interface
- Error handling and validation

## Testing

1. Sign up with test email: `test@example.com`
2. Login with same credentials
3. You should see the dashboard
4. Click Logout to return to login

---

## Next Steps

After Phase 1.1 is confirmed working:
- **Phase 1.2:** Kid management (add kids, set age groups)
- **Phase 1.3:** Admin panel (add words, upload images/audio)
- **Phase 1.4:** Learning interface (cards, games)
- **Phase 1.5:** Parent tips section

---

## Tech Stack

- **Frontend:** React 18, React Router
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Hosting:** Netlify
- **Styling:** CSS3

---

## Notes

- Keep `.env.local` private (add to .gitignore - already done)
- Firebase test mode expires in 30 days; set up proper security rules before production
- Audio/image uploads will be handled in Phase 1.3

---

Feel free to reach out with questions or feedback! 🎓
