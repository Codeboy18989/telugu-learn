import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KidManagement from '../components/KidManagement';
import '../styles/dashboard.css';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>తెలుగు Learn</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <main>
        <KidManagement />
      </main>
    </div>
  );
}

export default Dashboard;
