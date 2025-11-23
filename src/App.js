import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { USER_ROLES } from './services/userService';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Import app-specific components
import ConsumerDashboard from './apps/consumer/pages/ConsumerDashboard';
import InvitationsPage from './apps/consumer/pages/InvitationsPage';

// Import existing components temporarily (will be replaced with new app-specific components)
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import LetterMatch from './components/games/reading/LetterMatch';

// TODO: Import B2B and Admin components when created
// import BusinessDashboard from './apps/business/pages/BusinessDashboard';
// import AdminDashboard from './apps/admin/pages/AdminDashboard';

import './styles/theme.css';
import './styles/auth.css';
import './styles/dashboard.css';

/**
 * Private route that requires authentication
 */
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

/**
 * Role-based route that requires specific user role(s)
 */
function RoleRoute({ children, allowedRoles }) {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on user role
    return <Navigate to={getRoleBasedDashboard(userRole)} />;
  }

  return children;
}

/**
 * Get the default dashboard path for a user role
 */
function getRoleBasedDashboard(userRole) {
  switch (userRole) {
    case USER_ROLES.CONSUMER:
      return '/consumer/dashboard';
    case USER_ROLES.TEACHER:
    case USER_ROLES.SCHOOL_ADMIN:
      return '/business/dashboard';
    case USER_ROLES.SUPER_ADMIN:
      return '/admin/dashboard';
    default:
      return '/login';
  }
}

function AppRoutes() {
  const { currentUser, userRole } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to={getRoleBasedDashboard(userRole)} />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/signup"
        element={
          currentUser ? (
            <Navigate to={getRoleBasedDashboard(userRole)} />
          ) : (
            <Signup />
          )
        }
      />

      {/* B2C Consumer App Routes */}
      <Route
        path="/consumer/dashboard"
        element={
          <RoleRoute allowedRoles={[USER_ROLES.CONSUMER]}>
            <ConsumerDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/consumer/profile"
        element={
          <RoleRoute allowedRoles={[USER_ROLES.CONSUMER]}>
            <Settings />
          </RoleRoute>
        }
      />
      <Route
        path="/consumer/invitations"
        element={
          <RoleRoute allowedRoles={[USER_ROLES.CONSUMER]}>
            <InvitationsPage />
          </RoleRoute>
        }
      />

      {/* B2B Business App Routes */}
      <Route
        path="/business/dashboard"
        element={
          <RoleRoute
            allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.SCHOOL_ADMIN]}
          >
            {/* TODO: Replace with BusinessDashboard */}
            <Dashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/business/students"
        element={
          <RoleRoute
            allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.SCHOOL_ADMIN]}
          >
            {/* TODO: Create StudentsPage */}
            <div>Students Management - Coming Soon</div>
          </RoleRoute>
        }
      />
      <Route
        path="/business/reports"
        element={
          <RoleRoute
            allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.SCHOOL_ADMIN]}
          >
            {/* TODO: Create ReportsPage */}
            <div>Reports - Coming Soon</div>
          </RoleRoute>
        }
      />
      <Route
        path="/business/settings"
        element={
          <RoleRoute
            allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.SCHOOL_ADMIN]}
          >
            <Settings />
          </RoleRoute>
        }
      />

      {/* Super Admin Portal Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RoleRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
            {/* TODO: Replace with AdminDashboard */}
            <Dashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/organizations"
        element={
          <RoleRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
            {/* TODO: Create OrganizationsPage */}
            <div>Organizations Management - Coming Soon</div>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/create-organization"
        element={
          <RoleRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
            {/* TODO: Create CreateOrganizationPage */}
            <div>Create Organization - Coming Soon</div>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RoleRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
            {/* TODO: Create AnalyticsPage */}
            <div>Analytics - Coming Soon</div>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/activity-logs"
        element={
          <RoleRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
            {/* TODO: Create ActivityLogsPage */}
            <div>Activity Logs - Coming Soon</div>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/content"
        element={
          <RoleRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
            {/* TODO: Create ContentManagementPage */}
            <div>Content Management - Coming Soon</div>
          </RoleRoute>
        }
      />

      {/* Shared game routes - accessible by all authenticated users */}
      <Route
        path="/games/reading/letter-match/:learnerId/:lesson"
        element={
          <PrivateRoute>
            <LetterMatch />
          </PrivateRoute>
        }
      />

      {/* Legacy routes - redirect to new structure */}
      <Route
        path="/dashboard"
        element={
          currentUser ? (
            <Navigate to={getRoleBasedDashboard(userRole)} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/settings"
        element={
          currentUser ? (
            <Navigate to={getRoleBasedDashboard(userRole)} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate to={getRoleBasedDashboard(userRole)} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* 404 - Not found */}
      <Route
        path="*"
        element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>404 - Page Not Found</h1>
            <p>
              <a href="/">Go to home</a>
            </p>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
