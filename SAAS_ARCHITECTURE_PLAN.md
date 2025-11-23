# SaaS Architecture Refactor Plan - తెలుగు Learn

## Overview
Transform the current mode-switching application into a true SaaS platform with:
- **B2C Consumer App**: For friends and family
- **B2B App**: For teachers and schools
- **Super Admin Portal**: For managing all organizations and tracking activity

---

## 1. NEW DATABASE SCHEMA

### User Roles & Types
```javascript
userRoles = {
  CONSUMER: 'consumer',           // B2C users (adults)
  TEACHER: 'teacher',             // B2B individual teachers
  SCHOOL_ADMIN: 'school_admin',   // B2B school administrators
  SUPER_ADMIN: 'super_admin'      // Platform owner
}
```

### Database Structure

```
users/{userId}/
├── email: string
├── role: 'consumer' | 'teacher' | 'school_admin' | 'super_admin'
├── displayName: string
├── createdAt: timestamp
├── lastLoginAt: timestamp
└── organizationId: string (null for consumers)

// B2C: CONSUMER PROFILES & CHILDREN
consumerProfiles/{userId}/
├── phoneNumber: string (optional)
├── preferences: object
├── children/{childId}/
│   ├── name: string
│   ├── ageGroup: '2-4' | '4+' | '8+'
│   ├── createdAt: timestamp
│   ├── gameProgress/{progressId}/
│   ├── stats/streak/
│   └── progress/{progressId}/
│
├── sharedAccess/{partnerId}/    // Adults who can access this user's children
│   ├── email: string
│   ├── displayName: string
│   ├── accessGrantedAt: timestamp
│   └── status: 'active' | 'revoked'
│
└── accessToChildren/{ownerId}/  // Children this user has access to via sharing
    ├── ownerEmail: string
    ├── ownerName: string
    ├── childrenIds: array
    └── grantedAt: timestamp

// B2C: INVITATIONS SYSTEM
invitations/{invitationId}/
├── fromUserId: string
├── fromEmail: string
├── fromName: string
├── toEmail: string
├── message: string (optional)
├── status: 'pending' | 'accepted' | 'declined' | 'expired'
├── createdAt: timestamp
├── expiresAt: timestamp
└── respondedAt: timestamp (optional)

// B2B: ORGANIZATIONS (Schools/Teachers)
organizations/{organizationId}/
├── name: string
├── type: 'school' | 'individual_teacher'
├── createdBy: 'super_admin'
├── createdAt: timestamp
├── status: 'active' | 'suspended' | 'inactive'
│
├── branding/
│   ├── logo: string (URL)
│   ├── primaryColor: string
│   ├── secondaryColor: string
│   ├── appName: string (e.g., "ABC School తెలుగు")
│   ├── welcomeMessage: string
│   └── customDomain: string (optional)
│
├── subscription/
│   ├── plan: 'trial' | 'basic' | 'premium' | 'enterprise'
│   ├── startDate: timestamp
│   ├── expiryDate: timestamp
│   ├── maxStudents: number
│   └── features: array
│
├── settings/
│   ├── timezone: string
│   ├── language: string
│   └── features: object
│
├── admins/{userId}/             // School admins/Teachers
│   ├── email: string
│   ├── displayName: string
│   ├── credentials/
│   │   ├── username: string (generated)
│   │   ├── temporaryPassword: string (hashed, initial only)
│   │   └── passwordChangeRequired: boolean
│   ├── addedAt: timestamp
│   ├── lastLogin: timestamp
│   └── permissions: object
│
└── students/{studentId}/
    ├── name: string
    ├── studentNumber: string (optional)
    ├── ageGroup: '2-4' | '4+' | '8+'
    ├── addedBy: userId
    ├── createdAt: timestamp
    ├── gameProgress/{progressId}/
    ├── stats/streak/
    └── progress/{progressId}/

// B2B: ACTIVITY TRACKING (for super admin)
activityLogs/{logId}/
├── organizationId: string
├── userId: string
├── userRole: string
├── action: string ('login', 'add_student', 'complete_lesson', etc.)
├── details: object
├── timestamp: timestamp
├── ipAddress: string (optional)
└── userAgent: string (optional)

// B2B: ANALYTICS AGGREGATIONS
organizationAnalytics/{organizationId}/
├── stats/
│   ├── totalStudents: number
│   ├── activeStudents: number (last 7 days)
│   ├── totalLessons: number
│   ├── avgProgress: number
│   └── lastUpdated: timestamp
│
└── daily/{date}/
    ├── activeUsers: number
    ├── lessonsCompleted: number
    ├── newStudents: number
    └── timestamp: timestamp

// SHARED: CONTENT (Global)
content/{contentId}/
├── teluguText: string
├── englishTranslation: string
├── transliteration: string
├── audioUrl: string
├── ageGroup: '2-4' | '4+' | '8+'
├── category: string
├── createdBy: userId | 'system'
├── isPreloaded: boolean
├── organizationId: string (null for global, specific for org-only)
└── createdAt: timestamp
```

---

## 2. AUTHENTICATION & AUTHORIZATION

### User Types & Login Flows

**CONSUMER (B2C)**
- Standard email/password signup
- Social login (Google, Facebook) - future
- Self-service account creation
- Email verification recommended

**TEACHER/SCHOOL ADMIN (B2B)**
- Credentials provided by super admin
- Username format: `{orgname}_{firstname}` or custom
- Initial temporary password
- Force password change on first login
- Cannot self-register

**SUPER ADMIN**
- Protected email/password
- 2FA required (future enhancement)
- Special flag in users collection

### Auth Context Changes
```javascript
// Current
{
  currentUser,
  isSuperAdmin,
  login, logout, signup
}

// New
{
  currentUser,
  userRole,              // consumer | teacher | school_admin | super_admin
  organizationId,        // null for consumers
  organizationBranding,  // branding config for B2B users
  isConsumer,
  isTeacher,
  isSchoolAdmin,
  isSuperAdmin,
  login, logout,
  signupConsumer,        // B2C signup
  createOrganizationUser // Admin only - create B2B users
}
```

---

## 3. APP ARCHITECTURE & ROUTING

### Three Separate App Experiences

```javascript
// MAIN ROUTER
/ → Auto-redirect based on role after login

/consumer/*          // B2C App
  /dashboard         // Children management + learning
  /profile           // Account settings
  /invite-friends    // Invite other adults
  /shared-children   // Children shared with me

/business/*          // B2B App
  /dashboard         // Students + learning materials
  /students          // Student management
  /reports           // Progress reports
  /settings          // Organization settings (limited)
  /profile           // Personal profile

/admin/*             // Super Admin Portal
  /dashboard         // Overview of all activity
  /organizations     // Manage schools/teachers
  /create-org        // Create new organization
  /analytics         // System-wide analytics
  /users             // All users management
  /content           // Global content management
  /logs              // Activity logs

/login
/signup              // B2C only
/forgot-password
```

### Component Structure
```
src/
├── apps/
│   ├── consumer/          // B2C App
│   │   ├── pages/
│   │   │   ├── ConsumerDashboard.js
│   │   │   ├── ChildrenManagement.js
│   │   │   ├── InviteFriends.js
│   │   │   └── SharedChildren.js
│   │   └── components/
│   │       ├── ChildCard.js
│   │       └── InvitationManager.js
│   │
│   ├── business/          // B2B App
│   │   ├── pages/
│   │   │   ├── TeacherDashboard.js
│   │   │   ├── StudentManagement.js
│   │   │   └── ProgressReports.js
│   │   └── components/
│   │       ├── StudentCard.js
│   │       └── BrandedHeader.js
│   │
│   └── admin/             // Super Admin Portal
│       ├── pages/
│       │   ├── AdminDashboard.js
│       │   ├── OrganizationManagement.js
│       │   ├── CreateOrganization.js
│       │   └── SystemAnalytics.js
│       └── components/
│           ├── OrgCard.js
│           ├── ActivityChart.js
│           └── UserManagement.js
│
├── components/
│   ├── games/             // Shared across all apps
│   └── shared/            // Common UI components
│
├── services/
│   ├── consumer/
│   │   ├── childService.js
│   │   └── invitationService.js
│   ├── business/
│   │   ├── studentService.js
│   │   └── reportService.js
│   └── admin/
│       ├── organizationService.js
│       ├── analyticsService.js
│       └── activityLogService.js
│
└── context/
    ├── AuthContext.js     // Enhanced with role-based logic
    └── ThemeContext.js    // Dynamic branding support
```

---

## 4. KEY FEATURES BY APP TYPE

### B2C CONSUMER APP

**Core Features:**
1. **Children Management**
   - Add/edit/delete child profiles
   - Set age groups
   - View individual progress

2. **Friend Invitation System**
   - Invite other adults by email
   - Share access to your children's profiles
   - Accept invitations from others
   - View shared children from friends

3. **Learning Activities**
   - Games, flashcards, pronunciation practice
   - Same game engine as current system
   - Progress tracking per child

4. **Profile Management**
   - Update personal info
   - Manage sharing preferences
   - Notification settings

**UI/UX:**
- Friendly, family-oriented design
- Simple, intuitive navigation
- Focus on child progress and engagement

### B2B TEACHER/SCHOOL APP

**Core Features:**
1. **Student Management**
   - Add/edit/delete students
   - Assign to classes/groups (future)
   - Bulk import (CSV) - future

2. **Learning Materials**
   - Access to all pre-loaded content
   - Create custom content for organization
   - Assign specific lessons to students

3. **Progress Reports**
   - Individual student reports
   - Class/group analytics
   - Export to PDF/CSV

4. **Branded Experience**
   - Custom logo and colors
   - Organization name throughout app
   - White-labeled interface

**UI/UX:**
- Professional, education-focused design
- Efficient workflows for managing many students
- Data-driven dashboards

### SUPER ADMIN PORTAL

**Core Features:**
1. **Organization Management**
   - Create new schools/teachers
   - Configure branding per organization
   - Set subscription plans and limits
   - Suspend/activate organizations

2. **User Management**
   - Create teacher/school admin accounts
   - Generate login credentials
   - Reset passwords
   - View all users across platform

3. **Analytics Dashboard**
   - Total users (B2C vs B2B)
   - Active organizations
   - Platform-wide usage statistics
   - Revenue metrics (future)
   - Growth charts

4. **Activity Monitoring**
   - Real-time activity logs
   - Filter by organization, user, action
   - Export logs for analysis
   - Track all teacher/school activity

5. **Content Management**
   - Manage global pre-loaded content
   - Approve/reject org-specific content (future)
   - Content usage analytics

**UI/UX:**
- Admin-focused, data-dense interface
- Advanced filtering and search
- Quick actions for common tasks
- Clear visibility into all platform activity

---

## 5. CUSTOM BRANDING SYSTEM

### Implementation Approach

**Branding Storage:**
```javascript
organizations/{orgId}/branding/
├── logo: "https://storage.googleapis.com/.../logo.png"
├── primaryColor: "#1976d2"
├── secondaryColor: "#dc004e"
├── appName: "ABC School తెలుగు Learn"
├── welcomeMessage: "Welcome to ABC School's Telugu Learning Platform"
├── favicon: "https://..."
├── customDomain: "telugu.abcschool.edu" (future)
```

**Theme Context Enhancement:**
```javascript
// Load branding on login for B2B users
const ThemeContext = {
  mode: 'light' | 'dark',
  branding: {
    logo: url,
    colors: { primary, secondary },
    name: string,
    message: string
  },
  updateBranding: (orgId) => { /* Fetch and apply */ }
}
```

**Dynamic CSS Variables:**
```css
:root {
  --primary-color: var(--org-primary, #1976d2);
  --secondary-color: var(--org-secondary, #dc004e);
  --logo-url: var(--org-logo, '/default-logo.png');
}
```

**Branded Components:**
- `BrandedHeader` - Shows org logo and name
- `BrandedLogin` - Customized login page per org
- `BrandedFooter` - Organization contact info

---

## 6. SUPER ADMIN CAPABILITIES

### Organization Creation Workflow

1. **Create Organization Form**
   - Organization name
   - Type: School or Individual Teacher
   - Branding setup (logo upload, colors)
   - Subscription plan selection
   - Student limit

2. **Generate Admin Credentials**
   - Auto-generate username: `{orgname}_admin` or custom
   - Generate temporary password
   - Set password change required flag
   - Send credentials via email (or display once)

3. **Setup Complete**
   - Organization created in Firestore
   - Admin account created in Firebase Auth
   - Initial settings configured
   - Organization appears in admin dashboard

### Activity Tracking

**Events to Track:**
- User logins (all B2B users)
- Student additions/deletions
- Lessons completed
- Content created
- Reports generated
- Settings changes

**Dashboard Metrics:**
```javascript
{
  totalOrganizations: 150,
  activeOrganizations: 142,  // logged in last 30 days
  totalStudents: 5420,
  activeStudents: 3890,      // active last 7 days
  totalConsumers: 2340,
  activeConsumers: 1890,
  recentActivity: [
    { org: "ABC School", action: "Student added", time: "5m ago" },
    { org: "Teacher John", action: "Lesson completed", time: "12m ago" }
  ]
}
```

### Management Tools

- **Search:** Find any organization or user quickly
- **Bulk Actions:** Suspend multiple orgs, export data
- **Filters:** Active/inactive, plan type, date range
- **Exports:** CSV/PDF reports for accounting, analysis
- **Impersonation:** View app as any user (for support)

---

## 7. MIGRATION STRATEGY

### Phase 1: Database Schema Migration (Week 1-2)
- [ ] Create new collections structure
- [ ] Migrate existing users to new schema
- [ ] Map current "family" mode → consumer
- [ ] Map current "teacher" mode → organizations (if any exist)
- [ ] Map current "friends" mode → consumer with shared access
- [ ] Test data integrity

### Phase 2: Authentication Refactor (Week 2-3)
- [ ] Update AuthContext with role-based logic
- [ ] Implement organization user creation
- [ ] Add branding fetching on login
- [ ] Update Firestore security rules
- [ ] Test all login flows

### Phase 3: Build App Experiences (Week 3-5)
- [ ] **B2C Consumer App**
  - Children management (refactor from LearnerManagement)
  - Invitation system (enhance existing inviteService)
  - Shared children view
  - Profile management

- [ ] **B2B Business App**
  - Student management
  - Branded header/UI
  - Progress reports
  - Organization settings (view-only initially)

- [ ] **Super Admin Portal**
  - Dashboard with analytics
  - Organization management UI
  - User creation workflow
  - Activity logs viewer

### Phase 4: Branding & Theming (Week 5-6)
- [ ] Implement dynamic theming
- [ ] Logo upload and storage
- [ ] Custom color application
- [ ] Branded login pages
- [ ] Test with multiple org brands

### Phase 5: Testing & Polish (Week 6-7)
- [ ] E2E testing all user flows
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Deployment preparation

### Phase 6: Deployment (Week 7-8)
- [ ] Production database migration
- [ ] Rolling deployment
- [ ] Monitor activity logs
- [ ] User communication
- [ ] Support preparation

---

## 8. SECURITY CONSIDERATIONS

### Firestore Security Rules

```javascript
// Users can only read their own user document
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if false; // Only via admin SDK
}

// Consumers can manage their own children
match /consumerProfiles/{userId}/children/{childId} {
  allow read, write: if request.auth.uid == userId
    || exists(/databases/$(database)/documents/consumerProfiles/$(userId)/sharedAccess/$(request.auth.uid));
}

// Organization admins can manage their students
match /organizations/{orgId}/students/{studentId} {
  allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['teacher', 'school_admin'];
}

// Only super admin can manage organizations
match /organizations/{orgId} {
  allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin'
    || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId;
  allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
}

// Activity logs - super admin only
match /activityLogs/{logId} {
  allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
  allow write: if false; // Only via Cloud Functions
}
```

### Additional Security Measures
- Rate limiting on login attempts
- Email verification for consumers
- Password complexity requirements
- Session timeout for B2B users
- Audit logs for all admin actions
- HTTPS only
- CORS restrictions

---

## 9. FUTURE ENHANCEMENTS

### Short Term (3-6 months)
- Mobile apps (React Native)
- Push notifications
- Offline mode for games
- More game types
- Speaking track completion
- Social features (leaderboards within orgs)

### Medium Term (6-12 months)
- Subscription billing (Stripe integration)
- Advanced analytics and insights
- Parent portal for schools (view child's progress)
- Curriculum planning tools
- Assessment and testing modules
- Multi-language support (Hindi, Tamil, etc.)

### Long Term (12+ months)
- AI-powered personalized learning paths
- Video lessons
- Live tutoring marketplace
- Community features
- Certification programs
- White-label licensing
- API for third-party integrations

---

## 10. TECHNICAL STACK

**No Changes - Staying With:**
- React 18.2.0
- Firebase (Auth, Firestore, Storage, Functions)
- React Router DOM 6
- Material-UI or current styling
- Create React App

**Additions:**
- Firebase Cloud Functions (for activity logging, analytics)
- Firebase Admin SDK (for server-side operations)
- Chart.js or Recharts (for analytics visualizations)
- React Hook Form (for complex forms)
- Date-fns (for date handling in reports)

---

## APPROVED DECISIONS ✅

### 1. Content Ownership
**Decision:** All content will be global. Super admin will create content for schools if requested.
- No organization-specific private content at this time
- Super admin has full control over content management
- All users (B2C and B2B) see the same global content library

### 2. Data Migration
**Decision:** Start fresh. Do not preserve old data.
- Clean slate with new database structure
- No need to migrate existing users/learners/progress
- Simpler implementation path

### 3. Super Admin Setup
**Decision:** First signup will be auto super admin.
- First user to create an account automatically gets super admin role
- No manual configuration needed
- Subsequent signups will be regular consumers

### 4. Consumer Sharing
**Decision:**
- ✅ Only the creator of child profiles can grant access to other adults
- ✅ Can revoke access anytime
- ✅ Owner can see what shared partners see
- Individual child sharing (not required to share all children)

### 5. Organization Types
**Decision:** Just "school" and "individual teacher" for now.
- No tutoring centers, community centers, etc.
- Can be expanded in future phases

---

## IMPLEMENTATION STATUS: APPROVED - STARTING PHASE 1 🚀