import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  createOrganization,
  addOrganizationAdmin,
  ORG_TYPES,
  SUBSCRIPTION_PLANS
} from '../../../services/organizationService';
import { USER_ROLES } from '../../../services/userService';
import '../../../styles/dashboard.css';
import '../admin.css';

function CreateOrganizationPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  // Form state
  const [orgData, setOrgData] = useState({
    name: '',
    type: ORG_TYPES.SCHOOL,
    branding: {
      appName: '',
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      welcomeMessage: ''
    },
    subscription: {
      plan: SUBSCRIPTION_PLANS.TRIAL,
      maxStudents: 50
    }
  });

  const [adminData, setAdminData] = useState({
    email: '',
    displayName: '',
    username: '',
    role: USER_ROLES.SCHOOL_ADMIN
  });

  const handleOrgInputChange = (field, value) => {
    setOrgData({ ...orgData, [field]: value });
  };

  const handleBrandingChange = (field, value) => {
    setOrgData({
      ...orgData,
      branding: { ...orgData.branding, [field]: value }
    });
  };

  const handleSubscriptionChange = (field, value) => {
    setOrgData({
      ...orgData,
      subscription: { ...orgData.subscription, [field]: value }
    });
  };

  const handleAdminInputChange = (field, value) => {
    setAdminData({ ...adminData, [field]: value });
  };

  const generateUsername = () => {
    const orgName = orgData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    const adminName = adminData.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    return `${orgName}_${adminName || 'admin'}`;
  };

  const generatePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();

    if (!orgData.name.trim()) {
      setError('Organization name is required');
      return;
    }

    // Auto-generate app name if not provided
    if (!orgData.branding.appName) {
      setOrgData({
        ...orgData,
        branding: {
          ...orgData.branding,
          appName: `${orgData.name} తెలుగు Learn`
        }
      });
    }

    setError('');
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();

    if (!adminData.email.trim() || !adminData.displayName.trim()) {
      setError('Admin email and name are required');
      return;
    }

    if (!adminData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Step 1: Create the organization
      const organization = await createOrganization(orgData);

      // Step 2: Generate credentials
      const username = adminData.username || generateUsername();
      const temporaryPassword = generatePassword();

      // Step 3: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminData.email,
        temporaryPassword
      );

      const userId = userCredential.user.uid;

      // Step 4: Create user document in Firestore
      await setDoc(doc(db, 'users', userId), {
        email: adminData.email,
        displayName: adminData.displayName,
        role: adminData.role,
        organizationId: organization.id,
        createdAt: new Date(),
        lastLoginAt: null
      });

      // Step 5: Add admin to organization
      await addOrganizationAdmin(organization.id, {
        userId: userId,
        email: adminData.email,
        displayName: adminData.displayName,
        username: username,
        temporaryPassword: temporaryPassword, // In production, this should be hashed
        permissions: {}
      });

      // Store credentials to show to user
      setGeneratedCredentials({
        email: adminData.email,
        username: username,
        password: temporaryPassword,
        organizationName: orgData.name
      });

      setStep(3);
    } catch (err) {
      console.error('Error creating organization:', err);

      if (err.code === 'auth/email-already-in-use') {
        setError(
          'This email is already in use. Please use a different email address.'
        );
      } else {
        setError(
          'Failed to create organization. Please try again. Error: ' +
            err.message
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/admin/organizations');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="dashboard-container admin-dashboard">
      {/* Header */}
      <header className="dashboard-header admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🏢 Create New Organization</h1>
          </div>
          <div className="header-actions">
            <button
              className="secondary-btn"
              onClick={() => navigate('/admin/organizations')}
              disabled={loading}
            >
              ← Cancel
            </button>
            <span className="user-email">{currentUser?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="create-org-container">
          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Organization Details</span>
            </div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Admin Account</span>
            </div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Credentials</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError('')} className="close-btn">
                ×
              </button>
            </div>
          )}

          {/* Step 1: Organization Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="create-org-form">
              <h2>Step 1: Organization Details</h2>

              <div className="form-group">
                <label htmlFor="orgName">
                  Organization Name <span className="required">*</span>
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgData.name}
                  onChange={(e) => handleOrgInputChange('name', e.target.value)}
                  placeholder="ABC School / John's Telugu Classes"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="orgType">
                  Organization Type <span className="required">*</span>
                </label>
                <select
                  id="orgType"
                  value={orgData.type}
                  onChange={(e) => handleOrgInputChange('type', e.target.value)}
                  required
                >
                  <option value={ORG_TYPES.SCHOOL}>School</option>
                  <option value={ORG_TYPES.INDIVIDUAL_TEACHER}>
                    Individual Teacher
                  </option>
                </select>
              </div>

              <h3>Branding</h3>

              <div className="form-group">
                <label htmlFor="appName">App Name</label>
                <input
                  id="appName"
                  type="text"
                  value={orgData.branding.appName}
                  onChange={(e) =>
                    handleBrandingChange('appName', e.target.value)
                  }
                  placeholder={`${orgData.name} తెలుగు Learn`}
                />
                <small className="help-text">
                  Leave blank to auto-generate
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="primaryColor">Primary Color</label>
                  <div className="color-input-group">
                    <input
                      id="primaryColor"
                      type="color"
                      value={orgData.branding.primaryColor}
                      onChange={(e) =>
                        handleBrandingChange('primaryColor', e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={orgData.branding.primaryColor}
                      onChange={(e) =>
                        handleBrandingChange('primaryColor', e.target.value)
                      }
                      placeholder="#1976d2"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="secondaryColor">Secondary Color</label>
                  <div className="color-input-group">
                    <input
                      id="secondaryColor"
                      type="color"
                      value={orgData.branding.secondaryColor}
                      onChange={(e) =>
                        handleBrandingChange('secondaryColor', e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={orgData.branding.secondaryColor}
                      onChange={(e) =>
                        handleBrandingChange('secondaryColor', e.target.value)
                      }
                      placeholder="#dc004e"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="welcomeMessage">Welcome Message</label>
                <textarea
                  id="welcomeMessage"
                  value={orgData.branding.welcomeMessage}
                  onChange={(e) =>
                    handleBrandingChange('welcomeMessage', e.target.value)
                  }
                  placeholder="Welcome to our Telugu learning platform!"
                  rows="3"
                />
              </div>

              <h3>Subscription</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="plan">Plan</label>
                  <select
                    id="plan"
                    value={orgData.subscription.plan}
                    onChange={(e) =>
                      handleSubscriptionChange('plan', e.target.value)
                    }
                  >
                    <option value={SUBSCRIPTION_PLANS.TRIAL}>Trial</option>
                    <option value={SUBSCRIPTION_PLANS.BASIC}>Basic</option>
                    <option value={SUBSCRIPTION_PLANS.PREMIUM}>Premium</option>
                    <option value={SUBSCRIPTION_PLANS.ENTERPRISE}>
                      Enterprise
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="maxStudents">Max Students</label>
                  <input
                    id="maxStudents"
                    type="number"
                    value={orgData.subscription.maxStudents}
                    onChange={(e) =>
                      handleSubscriptionChange(
                        'maxStudents',
                        parseInt(e.target.value)
                      )
                    }
                    min="1"
                    max="10000"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  Next: Admin Account →
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Admin Account */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="create-org-form">
              <h2>Step 2: Create Admin Account</h2>
              <p className="help-text">
                Create the admin/teacher account for this organization. Login
                credentials will be generated automatically.
              </p>

              <div className="form-group">
                <label htmlFor="adminEmail">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  value={adminData.email}
                  onChange={(e) =>
                    handleAdminInputChange('email', e.target.value)
                  }
                  placeholder="teacher@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="adminName">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="adminName"
                  type="text"
                  value={adminData.displayName}
                  onChange={(e) =>
                    handleAdminInputChange('displayName', e.target.value)
                  }
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="adminRole">Role</label>
                <select
                  id="adminRole"
                  value={adminData.role}
                  onChange={(e) =>
                    handleAdminInputChange('role', e.target.value)
                  }
                  disabled={loading}
                >
                  <option value={USER_ROLES.SCHOOL_ADMIN}>School Admin</option>
                  <option value={USER_ROLES.TEACHER}>Teacher</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username (optional)</label>
                <input
                  id="username"
                  type="text"
                  value={adminData.username}
                  onChange={(e) =>
                    handleAdminInputChange('username', e.target.value)
                  }
                  placeholder="Leave blank to auto-generate"
                  disabled={loading}
                />
                <small className="help-text">
                  Will be auto-generated if left blank
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Creating Organization...' : 'Create Organization'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Show Credentials */}
          {step === 3 && generatedCredentials && (
            <div className="credentials-display">
              <div className="success-icon">✅</div>
              <h2>Organization Created Successfully!</h2>
              <p className="success-message">
                The organization has been created. Below are the login
                credentials for the admin account.
              </p>

              <div className="credentials-box">
                <h3>🔐 Login Credentials</h3>
                <div className="credential-item">
                  <span className="credential-label">Email:</span>
                  <span className="credential-value">
                    {generatedCredentials.email}
                  </span>
                </div>
                <div className="credential-item">
                  <span className="credential-label">Password:</span>
                  <span className="credential-value password">
                    {generatedCredentials.password}
                  </span>
                </div>
                <div className="credential-item">
                  <span className="credential-label">Organization:</span>
                  <span className="credential-value">
                    {generatedCredentials.organizationName}
                  </span>
                </div>

                <div className="warning-box">
                  <strong>⚠️ Important:</strong> Copy these credentials now and
                  send them to the admin securely. They will need to change
                  their password on first login.
                </div>

                <button
                  className="copy-btn"
                  onClick={() => {
                    const text = `
Organization: ${generatedCredentials.organizationName}
Email: ${generatedCredentials.email}
Temporary Password: ${generatedCredentials.password}

Please log in and change your password immediately.
Login URL: ${window.location.origin}/login
                    `.trim();
                    navigator.clipboard.writeText(text);
                    alert('Credentials copied to clipboard!');
                  }}
                >
                  📋 Copy Credentials
                </button>
              </div>

              <div className="form-actions">
                <button className="primary-btn" onClick={handleFinish}>
                  View All Organizations →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CreateOrganizationPage;
