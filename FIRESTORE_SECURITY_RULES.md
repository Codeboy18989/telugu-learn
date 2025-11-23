# Firestore Security Rules Documentation

## Overview
Comprehensive security rules for the telugu-learn SaaS platform with role-based access control supporting:
- **B2C Consumers**: Adults managing children's learning profiles
- **B2B Users**: Teachers and school admins managing students
- **Super Admin**: Platform owner with full access

---

## User Roles

### Role Hierarchy
1. **super_admin** - Platform owner, full access to everything
2. **school_admin** - School administrator, manages students in their organization
3. **teacher** - Individual teacher, manages students in their organization
4. **consumer** - B2C user, manages own children and can share with friends

---

## Helper Functions

### Authentication Helpers
```javascript
isAuthenticated()           // Check if user is logged in
getUserRole()              // Get current user's role from users collection
getUserOrganization()      // Get current user's organization ID
isOwner(userId)            // Check if user owns a resource
```

### Role Checking Helpers
```javascript
isSuperAdmin()             // Check if user is super admin
isConsumer()               // Check if user is a consumer
isB2BUser()                // Check if user is teacher or school admin
belongsToOrganization(id)  // Check if user belongs to specific org
```

---

## Security Rules by Collection

### 1. Users Collection (`/users/{userId}`)

**Purpose**: Core user documents with role and organization info

**Read Access**:
- ✅ Users can read their own document
- ✅ Super admin can read all user documents

**Write Access**:
- ❌ No client writes (managed server-side on signup)

**Rationale**: User roles and organizations are critical security attributes and should only be set by trusted backend code.

---

### 2. Consumer Profiles (`/consumerProfiles/{userId}`)

**Purpose**: B2C consumer data including children and sharing settings

#### 2.1 Profile Document
**Read/Write**:
- ✅ Consumers can access their own profile

#### 2.2 Children (`/children/{childId}`)
**Read Access**:
- ✅ Owner can read their children
- ✅ Adults with granted access can read shared children

**Write Access**:
- ✅ Owner can create/update/delete their children
- ❌ Shared access is read-only

**Subcollections** (`gameProgress`, `stats`, `progress`):
- Owner has full read/write access
- Shared users have read-only access

#### 2.3 Shared Access (`/sharedAccess/{partnerId}`)
**Read/Write**:
- ✅ Owner can manage who has access to their children

#### 2.4 Access To Children (`/accessToChildren/{ownerId}`)
**Read/Write**:
- ✅ User can see children shared with them

**Example**: Alice shares her children with Bob
```
consumerProfiles/alice/sharedAccess/bob
  - childrenIds: [child1, child2]
  - status: 'active'

consumerProfiles/bob/accessToChildren/alice
  - childrenIds: [child1, child2]
  - ownerName: 'Alice'
```

---

### 3. Invitations (`/invitations/{invitationId}`)

**Purpose**: Invitation system for adults to share children

**Read Access**:
- ✅ Sender can read invitations they sent
- ✅ Recipient can read invitations sent to their email (pending only)

**Write Access**:
- ✅ Consumers can create invitations
- ✅ Sender can cancel/delete their invitations
- ✅ Recipient can update status (accept/decline)

**Validation**:
- Sender must be authenticated consumer
- Status must be 'pending' when created
- Recipients can only change status to 'accepted' or 'declined'

---

### 4. Organizations (`/organizations/{organizationId}`)

**Purpose**: Schools and individual teacher organizations

**Read Access**:
- ✅ Super admin can read all organizations
- ✅ Organization members can read their own organization

**Write Access**:
- ✅ Super admin only

#### 4.1 Admins (`/admins/{adminId}`)
**Read Access**:
- ✅ Super admin
- ✅ Organization members

**Write Access**:
- ✅ Super admin only

#### 4.2 Students (`/students/{studentId}`)
**Read Access**:
- ✅ Organization members can read students in their org
- ✅ Super admin can read all students

**Write Access**:
- ✅ Organization members can create/update/delete students in their org

**Subcollections** (`gameProgress`, `stats`, `progress`):
- Organization members have full access to their students
- Super admin has read access to all

---

### 5. Activity Logs (`/activityLogs/{logId}`)

**Purpose**: Track all B2B user activity for super admin monitoring

**Read Access**:
- ✅ Super admin only

**Write Access**:
- ❌ No client writes (must use Cloud Functions)

**Rationale**: Activity logs are audit trails and must be tamper-proof. Only server-side code should write logs.

---

### 6. Organization Analytics (`/organizationAnalytics/{organizationId}`)

**Purpose**: Aggregated statistics for organizations

**Read Access**:
- ✅ Super admin can read all analytics
- ✅ Organization members can read their own analytics

**Write Access**:
- ❌ No client writes (calculated server-side)

**Subcollections** (`stats`, `daily`):
- Same read permissions as parent
- No client writes

**Rationale**: Analytics should be calculated server-side to ensure accuracy and prevent manipulation.

---

### 7. Content (`/content/{contentId}`)

**Purpose**: Telugu learning content (words, phrases, audio)

**Read Access**:
- ✅ All authenticated users

**Write Access**:
- ✅ Super admin can create/update/delete any content
- ✅ Consumers can create their own custom content
- ✅ Consumers can update/delete only their own non-preloaded content

**Validation**:
- Consumers cannot create content marked as `isPreloaded: true`
- Consumers cannot delete preloaded content
- Custom content must have `createdBy` set to user's ID

---

### 8. Legacy Collections (Backward Compatibility)

**Collections**: `/parents/{userId}/kids/{kidId}`

**Read/Write**:
- ✅ Authenticated user owns the resource

**Status**: Deprecated, maintained for migration period only

**Rationale**: Allows gradual migration from old structure to new without breaking existing users.

---

## Security Best Practices

### ✅ What These Rules Prevent

1. **Unauthorized Access**
   - Users cannot read other users' children/students
   - Users cannot access organizations they don't belong to
   - Non-admins cannot read activity logs

2. **Data Tampering**
   - Users cannot change their own role
   - Users cannot modify organization settings
   - Users cannot delete preloaded content
   - Activity logs are write-protected from clients

3. **Privilege Escalation**
   - Consumers cannot access organization data
   - Teachers cannot access other organizations
   - Users cannot grant themselves super admin

4. **Data Leakage**
   - Invitations only visible to sender and recipient
   - Analytics only visible to super admin and org members
   - Shared children only visible to granted users

### ✅ What These Rules Allow

1. **Proper Sharing**
   - Consumers can share children with friends
   - Shared users can view children's progress
   - Invitations work between authenticated users

2. **Organization Isolation**
   - Each organization's data is isolated
   - Teachers can manage their students
   - Organizations can track their own analytics

3. **Content Management**
   - Super admin controls global content
   - Consumers can add custom content for their children
   - Everyone can access all content for learning

---

## Common Scenarios

### Scenario 1: Consumer Shares Children with Friend

**Alice wants to share her children with Bob**

1. Alice creates invitation:
   ```javascript
   invitations/{inviteId}
     fromUserId: alice_id
     toEmail: bob@email.com
     childrenIds: [child1, child2]
     status: 'pending'
   ```

2. Bob accepts invitation (updates status to 'accepted')

3. Service creates shared access:
   ```javascript
   consumerProfiles/alice/sharedAccess/bob_id
     childrenIds: [child1, child2]
     status: 'active'

   consumerProfiles/bob/accessToChildren/alice_id
     childrenIds: [child1, child2]
   ```

4. Bob can now read alice's children (child1, child2) and their progress

### Scenario 2: Teacher Adds Student

**Teacher John adds student Sarah to ABC School**

1. John is logged in with:
   ```javascript
   users/john_id
     role: 'teacher'
     organizationId: abc_school_id
   ```

2. John creates student:
   ```javascript
   organizations/abc_school_id/students/{studentId}
     name: 'Sarah'
     ageGroup: '4+'
   ```

3. ✅ Allowed because:
   - John is a B2B user (teacher)
   - John belongs to abc_school_id
   - Writing to abc_school_id students

### Scenario 3: Super Admin Views All Activity

**Super admin checks what's happening**

1. Super admin is logged in with:
   ```javascript
   users/admin_id
     role: 'super_admin'
   ```

2. Super admin queries:
   ```javascript
   activityLogs/
     - All activity across all organizations

   organizations/
     - All organizations

   organizationAnalytics/
     - All analytics
   ```

3. ✅ Allowed because super admin has unrestricted read access

---

## Testing Security Rules

### Test Scenarios

1. **User Isolation**
   - ❌ Alice cannot read Bob's children
   - ✅ Alice can read her own children
   - ✅ Alice can read shared children from Carol

2. **Role Enforcement**
   - ❌ Consumer cannot create organization
   - ❌ Teacher cannot access other organization's students
   - ✅ Super admin can read all organizations

3. **Content Security**
   - ❌ Consumer cannot delete preloaded content
   - ✅ Consumer can delete their own custom content
   - ✅ Super admin can delete any content

4. **Invitation Privacy**
   - ❌ Alice cannot see Bob's invitations
   - ✅ Alice can see invitations sent to her email
   - ✅ Bob can cancel his own invitations

---

## Deployment

### To Deploy Rules

```bash
# Using Firebase CLI
firebase deploy --only firestore:rules

# Test rules before deploying
firebase emulators:start --only firestore
```

### Important Notes

1. **First Deployment**: Ensure at least one user exists before deploying, or create super admin manually
2. **Testing**: Test rules in emulator before production deployment
3. **Monitoring**: Watch Firebase Console for security rule violations
4. **Updates**: Any schema changes require corresponding rule updates

---

## Troubleshooting

### Common Issues

**"Permission denied" errors**

1. Check user's role in `/users/{userId}`
2. Verify organizationId matches for B2B users
3. Ensure shared access is set up correctly for shared children
4. Check invitation status is 'pending' for recipients

**"Missing or insufficient permissions"**

1. User may not be authenticated
2. Role may not be set correctly
3. Organization membership may be missing
4. Resource may not exist (get() calls fail)

**Rules not applying**

1. Rules may be cached (wait a few minutes)
2. Check Firebase Console for rule syntax errors
3. Verify rules were deployed successfully
4. Test in emulator first

---

## Future Enhancements

### Planned Improvements

1. **Field-level validation**
   - Validate data types and required fields
   - Enforce business logic constraints
   - Prevent data injection

2. **Rate limiting**
   - Limit invitation sends per user
   - Prevent spam/abuse
   - Use Cloud Functions for complex rate limiting

3. **Audit trails**
   - Log all access attempts
   - Track rule violations
   - Alert on suspicious activity

4. **Performance optimization**
   - Cache user role lookups
   - Minimize get() calls
   - Use denormalization where appropriate

---

## Summary

These security rules provide:
- ✅ **Strong isolation** between users and organizations
- ✅ **Role-based access control** for all user types
- ✅ **Granular sharing** for B2C child profiles
- ✅ **Protected audit logs** for compliance
- ✅ **Flexible content management** for super admin and consumers
- ✅ **Backward compatibility** during migration

All data is protected by default (deny all), with explicit allow rules for each valid use case.
