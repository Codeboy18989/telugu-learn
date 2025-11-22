import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserModeProvider } from './context/UserModeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import LetterMatch from './components/games/reading/LetterMatch';
import './styles/theme.css';
import './styles/auth.css';
import './styles/dashboard.css';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  return currentUser ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/signup"
        element={currentUser ? <Navigate to="/dashboard" /> : <Signup />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/games/reading/letter-match/:kidId/:lesson"
        element={
          <PrivateRoute>
            <LetterMatch />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <UserModeProvider>
            <AppRoutes />
          </UserModeProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
